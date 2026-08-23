import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Speed, Timer, Storage, Cloud, CleaningServices } from '@mui/icons-material';
import { dbRef } from '../../../services/db/ref';
import { copyTextToClipboard } from '../../../utils/clipboard';

interface PhaseData {
  ms: number;
  formatted: string;
  percent: string;
}

interface UserTiming {
  user: string;
  durationMs: number;
  durationFormatted: string;
  itemCount: number;
}

/** Ein Lauf aus admin/runs — Grundlage fuer den Verlauf. */
interface RunRecord {
  startedAt: string;
  durationMs: number;
  realErrorCount?: number;
  counters?: { users?: number; uniqueSeries?: number; uniqueMovies?: number };
  tmdb?: { requests?: number; cacheHits?: number; rateLimits?: number; fails?: number };
  catalog?: { luecken?: number };
}

interface ActionPerf {
  timestamp: string;
  action: string;
  totalDurationMs: number;
  totalDurationFormatted: string;
  phases: Record<string, PhaseData>;
  // Optional, weil der Cron seit der Umstellung auf globale Verarbeitung
  // keine Zeiten je Nutzer mehr erhebt — das Feld fehlt in den Daten.
  users?: UserTiming[];
  tmdb: { requests: number; cacheHits: number; rateLimits: number; fails: number };
  tvMaze?: { requests: number; cacheHits: number; rateLimits: number };
}

const ACTION_COLORS: Record<string, string> = {
  episodes: '#8338ec',
  movies: '#ff006e',
  all: '#3a86ff',
};

const PHASE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  firebaseReads: {
    label: 'Firebase Reads',
    color: '#06d6a0',
    icon: <Storage style={{ fontSize: 14 }} />,
  },
  apiCalls: { label: 'API Calls', color: '#4cc9f0', icon: <Cloud style={{ fontSize: 14 }} /> },
  firebaseWrites: {
    label: 'Firebase Writes',
    color: '#ff9f1c',
    icon: <Storage style={{ fontSize: 14 }} />,
  },
  cleanup: {
    label: 'Cleanup',
    color: '#ff4d6d',
    icon: <CleaningServices style={{ fontSize: 14 }} />,
  },
};

export function PerformanceTab({
  theme,
}: {
  theme: {
    primary: string;
    text: { primary: string; muted: string };
    background: { paper: string };
  };
}) {
  const [data, setData] = useState<Record<string, ActionPerf>>({});
  const [loading, setLoading] = useState(true);
  const [verlauf, setVerlauf] = useState<Record<string, RunRecord[]>>({});

  useEffect(() => {
    const ref = dbRef('admin/performance');
    const handler = ref.on('value', (snap) => {
      setData(snap.val() || {});
      setLoading(false);
    });
    return () => ref.off('value', handler);
  }, []);

  // Der Verlauf beantwortet die Frage, die eine Momentaufnahme nicht kann:
  // wird es langsamer? Kommt die Trefferquote des Caches ins Rutschen?
  useEffect(() => {
    const ref = dbRef('admin/runs');
    const handler = ref.on('value', (snap) => {
      const val = (snap.val() || {}) as Record<string, Record<string, RunRecord>>;
      const proAction: Record<string, RunRecord[]> = {};
      for (const action of Object.keys(val)) {
        proAction[action] = Object.values(val[action] || {})
          .filter((r) => r && r.startedAt)
          .sort((a, b) => new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime())
          .slice(-20);
      }
      setVerlauf(proAction);
    });
    return () => ref.off('value', handler);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted }}>Laden...</div>
    );
  }

  const actions = Object.entries(data).sort((a, b) =>
    (b[1].timestamp || '').localeCompare(a[1].timestamp || '')
  );

  const handleCopyAll = () => {
    const lines = actions.map(([action, perf]) => {
      const phases = Object.entries(perf.phases || {})
        .map(([k, v]) => `${k}: ${v.formatted} (${v.percent})`)
        .join(', ');
      const users = (perf.users || [])
        .map((u) => `${u.user}: ${u.durationFormatted} (${u.itemCount}x)`)
        .join(', ');
      const tmdb = perf.tmdb
        ? `TMDB: ${perf.tmdb.requests} req, ${perf.tmdb.cacheHits} cache, ${perf.tmdb.rateLimits} 429s, ${perf.tmdb.fails} fails`
        : '';
      const tvmaze =
        perf.tvMaze && perf.tvMaze.requests > 0
          ? `TVMaze: ${perf.tvMaze.requests} req, ${perf.tvMaze.cacheHits} cache, ${perf.tvMaze.rateLimits} 429s`
          : '';
      return `=== ${action.toUpperCase()} (${perf.totalDurationFormatted}) ===\n${phases}\nUsers: ${users}\n${[tmdb, tvmaze].filter(Boolean).join('\n')}`;
    });
    void copyTextToClipboard(lines.join('\n\n'));
  };

  return (
    <div className="adm-stack">
      {/* Copy button */}
      {actions.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleCopyAll}
            style={{
              background: `${theme.primary}15`,
              border: `1px solid ${theme.primary}30`,
              color: theme.primary,
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Kopieren
          </button>
        </div>
      )}
      {/* Laufzeit-Verlauf je Action.
          Farbwahl geprueft: die Marken-Farbe und das Fehler-Rot sind fuer das
          Auge praktisch identisch (dE 6.1) — deshalb tragen die Balken ein
          neutrales Grau und nur Laeufe MIT echten Fehlern das Rot (dE 22.5
          normal, 10.5 bei Protanopie). Die Legende benennt es zusaetzlich,
          damit die Farbe nicht allein traegt. */}
      {Object.entries(verlauf)
        .filter(([, runs]) => runs.length > 1)
        .map(([action, runs]) => {
          const max = Math.max(...runs.map((r) => r.durationMs || 0), 1);
          const letzter = runs[runs.length - 1];
          const schnitt = runs.reduce((a, r) => a + (r.durationMs || 0), 0) / runs.length;
          const trefferquote = (r: RunRecord) => {
            const req = r.tmdb?.requests || 0;
            const hits = r.tmdb?.cacheHits || 0;
            return req + hits > 0 ? Math.round((hits / (req + hits)) * 100) : null;
          };
          return (
            <div
              key={action}
              style={{ borderRadius: 12, background: theme.background.paper, padding: '12px 16px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: theme.text.primary }}>
                  Laufzeit-Verlauf · {action}
                </span>
                <span style={{ fontSize: 11, color: theme.text.muted }}>
                  Schnitt {Math.round(schnitt / 1000)}s · zuletzt{' '}
                  {Math.round((letzter.durationMs || 0) / 1000)}s
                  {trefferquote(letzter) !== null && <> · Cache {trefferquote(letzter)}%</>}
                  {letzter.counters?.users !== undefined && (
                    <>
                      {' '}
                      · {letzter.counters.users} Nutzer · {letzter.counters.uniqueSeries ?? 0}{' '}
                      Serien · {letzter.counters.uniqueMovies ?? 0} Filme
                    </>
                  )}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 56 }}>
                {runs.map((r) => {
                  const fehlerhaft = (r.realErrorCount ?? 0) > 0;
                  const hoehe = Math.max(3, Math.round(((r.durationMs || 0) / max) * 56));
                  return (
                    <div
                      key={r.startedAt}
                      title={`${new Date(r.startedAt).toLocaleString('de-DE')} · ${Math.round(
                        (r.durationMs || 0) / 1000
                      )}s · ${r.realErrorCount ?? 0} echte Fehler`}
                      style={{
                        flex: 1,
                        minWidth: 6,
                        height: hoehe,
                        borderRadius: '4px 4px 0 0',
                        background: fehlerhaft ? '#ff4d6d' : '#8a93a5',
                      }}
                    />
                  );
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  marginTop: 8,
                  fontSize: 11,
                  color: theme.text.muted,
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span
                    style={{ width: 9, height: 9, borderRadius: 2, background: '#8a93a5' }}
                    aria-hidden
                  />
                  ohne echte Fehler
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span
                    style={{ width: 9, height: 9, borderRadius: 2, background: '#ff4d6d' }}
                    aria-hidden
                  />
                  mit echten Fehlern
                </span>
                <span style={{ marginLeft: 'auto' }}>{runs.length} Läufe</span>
              </div>
            </div>
          );
        })}

      {/* Overview cards */}
      <div className="adm-stats">
        {actions.map(([action, perf]) => {
          const color = ACTION_COLORS[action] || theme.primary;
          return (
            <div
              key={action}
              className="adm-stat"
              style={{ '--adm-tone': color, minWidth: 176 } as CSSProperties}
            >
              <div className="adm-tag" style={{ marginBottom: 6, display: 'inline-block' }}>
                {action}
              </div>
              <div className="adm-stat__value" style={{ fontSize: 22 }}>
                {perf.totalDurationFormatted}
              </div>
              <div className="adm-stat__label">
                {perf.timestamp ? new Date(perf.timestamp).toLocaleString('de-DE') : '—'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-action details */}
      {actions.map(([action, perf]) => {
        const color = ACTION_COLORS[action] || theme.primary;
        const phases = perf.phases || {};
        const totalMs = perf.totalDurationMs || 1;

        return (
          <div key={action} className="adm-row">
            {/* Header */}
            <div
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${theme.text.muted}22`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Timer style={{ fontSize: 16, color }} />
                <span style={{ fontWeight: 600, color, fontSize: 14 }}>{action}</span>
                <span style={{ fontSize: 12, color: theme.text.muted }}>
                  {perf.totalDurationFormatted}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: theme.text.muted }}>
                {perf.tmdb && (
                  <span>
                    TMDB: {perf.tmdb.requests} req, {perf.tmdb.cacheHits} cache
                    {perf.tmdb.rateLimits > 0 && (
                      <span style={{ color: '#ff4d6d' }}>, {perf.tmdb.rateLimits} 429s</span>
                    )}
                  </span>
                )}
                {perf.tvMaze && perf.tvMaze.requests > 0 && (
                  <span>
                    TVMaze: {perf.tvMaze.requests} req
                    {perf.tvMaze.rateLimits > 0 && (
                      <span style={{ color: '#ff4d6d' }}>, {perf.tvMaze.rateLimits} 429s</span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Phase bar */}
            <div style={{ padding: '12px 16px' }}>
              <div
                style={{
                  display: 'flex',
                  height: 24,
                  borderRadius: 6,
                  overflow: 'hidden',
                  background: `${theme.text.muted}11`,
                }}
              >
                {Object.entries(phases).map(([phase, data]) => {
                  const pct = (data.ms / totalMs) * 100;
                  if (pct < 1) return null;
                  const cfg = PHASE_CONFIG[phase] || {
                    label: phase,
                    color: theme.text.muted,
                    icon: null,
                  };
                  return (
                    <div
                      key={phase}
                      title={`${cfg.label}: ${data.formatted} (${data.percent})`}
                      style={{
                        width: `${pct}%`,
                        background: cfg.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#000',
                        minWidth: pct > 5 ? undefined : 0,
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {pct > 10 && `${cfg.label} ${data.percent}`}
                    </div>
                  );
                })}
              </div>

              {/* Phase legend */}
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  marginTop: 8,
                  flexWrap: 'wrap',
                }}
              >
                {Object.entries(phases).map(([phase, data]) => {
                  const cfg = PHASE_CONFIG[phase] || {
                    label: phase,
                    color: theme.text.muted,
                    icon: null,
                  };
                  return (
                    <div
                      key={phase}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: cfg.color,
                        }}
                      />
                      <span style={{ color: theme.text.muted }}>{cfg.label}:</span>
                      <span style={{ color: theme.text.primary, fontWeight: 600 }}>
                        {data.formatted}
                      </span>
                      <span style={{ color: theme.text.muted }}>({data.percent})</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* User timings */}
            {perf.users && perf.users.length > 0 && (
              <div style={{ padding: '0 16px 12px' }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: theme.text.muted,
                    marginBottom: 6,
                  }}
                >
                  Pro User
                </div>
                {perf.users.map((u, idx) => {
                  const userPct = (u.durationMs / totalMs) * 100;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '4px 0',
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          color: theme.text.primary,
                          minWidth: 100,
                          fontWeight: 500,
                        }}
                      >
                        {u.user}
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          borderRadius: 3,
                          background: `${theme.text.muted}15`,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(userPct, 100)}%`,
                            height: '100%',
                            borderRadius: 3,
                            background: color,
                          }}
                        />
                      </div>
                      <span style={{ color: theme.text.muted, minWidth: 45, textAlign: 'right' }}>
                        {u.durationFormatted}
                      </span>
                      <span
                        style={{
                          color: theme.text.muted,
                          fontSize: 10,
                          minWidth: 30,
                          textAlign: 'right',
                        }}
                      >
                        {u.itemCount}x
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {actions.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: theme.text.muted }}>
          <Speed style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }} />
          <div>Noch keine Performance-Daten vorhanden</div>
        </div>
      )}
    </div>
  );
}
