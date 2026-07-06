import Group from '@mui/icons-material/Group';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import type { Friend } from '../../types/Friend';
import type { RecommendationMediaType } from '../../types/Recommendation';
import { FriendAvatarButton } from './FriendAvatarButton';

interface FriendPickerProps {
  sortedFriends: Friend[];
  selected: Set<string>;
  friendsWithMedia: Set<string>;
  checkingLibrary: boolean;
  availableCount: number;
  mediaType: RecommendationMediaType;
  onToggleFriend: (uid: string) => void;
}

/** "An wen?"-Sektion: Header mit Auswahl-Badge, Empty-State oder Freundes-Grid. */
export const FriendPicker: React.FC<FriendPickerProps> = ({
  sortedFriends,
  selected,
  friendsWithMedia,
  checkingLibrary,
  availableCount,
  mediaType,
  onToggleFriend,
}) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();

  const hasFriends = sortedFriends.length > 0;

  // Sizing tokens per breakpoint
  const avatarMin = isMobile ? 80 : 88;
  const gridGap = isMobile ? 14 : 16;

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isMobile ? 14 : 18,
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            aria-hidden
            style={{
              width: 4,
              height: 16,
              borderRadius: 2,
              background: `linear-gradient(180deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            }}
          />
          <div
            style={{
              fontSize: isMobile ? 13 : 14,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: currentTheme.text.primary,
            }}
          >
            An wen?
          </div>
          {!checkingLibrary && friendsWithMedia.size > 0 && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: currentTheme.text.muted,
                letterSpacing: '0.02em',
              }}
            >
              · {availableCount} verfügbar
            </div>
          )}
        </div>
        <AnimatePresence mode="popLayout">
          {selected.size > 0 && (
            <motion.span
              key={selected.size}
              initial={{ scale: 0.7, opacity: 0, y: -4 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: -4 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              style={{
                fontSize: 12,
                fontWeight: 800,
                padding: '5px 12px',
                borderRadius: 999,
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                color: currentTheme.text.secondary,
                boxShadow: `0 6px 16px -6px ${currentTheme.primary}99`,
                letterSpacing: '0.02em',
              }}
            >
              {selected.size} ausgewählt
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {!hasFriends ? (
        <div
          style={{
            textAlign: 'center',
            padding: isMobile ? '36px 16px' : '48px 24px',
            background: `${currentTheme.background.surface}88`,
            borderRadius: 20,
            border: `1px dashed ${currentTheme.border.default}`,
            backdropFilter: 'var(--blur-sm)',
            WebkitBackdropFilter: 'var(--blur-sm)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              margin: '0 auto 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${currentTheme.primary}22, ${currentTheme.accent}11)`,
              border: `1px solid ${currentTheme.primary}33`,
            }}
          >
            <Group style={{ fontSize: 28, color: currentTheme.primary }} />
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: currentTheme.text.primary,
              fontFamily: 'var(--font-display)',
            }}
          >
            Noch keine Freunde
          </div>
          <div
            style={{
              fontSize: 13,
              color: currentTheme.text.muted,
              marginTop: 6,
              lineHeight: 1.5,
            }}
          >
            Füge erst Freunde hinzu, um zu empfehlen.
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(auto-fill, minmax(${avatarMin}px, 1fr))`,
            gap: gridGap,
          }}
        >
          {sortedFriends.map((friend) => (
            <FriendAvatarButton
              key={friend.uid}
              friend={friend}
              isSelected={selected.has(friend.uid)}
              alreadyHas={friendsWithMedia.has(friend.uid)}
              mediaType={mediaType}
              onToggle={onToggleFriend}
            />
          ))}
        </div>
      )}
    </>
  );
};
