import { normalizeTitle } from '../text/searchRelevance';
import type { AniListMangaSearchResult, Manga } from '../../types/Manga';
import { looksLikeIsbn } from './bookIdentity';

export interface MangaVolumeInput {
  id: string;
  title: string;
  subtitle?: string;
  categories?: string[];
  publisher?: string;
}

export interface MangaVolumeGuess {
  /** Reihentitel ohne Bandangabe — wird zuerst abgeglichen. */
  series: string;
  /** Voller Titel, falls die Zahl zum Namen gehört („Kaiju No. 8", „Mob Psycho 100"). */
  full?: string;
  volume?: number;
}

/** Ein Buchtreffer, der als Manga-Reihe erkannt wurde. */
export interface MangaLink {
  manga: AniListMangaSearchResult;
  owned?: Manga;
  volume?: number;
}

const COMIC_HINT =
  /\b(?:c[oó]mics?|manga|manhwa|manhua|graphic novels?|bandes? dessin[ée]es?|fumetti|historietas?|quadrinhos|webtoons?)\b/i;
const MANGA_PUBLISHER =
  /\b(?:manga|tokyopop|kaz[ée]|crunchyroll|altraverse|viz|yen press|kodansha|seven seas|shueisha|square enix|ki-oon|kurokawa|pika|gl[ée]nat|dokico|j-pop|star comics|ivrea|panini|waneko|shonen jump|jump comics|planeta c[oó]mic|norma editorial|jbc|newpop|kana|hayabusa)\b/i;
const NOVEL_HINT = /\b(?:light ?novels?|novels?|roman|romanzo|novela)\b/i;
const VOLUME_TAIL =
  /^(.+?)[\s,.:;–—-]*(?:\b(?:band|bd|vol|volume|tome|tomo|tom|teil|nr|book|buch)\.?\s*|#\s*)?(\d{1,4})$/i;

export const hasComicHint = (item: MangaVolumeInput): boolean =>
  (item.categories ?? []).some((c) => COMIC_HINT.test(c)) ||
  (!!item.publisher && MANGA_PUBLISHER.test(item.publisher));

/** Reihentitel ohne Untertitel: „Frieren – Nach dem Ende der Reise" → Frieren. */
export const seriesHead = (title: string): string => title.split(/\s*:\s+|\s+[–—-]\s+/)[0];

/** „One Piece, Band 18" → One Piece + 18; ohne Bandangabe bleibt der Titel ganz. */
export function splitVolume(title: string): { series: string; volume?: number } {
  const clean = title
    .replace(/\s*[([][^)\]]*[)\]]\s*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const head = seriesHead(clean);
  const match = (head !== clean ? head.match(VOLUME_TAIL) : null) ?? clean.match(VOLUME_TAIL);
  if (!match) return { series: clean };
  const series = match[1].replace(/[\s,.:;–—-]+$/, '').trim();
  const volume = Number(match[2]);
  return series && volume > 0 ? { series, volume } : { series: clean };
}

/** Sieht der Treffer nach einem Manga-Band aus? Romane und Light Novels bleiben Bücher. */
export function mangaVolumeGuess(
  item: MangaVolumeInput,
  options: { loose?: boolean } = {}
): MangaVolumeGuess | null {
  if (!item.title) return null;
  const graphicFree = `${item.title} ${item.subtitle ?? ''}`.replace(/graphic novels?/gi, '');
  if (NOVEL_HINT.test(graphicFree)) return null;
  if (!options.loose && !hasComicHint(item)) return null;
  const { series, volume } = splitVolume(item.title);
  if (normalizeTitle(series).length < 2) return null;
  const full = item.title.replace(/\s+/g, ' ').trim();
  return volume === undefined ? { series } : { series, full, volume };
}

const titleVariants = (manga: AniListMangaSearchResult): string[] =>
  [manga.title.english, manga.title.romaji, manga.title.native, ...(manga.synonyms ?? [])].filter(
    (value): value is string => !!value
  );

export interface SeriesMatch {
  manga: AniListMangaSearchResult;
  /** Gleichnamiger Roman (Light Novel) existiert — ohne Comic-Merkmal nicht raten. */
  ambiguous: boolean;
}

/** Exakter Titeltreffer (auch Synonyme wie der deutsche Titel); Manga vor Romanen gleichen Namens. */
export function matchSeries(
  candidates: AniListMangaSearchResult[],
  title: string
): SeriesMatch | null {
  const wanted = normalizeTitle(title);
  if (!wanted) return null;
  const exact = candidates.filter((manga) =>
    titleVariants(manga).some((value) => normalizeTitle(value) === wanted)
  );
  const manga = exact.find((m) => m.format !== 'NOVEL') ?? exact[0];
  if (!manga) return null;
  const novel = exact.some((m) => m.format === 'NOVEL');
  return { manga, ambiguous: novel && exact.some((m) => m.format !== 'NOVEL') };
}

export const pickSeriesMatch = (
  candidates: AniListMangaSearchResult[],
  title: string
): AniListMangaSearchResult | null => matchSeries(candidates, title)?.manga ?? null;

/**
 * Treffer ohne Comic-Merkmal (Open Library kennt oft weder Genre noch Verlag): nur ein
 * nummerierter Band genau der Reihe, nach der gesucht wurde — oder der Band zur gesuchten ISBN.
 */
export function anchoredVolumeGuess(
  item: MangaVolumeInput,
  query: string | undefined
): MangaVolumeGuess | null {
  const q = query?.trim();
  if (!q || mangaVolumeGuess(item)) return null;
  const guess = mangaVolumeGuess(item, { loose: true });
  if (!guess?.volume) return null;
  if (looksLikeIsbn(q)) return guess;
  return normalizeTitle(guess.series) === normalizeTitle(splitVolume(q).series) ? guess : null;
}

export const isMangaVolumeCandidate = (item: MangaVolumeInput, query?: string): boolean =>
  !!mangaVolumeGuess(item) || !!anchoredVolumeGuess(item, query);

/** Eigener Manga als Suchtreffer, damit Karten und Links nur eine Form kennen. */
export function mangaAsSearchResult(manga: Manga): AniListMangaSearchResult {
  const [year, month, day] = (manga.startDate ?? '').split('-').map(Number);
  return {
    id: manga.anilistId,
    title: {
      romaji: manga.titleRomaji ?? manga.title,
      english: manga.titleEnglish ?? manga.title,
      native: null,
    },
    coverImage: { large: manga.poster, medium: manga.poster },
    bannerImage: manga.bannerImage ?? null,
    description: manga.description ?? null,
    chapters: manga.chapters ?? null,
    volumes: manga.volumes ?? null,
    status: manga.status ?? '',
    format: manga.format ?? 'MANGA',
    countryOfOrigin: manga.countryOfOrigin ?? 'JP',
    genres: manga.genres ?? [],
    averageScore: manga.averageScore ?? null,
    startDate: { year: year || null, month: month || null, day: day || null },
    isAdult: !!manga.isAdult,
  };
}

export type MangaVolumeEntry<T> =
  { kind: 'book'; result: T } | { kind: 'manga'; link: MangaLink; volumes: T[] };

/** Bände derselben Reihe werden zu einem Manga-Eintrag an der Stelle des ersten Bandes. */
export function groupMangaVolumes<T extends { id: string }>(
  results: T[],
  linkFor: (result: T) => MangaLink | undefined
): MangaVolumeEntry<T>[] {
  const entries: MangaVolumeEntry<T>[] = [];
  const byManga = new Map<number, Extract<MangaVolumeEntry<T>, { kind: 'manga' }>>();
  for (const result of results) {
    const link = linkFor(result);
    if (!link) {
      entries.push({ kind: 'book', result });
      continue;
    }
    const existing = byManga.get(link.manga.id);
    if (existing) {
      existing.volumes.push(result);
      continue;
    }
    const entry = { kind: 'manga' as const, link, volumes: [result] };
    byManga.set(link.manga.id, entry);
    entries.push(entry);
  }
  return entries;
}
