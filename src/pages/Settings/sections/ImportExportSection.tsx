/**
 * Import & Export der Watch-Daten (Plan: docs/IMPORT_EXPORT_PLAN.md).
 * Export: rein lokal (JSON = Backup/re-importierbar, CSV = generisch mit
 * TMDB-Ids). Import (Phase 1): TV-Rank-JSON + Trakt-JSON, id-basiert —
 * Commit läuft über den Backend-Job (/import/commit, importJobs/$uid).
 */
import { FileDownload, FileUpload } from '@mui/icons-material';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useMovieList } from '../../../contexts/MovieListContext';
import { useSeriesList } from '../../../contexts/SeriesListContext';
import { buildExportData, buildWatchCsv } from '../../../lib/export/buildExport';
import { parseImportFile, type ParsedImport } from '../../../lib/import/parseImport';
import { downloadFile } from '../../../services/export/downloadFile';
import { t } from '../../../services/i18n';
import { onValue } from '../../../services/db/subscribeValue';
import { SButton, SButtons, SRow } from '../kit/SettingsKit';

interface ImportJobState {
  status: 'running' | 'done' | 'error';
  total?: number;
  done?: number;
  currentTitle?: string;
  error?: string;
  report?: {
    addedSeries?: number;
    writtenEpisodes?: number;
    skippedExisting?: number;
    updatedMovies?: number;
    skippedMovies?: number;
    failed?: { title?: string; error?: string }[];
  };
}

export const ImportExportSection = () => {
  const { user } = useAuth() || {};
  const { seriesList } = useSeriesList() || { seriesList: [] };
  const { movieList } = useMovieList() || { movieList: [] };
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [unresolvedCount, setUnresolvedCount] = useState(0);
  const [parseError, setParseError] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [commitError, setCommitError] = useState('');
  const [job, setJob] = useState<ImportJobState | null>(null);

  // Live-Progress des Import-Jobs (Backend schreibt importJobs/$uid)
  useEffect(() => {
    if (!user?.uid || !committing) return;
    let ref: import('firebase/compat/app').default.database.Reference | null = null;
    let listener: ((snap: { val: () => ImportJobState | null }) => void) | null = null;
    let cancelled = false;
    void (async () => {
      try {
        const { dbRef } = await import('../../../services/db/ref');
        if (cancelled) return;
        ref = dbRef(`importJobs/${user.uid}`);
        listener = (snap) => setJob(snap.val());
        onValue(ref, listener);
      } catch {
        /* Rules evtl. noch nicht deployed */
      }
    })();
    return () => {
      cancelled = true;
      if (ref && listener) ref.off('value', listener);
    };
  }, [user?.uid, committing]);

  const exportJson = () => {
    const data = buildExportData(seriesList, movieList);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`tv-rank-export-${stamp}.json`, JSON.stringify(data, null, 2), 'application/json');
  };

  const exportCsv = () => {
    const data = buildExportData(seriesList, movieList);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadFile(`tv-rank-watch-history-${stamp}.csv`, buildWatchCsv(data), 'text/csv');
  };

  const handleFile = async (file: File) => {
    setParseError(false);
    setCommitError('');
    setParsed(null);
    setUnresolvedCount(0);
    setJob(null);
    const text = await file.text();
    const result = parseImportFile(text);
    if (!result || (result.series.length === 0 && result.movies.length === 0)) {
      setParseError(true);
      return;
    }
    // Trakt-Einträge ohne TMDB-Id über IMDb/TVDB auflösen (best-effort)
    const needsResolution =
      result.series.some((s) => !s.tmdbId) || result.movies.some((m) => !m.tmdbId);
    if (needsResolution) {
      try {
        const { resolveMissingTmdbIds } =
          await import('../../../services/import/resolveExternalIds');
        const { parsed: resolved, unresolved } = await resolveMissingTmdbIds(result);
        setUnresolvedCount(unresolved);
        if (resolved.series.length === 0 && resolved.movies.length === 0) {
          setParseError(true);
          return;
        }
        setParsed(resolved);
        return;
      } catch {
        // TMDB nicht erreichbar → nur die Einträge mit vorhandener TMDB-Id nutzen
        setUnresolvedCount(
          result.series.filter((s) => !s.tmdbId).length +
            result.movies.filter((m) => !m.tmdbId).length
        );
        setParsed({
          ...result,
          series: result.series.filter((s) => s.tmdbId),
          movies: result.movies.filter((m) => m.tmdbId),
        });
        return;
      }
    }
    setParsed(result);
  };

  const commitImport = async () => {
    if (!parsed || committing) return;
    setCommitting(true);
    setCommitError('');
    try {
      const { backendFetch } = await import('../../../services/api/backendApi');
      const res = await backendFetch('/import/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: parsed.source,
          series: parsed.series,
          movies: parsed.movies,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setCommitError(data.error || t('Import fehlgeschlagen'));
        setCommitting(false);
      }
      // Erfolg: Job läuft — Progress kommt über den importJobs-Listener
    } catch {
      setCommitError(t('Import fehlgeschlagen'));
      setCommitting(false);
    }
  };

  useEffect(() => {
    if (job?.status === 'done' || job?.status === 'error') {
      setCommitting(false);
      if (job.status === 'done') setParsed(null);
    }
  }, [job?.status]);

  const totalEpisodes = parsed ? parsed.series.reduce((sum, s) => sum + s.episodes.length, 0) : 0;
  const knownIds = new Set(seriesList.map((s) => s.id));
  const newSeriesCount = parsed
    ? parsed.series.filter((s) => s.tmdbId != null && !knownIds.has(s.tmdbId)).length
    : 0;

  return (
    <>
      <SRow
        icon={FileDownload}
        title={t('Exportieren')}
        subtitle={t(
          'JSON enthält deine komplette Watch-History (re-importierbar), CSV eine Zeile pro Folge/Film mit TMDB-Ids für andere Apps.'
        )}
        below={
          <SButtons>
            <SButton icon={FileDownload} onClick={exportJson}>
              {t('Export als JSON (Backup)')}
            </SButton>
            <SButton icon={FileDownload} onClick={exportCsv}>
              {t('Export als CSV')}
            </SButton>
          </SButtons>
        }
      />
      <SRow
        icon={FileUpload}
        title={t('Importieren')}
        subtitle={t('Bestehende Markierungen werden nie überschrieben.')}
        below={
          <div className="st-form">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFile(file);
                e.target.value = '';
              }}
            />
            <SButtons>
              <SButton
                icon={FileUpload}
                onClick={() => fileInputRef.current?.click()}
                disabled={committing}
              >
                {t('Import (TV-Rank- oder Trakt-JSON)')}
              </SButton>
            </SButtons>

            {parseError && (
              <p className="st-form-error">
                {t('Datei nicht erkannt. Unterstützt: TV-Rank-Export-JSON und Trakt-JSON.')}
              </p>
            )}

            {parsed && (
              <div className="st-import-preview">
                <strong>
                  {t('{n} Serien ({e} Folgen), {m} Filme erkannt', {
                    n: parsed.series.length,
                    e: totalEpisodes,
                    m: parsed.movies.length,
                  })}
                </strong>
                <p className="st-form-hint">
                  {t('{n} Serien davon neu — sie werden deiner Liste hinzugefügt.', {
                    n: newSeriesCount,
                  })}{' '}
                  {t('Bestehende Markierungen werden nie überschrieben.')}
                  {unresolvedCount > 0 &&
                    ` ${t('{n} Einträge ohne auflösbare TMDB-Id übersprungen.', { n: unresolvedCount })}`}
                </p>
                {job?.status === 'running' && (
                  <p className="st-import-progress">
                    {t('Import läuft… {done}/{total}', {
                      done: job.done ?? 0,
                      total: job.total ?? '?',
                    })}
                    {job.currentTitle ? ` — ${job.currentTitle}` : ''}
                  </p>
                )}
                {!committing && (
                  <SButtons>
                    <SButton variant="primary" onClick={() => void commitImport()}>
                      {t('Import starten')}
                    </SButton>
                  </SButtons>
                )}
              </div>
            )}

            {job?.status === 'done' && (
              <div>
                <p className="st-form-ok">{t('Import abgeschlossen!')}</p>
                {job.report && (
                  <p className="st-form-hint">
                    {t(
                      '{s} Serien neu, {e} Folgen importiert, {se} Folgen übersprungen (schon markiert), {m} Filme aktualisiert, {sm} Filme übersprungen.',
                      {
                        s: job.report.addedSeries ?? 0,
                        e: job.report.writtenEpisodes ?? 0,
                        se: job.report.skippedExisting ?? 0,
                        m: job.report.updatedMovies ?? 0,
                        sm: job.report.skippedMovies ?? 0,
                      }
                    )}
                    {(job.report.failed?.length ?? 0) > 0 &&
                      ` ${t('{n} Einträge fehlgeschlagen:', { n: job.report.failed!.length })} ${job.report
                        .failed!.slice(0, 5)
                        .map((f) => f.title || '?')
                        .join(', ')}${job.report.failed!.length > 5 ? '…' : ''}`}
                  </p>
                )}
              </div>
            )}
            {(commitError || job?.status === 'error') && (
              <p className="st-form-error">
                {commitError || job?.error || t('Import fehlgeschlagen')}
              </p>
            )}
          </div>
        }
      />
    </>
  );
};
