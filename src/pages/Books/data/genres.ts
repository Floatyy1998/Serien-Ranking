import {
  AutoFixHigh,
  Bolt,
  DarkMode,
  Favorite,
  Fingerprint,
  HistoryEdu,
  Lightbulb,
  RocketLaunch,
  type SvgIconComponent,
} from '@mui/icons-material';
import type { ShelfId } from '../../../services/api/bookDiscovery';
import { t } from '../../../services/i18n';

export interface GenreMeta {
  id: ShelfId;
  label: () => string;
  /** Verlauf der Genre-Kachel — Genres haben eine eigene Farbe wie Anbieter-Logos. */
  colors: [string, string];
  icon: SvgIconComponent;
}

export const GENRES: GenreMeta[] = [
  { id: 'fantasy', label: () => t('Fantasy'), colors: ['#5b21b6', '#c026d3'], icon: AutoFixHigh },
  {
    id: 'thriller',
    label: () => t('Thriller & Krimi'),
    colors: ['#7f1d1d', '#ea580c'],
    icon: Fingerprint,
  },
  { id: 'romance', label: () => t('Romance'), colors: ['#9d174d', '#fb7185'], icon: Favorite },
  {
    id: 'scifi',
    label: () => t('Science-Fiction'),
    colors: ['#0e7490', '#6366f1'],
    icon: RocketLaunch,
  },
  { id: 'ya', label: () => t('Young Adult'), colors: ['#0f766e', '#84cc16'], icon: Bolt },
  { id: 'classics', label: () => t('Klassiker'), colors: ['#78350f', '#d97706'], icon: HistoryEdu },
  { id: 'horror', label: () => t('Horror'), colors: ['#18181b', '#64748b'], icon: DarkMode },
  { id: 'nonfiction', label: () => t('Sachbuch'), colors: ['#1e3a8a', '#0ea5e9'], icon: Lightbulb },
];

export const SHELF_TITLES: Record<ShelfId, () => string> = {
  new: () => t('Neu & beliebt'),
  fantasy: () => t('Fantasy'),
  thriller: () => t('Thriller & Krimi'),
  romance: () => t('Romance'),
  scifi: () => t('Science-Fiction'),
  ya: () => t('Young Adult'),
  classics: () => t('Klassiker'),
  horror: () => t('Horror'),
  nonfiction: () => t('Sachbuch'),
};

export const isShelfId = (value: string | null): value is ShelfId =>
  !!value && (value === 'new' || GENRES.some((g) => g.id === value));
