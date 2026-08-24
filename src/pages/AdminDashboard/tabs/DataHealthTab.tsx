import { useState, useEffect, useMemo } from 'react';
import { Delete, Warning, CheckCircle, ContentCopy } from '@mui/icons-material';
import { dbRef, serverTimestamp } from '../../../services/db/ref';
import { useAuth } from '../../../contexts/AuthContext';
import { showToast } from '../../../lib/toast';
import { copyTextToClipboard } from '../../../utils/clipboard';

interface DataIssue {
  type?: string;
  seriesName: string;
  seriesKey: string;
  seasonIndex: number;
  episodeIndex: number;
  firebasePath: string;
  problem: string;
  storedFields: string[];
  storedValues: Record<string, unknown>;
}

interface UserIssues {
  timestamp: string;
  userName: string;
  issueCount: number;
  issues: DataIssue[];
}

/** Zusammenfassung aus admin/dataHealth — schreibt der naechtliche Cron. */
interface HealthSummary {
  lastRun?: string;
  durationMs?: number;
  usersChecked?: number;
  usersWithIssues?: number;
  issueTotal?: number;
  catalog?: {
    seriesGeprueft?: number;
    luecken?: number;
    lueckenSerien?: { id: string; keys: string }[];
    offeneRemaps?: number;
    unvollstaendig?: number;
    unvollstaendigeSerien?: {
      id: string;
      title: string;
      tmdb: number;
      katalog: number;
      fehlen: number;
    }[];
  };
}

const ISSUE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  // Fehlerklassen des heutigen, ID-basierten Datenmodells
  'orphan-episode': { label: 'Unsichtbare Haken (Episode fehlt im Katalog)', color: '#ff4d6d' },
  'season-out-of-range': { label: 'Staffel-Key ausserhalb des Katalogs', color: '#d62828' },
  'orphan-series': { label: 'Watch-Daten ohne verfolgte Serie', color: '#f77f00' },
  'no-catalog-entry': { label: 'Serie fehlt im Katalog', color: '#e76f51' },
  // Altbestand aus der frueheren Array-Struktur
  'missing-episode-number': { label: 'Episoden ohne episode_number', color: '#ff4d6d' },
  'missing-series-name': { label: 'Serien ohne Name', color: '#e76f51' },
  'missing-series-id': { label: 'Serien ohne ID', color: '#d62828' },
  'missing-seasons': { label: 'Serien ohne Seasons', color: '#f77f00' },
  'empty-season': { label: 'Leere Staffeln', color: '#fcbf49' },
  'missing-season-number': { label: 'Staffeln ohne season_number', color: '#f4a261' },
  'missing-episode-name': { label: 'Episoden ohne Name', color: '#8338ec' },
  'duplicate-episode': { label: 'Doppelte Episoden', color: '#3a86ff' },
  'watched-without-timestamp': { label: 'Watched ohne firstWatchedAt', color: '#06d6a0' },
  'sparse-array-hole': { label: 'Sparse Array Löcher', color: '#118ab2' },
  'mismatched-numbering': { label: 'Falsche Nummerierung', color: '#ef476f' },
  'missing-all-genre': { label: 'Fehlendes "All" Genre', color: '#ff9f1c' },
  'missing-all-rating': { label: 'Fehlendes "All" Rating', color: '#e9c46a' },
};

function getIssueColor(type?: string): string {
  return (type && ISSUE_TYPE_CONFIG[type]?.color) || '#ff4d6d';
}

export function DataHealthTab({
  theme,
}: {
  data: unknown;
  theme: {
    primary: string;
    text: { primary: string; muted: string };
    background: { paper: string };
  };
}) {
  const [issuesByUser, setIssuesByUser] = useState<Record<string, UserIssues>>({});
  const [loading, setLoading] = useState(true);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const { user: angemeldeterNutzer } = useAuth() || {};
  const eigeneUid = angemeldeterNutzer?.uid ?? null;
  /** Firebase-Schluessel duerfen kein / . # $ [ ] enthalten. */
  const auftragsSchluessel = (pfad: string) => pfad.replace(/[/.#$[]]/g, '_');
  const [filterType, setFilterType] = useState<string | null>(null);

  const [summary, setSummary] = useState<HealthSummary | null>(null);
  /** Serien, die bereits auf TMDB festgelegt sind (admin/config/forceTmdb). */
  const [forceListe, setForceListe] = useState<Record<string, unknown>>({});
  const [festlegend, setFestlegend] = useState<string | null>(null);

  useEffect(() => {
    const ref = dbRef('admin/dataIntegrityIssues');
    const handler = ref.on('value', (snap) => {
      setIssuesByUser(snap.val() || {});
      setLoading(false);
    });
    return () => ref.off('value', handler);
  }, []);

  // Getrennt vom Befund-Knoten: ohne diese Zusammenfassung liesse sich
  // "geprueft und sauber" nicht von "nie geprueft" unterscheiden — der Tab
  // zeigte jahrelang gruen, weil gar nichts mass.
  useEffect(() => {
    const ref = dbRef('admin/dataHealth');
    const handler = ref.on('value', (snap) => setSummary(snap.val() || null));
    return () => ref.off('value', handler);
  }, []);

  useEffect(() => {
    const ref = dbRef('admin/config/forceTmdb');
    const handler = ref.on('value', (snap) => setForceListe(snap.val() || {}));
    return () => ref.off('value', handler);
  }, []);

  /**
   * Legt eine Serie auf TMDB fest. Das Backend liest die Liste aus Datei UND
   * diesem Knoten und uebernimmt den Eintrag binnen einer Minute — der
   * naechste Katalog-Lauf baut die Serie dann vollstaendig aus TMDB.
   */
  const aufTmdbFestlegen = async (id: string, titel: string) => {
    setFestlegend(id);
    try {
      await dbRef(`admin/config/forceTmdb/${id}`).set({
        addedAt: serverTimestamp(),
        title: titel,
      });
    } catch (e) {
      console.error('[forceTmdb] Schreiben fehlgeschlagen:', e);
    } finally {
      setFestlegend(null);
    }
  };

  const totalIssues = Object.values(issuesByUser).reduce(
    (sum, u) => sum + (u.issues?.length || 0),
    0
  );
  const affectedUsers = Object.keys(issuesByUser).length;

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(issuesByUser).forEach((userData) => {
      userData.issues?.forEach((issue) => {
        const t = issue.type || 'unknown';
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [issuesByUser]);

  const handleDeleteUserIssues = async (uid: string) => {
    await dbRef(`admin/dataIntegrityIssues/${uid}`).remove();
  };

  /**
   * Loescht einen fehlerhaften Watch-Eintrag.
   *
   * Direkt geht das nur bei den eigenen Daten: Die Rules erlauben Schreiben
   * ausschliesslich unter der eigenen UID, Lesen dagegen ueberall. Fuer fremde
   * Nutzer wird der Auftrag deshalb in admin/config/watchDeletions abgelegt —
   * das Backend hoert darauf und fuehrt ihn binnen Sekunden aus.
   *
   * Vorher scheiterte der Knopf bei fremden Nutzern lautlos: kein catch, keine
   * Meldung, nichts passierte.
   */
  const handleDeleteCorruptEpisode = async (uid: string, issue: DataIssue) => {
    setDeletingPath(issue.firebasePath);
    try {
      if (uid === eigeneUid) {
        await dbRef(issue.firebasePath).remove();
      } else {
        await dbRef(`admin/config/watchDeletions/${auftragsSchluessel(issue.firebasePath)}`).set({
          path: issue.firebasePath,
          requestedAt: serverTimestamp(),
        });
        showToast('Löschauftrag gesendet — das Backend führt ihn in Kürze aus', 3000);
      }
      const remaining = issuesByUser[uid]?.issues?.filter(
        (i) => i.firebasePath !== issue.firebasePath
      );
      if (!remaining || remaining.length === 0) {
        await handleDeleteUserIssues(uid);
      } else {
        await dbRef(`admin/dataIntegrityIssues/${uid}/issues`).set(remaining);
        await dbRef(`admin/dataIntegrityIssues/${uid}/issueCount`).set(remaining.length);
      }
    } catch (e) {
      console.error('[DataHealth] Löschen fehlgeschlagen:', e);
      showToast(`Löschen fehlgeschlagen: ${(e as Error)?.message || 'unbekannt'}`, 5000, 'error');
    } finally {
      setDeletingPath(null);
    }
  };

  const copyPath = (path: string) => {
    void copyTextToClipboard(path);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted }}>Laden...</div>
    );
  }

  return (
    <div className="adm-stack">
      {/* Summary */}
      <div className="adm-stats">
        <div className={`adm-stat ${totalIssues > 0 ? 'adm-tone-bad' : 'adm-tone-ok'}`}>
          <div className="adm-stat__value">{totalIssues}</div>
          <div className="adm-stat__label">Datenprobleme</div>
        </div>
        <div className="adm-stat adm-tone-info">
          <div className="adm-stat__value">{affectedUsers}</div>
          <div className="adm-stat__label">Betroffene User</div>
        </div>
        <div className="adm-stat adm-tone-info">
          <div className="adm-stat__value">{Object.keys(typeCounts).length}</div>
          <div className="adm-stat__label">Problem-Typen</div>
        </div>
        <div
          className={`adm-stat ${
            (summary?.catalog?.luecken ?? 0) > 0 ? 'adm-tone-bad' : 'adm-tone-ok'
          }`}
        >
          <div className="adm-stat__value">{summary?.catalog?.luecken ?? '—'}</div>
          <div className="adm-stat__label">Katalog-Lücken</div>
        </div>
        <div
          className={`adm-stat ${
            (summary?.catalog?.unvollstaendig ?? 0) > 0 ? 'adm-tone-bad' : 'adm-tone-ok'
          }`}
        >
          <div className="adm-stat__value">{summary?.catalog?.unvollstaendig ?? '—'}</div>
          <div className="adm-stat__label">Unvollständige Serien</div>
        </div>
        <div
          className={`adm-stat ${
            !summary?.lastRun ? 'adm-tone-info' : totalIssues === 0 ? 'adm-tone-ok' : 'adm-tone-bad'
          }`}
        >
          <div className="adm-stat__value">
            {!summary?.lastRun ? (
              <Warning style={{ fontSize: 26 }} />
            ) : totalIssues === 0 ? (
              <CheckCircle style={{ fontSize: 26 }} />
            ) : (
              <Warning style={{ fontSize: 26 }} />
            )}
          </div>
          {/* Ohne Prueflauf gibt es kein "alles OK" — ein leerer Knoten ist
              kein Gesundheitszeugnis. Genau daran hat dieser Tab jahrelang
              gruen gezeigt, ohne etwas zu messen. */}
          <div className="adm-stat__label">
            {!summary?.lastRun ? 'Nie geprüft' : totalIssues === 0 ? 'Alles OK' : 'Probleme'}
          </div>
        </div>
      </div>

      {(summary?.catalog?.unvollstaendigeSerien?.length ?? 0) > 0 && (
        <div
          style={{
            borderRadius: 12,
            background: theme.background.paper,
            padding: '12px 16px',
            fontSize: 12,
          }}
        >
          {/* TVMaze kennt manche Serien nur teilweise. Weil TVMaze die Quelle
              komplett gewinnt, fehlen dann ganze Staffeln in der App — der
              Nutzer sieht sie nie. Abhilfe: Serie in forceTmdb.js eintragen. */}
          <div style={{ fontWeight: 700, marginBottom: 6, color: theme.text.primary }}>
            Serien mit fehlenden Folgen
          </div>
          <div style={{ color: theme.text.muted, marginBottom: 8 }}>
            TMDB kennt mehr Folgen als im Katalog stehen — TVMaze führt die Serie dann nur
            teilweise. Ein Klick legt sie auf TMDB fest; der nächste Katalog-Lauf baut sie
            vollständig neu auf.
          </div>
          {summary?.catalog?.unvollstaendigeSerien?.map((u) => (
            <div
              key={u.id}
              style={{
                display: 'flex',
                gap: 10,
                padding: '3px 0',
                fontVariantNumeric: 'tabular-nums',
                color: theme.text.primary,
              }}
            >
              <span style={{ minWidth: 62, color: theme.text.muted }}>{u.id}</span>
              <span style={{ flex: 1 }}>{u.title}</span>
              <span style={{ color: '#ff4d6d' }}>
                {u.katalog} von {u.tmdb} — {u.fehlen} fehlen
              </span>
              {forceListe[u.id] ? (
                <span style={{ color: '#06d6a0', whiteSpace: 'nowrap' }}>auf TMDB festgelegt</span>
              ) : (
                <button
                  onClick={() => aufTmdbFestlegen(u.id, u.title)}
                  disabled={festlegend === u.id}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${theme.primary}55`,
                    color: theme.primary,
                    padding: '2px 10px',
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: festlegend === u.id ? 'default' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {festlegend === u.id ? '…' : 'Auf TMDB festlegen'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 12, color: theme.text.muted, lineHeight: 1.6 }}>
        {summary?.lastRun ? (
          <>
            Zuletzt geprüft {new Date(summary.lastRun).toLocaleString('de-DE')} ·{' '}
            {summary.usersChecked ?? 0} Nutzer · {summary.catalog?.seriesGeprueft ?? 0} Serien im
            Katalog
            {(summary.catalog?.offeneRemaps ?? 0) > 0 && (
              <> · {summary.catalog?.offeneRemaps} offene Episoden-Umschlüsselung(en)</>
            )}
          </>
        ) : (
          <>
            Es liegt noch kein Prüflauf vor. Die nächtliche Prüfung schreibt Befunde und diese
            Zusammenfassung — bis dahin sagt dieser Tab nichts über den Zustand der Daten aus.
          </>
        )}
      </div>

      {/* Type summary pills */}
      {Object.keys(typeCounts).length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            padding: 16,
            borderRadius: 12,
            background: theme.background.paper,
          }}
        >
          <button
            onClick={() => setFilterType(null)}
            style={{
              padding: '4px 12px',
              borderRadius: 16,
              border: filterType === null ? `2px solid ${theme.primary}` : '2px solid transparent',
              background: `${theme.text.muted}15`,
              color: theme.text.primary,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Alle ({totalIssues})
          </button>
          {Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => {
              const config = ISSUE_TYPE_CONFIG[type];
              const color = config?.color || '#ff4d6d';
              const label = config?.label || type;
              return (
                <button
                  key={type}
                  onClick={() => setFilterType(filterType === type ? null : type)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 16,
                    border: filterType === type ? `2px solid ${color}` : '2px solid transparent',
                    background: `${color}20`,
                    color,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {label} ({count})
                </button>
              );
            })}
        </div>
      )}

      {/* Issues by user */}
      {Object.entries(issuesByUser).map(([uid, userData]) => {
        const filteredIssues = filterType
          ? userData.issues?.filter((i) => i.type === filterType)
          : userData.issues;
        if (!filteredIssues || filteredIssues.length === 0) return null;

        return (
          <div
            key={uid}
            style={{
              borderRadius: 12,
              background: theme.background.paper,
              overflow: 'hidden',
            }}
          >
            {/* User header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                borderBottom: `1px solid ${theme.text.muted}22`,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, color: theme.text.primary }}>
                  {userData.userName}
                </div>
                <div style={{ fontSize: 11, color: theme.text.muted }}>
                  {new Date(userData.timestamp).toLocaleString('de-DE')} · {filteredIssues.length}
                  {filterType ? ` (von ${userData.issues?.length || 0})` : ''} Probleme
                </div>
              </div>
              <button
                onClick={() => handleDeleteUserIssues(uid)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: theme.text.muted,
                  cursor: 'pointer',
                  padding: 4,
                }}
                title="Alle Issues dieses Users löschen"
              >
                <Delete style={{ fontSize: 18 }} />
              </button>
            </div>

            {/* Issue cards */}
            {filteredIssues.map((issue, idx) => {
              const issueColor = getIssueColor(issue.type);
              return (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    borderBottom:
                      idx < filteredIssues.length - 1 ? `1px solid ${theme.text.muted}11` : 'none',
                  }}
                >
                  {/* Serie + Problem */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <span style={{ color: theme.primary, fontWeight: 600, fontSize: 14 }}>
                        {issue.seriesName}
                      </span>
                      {issue.seasonIndex >= 0 && (
                        <span style={{ color: theme.text.muted, fontSize: 12 }}>
                          {' '}
                          · Season {issue.seasonIndex + 1}
                          {issue.episodeIndex >= 0 && ` · Episode-Index ${issue.episodeIndex}`}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteCorruptEpisode(uid, issue)}
                      disabled={deletingPath === issue.firebasePath}
                      style={{
                        background: `${issueColor}22`,
                        border: 'none',
                        color: issueColor,
                        cursor: 'pointer',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 600,
                        opacity: deletingPath === issue.firebasePath ? 0.5 : 1,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {deletingPath === issue.firebasePath ? '...' : 'Aus Firebase löschen'}
                    </button>
                  </div>

                  {/* Type badge + Problem description */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    {issue.type && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: issueColor,
                          background: `${issueColor}18`,
                          padding: '2px 8px',
                          borderRadius: 10,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {ISSUE_TYPE_CONFIG[issue.type]?.label || issue.type}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: issueColor,
                      marginBottom: 6,
                      padding: '4px 8px',
                      background: `${issueColor}11`,
                      borderRadius: 6,
                    }}
                  >
                    {issue.problem}
                  </div>

                  {/* Firebase path */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      marginBottom: 6,
                    }}
                  >
                    <code
                      style={{
                        fontSize: 11,
                        color: '#4cc9f0',
                        background: '#4cc9f011',
                        padding: '2px 6px',
                        borderRadius: 4,
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontFamily: 'monospace',
                      }}
                    >
                      {issue.firebasePath}
                    </code>
                    <button
                      onClick={() => copyPath(issue.firebasePath)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme.text.muted,
                        cursor: 'pointer',
                        padding: 2,
                      }}
                      title="Pfad kopieren"
                    >
                      <ContentCopy style={{ fontSize: 14 }} />
                    </button>
                  </div>

                  {/* Stored values */}
                  {issue.storedValues && Object.keys(issue.storedValues).length > 0 && (
                    <div
                      style={{
                        fontSize: 11,
                        color: theme.text.muted,
                        background: `${theme.text.muted}08`,
                        padding: '6px 8px',
                        borderRadius: 6,
                        fontFamily: 'monospace',
                      }}
                    >
                      <div
                        style={{
                          marginBottom: 2,
                          color: theme.text.primary,
                          fontSize: 10,
                          fontWeight: 600,
                        }}
                      >
                        Gespeicherte Werte:
                      </div>
                      {Object.entries(issue.storedValues).map(([key, val]) => (
                        <div key={key}>
                          <span style={{ color: '#f4a261' }}>{key}</span>:{' '}
                          <span style={{ color: theme.text.primary }}>
                            {typeof val === 'string'
                              ? `"${val}"`
                              : Array.isArray(val)
                                ? `[${val.join(', ')}]`
                                : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {totalIssues === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: theme.text.muted }}>
          <CheckCircle style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }} />
          <div>Keine Datenprobleme gefunden</div>
        </div>
      )}
    </div>
  );
}
