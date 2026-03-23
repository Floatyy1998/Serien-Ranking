import { useEffect, useState } from 'react';
import { CheckCircle, Warning, Delete, ContentCopy } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

interface BackendError {
  timestamp: string;
  context: string;
  message: string;
  [key: string]: unknown;
}

interface ActionLog {
  runStart: string;
  runEnd?: string;
  action: string;
  errorCount: number;
  errors: BackendError[];
}

const ACTION_COLORS: Record<string, string> = {
  episodes: '#8338ec',
  movies: '#ff006e',
  all: '#3a86ff',
  dates: '#06d6a0',
};

export function BackendErrorsTab({
  theme,
}: {
  data: unknown;
  theme: {
    primary: string;
    text: { primary: string; muted: string };
    background: { paper: string };
  };
}) {
  const [logs, setLogs] = useState<Record<string, ActionLog>>({});
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  useEffect(() => {
    const ref = firebase.database().ref('admin/backendErrors');
    const handler = ref.on('value', (snap) => {
      const data = snap.val();
      if (data && typeof data === 'object') {
        // Neues Format: { episodes: {...}, movies: {...}, all: {...} }
        if (data.episodes || data.movies || data.all || data.dates) {
          setLogs(data);
        } else if (data.runStart) {
          // Altes Format: flaches Objekt — migrieren
          setLogs({ [data.action || 'all']: data });
        }
      }
      setLoading(false);
    });
    return () => ref.off('value', handler);
  }, []);

  const handleClear = async () => {
    await firebase.database().ref('admin/backendErrors').remove();
  };

  const handleClearAction = async (action: string) => {
    await firebase.database().ref(`admin/backendErrors/${action}`).remove();
  };

  // Collect all errors across all actions
  const allErrors: (BackendError & { _action: string })[] = [];
  Object.entries(logs).forEach(([action, log]) => {
    (log.errors || []).forEach((e) => {
      allErrors.push({ ...e, _action: action });
    });
  });

  const filteredErrors = activeAction
    ? allErrors.filter((e) => e._action === activeAction)
    : allErrors;

  const handleCopyAll = () => {
    const sections = Object.entries(logs).map(([action, log]) => {
      const lines = (log.errors || []).map((e) => {
        const details = Object.entries(e)
          .filter(([k]) => !['timestamp', 'context', 'message'].includes(k))
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
        return `[${e.context}] ${e.message}${details ? ` (${details})` : ''}`;
      });
      return `=== ${action.toUpperCase()} (${log.runStart || '?'}) ===\n${lines.join('\n')}`;
    });
    navigator.clipboard.writeText(sections.join('\n\n'));
  };

  // Group filtered errors by context
  const grouped: Record<string, (BackendError & { _action: string })[]> = {};
  filteredErrors.forEach((e) => {
    const ctx = e.context || 'Unbekannt';
    if (!grouped[ctx]) grouped[ctx] = [];
    grouped[ctx].push(e);
  });

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted }}>Laden...</div>
    );
  }

  const hasErrors = allErrors.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          padding: 16,
          borderRadius: 12,
          background: theme.background.paper,
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: hasErrors ? '#ff4d6d' : '#06d6a0',
            }}
          >
            {allErrors.length}
          </div>
          <div style={{ fontSize: 12, color: theme.text.muted }}>Fehler gesamt</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.text.primary }}>
            {Object.keys(logs).length}
          </div>
          <div style={{ fontSize: 12, color: theme.text.muted }}>Runs</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          {hasErrors ? (
            <Warning style={{ fontSize: 28, color: '#ff4d6d' }} />
          ) : (
            <CheckCircle style={{ fontSize: 28, color: '#06d6a0' }} />
          )}
          <div style={{ fontSize: 12, color: theme.text.muted }}>
            {hasErrors ? 'Fehler' : 'Alles OK'}
          </div>
        </div>
        {hasErrors && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCopyAll}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.text.muted,
                cursor: 'pointer',
                padding: 4,
              }}
              title="Alle Errors kopieren"
            >
              <ContentCopy style={{ fontSize: 18 }} />
            </button>
            <button
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.text.muted,
                cursor: 'pointer',
                padding: 4,
              }}
              title="Alle Errors löschen"
            >
              <Delete style={{ fontSize: 18 }} />
            </button>
          </div>
        )}
      </div>

      {/* Action tabs */}
      {Object.keys(logs).length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveAction(null)}
            style={{
              padding: '6px 14px',
              borderRadius: 20,
              border:
                activeAction === null ? `2px solid ${theme.primary}` : '2px solid transparent',
              background: `${theme.text.muted}15`,
              color: theme.text.primary,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Alle ({allErrors.length})
          </button>
          {Object.entries(logs)
            .sort((a, b) => (b[1].runStart || '').localeCompare(a[1].runStart || ''))
            .map(([action, log]) => {
              const color = ACTION_COLORS[action] || theme.primary;
              const count = log.errors?.length || 0;
              return (
                <button
                  key={action}
                  onClick={() => setActiveAction(activeAction === action ? null : action)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    border:
                      activeAction === action ? `2px solid ${color}` : '2px solid transparent',
                    background: `${color}20`,
                    color,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {action} ({count})
                </button>
              );
            })}
        </div>
      )}

      {/* Run info per action */}
      {Object.entries(logs)
        .filter(([action]) => !activeAction || activeAction === action)
        .sort((a, b) => (b[1].runStart || '').localeCompare(a[1].runStart || ''))
        .map(([action, log]) => {
          const color = ACTION_COLORS[action] || theme.primary;
          return (
            <div
              key={action}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                background: theme.background.paper,
                fontSize: 12,
                color: theme.text.muted,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span
                  style={{
                    background: `${color}20`,
                    color,
                    padding: '1px 8px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 700,
                    marginRight: 6,
                  }}
                >
                  {action}
                </span>
                {log.runStart ? new Date(log.runStart).toLocaleString('de-DE') : '—'}
                {log.runEnd
                  ? ` — ${new Date(log.runEnd).toLocaleString('de-DE')}`
                  : ' (läuft noch...)'}
                <span
                  style={{
                    marginLeft: 8,
                    color: (log.errors?.length || 0) > 0 ? '#ff4d6d' : '#06d6a0',
                  }}
                >
                  {log.errors?.length || 0} Fehler
                </span>
              </div>
              <button
                onClick={() => handleClearAction(action)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.text.muted,
                  cursor: 'pointer',
                  padding: 2,
                }}
                title={`${action}-Log löschen`}
              >
                <Delete style={{ fontSize: 14 }} />
              </button>
            </div>
          );
        })}

      {/* Errors grouped by context */}
      {Object.entries(grouped)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([context, contextErrors]) => (
          <div
            key={context}
            style={{
              borderRadius: 12,
              background: theme.background.paper,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '10px 16px',
                borderBottom: `1px solid ${theme.text.muted}22`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 600, color: '#ff4d6d', fontSize: 13 }}>{context}</span>
              <span
                style={{
                  fontSize: 11,
                  background: '#ff4d6d20',
                  color: '#ff4d6d',
                  padding: '2px 8px',
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                {contextErrors.length}x
              </span>
            </div>

            {contextErrors.map((err, idx) => {
              const details = Object.entries(err).filter(
                ([k]) => !['timestamp', 'context', 'message', '_action'].includes(k)
              );
              const actionColor = ACTION_COLORS[err._action] || theme.primary;
              return (
                <div
                  key={idx}
                  style={{
                    padding: '8px 16px',
                    borderBottom:
                      idx < contextErrors.length - 1 ? `1px solid ${theme.text.muted}11` : 'none',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: theme.text.primary,
                      marginBottom: 4,
                      fontFamily: 'monospace',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>{err.message}</span>
                    <button
                      onClick={() => {
                        const d = Object.entries(err)
                          .filter(
                            ([k]) => !['timestamp', 'context', 'message', '_action'].includes(k)
                          )
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(' | ');
                        navigator.clipboard.writeText(
                          `[${err.context}] ${err.message}${d ? ` (${d})` : ''}`
                        );
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme.text.muted,
                        cursor: 'pointer',
                        padding: 2,
                        flexShrink: 0,
                      }}
                      title="Fehler kopieren"
                    >
                      <ContentCopy style={{ fontSize: 13 }} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: 10,
                        background: `${actionColor}20`,
                        color: actionColor,
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontWeight: 700,
                      }}
                    >
                      {err._action}
                    </span>
                    <span style={{ fontSize: 10, color: theme.text.muted }}>
                      {new Date(err.timestamp).toLocaleString('de-DE')}
                    </span>
                    {details.map(([key, val]) => (
                      <span
                        key={key}
                        onClick={() => navigator.clipboard.writeText(String(val))}
                        style={{
                          fontSize: 10,
                          color: '#4cc9f0',
                          background: '#4cc9f011',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontFamily: 'monospace',
                          cursor: 'pointer',
                        }}
                        title={`"${val}" kopieren`}
                      >
                        {key}: {String(val)}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {!hasErrors && (
        <div style={{ textAlign: 'center', padding: 40, color: theme.text.muted }}>
          <CheckCircle style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }} />
          <div>Keine Backend-Fehler</div>
        </div>
      )}
    </div>
  );
}
