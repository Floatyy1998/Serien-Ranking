/**
 * Import & Export der Watch-Daten (Plan: docs/IMPORT_EXPORT_PLAN.md).
 * Export: rein lokal (JSON = Backup/re-importierbar, CSV = generisch mit
 * TMDB-Ids). Import (Phase 1): TV-Rank-JSON + Trakt-JSON, id-basiert —
 * Commit läuft über den Backend-Job (/import/commit, importJobs/$uid).
 */
import { FileDownload, FileUpload, ImportExport } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { buildExportData, buildWatchCsv } from '../../lib/export/buildExport';
import { parseImportFile, type ParsedImport } from '../../lib/import/parseImport';
import { tapScaleSmall } from '../../lib/motion';
import { downloadFile } from '../../services/export/downloadFile';
import { t } from '../../services/i18n';

interface ImportJobState {
  status: 'running' | 'done' | 'error';
  total?: number;
  done?: number;
  currentTitle?: string;
  error?: string;
}

export const ImportExportSection = () => {
  const { currentTheme } = useTheme();
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
        const { dbRef } = await import('../../services/db/ref');
        if (cancelled) return;
        ref = dbRef(`importJobs/${user.uid}`);
        listener = (snap) => setJob(snap.val());
        ref.on('value', listener);
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
        const { resolveMissingTmdbIds } = await import('../../services/import/resolveExternalIds');
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
      const { backendFetch } = await import('../../services/backendApi');
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

  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 12,
    border: `1px solid ${currentTheme.border.default}`,
    background: 'rgba(255,255,255,0.03)',
    color: currentTheme.text.secondary,
    fontWeight: 600,
    fontSize: 14,
    cursor: 'pointer',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.24 }}
      className="settings-card"
    >
      <h2
        className="settings-section-title"
        style={{
          color: currentTheme.text.primary,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <ImportExport style={{ fontSize: 20, color: currentTheme.primary }} />
        {t('Import & Export')}
      </h2>

      {/* Export */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <motion.button whileTap={tapScaleSmall} onClick={exportJson} style={buttonStyle}>
          <FileDownload style={{ fontSize: 18 }} />
          {t('Export als JSON (Backup)')}
        </motion.button>
        <motion.button whileTap={tapScaleSmall} onClick={exportCsv} style={buttonStyle}>
          <FileDownload style={{ fontSize: 18 }} />
          {t('Export als CSV')}
        </motion.button>
      </div>
      <p
        style={{
          color: currentTheme.text.muted,
          fontSize: '0.85rem',
          lineHeight: 1.5,
          margin: '10px 0 0 0',
        }}
      >
        {t(
          'JSON enthält deine komplette Watch-History (re-importierbar), CSV eine Zeile pro Folge/Film mit TMDB-Ids für andere Apps.'
        )}
      </p>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />

      {/* Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = '';
        }}
      />
      <motion.button
        whileTap={tapScaleSmall}
        onClick={() => fileInputRef.current?.click()}
        disabled={committing}
        style={buttonStyle}
      >
        <FileUpload style={{ fontSize: 18 }} />
        {t('Import (TV-Rank- oder Trakt-JSON)')}
      </motion.button>

      {parseError && (
        <p style={{ color: currentTheme.status.error, fontSize: '0.85rem', margin: '10px 0 0' }}>
          {t('Datei nicht erkannt. Unterstützt: TV-Rank-Export-JSON und Trakt-JSON.')}
        </p>
      )}

      {parsed && (
        <div
          style={{
            marginTop: 12,
            padding: '12px 14px',
            borderRadius: 12,
            background: `${currentTheme.primary}10`,
            border: `1px solid ${currentTheme.primary}30`,
          }}
        >
          <div style={{ color: currentTheme.text.primary, fontSize: 14, fontWeight: 600 }}>
            {t('{n} Serien ({e} Folgen), {m} Filme erkannt', {
              n: parsed.series.length,
              e: totalEpisodes,
              m: parsed.movies.length,
            })}
          </div>
          <div style={{ color: currentTheme.text.muted, fontSize: 13, marginTop: 4 }}>
            {t('{n} Serien davon neu — sie werden deiner Liste hinzugefügt.', {
              n: newSeriesCount,
            })}{' '}
            {t('Bestehende Markierungen werden nie überschrieben.')}
            {unresolvedCount > 0 &&
              ` ${t('{n} Einträge ohne auflösbare TMDB-Id übersprungen.', { n: unresolvedCount })}`}
          </div>
          {job?.status === 'running' && (
            <div style={{ color: currentTheme.primary, fontSize: 13, marginTop: 8 }}>
              {t('Import läuft… {done}/{total}', {
                done: job.done ?? 0,
                total: job.total ?? '?',
              })}
              {job.currentTitle ? ` — ${job.currentTitle}` : ''}
            </div>
          )}
          {!committing && (
            <motion.button
              whileTap={tapScaleSmall}
              onClick={() => void commitImport()}
              style={{
                ...buttonStyle,
                marginTop: 10,
                background: currentTheme.primary,
                color: '#fff',
                border: 'none',
              }}
            >
              {t('Import starten')}
            </motion.button>
          )}
        </div>
      )}

      {job?.status === 'done' && (
        <p style={{ color: currentTheme.status.success, fontSize: '0.9rem', margin: '10px 0 0' }}>
          {t('Import abgeschlossen!')}
        </p>
      )}
      {(commitError || job?.status === 'error') && (
        <p style={{ color: currentTheme.status.error, fontSize: '0.85rem', margin: '10px 0 0' }}>
          {commitError || job?.error || t('Import fehlgeschlagen')}
        </p>
      )}
    </motion.div>
  );
};
