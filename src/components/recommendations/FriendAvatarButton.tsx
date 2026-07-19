import Check from '@mui/icons-material/Check';
import LibraryAddCheck from '@mui/icons-material/LibraryAddCheck';
import Person from '@mui/icons-material/Person';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import type { Friend } from '../../types/Friend';
import type { RecommendationMediaType } from '../../types/Recommendation';
import { t } from '../../services/i18n';

interface FriendAvatarButtonProps {
  friend: Friend;
  isSelected: boolean;
  /** Freund hat das Medium bereits in der Library — dann nicht auswählbar. */
  alreadyHas: boolean;
  mediaType: RecommendationMediaType;
  onToggle: (uid: string) => void;
}

/** Einzelner Freund im Picker-Grid: Avatar mit Auswahl-Ring, Check-Badge und Namen. */
export const FriendAvatarButton: React.FC<FriendAvatarButtonProps> = ({
  friend,
  isSelected,
  alreadyHas,
  mediaType,
  onToggle,
}) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();

  // Sizing tokens per breakpoint
  const avatarSize = isMobile ? 60 : 66;
  const avatarMin = isMobile ? 80 : 88;

  const name = friend.displayName || friend.username || t('Freund');

  return (
    <motion.button
      whileTap={alreadyHas ? undefined : { scale: 0.9 }}
      whileHover={!isMobile && !alreadyHas ? { y: -2 } : undefined}
      onClick={() => onToggle(friend.uid)}
      aria-pressed={isSelected}
      aria-disabled={alreadyHas}
      title={
        alreadyHas
          ? mediaType === 'movie'
            ? t('{name} hat den Film schon', { name })
            : t('{name} hat die Serie schon', { name })
          : undefined
      }
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        padding: '8px 4px',
        background: 'none',
        border: 'none',
        cursor: alreadyHas ? 'not-allowed' : 'pointer',
        borderRadius: 14,
        opacity: alreadyHas ? 0.42 : 1,
        filter: alreadyHas ? 'grayscale(0.6)' : 'none',
        transition: 'opacity 0.2s ease, filter 0.2s ease',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: avatarSize,
          height: avatarSize,
          borderRadius: '50%',
        }}
      >
        {/* Glow halo when selected */}
        <motion.div
          aria-hidden
          animate={isSelected ? { scale: 1.15, opacity: 0.55 } : { scale: 0.85, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${currentTheme.primary}, transparent 70%)`,
            filter: 'blur(12px)',
            zIndex: 0,
          }}
        />
        {/* Gradient ring */}
        <motion.div
          aria-hidden
          animate={isSelected ? { scale: 1, opacity: 1 } : { scale: 0.92, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 22 }}
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: 'relative',
            width: avatarSize,
            height: avatarSize,
            borderRadius: '50%',
            overflow: 'hidden',
            border: isSelected
              ? `3px solid ${currentTheme.background.default}`
              : `2px solid ${currentTheme.border.default}`,
            background: friend.photoURL
              ? `url("${friend.photoURL}") center/cover`
              : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2,
            boxShadow: isSelected
              ? `0 10px 24px -8px ${currentTheme.primary}bb`
              : '0 3px 8px rgba(0,0,0,0.2)',
            transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          }}
        >
          {!friend.photoURL && (
            <Person
              style={{
                fontSize: Math.round(avatarSize * 0.5),
                color: currentTheme.text.primary,
              }}
              aria-hidden
            />
          )}
        </div>
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 30 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              style={{
                position: 'absolute',
                right: -2,
                bottom: -2,
                width: isMobile ? 24 : 28,
                height: isMobile ? 24 : 28,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                border: `2.5px solid ${currentTheme.background.default}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 3,
                boxShadow: `0 4px 10px -2px ${currentTheme.primary}99`,
              }}
            >
              <Check style={{ fontSize: isMobile ? 14 : 16, color: '#fff' }} aria-hidden />
            </motion.div>
          )}
        </AnimatePresence>
        {alreadyHas && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: -2,
              bottom: -2,
              width: isMobile ? 24 : 28,
              height: isMobile ? 24 : 28,
              borderRadius: '50%',
              background: currentTheme.background.surface,
              border: `2px solid ${currentTheme.background.default}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 3,
              boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
            }}
          >
            <LibraryAddCheck
              style={{
                fontSize: isMobile ? 13 : 15,
                color: currentTheme.status?.success || '#22c55e',
              }}
            />
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
          maxWidth: avatarMin - 8,
        }}
      >
        <div
          style={{
            fontSize: isMobile ? 12 : 13,
            fontWeight: isSelected ? 800 : 600,
            color: isSelected ? currentTheme.text.primary : currentTheme.text.muted,
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '100%',
            transition: 'color 0.2s ease',
          }}
        >
          {name}
        </div>
        {alreadyHas && (
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: currentTheme.status?.success || '#22c55e',
              opacity: 0.85,
              whiteSpace: 'nowrap',
            }}
          >
            {t('Hat das schon')}
          </div>
        )}
      </div>
    </motion.button>
  );
};
