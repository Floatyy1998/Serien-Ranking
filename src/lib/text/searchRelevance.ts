/**
 * Sortierung von TMDB-Suchtreffern: exakte Titeltreffer zuerst, danach
 * Popularität. Reine Popularität begräbt kleine Titel wie „3%" hinter
 * „3 Body Problem" & Co. unter dem Ergebnis-Cut.
 */

/** Kleinbuchstaben, ohne Akzente, nur Buchstaben und Ziffern („3 %" → „3"). */
export const normalizeTitle = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');

export interface RankableResult {
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  popularity?: number;
}

const isExactMatch = (item: RankableResult, normalizedQuery: string): boolean =>
  [item.title, item.name, item.original_title, item.original_name].some(
    (value) => !!value && normalizeTitle(value) === normalizedQuery
  );

export const rankSearchResults = <T extends RankableResult>(items: T[], query: string): T[] => {
  const normalizedQuery = normalizeTitle(query);
  return items
    .map((item) => ({ item, exact: !!normalizedQuery && isExactMatch(item, normalizedQuery) }))
    .sort(
      (a, b) =>
        Number(b.exact) - Number(a.exact) || (b.item.popularity ?? 0) - (a.item.popularity ?? 0)
    )
    .map(({ item }) => item);
};
