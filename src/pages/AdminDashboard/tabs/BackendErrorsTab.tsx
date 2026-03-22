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

interface BackendErrorLog {
  runStart: string;
  runEnd: string;
  errorCount: number;
  errors: BackendError[];
}

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
  const [log, setLog] = useState<BackendErrorLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = firebase.database().ref('admin/backendErrors');
    const handler = ref.on('value', (snap) => {
      setLog(snap.val());
      setLoading(false);
    });
    return () => ref.off('value', handler);
  }, []);

  const handleClear = async () => {
    await firebase.database().ref('admin/backendErrors').remove();
  };

  const handleCopyAll = () => {
    const lines = (log?.errors || []).map((e) => {
      const details = Object.entries(e)
        .filter(([k]) => !['timestamp', 'context', 'message'].includes(k))
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ');
      return `[${e.context}] ${e.message}${details ? ` (${details})` : ''}`;
    });
    const text = `Backend Errors (${log?.runStart || '?'}):\n${lines.join('\n')}`;
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted }}>Laden...</div>
    );
  }

  const errors = log?.errors || [];
  const hasErrors = errors.length > 0;

  // Group by context
  const grouped: Record<string, BackendError[]> = {};
  errors.forEach((e) => {
    const ctx = e.context || 'Unbekannt';
    if (!grouped[ctx]) grouped[ctx] = [];
    grouped[ctx].push(e);
  });

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
            {errors.length}
          </div>
          <div style={{ fontSize: 12, color: theme.text.muted }}>Fehler</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.text.primary }}>
            {Object.keys(grouped).length}
          </div>
          <div style={{ fontSize: 12, color: theme.text.muted }}>Kategorien</div>
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

      {/* Run info */}
      {log && (
        <div
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            background: theme.background.paper,
            fontSize: 12,
            color: theme.text.muted,
          }}
        >
          <span style={{ fontWeight: 600 }}>Letzter Run:</span>{' '}
          {new Date(log.runStart).toLocaleString('de-DE')} —{' '}
          {new Date(log.runEnd).toLocaleString('de-DE')}
        </div>
      )}

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
                ([k]) => !['timestamp', 'context', 'message'].includes(k)
              );
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
                          .filter(([k]) => !['timestamp', 'context', 'message'].includes(k))
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
          <div>Keine Backend-Fehler im letzten Run</div>
        </div>
      )}
    </div>
  );
}
