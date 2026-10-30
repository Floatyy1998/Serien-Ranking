import type { BookSearchResult } from '../../types/Book';
import { bookTitleKey, isSameBookIdentity, splitVolumeKey } from './bookIdentity';
import { stripResult } from './bookSearchMapping';

/** Gleiche ISBN oder gleicher Titel samt Band — Beteiligte müssen sich nur ohne Bandnummer treffen. */
export function isSameBook(a: BookSearchResult, b: BookSearchResult): boolean {
  return isSameBookIdentity(a, b);
}

const richness = (r: BookSearchResult) =>
  (r.description ? 3 : 0) + (r.pageCount ? 2 : 0) + (r.cover ? 1 : 0) + (r.isbn13 ? 1 : 0);

function combine(a: BookSearchResult, b: BookSearchResult, language: string): BookSearchResult {
  const weight = (r: BookSearchResult) => richness(r) + (r.language === language ? 4 : 0);
  const [keep, other] = weight(b) > weight(a) ? [b, a] : [a, b];
  return stripResult({
    ...keep,
    authors: keep.authors?.length ? keep.authors : other.authors,
    cover: keep.cover ?? other.cover,
    coverFallback: keep.coverFallback ?? (keep.cover ? other.cover : other.coverFallback),
    pageCount: keep.pageCount ?? other.pageCount,
    popularity: Math.max(keep.popularity ?? 0, other.popularity ?? 0) || undefined,
  });
}

/**
 * Ausgaben desselben Buchs (Sprachen, Verlage, Quellen) werden ein Treffer: die Ausgabe in der
 * App-Sprache gewinnt, sonst die reichhaltigere; fehlendes Cover und Autoren kommen von der anderen.
 */
export function mergeEditions(results: BookSearchResult[], language: string): BookSearchResult[] {
  const merged: BookSearchResult[] = [];
  for (const result of results) {
    const at = merged.findIndex((known) => isSameBook(known, result));
    if (at === -1) merged.push(result);
    else merged[at] = combine(merged[at], result, language);
  }
  return merged;
}

const volumeOf = (r: BookSearchResult) => splitVolumeKey(bookTitleKey(r.title));

/** Bände einer Reihe stehen zusammen und aufsteigend — dort, wo der bestplatzierte Band stand. */
export function orderSeriesVolumes(results: BookSearchResult[]): BookSearchResult[] {
  const volumes = results.map((r) => ({ r, volume: volumeOf(r) }));
  const placed = new Set<string>();
  const ordered: BookSearchResult[] = [];
  for (const { r, volume } of volumes) {
    if (!volume) {
      ordered.push(r);
      continue;
    }
    if (placed.has(volume.series)) continue;
    placed.add(volume.series);
    ordered.push(
      ...volumes
        .filter((entry) => entry.volume?.series === volume.series)
        .sort((a, b) => (a.volume?.number ?? 0) - (b.volume?.number ?? 0))
        .map((entry) => entry.r)
    );
  }
  return ordered;
}
