import { normalizeTitle } from '../text/searchRelevance';
import type { AniListMangaSearchResult } from '../../types/Manga';

type TitledManga = Pick<AniListMangaSearchResult, 'title' | 'synonyms'>;

export interface AliasHit {
  title: string;
  hitTitle: string;
}

const titleVariants = (manga: TitledManga): string[] =>
  [manga.title.english, manga.title.romaji, manga.title.native, ...(manga.synonyms ?? [])].filter(
    (value): value is string => !!value
  );

/** Kurze Eingaben müssen exakt treffen, ab 4 Zeichen reicht ein Teiltreffer. */
export const matchesTitleText = (value: string, query: string): boolean => {
  const normalizedQuery = normalizeTitle(query);
  if (!normalizedQuery) return false;
  const normalized = normalizeTitle(value);
  return (
    normalized === normalizedQuery ||
    (normalizedQuery.length >= 4 && normalized.includes(normalizedQuery))
  );
};

export const matchesMangaTitle = (manga: TitledManga, query: string): boolean =>
  titleVariants(manga).some((value) => matchesTitleText(value, query));

export const hasDirectTitleMatch = (results: TitledManga[], query: string): boolean =>
  results.some((manga) => matchesMangaTitle(manga, query));

export const hasLeadingTitleMatch = (results: TitledManga[], query: string): boolean => {
  const normalizedQuery = normalizeTitle(query);
  if (!normalizedQuery) return false;
  return results.some((manga) =>
    titleVariants(manga).some((value) => normalizeTitle(value).startsWith(normalizedQuery))
  );
};

const isExactTitle = (manga: TitledManga, query: string): boolean => {
  const normalizedQuery = normalizeTitle(query);
  return (
    !!normalizedQuery &&
    titleVariants(manga).some((value) => normalizeTitle(value) === normalizedQuery)
  );
};

export const sortExactTitleFirst = <T extends TitledManga>(results: T[], query: string): T[] => [
  ...results.filter((manga) => isExactTitle(manga, query)),
  ...results.filter((manga) => !isExactTitle(manga, query)),
];

export const findExactTitleMatch = <T extends TitledManga>(
  results: T[],
  title: string
): T | null => {
  const normalizedTitle = normalizeTitle(title);
  if (!normalizedTitle) return null;
  return (
    results.find((manga) =>
      titleVariants(manga).some((value) => normalizeTitle(value) === normalizedTitle)
    ) ?? null
  );
};

/** MangaUpdates liefert auch lose Treffer; nur die behalten, deren Titel zur Eingabe passt. */
export const pickRelevantAliasHits = <T extends AliasHit & { id?: number | null }>(
  hits: T[],
  query: string,
  limit = 5
): T[] => {
  const seen = new Set<string>();
  const normalizedQuery = normalizeTitle(query);
  const isExact = (hit: T) =>
    normalizeTitle(hit.hitTitle) === normalizedQuery ||
    normalizeTitle(hit.title) === normalizedQuery;
  const relevant = hits.filter((hit) => {
    const key = hit.id ? String(hit.id) : normalizeTitle(hit.title);
    if (!key || seen.has(key)) return false;
    if (!matchesTitleText(hit.hitTitle, query) && !matchesTitleText(hit.title, query)) {
      return false;
    }
    seen.add(key);
    return true;
  });
  return [...relevant.filter(isExact), ...relevant.filter((hit) => !isExact(hit))].slice(0, limit);
};
