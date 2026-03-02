/**
 * RemoveFriendSheet - BottomSheet confirmation for removing a friend
 */

import { PersonRemove } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { BottomSheet } from '../../components/ui';

interface RemoveFriendSheetProps {
  friend: { uid: string; name: string } | null;
  onConfirm: (uid: string) => Promise<void>;
  onClose: () => void;
  isRemoving: boolean;
}

export const RemoveFriendSheet = ({
  friend,
  onConfirm,
  onClose,
  isRemoving,
}: RemoveFriendSheetProps) => {
  const { currentTheme } = useTheme();

  return (
    <BottomSheet isOpen={!!friend} onClose={onClose} ariaLabel="Freund entfernen">
      <div style={{ padding: '0 20px 32px', textAlign: 'center' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            borderRadius: '50%',
            background: `${currentTheme.status.error}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PersonRemove style={{ fontSize: '32px', color: currentTheme.status.error }} />
        </div>
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: currentTheme.text.primary,
            margin: '0 0 8px',
          }}
        >
          Freund entfernen
        </h2>
        <p
          style={{
            fontSize: '15px',
            color: currentTheme.text.secondary,
            margin: '0 0 24px',
            lineHeight: 1.5,
          }}
        >
          Möchtest du <strong>{friend?.name}</strong> wirklich als Freund entfernen? Ihr seht dann
          keine Aktivitäten mehr voneinander.
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              flex: 1,
              padding: '14px',
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
              borderRadius: '12px',
              color: currentTheme.text.primary,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Abbrechen
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={async () => {
              if (!friend || isRemoving) return;
              await onConfirm(friend.uid);
            }}
            disabled={isRemoving}
            style={{
              flex: 1,
              padding: '14px',
              background: `linear-gradient(135deg, ${currentTheme.status.error}, #ef4444)`,
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: isRemoving ? 'not-allowed' : 'pointer',
              opacity: isRemoving ? 0.7 : 1,
            }}
          >
            {isRemoving ? 'Entfernt...' : 'Entfernen'}
          </motion.button>
        </div>
      </div>
    </BottomSheet>
  );
};
