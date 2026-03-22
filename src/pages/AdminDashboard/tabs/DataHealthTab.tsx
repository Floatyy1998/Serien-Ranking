import { useEffect, useState } from 'react';
import { Delete, Warning, CheckCircle } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

interface DataIssue {
  series: string;
  season: number;
  episodeIndex: number;
  fields: string[];
}

interface UserIssues {
  timestamp: string;
  userName: string;
  issues: DataIssue[];
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

  const handleDeleteUserIssues = async (uid: string) => {
    await firebase.database().ref(`admin/dataIntegrityIssues/${uid}`).remove();
  };

  const handleDeleteCorruptEpisode = async (
    uid: string,
    issue: DataIssue,
    userIssues: UserIssues
  ) => {
    // Find the series in user's data to get firebase key
    const seriesSnap = await firebase.database().ref(`${uid}/serien`).once('value');
    const seriesData = seriesSnap.val();
    if (!seriesData) return;

    // Find the series by name
    for (const [key, series] of Object.entries(seriesData) as [string, Record<string, unknown>][]) {
      if (series.name === issue.series) {
        const seasonIndex = issue.season - 1;
        const epPath = `${uid}/serien/${key}/seasons/${seasonIndex}/episodes/${issue.episodeIndex}`;
        await firebase.database().ref(epPath).remove();
        break;
      }
    }

    // Remove the issue from the log if it was the last one
    if (userIssues.issues.length <= 1) {
      await handleDeleteUserIssues(uid);
    }
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
          <div style={{ fontSize: 12, color: theme.text.muted }}>Kaputte Episoden</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: theme.text.primary }}>
            {affectedUsers}
          </div>
          <div style={{ fontSize: 12, color: theme.text.muted }}>Betroffene User</div>
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

      {/* Issues by user */}
      {Object.entries(issuesByUser).map(([uid, userData]) => (
        <div
          key={uid}
          style={{
            borderRadius: 12,
            background: theme.background.paper,
            overflow: 'hidden',
          }}
        >
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
              <div style={{ fontWeight: 600, color: theme.text.primary }}>{userData.userName}</div>
              <div style={{ fontSize: 11, color: theme.text.muted }}>
                {new Date(userData.timestamp).toLocaleString('de-DE')} ·{' '}
                {userData.issues?.length || 0} Probleme
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
              title="Alle Issues löschen"
            >
              <Delete style={{ fontSize: 18 }} />
            </button>
          </div>

          {userData.issues?.map((issue, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 16px',
                borderBottom:
                  idx < userData.issues.length - 1 ? `1px solid ${theme.text.muted}11` : 'none',
              }}
            >
              <div style={{ flex: 1 }}>
                <span style={{ color: theme.primary, fontWeight: 500 }}>{issue.series}</span>
                <span style={{ color: theme.text.muted, fontSize: 12 }}>
                  {' '}
                  S{issue.season} Index {issue.episodeIndex}
                </span>
                <div style={{ fontSize: 11, color: theme.text.muted }}>
                  Felder: {issue.fields?.join(', ') || 'keine'}
                </div>
              </div>
              <button
                onClick={() => handleDeleteCorruptEpisode(uid, issue, userData)}
                style={{
                  background: '#ff4d6d22',
                  border: 'none',
                  color: '#ff4d6d',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 11,
                }}
              >
                Löschen
              </button>
            </div>
          ))}
        </div>
      ))}

      {totalIssues === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: theme.text.muted }}>
          <CheckCircle style={{ fontSize: 48, opacity: 0.3, marginBottom: 8 }} />
          <div>Keine Datenprobleme gefunden</div>
        </div>
      )}
    </div>
  );
}
