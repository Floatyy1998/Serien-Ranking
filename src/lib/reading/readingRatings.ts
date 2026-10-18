/** Gemeinsames Ranking für Bücher und Manga (beide 0–10, 0 = unbewertet). */

import type { Book } from '../../types/Book';
import type { Manga } from '../../types/Manga';
import { progressPercent } from '../books/bookProgress';
import { userMangaRating } from '../manga/overview';
import { mangaStand } from '../manga/progress';

export type RatingKind = 'book' | 'manga';
export type RatingMedium = 'book' | 'manga' | 'manhwa' | 'manhua';

export type RatingItem = {
  key: string;
  title: string;
  rating: number;
  medium: RatingMedium;
  /** Beendet, abgebrochen oder mindestens zur Hälfte gelesen — reif für eine Bewertung. */
  rateable: boolean;
  /** Letzter Lese-Zeitpunkt (ms) für die Reihenfolge von „Noch zu bewerten". */
  lastAt: number;
} & ({ kind: 'book'; book: Book } | { kind: 'manga'; manga: Manga });

export type RankedItem = RatingItem & { place: number };

/** Ab hier gilt ein Titel als weit gelesen. */
const FAR_PERCENT = 50;
/** Laufende Manga ohne bekannte Gesamtzahl: ab so vielen Kapiteln. */
const FAR_CHAPTERS = 50;

/** AniList meldet fast alles als MANGA — die Herkunft trennt Manhwa und Manhua. */
export const mangaMedium = (manga: Pick<Manga, 'countryOfOrigin'>): RatingMedium =>
  manga.countryOfOrigin === 'KR' ? 'manhwa' : manga.countryOfOrigin === 'CN' ? 'manhua' : 'manga';

const time = (iso: string | undefined): number => {
  const ms = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(ms) ? ms : 0;
};

const done = (status: string | undefined) => status === 'completed' || status === 'dropped';

function mangaFarRead(manga: Manga): boolean {
  const stand = mangaStand(manga);
  if (stand.total > 0) return stand.percent >= FAR_PERCENT;
  return stand.unit === 'chapter' && stand.current >= FAR_CHAPTERS;
}

export function buildRatingItems(
  books: Book[],
  manga: Manga[],
  uid: string | undefined
): RatingItem[] {
  return [
    ...books.map((book): RatingItem => ({
      kind: 'book',
      book,
      key: `b-${book.id}`,
      title: book.title || '',
      rating: book.rating && book.rating > 0 ? book.rating : 0,
      medium: 'book',
      rateable: done(book.status) || progressPercent(book) >= FAR_PERCENT,
      lastAt: time(book.completedAt || book.lastReadAt || book.addedAt),
    })),
    ...manga.map((m): RatingItem => ({
      kind: 'manga',
      manga: m,
      key: `m-${m.anilistId}`,
      title: m.title || '',
      rating: userMangaRating(m, uid),
      medium: mangaMedium(m),
      rateable: done(m.readStatus) || mangaFarRead(m),
      lastAt: time(m.completedAt || m.lastReadAt || m.addedAt),
    })),
  ];
}

/** Medien-Chips lohnen sich nur, wenn beides in der Liste steckt. */
export function availableKinds(items: RatingItem[]): RatingKind[] {
  const kinds = new Set(items.map((i) => i.kind));
  return kinds.has('book') && kinds.has('manga') ? ['book', 'manga'] : [];
}

const byTitle = (a: RatingItem, b: RatingItem) => a.title.localeCompare(b.title);

/** Bewertete Titel nach Wertung; Gleichstand teilt sich den Platz (1, 1, 3) und steht nach Titel. */
export function rankRatingItems(items: RatingItem[], kind: RatingKind | null): RankedItem[] {
  const sorted = items
    .filter((i) => i.rating > 0 && (!kind || i.kind === kind))
    .sort((a, b) => b.rating - a.rating || byTitle(a, b));
  return sorted.map((item, index) => {
    let first = index;
    while (first > 0 && sorted[first - 1].rating === item.rating) first -= 1;
    return { ...item, place: first + 1 };
  });
}

/** Unbewertete, aber beendete oder weit gelesene Titel — zuletzt gelesene zuerst. */
export function ratingQueue(items: RatingItem[], kind: RatingKind | null): RatingItem[] {
  return items
    .filter((i) => i.rating === 0 && i.rateable && (!kind || i.kind === kind))
    .sort((a, b) => b.lastAt - a.lastAt || byTitle(a, b));
}

export function ratingSummary(items: RatingItem[]): { count: number; average: number } {
  const rated = items.filter((i) => i.rating > 0);
  const sum = rated.reduce((s, i) => s + i.rating, 0);
  return { count: rated.length, average: rated.length > 0 ? sum / rated.length : 0 };
}

/** Einheitliche Anzeige beider Skalen: „9", „8,5" — mit fixed immer eine Nachkommastelle. */
export function formatRating(value: number, locale: string, fixed = false): string {
  return value.toLocaleString(locale, {
    minimumFractionDigits: fixed ? 1 : 0,
    maximumFractionDigits: 1,
  });
}
