import { Bookmark, NewReleases, PlaylistAdd, Schedule, Star } from '@mui/icons-material';
import { t } from '../../services/i18n';

export const seriesQuickFilters = [
  { value: 'unrated', label: t('Ohne Bewertung'), icon: Star },
  { value: 'new-episodes', label: t('Neue Episoden'), icon: NewReleases },
  { value: 'started', label: t('Begonnen'), icon: Schedule },
  { value: 'recently-added', label: t('Zuletzt Hinzugefügt'), icon: PlaylistAdd },
];

export const movieQuickFilters = [
  { value: 'unrated', label: t('Ohne Bewertung'), icon: Star },
  { value: 'unreleased', label: t('Unveröffentlicht'), icon: Schedule },
  { value: 'recently-added', label: t('Zuletzt Hinzugefügt'), icon: PlaylistAdd },
];

export const ratingsQuickFilters = [
  { value: 'watchlist', label: t('Watchlist'), icon: Bookmark },
  { value: 'unrated', label: t('Ohne Bewertung'), icon: Star },
  { value: 'started', label: t('Begonnen'), icon: Schedule },
  { value: 'not-started', label: t('Noch nicht begonnen'), icon: Schedule },
  { value: 'ongoing', label: t('Fortlaufend'), icon: Schedule },
  { value: 'recently-added', label: t('Zuletzt Hinzugefügt'), icon: PlaylistAdd },
];
