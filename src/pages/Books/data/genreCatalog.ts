import {
  AutoFixHigh,
  Favorite,
  Fingerprint,
  HistoryEdu,
  Lightbulb,
  Science,
  type SvgIconComponent,
} from '@mui/icons-material';
import { t } from '../../../services/i18n';

/** Spiegel zu CATALOG/MOODS im Backend (hardcover.js) — die Schlüssel müssen übereinstimmen. */
export interface CatalogGenre {
  id: string;
  group: string;
  label: () => string;
}

export interface CatalogGroup {
  id: string;
  label: () => string;
  colors: [string, string];
  icon: SvgIconComponent;
}

export interface CatalogMood {
  id: string;
  label: () => string;
}

export const CATALOG_GROUPS: CatalogGroup[] = [
  {
    id: 'fantasy-scifi',
    label: () => t('Fantasy & Science-Fiction'),
    colors: ['#5b21b6', '#2563eb'],
    icon: AutoFixHigh,
  },
  { id: 'love', label: () => t('Liebe & Romance'), colors: ['#9d174d', '#fb7185'], icon: Favorite },
  {
    id: 'suspense',
    label: () => t('Spannung & Grusel'),
    colors: ['#7f1d1d', '#ea580c'],
    icon: Fingerprint,
  },
  {
    id: 'stories',
    label: () => t('Literatur & Geschichten'),
    colors: ['#0f766e', '#84cc16'],
    icon: HistoryEdu,
  },
  {
    id: 'young',
    label: () => t('Kinder & Jugend'),
    colors: ['#b45309', '#f59e0b'],
    icon: Lightbulb,
  },
  {
    id: 'knowledge',
    label: () => t('Sachbuch & Wissen'),
    colors: ['#1e3a8a', '#06b6d4'],
    icon: Science,
  },
];

export const CATALOG_GENRES: CatalogGenre[] = [
  { id: 'fantasy', group: 'fantasy-scifi', label: () => t('Fantasy') },
  { id: 'epic-fantasy', group: 'fantasy-scifi', label: () => t('Epische Fantasy') },
  { id: 'urban-fantasy', group: 'fantasy-scifi', label: () => t('Urban Fantasy') },
  { id: 'romantasy', group: 'fantasy-scifi', label: () => t('Romantasy') },
  { id: 'dragons', group: 'fantasy-scifi', label: () => t('Drachen') },
  { id: 'magic', group: 'fantasy-scifi', label: () => t('Magie') },
  { id: 'scifi', group: 'fantasy-scifi', label: () => t('Science-Fiction') },
  { id: 'dystopian', group: 'fantasy-scifi', label: () => t('Dystopie') },
  { id: 'space-opera', group: 'fantasy-scifi', label: () => t('Space Opera') },
  { id: 'time-travel', group: 'fantasy-scifi', label: () => t('Zeitreisen') },
  { id: 'post-apocalyptic', group: 'fantasy-scifi', label: () => t('Postapokalypse') },
  { id: 'aliens', group: 'fantasy-scifi', label: () => t('Außerirdische') },
  { id: 'romance', group: 'love', label: () => t('Romance') },
  { id: 'contemporary-romance', group: 'love', label: () => t('Moderne Liebesromane') },
  { id: 'historical-romance', group: 'love', label: () => t('Historische Liebesromane') },
  { id: 'paranormal-romance', group: 'love', label: () => t('Paranormale Romance') },
  { id: 'romantic-suspense', group: 'love', label: () => t('Romantic Suspense') },
  { id: 'lgbtq', group: 'love', label: () => t('LGBTQ+') },
  { id: 'thriller', group: 'suspense', label: () => t('Thriller') },
  { id: 'psychological-thriller', group: 'suspense', label: () => t('Psychothriller') },
  { id: 'mystery', group: 'suspense', label: () => t('Mystery') },
  { id: 'crime', group: 'suspense', label: () => t('Kriminalroman') },
  { id: 'horror', group: 'suspense', label: () => t('Horror') },
  { id: 'gothic', group: 'suspense', label: () => t('Gothic') },
  { id: 'vampires', group: 'suspense', label: () => t('Vampire') },
  { id: 'paranormal', group: 'suspense', label: () => t('Paranormal') },
  { id: 'true-crime', group: 'suspense', label: () => t('True Crime') },
  { id: 'historical-fiction', group: 'stories', label: () => t('Historische Romane') },
  { id: 'war', group: 'stories', label: () => t('Krieg') },
  { id: 'classics', group: 'stories', label: () => t('Klassiker') },
  { id: 'literary', group: 'stories', label: () => t('Literatur') },
  { id: 'contemporary', group: 'stories', label: () => t('Gegenwartsliteratur') },
  { id: 'adventure', group: 'stories', label: () => t('Abenteuer') },
  { id: 'humor', group: 'stories', label: () => t('Humor') },
  { id: 'coming-of-age', group: 'stories', label: () => t('Coming of Age') },
  { id: 'friendship', group: 'stories', label: () => t('Freundschaft') },
  { id: 'family', group: 'stories', label: () => t('Familie') },
  { id: 'short-stories', group: 'stories', label: () => t('Kurzgeschichten') },
  { id: 'poetry', group: 'stories', label: () => t('Lyrik') },
  { id: 'drama', group: 'stories', label: () => t('Drama') },
  { id: 'fairy-tales', group: 'stories', label: () => t('Märchen & Sagen') },
  { id: 'christmas', group: 'stories', label: () => t('Weihnachten') },
  { id: 'ya', group: 'young', label: () => t('Young Adult') },
  { id: 'children', group: 'young', label: () => t('Kinderbücher') },
  { id: 'juvenile', group: 'young', label: () => t('Jugendbücher') },
  { id: 'nonfiction', group: 'knowledge', label: () => t('Sachbuch') },
  { id: 'biography', group: 'knowledge', label: () => t('Biografien') },
  { id: 'history', group: 'knowledge', label: () => t('Geschichte') },
  { id: 'philosophy', group: 'knowledge', label: () => t('Philosophie') },
  { id: 'psychology', group: 'knowledge', label: () => t('Psychologie') },
  { id: 'science', group: 'knowledge', label: () => t('Wissenschaft') },
  { id: 'mathematics', group: 'knowledge', label: () => t('Mathematik') },
  { id: 'computers', group: 'knowledge', label: () => t('Computer & Technik') },
  { id: 'business', group: 'knowledge', label: () => t('Wirtschaft & Business') },
  { id: 'self-help', group: 'knowledge', label: () => t('Ratgeber') },
  { id: 'religion', group: 'knowledge', label: () => t('Religion & Spiritualität') },
  { id: 'politics', group: 'knowledge', label: () => t('Politik') },
  { id: 'travel', group: 'knowledge', label: () => t('Reisen') },
  { id: 'cooking', group: 'knowledge', label: () => t('Kochen & Genuss') },
  { id: 'art', group: 'knowledge', label: () => t('Kunst & Architektur') },
  { id: 'music', group: 'knowledge', label: () => t('Musik & Bühne') },
  { id: 'nature', group: 'knowledge', label: () => t('Natur') },
  { id: 'health', group: 'knowledge', label: () => t('Gesundheit & Fitness') },
  { id: 'education', group: 'knowledge', label: () => t('Bildung') },
  { id: 'sports', group: 'knowledge', label: () => t('Sport') },
];

export const CATALOG_MOODS: CatalogMood[] = [
  { id: 'adventurous', label: () => t('Abenteuerlich') },
  { id: 'emotional', label: () => t('Emotional') },
  { id: 'dark', label: () => t('Düster') },
  { id: 'mysterious', label: () => t('Geheimnisvoll') },
  { id: 'tense', label: () => t('Spannend') },
  { id: 'funny', label: () => t('Lustig') },
  { id: 'reflective', label: () => t('Nachdenklich') },
  { id: 'lighthearted', label: () => t('Leicht & unbeschwert') },
  { id: 'sad', label: () => t('Traurig') },
  { id: 'hopeful', label: () => t('Hoffnungsvoll') },
  { id: 'challenging', label: () => t('Herausfordernd') },
  { id: 'inspiring', label: () => t('Inspirierend') },
  { id: 'informative', label: () => t('Lehrreich') },
  { id: 'relaxing', label: () => t('Entspannend') },
  { id: 'fast-paced', label: () => t('Temporeich') },
  { id: 'slow-paced', label: () => t('Gemächlich') },
];

const WARNING_LABELS: Record<string, () => string> = {
  death: () => t('Tod'),
  violence: () => t('Gewalt'),
  'sexual content': () => t('Sexuelle Inhalte'),
  murder: () => t('Mord'),
  'death of parent': () => t('Tod eines Elternteils'),
  blood: () => t('Blut'),
  rape: () => t('Vergewaltigung'),
  'sexual assault': () => t('Sexuelle Übergriffe'),
  grief: () => t('Trauer'),
  'child abuse': () => t('Kindesmissbrauch'),
  'injury/injury detail': () => t('Verletzungen'),
  suicide: () => t('Suizid'),
  'child death': () => t('Tod eines Kindes'),
  gore: () => t('Blutige Details'),
  racism: () => t('Rassismus'),
  'emotional abuse': () => t('Seelische Misshandlung'),
  'animal death': () => t('Tod von Tieren'),
  war: () => t('Krieg'),
  alcohol: () => t('Alkohol'),
  misogyny: () => t('Frauenfeindlichkeit'),
  'mental illness': () => t('Psychische Erkrankungen'),
  'toxic relationship': () => t('Toxische Beziehung'),
  torture: () => t('Folter'),
  'gun violence': () => t('Waffengewalt'),
  'medical content': () => t('Medizinische Inhalte'),
  'domestic abuse': () => t('Häusliche Gewalt'),
  homophobia: () => t('Homophobie'),
  'suicidal thoughts': () => t('Suizidgedanken'),
  bullying: () => t('Mobbing'),
  'physical abuse': () => t('Körperliche Misshandlung'),
  'body horror': () => t('Body Horror'),
  kidnapping: () => t('Entführung'),
  'drug use': () => t('Drogenkonsum'),
  'sexual violence': () => t('Sexuelle Gewalt'),
  addiction: () => t('Sucht'),
  infidelity: () => t('Untreue'),
  'self harm': () => t('Selbstverletzung'),
  stalking: () => t('Stalking'),
  slavery: () => t('Sklaverei'),
  cancer: () => t('Krebs'),
};

export const catalogGenre = (id: string | null | undefined): CatalogGenre | undefined =>
  CATALOG_GENRES.find((g) => g.id === id);

export const catalogGroup = (id: string): CatalogGroup | undefined =>
  CATALOG_GROUPS.find((g) => g.id === id);

export const isCatalogMood = (id: string | null | undefined): id is string =>
  !!id && CATALOG_MOODS.some((m) => m.id === id);

/** Stimmung aus Hardcover (klein geschrieben, englisch) in der App-Sprache. */
export const moodLabel = (raw: string): string => {
  const mood = CATALOG_MOODS.find((m) => m.id === raw.toLowerCase().replace(/\s+/g, '-'));
  return mood ? mood.label() : raw.charAt(0).toUpperCase() + raw.slice(1);
};

/** Inhaltshinweis aus Hardcover in der App-Sprache; Unbekanntes bleibt englisch. */
export const warningLabel = (raw: string): string => {
  const known = WARNING_LABELS[raw.toLowerCase().trim()];
  return known ? known() : raw.charAt(0).toUpperCase() + raw.slice(1);
};
