import GroupRounded from '@mui/icons-material/GroupRounded';
import { useNavigate } from 'react-router-dom';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import { EmptyState } from '../ui/feedback/EmptyState';
import { BottomSheet } from '../ui/overlay/BottomSheet';
import { FriendAvatarButton } from '../recommendations/FriendAvatarButton';

interface FavoriteFriendsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  zIndex?: number | string;
}

/**
 * Favoriten-Auswahl: Avatar-Raster, antippen schaltet den Stern um. Schreibt
 * sofort (kein Speichern-Knopf) — der Auswahl-Ring ist die Rückmeldung.
 */
export const FavoriteFriendsSheet: React.FC<FavoriteFriendsSheetProps> = ({
  isOpen,
  onClose,
  zIndex,
}) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { friends, favoriteIds, toggleFavoriteFriend, shareState } = useOptimizedFriends();

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      ariaLabel={t('Favoriten wählen')}
      zIndex={zIndex}
    >
      <div style={{ padding: '4px 24px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: currentTheme.text.primary,
              margin: '0 0 6px',
            }}
          >
            {t('Favoriten wählen')}
          </h3>
          <p style={{ fontSize: '13px', color: currentTheme.text.secondary, margin: 0 }}>
            {t('Wen du wählst, wird um Einblick gebeten — sichtbar wird es nach der Zusage.')}
          </p>
        </div>

        {friends.length === 0 ? (
          <EmptyState
            icon={<GroupRounded style={{ fontSize: 28 }} />}
            title={t('Noch keine Freunde')}
            description={t('Füge erst Freunde hinzu, um Favoriten zu wählen.')}
            action={{
              label: t('Freunde finden'),
              onClick: () => {
                onClose();
                navigate('/activity');
              },
            }}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))',
              gap: 14,
            }}
          >
            {friends.map((friend) => {
              const favorit = favoriteIds.has(friend.uid);
              const zustand = shareState(friend.uid);
              // Der Auswahl-Ring stand bisher auch bei offener Bitte — er sah
              // aus wie „freigegeben". Nur ein tatsaechlicher Einblick zaehlt.
              const sichtbar = favorit && zustand === 'granted';
              const hinweis = !favorit
                ? null
                : zustand === 'pending'
                  ? t('wartet')
                  : zustand === 'none'
                    ? t('kein Zugriff')
                    : null;
              return (
                <div key={friend.uid} style={{ position: 'relative' }}>
                  <div style={{ opacity: favorit && !sichtbar ? 0.55 : 1 }}>
                    <FriendAvatarButton
                      friend={friend}
                      isSelected={sichtbar}
                      onToggle={(uid) => void toggleFavoriteFriend(uid)}
                    />
                  </div>
                  {hinweis && (
                    <span
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        fontSize: 11,
                        fontWeight: 600,
                        color: zustand === 'none' ? currentTheme.primary : currentTheme.text.muted,
                        marginTop: -4,
                      }}
                    >
                      {hinweis}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BottomSheet>
  );
};
