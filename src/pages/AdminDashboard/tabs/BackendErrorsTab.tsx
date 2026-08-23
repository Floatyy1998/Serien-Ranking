import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { CSSProperties } from 'react';
import { CheckCircle, Warning, Delete, ContentCopy } from '@mui/icons-material';
import { dbRef } from '../../../services/db/ref';
import { copyTextToClipboard } from '../../../utils/clipboard';

interface BackendError {
  timestamp: string;
  context: string;
  message: string;
  // Seit der Telemetrie-Umstellung steht EIN Eintrag fuer eine ganze Gruppe
  // gleichartiger Fehler: count ist die Anzahl der Vorkommen, severity trennt
  // echte Fehler von erwarteten Normalfaellen (z. B. TVMaze-Fallback).
  severity?: 'error' | 'info';
  count?: number;
  [key: string]: unknown;
}

/** Vorkommen statt Eintraege zaehlen — ein Eintrag kann N Fehler buendeln. */
const summe = (liste: BackendError[]) => liste.reduce((n, e) => n + (e.count ?? 1), 0);
const istEcht = (e: BackendError) => (e.severity ?? 'error') === 'error';

/** Ein Lauf aus admin/runs — die Historie, die es vorher gar nicht gab. */
interface RunGroup {
  context: string;
  muster: string;
  severity?: 'error' | 'info';
  anzahl: number;
  zuletzt?: string;
  beispiele?: { message?: string; [k: string]: unknown }[];
}

interface RunRecord {
  startedAt: string;
  durationMs: number;
  errorTotal: number;
  realErrorCount: number;
  errorGroups?: RunGroup[];
  catalog?: { luecken?: number; seriesGeprueft?: number; offeneRemaps?: number };
  counters?: Record<string, number>;
}

interface ActionLog {
  runStart: string;
  runEnd?: string;
  action: string;
  errorCount: number;
  errors: BackendError[] | Record<string, BackendError>;
}

// Firebase kann Arrays als Objekte mit numerischen Keys liefern
const toErrorArray = (
  errors: BackendError[] | Record<string, BackendError> | undefined
): BackendError[] => {
  if (!errors) return [];
  if (Array.isArray(errors)) return errors;
  return Object.values(errors);
};

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
  // Der Filter steht in der URL, damit ein bestimmter Lauf verlinkbar ist:
  // /admin?tab=backend&action=episodes
  const [params, setParams] = useSearchParams();
  const activeAction = params.get('action');
  const setActiveAction = useCallback(
    (naechste: string | null) => {
      const next = new URLSearchParams(params);
      if (naechste) next.set('action', naechste);
      else next.delete('action');
      setParams(next);
    },
    [params, setParams]
  );

  useEffect(() => {
    const ref = dbRef('admin/backendErrors');
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

  // Historie nur fuer die gewaehlte Action laden — der Gesamtknoten waere
  // unnoetig gross, und ohne Auswahl gibt es nichts Sinnvolles zu zeigen.
  const [runs, setRuns] = useState<RunRecord[]>([]);
  useEffect(() => {
    if (!activeAction) {
      setRuns([]);
      return;
    }
    const ref = dbRef(`admin/runs/${activeAction}`).limitToLast(20);
    const handler = ref.on('value', (snap) => {
      const val = (snap.val() || {}) as Record<string, RunRecord>;
      setRuns(
        Object.values(val).sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        )
      );
    });
    return () => ref.off('value', handler);
  }, [activeAction]);

  const handleClear = async () => {
    await dbRef('admin/backendErrors').remove();
  };

  const handleClearAction = async (action: string) => {
    await dbRef(`admin/backendErrors/${action}`).remove();
  };

  // Ein bestimmter Lauf kann geoeffnet werden (?run=…) — dann zeigt der Tab
  // dessen Fehler statt der des letzten Laufs. Damit ist ein konkreter
  // Vorfall verlinkbar, nicht nur "der aktuelle Stand".
  const gewaehlterLauf = params.get('run');
  const offenerLauf = gewaehlterLauf
    ? runs.find((r) => String(new Date(r.startedAt).getTime()) === gewaehlterLauf)
    : null;

  const setLauf = useCallback(
    (r: RunRecord | null) => {
      const next = new URLSearchParams(params);
      if (r) next.set('run', String(new Date(r.startedAt).getTime()));
      else next.delete('run');
      setParams(next);
    },
    [params, setParams]
  );

  // Collect all errors across all actions
  const allErrors: (BackendError & { _action: string })[] = [];
  if (offenerLauf) {
    (offenerLauf.errorGroups || []).forEach((g) =>
      allErrors.push({
        timestamp: g.zuletzt || offenerLauf.startedAt,
        context: g.context,
        message: g.beispiele?.[0]?.message || g.muster,
        severity: g.severity,
        count: g.anzahl,
        _action: activeAction || 'run',
      })
    );
  } else {
    Object.entries(logs).forEach(([action, log]) => {
      toErrorArray(log.errors).forEach((e) => {
        allErrors.push({ ...e, _action: action });
      });
    });
  }

  const filteredErrors = activeAction
    ? allErrors.filter((e) => e._action === activeAction)
    : allErrors;

  const handleCopyAll = () => {
    const sections = Object.entries(logs).map(([action, log]) => {
      const lines = toErrorArray(log.errors).map((e) => {
        const details = Object.entries(e)
          .filter(([k]) => !['timestamp', 'context', 'message'].includes(k))
          .map(([k, v]) => `${k}: ${v}`)
          .join(' | ');
        return `[${e.context}] ${e.message}${details ? ` (${details})` : ''}`;
      });
      return `=== ${action.toUpperCase()} (${log.runStart || '?'}) ===\n${lines.join('\n')}`;
    });
    void copyTextToClipboard(sections.join('\n\n'));
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

  const echteFehler = allErrors.filter(istEcht);
  const erwartete = allErrors.filter((e) => !istEcht(e));
  const hasErrors = summe(echteFehler) > 0;

  return (
    <div className="adm-stack">
      {/* Summary */}
      <div className="adm-stats">
        <div className={`adm-stat ${hasErrors ? 'adm-tone-bad' : 'adm-tone-ok'}`}>
          <div className="adm-stat__value">{summe(echteFehler)}</div>
          <div className="adm-stat__label">Fehler gesamt</div>
        </div>
        <div className="adm-stat adm-tone-info">
          <div className="adm-stat__value">{summe(erwartete)}</div>
          <div className="adm-stat__label">erwartet (kein Handlungsbedarf)</div>
        </div>
        <div className="adm-stat adm-tone-info">
          <div className="adm-stat__value">{Object.keys(logs).length}</div>
          <div className="adm-stat__label">Runs</div>
        </div>
        <div className={`adm-stat ${hasErrors ? 'adm-tone-bad' : 'adm-tone-ok'}`}>
          <div className="adm-stat__value">
            {hasErrors ? (
              <Warning style={{ fontSize: 26 }} />
            ) : (
              <CheckCircle style={{ fontSize: 26 }} />
            )}
          </div>
          <div className="adm-stat__label">{hasErrors ? 'Fehler' : 'Alles OK'}</div>
        </div>
        {hasErrors && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginLeft: 'auto' }}>
            <button className="adm-icon-btn" onClick={handleCopyAll} title="Alle Errors kopieren">
              <ContentCopy style={{ fontSize: 18 }} />
            </button>
            <button className="adm-icon-btn" onClick={handleClear} title="Alle Errors löschen">
              <Delete style={{ fontSize: 18 }} />
            </button>
          </div>
        )}
      </div>

      {/* Action tabs */}
      {Object.keys(logs).length > 0 && (
        <div className="adm-chips">
          <button
            className={`adm-chip ${activeAction === null ? 'adm-chip--on' : ''}`}
            onClick={() => setActiveAction(null)}
          >
            Alle ({summe(allErrors)})
          </button>
          {Object.entries(logs)
            .sort((a, b) => (b[1].runStart || '').localeCompare(a[1].runStart || ''))
            .map(([action, log]) => {
              const color = ACTION_COLORS[action] || theme.primary;
              const count = summe(toErrorArray(log.errors));
              return (
                <button
                  key={action}
                  className={`adm-chip ${activeAction === action ? 'adm-chip--on' : ''}`}
                  style={{ '--adm-tone': color } as CSSProperties}
                  onClick={() => setActiveAction(activeAction === action ? null : action)}
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
                    color:
                      summe(toErrorArray(log.errors).filter(istEcht)) > 0 ? '#ff4d6d' : '#06d6a0',
                  }}
                >
                  {summe(toErrorArray(log.errors))} Fehler
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

      {/* Lauf-Historie der gewaehlten Action */}
      {activeAction && runs.length > 0 && (
        <div style={{ borderRadius: 12, background: theme.background.paper, padding: '12px 16px' }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: theme.text.muted,
              marginBottom: 8,
            }}
          >
            Verlauf ({runs.length} Läufe)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {runs.map((r) => (
              <div
                key={r.startedAt}
                role="button"
                tabIndex={0}
                onClick={() => setLauf(offenerLauf === r ? null : r)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLauf(offenerLauf === r ? null : r);
                  }
                }}
                title="Diesen Lauf öffnen — zeigt seine Fehlergruppen statt der aktuellen"
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'baseline',
                  fontSize: 12,
                  fontVariantNumeric: 'tabular-nums',
                  padding: '3px 6px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  background: offenerLauf === r ? `${theme.primary}22` : 'transparent',
                  color: theme.text.primary,
                }}
              >
                <span style={{ color: theme.text.muted, minWidth: 118 }}>
                  {new Date(r.startedAt).toLocaleString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span style={{ minWidth: 46 }}>{Math.round(r.durationMs / 1000)}s</span>
                <span style={{ minWidth: 96, color: r.realErrorCount > 0 ? '#ff4d6d' : '#06d6a0' }}>
                  {r.realErrorCount} echte
                </span>
                <span style={{ color: theme.text.muted, minWidth: 92 }}>{r.errorTotal} gesamt</span>
                {r.catalog?.luecken !== undefined && (
                  <span style={{ color: r.catalog.luecken > 0 ? '#ff4d6d' : theme.text.muted }}>
                    {r.catalog.luecken} Katalog-Lücken
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unuebersehbar machen, dass ein historischer Lauf offen ist — sonst
          liest man alte Fehler als aktuellen Stand. */}
      {offenerLauf && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 10,
            background: `${theme.primary}18`,
            border: `1px solid ${theme.primary}44`,
            fontSize: 13,
            color: theme.text.primary,
          }}
        >
          <span>
            Lauf vom <strong>{new Date(offenerLauf.startedAt).toLocaleString('de-DE')}</strong> —
            nicht der aktuelle Stand
          </span>
          <button
            onClick={() => setLauf(null)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: `1px solid ${theme.primary}55`,
              color: theme.primary,
              padding: '4px 12px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Zurück zum aktuellen Stand
          </button>
        </div>
      )}

      {/* Errors grouped by context */}
      {Object.entries(grouped)
        .sort((a, b) => {
          // Echte Fehler zuerst, danach nach Haeufigkeit — die 46 erwarteten
          // TVMaze-Fallbacks sollen den einen echten nicht verdraengen.
          const aEcht = a[1].some(istEcht);
          const bEcht = b[1].some(istEcht);
          if (aEcht !== bEcht) return aEcht ? -1 : 1;
          return summe(b[1]) - summe(a[1]);
        })
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
                {summe(contextErrors)}x
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
                        void copyTextToClipboard(
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
                        onClick={() => void copyTextToClipboard(String(val))}
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
