import type { BookSearchResult } from '../../types/Book';
import { bookTitleKey, normalizeBookText } from './bookIdentity';

const NOT_RELATED = 1000;

const plain = (value: string): string =>
  normalizeBookText(value)
    .replace(/[^a-z0-9ß]+/g, ' ')
    .trim();

const rank = (result: BookSearchResult, title: string): number => {
  const prefix = plain(title);
  const full = plain(result.title);
  const exact = full === prefix;
  const startsWith = full.startsWith(`${prefix} `);
  const seriesNamed = !!result.series && bookTitleKey(result.series.name) === bookTitleKey(title);
  if (!exact && !startsWith && !seriesNamed) return NOT_RELATED;
  const numbered = startsWith ? full.slice(prefix.length).match(/^\D{0,12}?(\d{1,3})\b/) : null;
  const position = result.series?.position ?? (numbered ? Number(numbered[1]) : undefined);
  if (exact && (position === undefined || position <= 1)) return 0;
  if (position !== undefined && position <= 1) return 1;
  return position === undefined ? 2 : 2 + position;
};

/**
 * Bester Treffer für ein Werk: genauer Titel vor allem anderen; heißt das Werk wie seine
 * Reihe („Die Tribute von Panem"), der erste Band statt eines beliebigen.
 */
export function pickWorkHit(
  results: BookSearchResult[],
  title: string
): BookSearchResult | undefined {
  let best: BookSearchResult | undefined;
  let bestRank = Infinity;
  for (const result of results) {
    const r = rank(result, title);
    if (r < bestRank) {
      best = result;
      bestRank = r;
    }
  }
  return best;
}
