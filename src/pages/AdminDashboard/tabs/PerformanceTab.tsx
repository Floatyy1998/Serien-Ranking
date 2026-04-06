import { useEffect, useState } from 'react';
import { Speed, Timer, Storage, Cloud, CleaningServices } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

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

interface ActionPerf {
  timestamp: string;
  action: string;
  totalDurationMs: number;
  totalDurationFormatted: string;
  phases: Record<string, PhaseData>;
  users: UserTiming[];
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

  useEffect(() => {
    const ref = firebase.database().ref('admin/performance');
    const handler = ref.on('value', (snap) => {
      setData(snap.val() || {});
      setLoading(false);
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
    navigator.clipboard.writeText(lines.join('\n\n'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      {/* Overview cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {actions.map(([action, perf]) => {
          const color = ACTION_COLORS[action] || theme.primary;
          return (
            <div
              key={action}
              style={{
                flex: '1 1 150px',
                padding: 16,
                borderRadius: 12,
                background: theme.background.paper,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color,
                  background: `${color}20`,
                  display: 'inline-block',
                  padding: '2px 10px',
                  borderRadius: 10,
                  marginBottom: 8,
                }}
              >
                {action}
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.text.primary }}>
                {perf.totalDurationFormatted}
              </div>
              <div style={{ fontSize: 11, color: theme.text.muted, marginTop: 2 }}>
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
          <div
            key={action}
            style={{ borderRadius: 12, background: theme.background.paper, overflow: 'hidden' }}
          >
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
