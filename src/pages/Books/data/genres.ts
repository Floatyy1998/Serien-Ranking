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
import type { ShelfId, ShelfSort } from '../../../services/api/bookDiscovery';
import { t } from '../../../services/i18n';

export interface GenreTheme {
  id: string;
  label: () => string;
}

export interface GenreMeta {
  id: ShelfId;
  label: () => string;
  /** Verlauf der Genre-Kachel — Genres haben eine eigene Farbe wie Anbieter-Logos. */
  colors: [string, string];
  icon: SvgIconComponent;
  themes: GenreTheme[];
}

export const GENRES: GenreMeta[] = [
  {
    id: 'fantasy',
    label: () => t('Fantasy'),
    colors: ['#5b21b6', '#c026d3'],
    icon: AutoFixHigh,
    themes: [
      { id: 'epic', label: () => t('Epische Fantasy') },
      { id: 'romantasy', label: () => t('Romantasy') },
      { id: 'dragons', label: () => t('Drachen') },
      { id: 'urban', label: () => t('Urban Fantasy') },
      { id: 'historical', label: () => t('Historische Fantasy') },
    ],
  },
  {
    id: 'thriller',
    label: () => t('Thriller & Krimi'),
    colors: ['#7f1d1d', '#ea580c'],
    icon: Fingerprint,
    themes: [
      { id: 'psycho', label: () => t('Psychothriller') },
      { id: 'police', label: () => t('Ermittler') },
      { id: 'whodunit', label: () => t('Whodunit') },
      { id: 'serial', label: () => t('Serienmörder') },
      { id: 'spy', label: () => t('Spionage') },
      { id: 'legal', label: () => t('Justiz') },
    ],
  },
  {
    id: 'romance',
    label: () => t('Romance'),
    colors: ['#9d174d', '#fb7185'],
    icon: Favorite,
    themes: [
      { id: 'contemporary', label: () => t('Gegenwart') },
      { id: 'historical', label: () => t('Historisch') },
      { id: 'romantasy', label: () => t('Romantasy') },
      { id: 'paranormal', label: () => t('Paranormal') },
      { id: 'suspense', label: () => t('Romantic Suspense') },
      { id: 'queer', label: () => t('Queer') },
    ],
  },
  {
    id: 'scifi',
    label: () => t('Science-Fiction'),
    colors: ['#0e7490', '#6366f1'],
    icon: RocketLaunch,
    themes: [
      { id: 'space', label: () => t('Space Opera') },
      { id: 'dystopia', label: () => t('Dystopie') },
      { id: 'aliens', label: () => t('Außerirdische') },
      { id: 'time', label: () => t('Zeitreisen') },
      { id: 'ai', label: () => t('KI & Roboter') },
      { id: 'apocalypse', label: () => t('Endzeit') },
      { id: 'hard', label: () => t('Hard SF') },
    ],
  },
  {
    id: 'ya',
    label: () => t('Young Adult'),
    colors: ['#0f766e', '#84cc16'],
    icon: Bolt,
    themes: [
      { id: 'fantasy', label: () => t('Fantasy') },
      { id: 'romance', label: () => t('Romance') },
      { id: 'mystery', label: () => t('Mystery') },
      { id: 'coming', label: () => t('Erwachsenwerden') },
    ],
  },
  {
    id: 'classics',
    label: () => t('Klassiker'),
    colors: ['#78350f', '#d97706'],
    icon: HistoryEdu,
    themes: [
      { id: 'german', label: () => t('Deutschsprachig') },
      { id: 'english', label: () => t('Englisch') },
      { id: 'american', label: () => t('Amerikanisch') },
      { id: 'french', label: () => t('Französisch') },
      { id: 'russian', label: () => t('Russisch') },
    ],
  },
  {
    id: 'horror',
    label: () => t('Horror'),
    colors: ['#18181b', '#64748b'],
    icon: DarkMode,
    themes: [
      { id: 'ghosts', label: () => t('Geister') },
      { id: 'vampires', label: () => t('Vampire') },
      { id: 'gothic', label: () => t('Gothic') },
      { id: 'occult', label: () => t('Okkultes') },
      { id: 'short', label: () => t('Kurzgeschichten') },
    ],
  },
  {
    id: 'nonfiction',
    label: () => t('Sachbuch'),
    colors: ['#1e3a8a', '#0ea5e9'],
    icon: Lightbulb,
    themes: [
      { id: 'biography', label: () => t('Biografien') },
      { id: 'history', label: () => t('Geschichte') },
      { id: 'science', label: () => t('Wissenschaft') },
      { id: 'psychology', label: () => t('Psychologie') },
      { id: 'philosophy', label: () => t('Philosophie') },
      { id: 'selfhelp', label: () => t('Ratgeber') },
    ],
  },
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

export const SORT_LABELS: Record<ShelfSort, () => string> = {
  popular: () => t('Beliebt'),
  top: () => t('Top'),
  gems: () => t('Geheimtipps'),
  recent: () => t('Neu'),
};

export const SORT_HINTS: Record<ShelfSort, () => string> = {
  popular: () => t('Die beliebtesten Bücher in deiner Sprache'),
  top: () => t('Am besten bewertet'),
  gems: () => t('Stark bewertet, aber abseits der Bestseller'),
  recent: () => t('Viel gelesen aus den letzten Jahren'),
};

export const isShelfId = (value: string | null): value is ShelfId =>
  !!value && (value === 'new' || GENRES.some((g) => g.id === value));
