import StarBorderRounded from '@mui/icons-material/StarBorderRounded';
import TuneRounded from '@mui/icons-material/TuneRounded';
import { useState } from 'react';
import { FavoriteFriendsSheet } from '../../components/social/FavoriteFriendsSheet';
import { UserAvatar } from '../../components/ui/media/UserAvatar';
import { useAuth } from '../../contexts/AuthContext';
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
  const { user } = useAuth() || {};
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!hasFriends) return null;

  if (favoriteFriends.length === 0) {
    return (
      <>
        <div className="cal-friendbar">
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

  const person = (
    key: string,
    label: string,
    active: boolean,
    onClick: () => void,
    avatar: React.ReactNode
  ) => (
    <button
      key={key}
      type="button"
      role="tab"
      aria-selected={active}
      className={`cal-person${active ? ' is-active' : ''}`}
      onClick={onClick}
    >
      <span
        className="cal-person__ring"
        style={{
          boxShadow: active
            ? `0 0 0 2px ${currentTheme.primary}, 0 4px 14px ${currentTheme.primary}40`
            : `0 0 0 1px ${currentTheme.border.default}`,
        }}
        aria-hidden
      >
        {avatar}
      </span>
      <span
        className="cal-person__name"
        style={{ color: active ? currentTheme.primary : currentTheme.text.muted }}
      >
        {label}
      </span>
    </button>
  );

  const ownName = user?.displayName || t('Ich');

  return (
    <>
      <div
        className="cal-friendbar cal-friendbar--people"
        role="tablist"
        aria-label={t('Kalender wählen')}
      >
        {person(
          'me',
          t('Ich'),
          viewedFriendUid === null,
          () => onSelect(null),
          <UserAvatar
            userId={user?.uid ?? 'me'}
            username={ownName}
            photoURL={user?.photoURL ?? undefined}
            size={40}
            navigable={false}
            bordered={false}
            decorative
          />
        )}

        {favoriteFriends.map((friend) => {
          const active = viewedFriendUid === friend.uid;
          const name = friend.displayName || friend.username || t('Freund');
          return person(
            friend.uid,
            name,
            active,
            () => onSelect(active ? null : friend.uid),
            <UserAvatar
              userId={friend.uid}
              username={name}
              photoURL={friend.photoURL}
              size={40}
              navigable={false}
              bordered={false}
              decorative
            />
          );
        })}

        <button
          type="button"
          className="cal-person cal-person--edit"
          onClick={() => setPickerOpen(true)}
          aria-label={t('Favoriten bearbeiten')}
        >
          <span
            className="cal-person__ring cal-person__ring--edit"
            style={{ borderColor: currentTheme.border.default, color: currentTheme.text.muted }}
            aria-hidden
          >
            <TuneRounded style={{ fontSize: 18 }} />
          </span>
          <span className="cal-person__name" style={{ color: currentTheme.text.muted }}>
            {t('Bearbeiten')}
          </span>
        </button>
      </div>
      <FavoriteFriendsSheet isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
};
