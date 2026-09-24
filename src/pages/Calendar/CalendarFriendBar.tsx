import GroupRounded from '@mui/icons-material/GroupRounded';
import StarBorderRounded from '@mui/icons-material/StarBorderRounded';
import TuneRounded from '@mui/icons-material/TuneRounded';
import { useState } from 'react';
import { FavoriteFriendsSheet } from '../../components/social/FavoriteFriendsSheet';
import { UserAvatar } from '../../components/ui/media/UserAvatar';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import type { Friend } from '../../types/Friend';
import './CalendarFriendBar.css';

interface CalendarFriendBarProps {
  favoriteFriends: Friend[];
  /** Gibt es überhaupt Freunde? Ohne sie bleibt die Leiste komplett weg. */
  hasFriends: boolean;
  viewedFriendUid: string | null;
  onSelect: (uid: string | null) => void;
}

/**
 * Umschalter über dem Wochenraster: eigener Kalender oder der eines Favoriten.
 * Ohne Favoriten steht hier ein einzelner Einladungs-Chip — ohne Freunde gar
 * nichts, damit die App für Alleinnutzer unverändert bleibt.
 */
export const CalendarFriendBar: React.FC<CalendarFriendBarProps> = ({
  favoriteFriends,
  hasFriends,
  viewedFriendUid,
  onSelect,
}) => {
  const { currentTheme } = useTheme();
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!hasFriends) return null;

  // Auswahl-Optik wie bei den Filter-Chips darüber, nicht als Vollfläche.
  const activeStyle = {
    background: `${currentTheme.primary}20`,
    color: currentTheme.primary,
    borderColor: `${currentTheme.primary}50`,
  };

  const icon = (
    <GroupRounded
      className="cal-friendbar__icon"
      style={{ fontSize: 16, color: currentTheme.text.muted }}
      aria-hidden
    />
  );

  if (favoriteFriends.length === 0) {
    return (
      <>
        <div className="cal-friendbar">
          {icon}
          <button
            type="button"
            className="cal-friendchip"
            onClick={() => setPickerOpen(true)}
            style={{ color: currentTheme.text.secondary }}
          >
            <StarBorderRounded style={{ fontSize: 16 }} />
            {t('Favoriten wählen')}
          </button>
        </div>
        <FavoriteFriendsSheet isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
      </>
    );
  }

  return (
    <>
      <div className="cal-friendbar" role="tablist" aria-label={t('Kalender wählen')}>
        {icon}
        <button
          type="button"
          role="tab"
          aria-selected={viewedFriendUid === null}
          className={`cal-friendchip${viewedFriendUid === null ? ' is-active' : ''}`}
          onClick={() => onSelect(null)}
          style={viewedFriendUid === null ? activeStyle : undefined}
        >
          {t('Ich')}
        </button>

        {favoriteFriends.map((friend) => {
          const active = viewedFriendUid === friend.uid;
          const name = friend.displayName || friend.username || t('Freund');
          return (
            <button
              key={friend.uid}
              type="button"
              role="tab"
              aria-selected={active}
              className={`cal-friendchip cal-friendchip--avatar${active ? ' is-active' : ''}`}
              onClick={() => onSelect(active ? null : friend.uid)}
              style={active ? activeStyle : undefined}
            >
              <span className="cal-friendchip__avatar" aria-hidden>
                <UserAvatar
                  userId={friend.uid}
                  username={name}
                  photoURL={friend.photoURL}
                  size={42}
                  navigable={false}
                  bordered={false}
                  decorative
                />
              </span>
              {name}
            </button>
          );
        })}

        <button
          type="button"
          className="cal-friendchip cal-friendchip--edit"
          onClick={() => setPickerOpen(true)}
          aria-label={t('Favoriten bearbeiten')}
        >
          <TuneRounded style={{ fontSize: 15 }} />
        </button>
      </div>
      <FavoriteFriendsSheet isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
};
