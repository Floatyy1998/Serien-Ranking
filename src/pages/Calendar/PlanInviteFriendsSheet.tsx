import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import GroupRounded from '@mui/icons-material/GroupRounded';
import { useTheme } from '../../contexts/ThemeContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { BottomSheet } from '../../components/ui/overlay/BottomSheet';
import { EmptyState } from '../../components/ui/feedback/EmptyState';
import { FriendAvatarButton } from '../../components/recommendations/FriendAvatarButton';
import type { PlanGuestStatus } from '../../lib/watch/watchPlan';
import { t } from '../../services/i18n';

export const PlanInviteFriendsSheet = ({
  isOpen,
  onClose,
  invited,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  invited: Record<string, PlanGuestStatus>;
  onConfirm: (uids: string[]) => void;
}) => {
  const { currentTheme } = useTheme();
  const { friends } = useOptimizedFriends();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) setSelected(new Set());
  }, [isOpen]);

  const toggle = (uid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} ariaLabel={t('Freunde einladen')} zIndex={1300}>
      <div className="wp-sheet">
        <h3 className="wp-sheet__title" style={{ color: currentTheme.text.secondary }}>
          {t('Freunde einladen')}
        </h3>
        <p className="wp-muted" style={{ color: currentTheme.text.muted, marginTop: -6 }}>
          {t('Wer annimmt, hat den Termin auch in seinem Plan.')}
        </p>
        {friends.length === 0 ? (
          <EmptyState
            icon={<GroupRounded style={{ fontSize: 28 }} />}
            title={t('Noch keine Freunde')}
            description={t('Füge erst Freunde hinzu, um sie einzuladen.')}
          />
        ) : (
          <div className="wp-friend-grid">
            {friends.map((friend) => {
              const status = invited[friend.uid];
              const locked = status === 'a' || status === 'p';
              return (
                <div key={friend.uid} style={{ opacity: locked ? 0.5 : 1 }}>
                  <FriendAvatarButton
                    friend={friend}
                    isSelected={locked || selected.has(friend.uid)}
                    onToggle={(uid) => {
                      if (!locked) toggle(uid);
                    }}
                  />
                  {locked && (
                    <span
                      className="wp-friend-grid__hint"
                      style={{ color: currentTheme.text.muted }}
                    >
                      {status === 'a' ? t('zugesagt') : t('eingeladen')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {friends.length > 0 && (
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            className="wp-btn wp-btn--primary wp-btn--block"
            disabled={selected.size === 0}
            onClick={() => {
              onConfirm([...selected]);
              onClose();
            }}
            style={{ background: currentTheme.primary, color: currentTheme.background.default }}
          >
            {selected.size > 0 ? t('{n} einladen', { n: selected.size }) : t('Freunde auswählen')}
          </motion.button>
        )}
      </div>
    </BottomSheet>
  );
};
