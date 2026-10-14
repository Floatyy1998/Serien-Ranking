import { looksLikeIsbn } from '../../lib/books/bookIdentity';
import {
  hasDirectTitleMatch,
  hasLeadingTitleMatch,
  sortExactTitleFirst,
} from '../../lib/manga/titleMatch';
import { findMangaByIsbn } from '../books/mangaVolumes';
import { searchManga } from './anilistService';
import { findViaMangaUpdates, type MangaSearchOutcome } from './mangaAliasSearch';

export type { MangaSearchOutcome } from './mangaAliasSearch';

const MIN_FALLBACK_LENGTH = 4;

/**
 * AniList-Suche; findet sie keinen passenden Titel, wird die Eingabe über
 * MangaUpdates (kennt deutsche Webtoon-Titel) auf den Originaltitel übersetzt.
 * Eine ISBN wird über die Buchquellen auf den Band und damit die Reihe aufgelöst.
 */
export async function searchMangaWithTitleFallback(
  query: string,
  perPage = 30
): Promise<MangaSearchOutcome> {
  const trimmed = query.trim();
  if (looksLikeIsbn(trimmed)) return findMangaByIsbn(trimmed);
  const { results } = await searchManga(trimmed, 1, perPage);
  if (trimmed.length < MIN_FALLBACK_LENGTH || hasLeadingTitleMatch(results, trimmed)) {
    return { results, aliases: {} };
  }

  const fallback = await findViaMangaUpdates(trimmed).catch(() => null);
  if (!fallback || fallback.results.length === 0) return { results, aliases: {} };
  const fallbackIds = new Set(fallback.results.map((result) => result.id));
  const merged = hasDirectTitleMatch(results, trimmed)
    ? [...results, ...fallback.results.filter((result) => !results.some((r) => r.id === result.id))]
    : [...fallback.results, ...results.filter((result) => !fallbackIds.has(result.id))];
  return { results: sortExactTitleFirst(merged, trimmed), aliases: fallback.aliases };
}
