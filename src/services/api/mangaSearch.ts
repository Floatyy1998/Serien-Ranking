import {
  findExactTitleMatch,
  hasDirectTitleMatch,
  pickRelevantAliasHits,
} from '../../lib/manga/titleMatch';
import { normalizeTitle } from '../../lib/text/searchRelevance';
import type { AniListMangaSearchResult } from '../../types/Manga';
import { searchManga, searchMangaByTitles } from './anilistService';
import { searchMangaUpdatesTitles } from './mangaUpdatesService';

const MIN_FALLBACK_LENGTH = 4;

export interface MangaSearchOutcome {
  results: AniListMangaSearchResult[];
  /** AniList-ID → Titel, über den der Eintrag gefunden wurde (z.B. deutscher Webtoon-Name). */
  aliases: Record<number, string>;
}

async function findViaMangaUpdates(query: string): Promise<MangaSearchOutcome> {
  const hits = pickRelevantAliasHits(await searchMangaUpdatesTitles(query), query);
  if (hits.length === 0) return { results: [], aliases: {} };

  const candidates = await searchMangaByTitles(hits.map((hit) => hit.title));
  const results: AniListMangaSearchResult[] = [];
  const aliases: Record<number, string> = {};
  hits.forEach((hit, i) => {
    const match = findExactTitleMatch(candidates[i] ?? [], hit.title);
    if (!match || aliases[match.id] !== undefined) return;
    results.push(match);
    if (normalizeTitle(hit.hitTitle) !== normalizeTitle(hit.title)) {
      aliases[match.id] = hit.hitTitle;
    }
  });
  return { results, aliases };
}

/**
 * AniList-Suche; findet sie keinen passenden Titel, wird die Eingabe über
 * MangaUpdates (kennt deutsche Webtoon-Titel) auf den Originaltitel übersetzt.
 */
export async function searchMangaWithTitleFallback(
  query: string,
  perPage = 30
): Promise<MangaSearchOutcome> {
  const trimmed = query.trim();
  const { results } = await searchManga(trimmed, 1, perPage);
  if (trimmed.length < MIN_FALLBACK_LENGTH || hasDirectTitleMatch(results, trimmed)) {
    return { results, aliases: {} };
  }

  const fallback = await findViaMangaUpdates(trimmed).catch(() => null);
  if (!fallback || fallback.results.length === 0) return { results, aliases: {} };
  const fallbackIds = new Set(fallback.results.map((result) => result.id));
  return {
    results: [...fallback.results, ...results.filter((result) => !fallbackIds.has(result.id))],
    aliases: fallback.aliases,
  };
}
