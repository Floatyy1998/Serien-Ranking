import type { SkeletonShape } from '../../HomeLayout/LayoutCanvasSection';
import { MANGA_FOR_YOU_LABELS } from '../../Manga/data/mangaSectionLabels';
import { t } from '../../../services/i18n';

export const READING_SECTION_LABELS: Record<string, string> = {
  'continue-reading': t('Weiterlesen'),
  new: t('Neu erschienen'),
  'for-you': t('Für dich'),
  'up-next': t('Als Nächstes'),
  wishlist: t('Wunschliste'),
  'quick-actions': t('Manga-Schnellzugriff'),
  shelf: t('Lese-Regal'),
  library: t('Deine Bibliothek'),
  discover: t('Entdecken'),
  'for-shows': t('Bücher zu deinen Serien'),
  year: t('Lesejahr in Zahlen'),
  stats: t('Statistiken'),
  owned: t('Im Besitz'),
  paused: t('Pausiert'),
  'recently-added': t('Kürzlich hinzugefügt'),
  friends: t('Bei Freunden im Besitz'),
};

export const READING_SECTION_HINTS: Record<string, string> = {
  'continue-reading': t('Bücher und Manga, die du gerade liest'),
  new: t('Neue Kapitel und der nächste Band deiner Reihen'),
  'for-you': t('Leseziel, Aufholen, Bewerten, nochmal lesen'),
  'up-next': t('Dein Bücherstapel und geplante Manga'),
  wishlist: t('Bücher, die du dir wünschst'),
  'quick-actions': t('Abkürzungen zu Leseliste, Entdecken, Statistiken und mehr'),
  shelf: t('Was du gelesen hast, nach Lesedatum'),
  library: t('Ganzes Bücherregal und komplette Manga-Sammlung'),
  discover: t('Neues, Vorschläge und Genres für Bücher und Manga'),
  'for-shows': t('Bücher, auf denen deine Serien beruhen'),
  year: t('Bücher und Manga dieses Jahres in Zahlen'),
  stats: t('Seiten, Kapitel und Verlauf des Jahres'),
  owned: t('Bücher, die bei dir im Regal stehen'),
  paused: t('Bücher, die gerade ruhen'),
  'recently-added': t('Was du in den letzten Tagen hinzugefügt hast'),
  friends: t('Bücher, die deine Freunde besitzen'),
};

export const READING_SECTION_SHAPES: Record<string, SkeletonShape> = {
  'continue-reading': 'posters',
  new: 'posters',
  'for-you': 'cards',
  'up-next': 'posters',
  wishlist: 'posters',
  'quick-actions': 'bar',
  shelf: 'bar',
  library: 'tiles',
  discover: 'posters',
  'for-shows': 'posters',
  year: 'tiles',
  stats: 'tiles',
  owned: 'posters',
  paused: 'posters',
  'recently-added': 'posters',
  friends: 'posters',
};

export const READING_DISCOVER_LABELS: Record<string, string> = {
  hero: t('Highlight'),
  new: t('Neu & beliebt'),
  'for-you': t('Für dich'),
  genres: t('Stöbern nach Genre'),
  'genre-rows': t('Genre-Reihen'),
};

export const READING_FOR_YOU_LABELS: Record<string, string> = {
  goal: t('Leseziel'),
  ...MANGA_FOR_YOU_LABELS,
};
