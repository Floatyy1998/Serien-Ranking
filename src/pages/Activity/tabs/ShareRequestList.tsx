import CheckRounded from '@mui/icons-material/CheckRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import { useState } from 'react';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';

/**
 * Eingehende Bitten um Einblick in die eigenen Serien. Steht im Anfragen-Reiter
 * über den Freundschaftsanfragen — dieselbe Geste, andere Tragweite.
 */
export const ShareRequestList: React.FC = () => {
  const { currentTheme } = useTheme();
  const { shareRequests, acceptShare, declineShare, friends } = useOptimizedFriends();
  const [busy, setBusy] = useState<Set<string>>(() => new Set());

  if (shareRequests.length === 0) return null;

  const nameOf = (uid: string, fallback?: string): string => {
    const friend = friends.find((f) => f.uid === uid);
    return friend?.displayName || friend?.username || fallback || t('Unbekannt');
  };

  const run = async (id: string, action: () => Promise<void>) => {
    if (busy.has(id)) return;
    setBusy((prev) => new Set(prev).add(id));
    try {
      await action();
    } finally {
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <h2
        style={{
          fontSize: '12px',
          fontWeight: 800,
          color: currentTheme.text.muted,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          margin: '0 0 10px',
        }}
      >
        {t('Bitten um Einblick')}
      </h2>

      {shareRequests.map((request) => {
        const name = nameOf(request.fromUserId, request.fromUsername);
        const isBusy = busy.has(request.id);
        return (
          <div
            key={request.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              marginBottom: '8px',
              borderRadius: 'var(--radius-md)',
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            <VisibilityRounded style={{ fontSize: 20, color: currentTheme.primary }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: currentTheme.text.primary }}>
                {t('{name} möchte deine Serien sehen', { name })}
              </div>
              <div style={{ fontSize: 12, color: currentTheme.text.muted }}>
                {t('Serienliste, Fortschritt, Kalender und Bewertungen — jederzeit widerrufbar.')}
              </div>
            </div>
            <button
              type="button"
              aria-label={t('{name} Einblick geben', { name })}
              disabled={isBusy}
              onClick={() => run(request.id, () => acceptShare(request.id, request.fromUserId))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                border: 'none',
                background: `${currentTheme.status.success}18`,
                color: currentTheme.status.success,
                cursor: isBusy ? 'default' : 'pointer',
                flexShrink: 0,
              }}
            >
              <CheckRounded style={{ fontSize: 18 }} />
            </button>
            <button
              type="button"
              aria-label={t('{name} ablehnen', { name })}
              disabled={isBusy}
              onClick={() => run(request.id, () => declineShare(request.id))}
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                border: 'none',
                background: `${currentTheme.text.muted}18`,
                color: currentTheme.text.muted,
                cursor: isBusy ? 'default' : 'pointer',
                flexShrink: 0,
              }}
            >
              <CloseRounded style={{ fontSize: 18 }} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
