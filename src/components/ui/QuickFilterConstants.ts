import { Bookmark, NewReleases, PlaylistAdd, Schedule, Star } from '@mui/icons-material';

export const seriesQuickFilters = [
  { value: 'unrated', label: 'Ohne Bewertung', icon: Star },
  { value: 'new-episodes', label: 'Neue Episoden', icon: NewReleases },
  { value: 'started', label: 'Begonnen', icon: Schedule },
  { value: 'recently-added', label: 'Zuletzt Hinzugefügt', icon: PlaylistAdd },
];

export const movieQuickFilters = [
  { value: 'unrated', label: 'Ohne Bewertung', icon: Star },
  { value: 'unreleased', label: 'Unveröffentlicht', icon: Schedule },
  { value: 'recently-added', label: 'Zuletzt Hinzugefügt', icon: PlaylistAdd },
];

export const ratingsQuickFilters = [
  { value: 'watchlist', label: 'Watchlist', icon: Bookmark },
  { value: 'unrated', label: 'Ohne Bewertung', icon: Star },
  { value: 'started', label: 'Begonnen', icon: Schedule },
  { value: 'not-started', label: 'Noch nicht begonnen', icon: Schedule },
  { value: 'ongoing', label: 'Fortlaufend', icon: Schedule },
  { value: 'recently-added', label: 'Zuletzt Hinzugefügt', icon: PlaylistAdd },
];
