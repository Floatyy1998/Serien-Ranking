import type { BookSearchResult } from '../../types/Book';
import { normalizeTitle } from '../text/searchRelevance';
import { splitVolume } from './mangaVolume';

/** Band N genau dieser Reihe aus Buchtreffern — App-Sprache und Cover zuerst. */
export function pickVolumeBook(
  hits: BookSearchResult[],
  seriesNames: string[],
  volume: number,
  locale: string
): BookSearchResult | null {
  const wanted = new Set(seriesNames.map(normalizeTitle).filter(Boolean));
  const matches = hits.filter((hit) => {
    const split = splitVolume(hit.title);
    return split.volume === volume && wanted.has(normalizeTitle(split.series));
  });
  const score = (hit: BookSearchResult) => (hit.language === locale ? 2 : 0) + (hit.cover ? 1 : 0);
  return matches.reduce<BookSearchResult | null>(
    (best, hit) => (!best || score(hit) > score(best) ? hit : best),
    null
  );
}
