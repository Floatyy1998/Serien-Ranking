import type { AniListMangaSearchResult } from '../../types/Manga';
import { appLocale } from '../i18n';
import { createCatalogClient } from './catalogClient';

/**
 * Manga-Katalog auf dem eigenen Server: jeder Manga, den irgendwer hinzugefügt hat, liegt dauerhaft als
 * catalog/manga/items/<anilistId>.json samt Cover bei uns (negative IDs = MangaUpdates).
 */

/** Zeile aus index.json: t Titel, e englisch, r Romaji, y Startjahr, f Format, k Land, a 1 = Erwachsene, c 1 = Cover. */
export interface MangaCatalogEntry {
  id: string;
  t: string;
  e?: string;
  r?: string;
  y?: number;
  f?: string;
  k?: string;
  a?: 1;
  c?: 1;
  v: number;
}

export interface MangaCatalogItem {
  id: string;
  anilistId: number;
  title: string;
  titleEnglish?: string;
  titleRomaji?: string;
  titleNative?: string;
  poster?: string;
  cover?: string;
  bannerImage?: string;
  description?: string;
  chapters?: number;
  volumes?: number;
  status?: string;
  format?: string;
  countryOfOrigin?: string;
  genres?: string[];
  averageScore?: number;
  startDate?: string;
  isAdult?: boolean;
  v?: number;
  descriptions?: Record<string, string>;
}

const client = createCatalogClient<MangaCatalogEntry, MangaCatalogItem>({
  dir: 'manga',
  versionPath: '/manga/version',
  addPath: '/manga/add',
  describePath: '/manga/describe',
  payloadKey: 'manga',
  cacheNs: 'mcatdesc',
});

export const mangaCatalogVersion = client.version;
export const loadMangaCatalogIndex = client.index;
export const loadMangaCatalogItem = client.item;
export const describeMangaFromCatalog = client.describe;

const dateOf = (d: AniListMangaSearchResult['startDate'] | undefined): string | undefined => {
  if (!d?.year) return undefined;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (d.month && d.day) return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
  return String(d.year);
};

/** Flacher Eintrag für den Katalog — Titel als Strings, Cover als Quelle, ohne Empfehlungen und Relationen. */
export function keepMangaInCatalog(result: AniListMangaSearchResult): void {
  client.keep(
    {
      id: String(result.id),
      title: result.title.english || result.title.romaji,
      titleEnglish: result.title.english ?? undefined,
      titleRomaji: result.title.romaji,
      titleNative: result.title.native ?? undefined,
      poster: result.coverImage?.large,
      bannerImage: result.bannerImage ?? undefined,
      description: result.description ?? undefined,
      chapters: result.chapters ?? undefined,
      volumes: result.volumes ?? undefined,
      status: result.status,
      format: result.format,
      countryOfOrigin: result.countryOfOrigin,
      genres: result.genres,
      averageScore: result.averageScore ?? undefined,
      startDate: dateOf(result.startDate),
      isAdult: result.isAdult || undefined,
    },
    appLocale
  );
}

/** Katalog-Eintrag in der Form eines AniList-Suchtreffers — Cover aus der eigenen Ablage, wenn vorhanden. */
export function mangaCatalogItemToResult(item: MangaCatalogItem): AniListMangaSearchResult {
  const cover = item.cover ?? item.poster ?? '';
  const [year, month, day] = (item.startDate ?? '').split('-').map((part) => Number(part) || null);
  return {
    id: item.anilistId ?? Number(item.id),
    title: {
      romaji: item.titleRomaji ?? item.title,
      english: item.titleEnglish ?? null,
      native: item.titleNative ?? null,
    },
    coverImage: { large: cover, medium: cover },
    bannerImage: item.bannerImage ?? null,
    description: item.description ?? null,
    chapters: item.chapters ?? null,
    volumes: item.volumes ?? null,
    status: item.status ?? '',
    format: item.format ?? '',
    countryOfOrigin: item.countryOfOrigin ?? '',
    genres: item.genres ?? [],
    averageScore: item.averageScore ?? null,
    startDate: { year: year ?? null, month: month ?? null, day: day ?? null },
    isAdult: !!item.isAdult,
  };
}

const fold = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Jedes Suchwort muss in einem der Titel vorkommen — Romaji, Englisch oder Anzeigetitel. */
export function mangaEntryMatches(entry: MangaCatalogEntry, query: string): boolean {
  const words = fold(query)
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  if (!words.length) return false;
  const haystack = fold([entry.t, entry.e, entry.r].filter(Boolean).join(' | '));
  return words.every((w) => haystack.includes(w));
}

/** Treffer aus unserem Katalog, als fertige Suchtreffer mit eigenem Cover. */
export async function searchMangaCatalog(
  query: string,
  limit = 8
): Promise<AniListMangaSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const { items } = await loadMangaCatalogIndex();
  const hits = items.filter((e) => mangaEntryMatches(e, trimmed)).slice(0, limit);
  const loaded = await Promise.all(hits.map((e) => loadMangaCatalogItem(e.id, e.v)));
  return loaded
    .filter((item): item is MangaCatalogItem => !!item && !!item.title)
    .map(mangaCatalogItemToResult);
}
