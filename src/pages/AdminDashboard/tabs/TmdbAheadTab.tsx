import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { NewReleases, OpenInNew, Visibility, VisibilityOff } from '@mui/icons-material';
import { dbRef, serverTimestamp } from '../../../services/db/ref';
import { onValue } from '../../../services/db/subscribeValue';
import { showToast } from '../../../lib/interaction/toast';

export interface TmdbAheadItem {
  title: string;
  poster?: string | null;
  tmdbSeason: number;
  seasonName?: string | null;
  airDate: string;
  tmdbEpisodes: number;
  moreSeasons?: number[];
  catalogSeasons: number;
  catalogLastAired?: string | null;
  tvmazeId: number;
  tvmazeUrl: string;
  tvmazeSeasonExists: boolean;
  tvmazeUndated: number;
  tvmazeLastSeason: number;
  firstSeen: number;
}

interface Payload {
  lastRun?: number;
  checked?: number;
  failed?: number;
  items?: Record<string, TmdbAheadItem>;
}

type Dismissed = Record<string, { season: number } | null>;
type Row = TmdbAheadItem & { id: string };

const TONE_MISSING = '#ff5c7a';
const TONE_UNDATED = '#f2a648';
const TONE_IGNORED = '#8a8a9a';

const formatDate = (iso?: string | null): string =>
  iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('de-DE') : '—';

const daysUntil = (iso: string): number =>
  Math.round((new Date(`${iso.slice(0, 10)}T00:00:00`).getTime() - Date.now()) / 86400000);

const relativeStart = (iso: string): string => {
  const d = daysUntil(iso);
  if (d === 0) return 'heute';
  if (d > 0) return `in ${d} ${d === 1 ? 'Tag' : 'Tagen'}`;
  return `seit ${-d} ${d === -1 ? 'Tag' : 'Tagen'}`;
};

export function TmdbAheadTab() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [dismissed, setDismissed] = useState<Dismissed>({});
  const [loading, setLoading] = useState(true);
  const [showIgnored, setShowIgnored] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    const ref = dbRef('adminPrivate/tmdbAhead');
    const handler = onValue(ref, (snap) => {
      setPayload((snap.val() as Payload) || {});
      setLoading(false);
    });
    return () => ref.off('value', handler);
  }, []);

  useEffect(() => {
    const ref = dbRef('admin/config/tmdbAheadDismissed');
    const handler = onValue(ref, (snap) => setDismissed((snap.val() as Dismissed) || {}));
    return () => ref.off('value', handler);
  }, []);

  const isIgnored = (row: Row) => Number(dismissed[row.id]?.season) >= row.tmdbSeason;

  const { open, ignored } = useMemo(() => {
    const rows = Object.entries(payload?.items || {})
      .map(([id, item]) => ({ ...item, id }))
      .sort((a, b) => a.airDate.localeCompare(b.airDate));
    const ign = (row: Row) => Number(dismissed[row.id]?.season) >= row.tmdbSeason;
    return { open: rows.filter((r) => !ign(r)), ignored: rows.filter(ign) };
  }, [payload, dismissed]);

  const setIgnored = async (row: Row, ignore: boolean) => {
    setBusyId(row.id);
    try {
      const ref = dbRef(`admin/config/tmdbAheadDismissed/${row.id}`);
      if (ignore) {
        await ref.set({ season: row.tmdbSeason, title: row.title, at: serverTimestamp() });
      } else {
        await ref.remove();
      }
    } catch (e) {
      showToast(`Speichern fehlgeschlagen: ${(e as Error)?.message || 'unbekannt'}`, 5000, 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="adm-empty">Lade Staffel-Abgleich…</div>;

  const renderRow = (row: Row) => {
    const ignoredRow = isIgnored(row);
    const tone = ignoredRow ? TONE_IGNORED : row.tvmazeSeasonExists ? TONE_UNDATED : TONE_MISSING;
    return (
      <div key={row.id} className="adm-row" style={{ '--adm-tone': tone } as CSSProperties}>
        <div className="adm-row__head" style={{ cursor: 'default' }}>
          <div className="adm-row__bar" />
          {row.poster ? (
            <img
              src={row.poster}
              alt=""
              loading="lazy"
              style={{ width: 40, height: 60, objectFit: 'cover', borderRadius: 6 }}
            />
          ) : (
            <div style={{ width: 40 }} />
          )}
          <div style={{ minWidth: 0 }}>
            <div className="adm-row__title">
              {row.title} · Staffel {row.tmdbSeason}
            </div>
            <div className="adm-row__meta">
              <span>
                ab <b>{formatDate(row.airDate)}</b> ({relativeStart(row.airDate)})
              </span>
              <span>
                <b>{row.tmdbEpisodes}</b> Folgen bei TMDB
              </span>
              <span>
                Katalog: {row.catalogSeasons} Staffeln, zuletzt {formatDate(row.catalogLastAired)}
              </span>
              {(row.moreSeasons?.length ?? 0) > 0 && (
                <span>auch Staffel {row.moreSeasons?.join(', ')}</span>
              )}
            </div>
            <div className="adm-chips" style={{ marginTop: 8 }}>
              <span className="adm-tag" style={{ whiteSpace: 'normal' }}>
                {ignoredRow
                  ? 'ignoriert'
                  : row.tvmazeSeasonExists
                    ? `TVMaze: Staffel angelegt, ohne Termin${
                        row.tvmazeUndated ? ` (${row.tvmazeUndated} Folgen)` : ''
                      }`
                    : `TVMaze: fehlt (dort bis Staffel ${row.tvmazeLastSeason})`}
              </span>
            </div>
          </div>
          <div className="adm-row__acts">
            <a
              className="adm-icon-btn"
              href={`https://www.themoviedb.org/tv/${row.id}/season/${row.tmdbSeason}`}
              target="_blank"
              rel="noreferrer"
              title="Staffel bei TMDB öffnen"
            >
              <OpenInNew style={{ fontSize: 16 }} />
            </a>
            <a
              className="adm-chip"
              href={`${row.tvmazeUrl}/episodes`}
              target="_blank"
              rel="noreferrer"
              title="Episodenliste bei TVMaze öffnen"
            >
              TVMaze
            </a>
            <button
              type="button"
              className="adm-icon-btn"
              disabled={busyId === row.id}
              title={ignoredRow ? 'Wieder einblenden' : 'Diese Staffel ignorieren'}
              onClick={() => void setIgnored(row, !ignoredRow)}
            >
              {ignoredRow ? (
                <Visibility style={{ fontSize: 16 }} />
              ) : (
                <VisibilityOff style={{ fontSize: 16 }} />
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="adm-stack">
      <div className="adm-card">
        <div className="adm-card__head">
          <div className="adm-card__title">
            <NewReleases style={{ fontSize: 18 }} /> Neue Staffeln nur bei TMDB
          </div>
        </div>
        <div className="adm-stats">
          <div className={`adm-stat ${open.length ? 'adm-tone-bad' : 'adm-tone-ok'}`}>
            <div className="adm-stat__value">{open.length}</div>
            <div className="adm-stat__label">Offen</div>
          </div>
          <div className="adm-stat adm-tone-info">
            <div className="adm-stat__value">{ignored.length}</div>
            <div className="adm-stat__label">Ignoriert</div>
          </div>
          <div className="adm-stat">
            <div className="adm-stat__value">{payload?.checked ?? 0}</div>
            <div className="adm-stat__label">Serien geprüft</div>
          </div>
          {(payload?.failed ?? 0) > 0 && (
            <div className="adm-stat adm-tone-warn">
              <div className="adm-stat__value">{payload?.failed}</div>
              <div className="adm-stat__label">TMDB-Fehler</div>
            </div>
          )}
        </div>
        <div className="adm-note">
          TMDB kennt für diese Serien schon eine neue Staffel mit Termin, TVMaze noch nicht — in der
          App fehlt sie deshalb. Auf TVMaze nachtragen, der nächste Katalog-Lauf übernimmt sie. Eine
          Staffel erscheint hier erst eine Woche vor Start, wenn TVMaze sie bis dahin nicht
          nachgetragen hat, und kommt dann auch als Benachrichtigung. Täglich 07:30 geprüft.{' '}
          {payload?.lastRun
            ? `Zuletzt geprüft ${new Date(payload.lastRun).toLocaleString('de-DE')}.`
            : 'Noch kein Prüflauf.'}
        </div>
      </div>

      {open.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty__t">Nichts offen</div>
          <div className="adm-empty__s">TVMaze kennt alle angekündigten Staffeln.</div>
        </div>
      ) : (
        open.map(renderRow)
      )}

      {ignored.length > 0 && (
        <div className="adm-chips">
          <button
            type="button"
            className={`adm-chip${showIgnored ? ' adm-chip--on' : ''}`}
            onClick={() => setShowIgnored((v) => !v)}
          >
            Ignorierte anzeigen
            <span className="adm-chip__count">{ignored.length}</span>
          </button>
        </div>
      )}
      {showIgnored && ignored.map(renderRow)}
    </div>
  );
}
