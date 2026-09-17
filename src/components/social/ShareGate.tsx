import LockPersonRounded from '@mui/icons-material/LockPersonRounded';
import { useState } from 'react';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';

interface ShareGateProps {
  friendId: string;
  friendName: string;
  /** Was genau gesperrt ist — steht in der Erklärung. */
  what: string;
  children: React.ReactNode;
}

/**
 * Zeigt den Inhalt nur, wenn der Freund Einblick gegeben hat. Sonst eine
 * Erklärung mit Anfrage-Knopf, statt einer leeren Fläche ohne Grund.
 */
export const ShareGate: React.FC<ShareGateProps> = ({ friendId, friendName, what, children }) => {
  const { currentTheme } = useTheme();
  const { shareState, requestShare } = useOptimizedFriends();
  const [sending, setSending] = useState(false);
  // „Gerade abgeschickt" haelt den Knopf sofort verschwunden, auch bevor der
  // Listener die neue Anfrage meldet. Ohne das laesst sich der Knopf in der
  // Zwischenzeit mehrfach druecken.
  const [justSent, setJustSent] = useState(false);
  const state = shareState(friendId);

  if (state === 'granted') return <>{children}</>;

  const wartend = state === 'pending' || justSent;

  const handleAsk = async () => {
    if (sending || wartend) return;
    setSending(true);
    try {
      await requestShare(friendId);
      setJustSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      style={{
        textAlign: 'center',
        padding: '28px 20px',
        background: `${currentTheme.background.surface}88`,
        borderRadius: 'var(--radius-lg)',
        border: `1px dashed ${currentTheme.border.default}`,
      }}
    >
      <LockPersonRounded style={{ fontSize: 30, color: currentTheme.text.muted }} />
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: currentTheme.text.primary,
          margin: '10px 0 4px',
          fontFamily: 'var(--font-display)',
        }}
      >
        {t('{name} teilt {was} nicht', { name: friendName, was: what })}
      </div>
      <p
        style={{
          fontSize: 13,
          color: currentTheme.text.muted,
          margin: '0 0 16px',
          lineHeight: 1.5,
        }}
      >
        {wartend
          ? t('Deine Anfrage liegt bei {name}. Sobald sie angenommen ist, siehst du alles hier.', {
              name: friendName,
            })
          : t('Du kannst {name} um Einblick bitten — jederzeit widerrufbar.', {
              name: friendName,
            })}
      </p>
      {!wartend && (
        <button
          type="button"
          onClick={handleAsk}
          disabled={sending}
          style={{
            padding: '11px 22px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: currentTheme.primary,
            color: currentTheme.background.default,
            fontSize: 14,
            fontWeight: 700,
            cursor: sending ? 'default' : 'pointer',
            opacity: sending ? 0.6 : 1,
          }}
        >
          {sending ? t('Wird gesendet …') : t('Einblick anfragen')}
        </button>
      )}
    </div>
  );
};
