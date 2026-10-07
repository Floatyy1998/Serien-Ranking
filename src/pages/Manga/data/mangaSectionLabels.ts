import type { SkeletonShape } from '../../HomeLayout/LayoutCanvasSection';
import { t } from '../../../services/i18n';

export const MANGA_SECTION_LABELS: Record<string, string> = {
  'quick-actions': t('Schnellzugriff'),
  'continue-reading': t('Weiterlesen'),
  'new-chapters': t('Neue Kapitel'),
  'recently-added': t('Kürzlich hinzugefügt'),
  'up-next': t('Als Nächstes lesen'),
  'for-you': t('Für dich'),
  'genre-picks': t('Passend zu deinem Geschmack'),
  trending: 'Trending',
  popular: t('Beliebt'),
  'top-rated': t('Top bewertet'),
  stats: t('Statistiken'),
  collection: t('Sammlung'),
};

export const MANGA_SECTION_HINTS: Record<string, string> = {
  'quick-actions': t('Abkürzungen zu Leseliste, Entdecken, Statistiken und mehr'),
  'continue-reading': t('Was du gerade liest — zum Abhaken wischen'),
  'new-chapters': t('Frisch erschienene Kapitel, die du noch nicht gelesen hast'),
  'recently-added': t('Was du in den letzten Tagen hinzugefügt hast'),
  'up-next': t('Deine geplanten Manga, die noch warten'),
  'for-you': t('Aufholen, Bewerten, nochmal lesen'),
  'genre-picks': t('Neue Titel aus deinem Lieblingsgenre'),
  trending: t('Was gerade alle lesen'),
  popular: t('Die beliebtesten Manga aller Zeiten'),
  'top-rated': t('Die am besten bewerteten Manga'),
  stats: t('Kapitel, Fortschritt und Lieblingsgenre'),
  collection: t('Deine komplette Sammlung mit Suche und Filtern'),
};

export const MANGA_SECTION_SHAPES: Record<string, SkeletonShape> = {
  'quick-actions': 'cards',
  'continue-reading': 'banners',
  'new-chapters': 'posters',
  'recently-added': 'posters',
  'up-next': 'posters',
  'for-you': 'cards',
  'genre-picks': 'posters',
  trending: 'posters',
  popular: 'posters',
  'top-rated': 'posters',
  stats: 'tiles',
  collection: 'grid',
};

export const MANGA_QUICK_ACTION_LABELS: Record<string, string> = {
  'reading-list': t('Leseliste'),
  discover: t('Entdecken'),
  ratings: t('Ratings'),
  stats: t('Statistiken'),
  journey: t('Journey'),
  history: t('Verlauf'),
  'catch-up': t('Aufholen'),
};

export const MANGA_FOR_YOU_LABELS: Record<string, string> = {
  'catch-up': t('Aufholen'),
  'rating-queue': t('Noch nicht bewertet'),
  reread: t('Nochmal lesen'),
  hidden: t('Versteckte Manga'),
};
