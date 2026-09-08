import { Bookmark, NewReleases, PlaylistAdd, Schedule, Star } from '@mui/icons-material';
// Einzeln importiert: viele Testdateien mocken das Barrel mit einer festen
// Export-Liste, ein neues Icon dort hätte sie reihenweise brechen lassen.
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { t } from '../../../services/i18n';

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
  { value: 'watched', label: t('Gesehen'), icon: Visibility },
  { value: 'not-started', label: t('Nicht gesehen'), icon: VisibilityOff },
  { value: 'ongoing', label: t('Fortlaufend'), icon: Schedule },
  { value: 'recently-added', label: t('Zuletzt Hinzugefügt'), icon: PlaylistAdd },
];
