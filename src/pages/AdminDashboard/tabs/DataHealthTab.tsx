import { useState, useEffect, useMemo } from 'react';
import { Delete, Warning, CheckCircle, ContentCopy } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

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

const ISSUE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
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
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    const ref = firebase.database().ref('admin/dataIntegrityIssues');
    const handler = ref.on('value', (snap) => {
      setIssuesByUser(snap.val() || {});
      setLoading(false);
    });
    return () => ref.off('value', handler);
  }, []);

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
    await firebase.database().ref(`admin/dataIntegrityIssues/${uid}`).remove();
  };

  const handleDeleteCorruptEpisode = async (uid: string, issue: DataIssue) => {
    setDeletingPath(issue.firebasePath);
    try {
      await firebase.database().ref(issue.firebasePath).remove();
      const remaining = issuesByUser[uid]?.issues?.filter(
        (i) => i.firebasePath !== issue.firebasePath
      );
      if (!remaining || remaining.length === 0) {
        await handleDeleteUserIssues(uid);
      } else {
        await firebase.database().ref(`admin/dataIntegrityIssues/${uid}/issues`).set(remaining);
        await firebase
          .database()
          .ref(`admin/dataIntegrityIssues/${uid}/issueCount`)
          .set(remaining.length);
      }
    } finally {
      setDeletingPath(null);
    }
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: theme.text.muted }}>Laden...</div>
    );
  }

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
        }}
      >
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: totalIssues > 0 ? '#ff4d6d' : '#06d6a0',
            }}
          >
            {totalIssues}
          </div>
          <div style={{ fontSize: 12, color: theme.text.muted }}>Datenprobleme</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.text.primary }}>
            {affectedUsers}
          </div>
          <div style={{ fontSize: 12, color: theme.text.muted }}>Betroffene User</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.text.primary }}>
            {Object.keys(typeCounts).length}
          </div>
          <div style={{ fontSize: 12, color: theme.text.muted }}>Problem-Typen</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          {totalIssues === 0 ? (
            <CheckCircle style={{ fontSize: 28, color: '#06d6a0' }} />
          ) : (
            <Warning style={{ fontSize: 28, color: '#ff4d6d' }} />
          )}
          <div style={{ fontSize: 12, color: theme.text.muted }}>
            {totalIssues === 0 ? 'Alles OK' : 'Probleme'}
          </div>
        </div>
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
