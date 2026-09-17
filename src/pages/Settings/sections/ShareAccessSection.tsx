import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import { useState } from 'react';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';

/**
 * „Wer meine Serien sieht" — Liste der erteilten Freigaben mit Entzug, plus die
 * Abkürzung, allen bestehenden Freunden auf einmal freizugeben.
 */
export const ShareAccessSection: React.FC = () => {
  const { currentTheme } = useTheme();
  const { friends, shareIds, revokeShare, shareWithAllFriends } = useOptimizedFriends();
  const [busy, setBusy] = useState(false);

  if (friends.length === 0) return null;

  const withAccess = friends.filter((friend) => shareIds.has(friend.uid));
  const alleFreigegeben = withAccess.length === friends.length;

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="settings-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <VisibilityRounded style={{ fontSize: 20, color: currentTheme.primary }} />
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 700,
            color: currentTheme.text.primary,
            fontFamily: 'var(--font-display)',
          }}
        >
          {t('Wer meine Serien sieht')}
        </h3>
      </div>

      <p
        style={{
          fontSize: 13,
          color: currentTheme.text.muted,
          margin: '0 0 14px',
          lineHeight: 1.5,
        }}
      >
        {t(
          'Freunde sehen deine Serienliste, deinen Fortschritt, deinen Kalender und deine Bewertungen nur, wenn du es erlaubst. Ohne Freigabe steht im Verlauf nur, dass du etwas gesehen hast — ohne Titel.'
        )}
      </p>

      {withAccess.length === 0 ? (
        <p style={{ fontSize: 13, color: currentTheme.text.secondary, margin: '0 0 14px' }}>
          {t('Aktuell sieht niemand deine Serien.')}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {withAccess.map((friend) => {
            const name = friend.displayName || friend.username || t('Freund');
            return (
              <div
                key={friend.uid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: currentTheme.background.surface,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 14,
                    fontWeight: 600,
                    color: currentTheme.text.primary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {name}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => revokeShare(friend.uid))}
                  style={{
                    padding: '7px 13px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${currentTheme.status.error}55`,
                    background: 'transparent',
                    color: currentTheme.status.error,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: busy ? 'default' : 'pointer',
                  }}
                >
                  {t('Entziehen')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {!alleFreigegeben && (
        <button
          type="button"
          disabled={busy}
          onClick={() => run(shareWithAllFriends)}
          style={{
            padding: '11px 18px',
            borderRadius: 'var(--radius-md)',
            border: `1px solid ${currentTheme.primary}55`,
            background: `${currentTheme.primary}18`,
            color: currentTheme.primary,
            fontSize: 14,
            fontWeight: 700,
            cursor: busy ? 'default' : 'pointer',
          }}
        >
          {t('Allen {n} Freunden freigeben', { n: friends.length })}
        </button>
      )}
    </div>
  );
};
