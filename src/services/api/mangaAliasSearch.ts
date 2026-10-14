import {
  hasAdultGenre,
  isMangaUpdatesOnlyType,
  mangaUpdatesToSearchResult,
  type MangaUpdatesHit,
} from '../../lib/manga/mangaUpdatesAdapter';
import { findExactTitleMatch, pickRelevantAliasHits } from '../../lib/manga/titleMatch';
import { normalizeTitle } from '../../lib/text/searchRelevance';
import type { AniListMangaSearchResult } from '../../types/Manga';
import { searchMangaByTitles } from './anilistService';
import { searchMangaUpdatesTitles } from './mangaUpdatesService';

export interface MangaSearchOutcome {
  results: AniListMangaSearchResult[];
  /** AniList-ID → Titel, über den der Eintrag gefunden wurde (z.B. deutscher Webtoon-Name). */
  aliases: Record<number, string>;
}

const isMangaUpdatesOnlyHit = (hit: MangaUpdatesHit): hit is MangaUpdatesHit & { id: number } =>
  !!hit.id && isMangaUpdatesOnlyType(hit.type) && !hasAdultGenre(hit.genres);

/** Übersetzt die Eingabe über MangaUpdates (kennt deutsche Titel) auf den AniList-Eintrag. */
export async function findViaMangaUpdates(query: string): Promise<MangaSearchOutcome> {
  const hits = pickRelevantAliasHits(await searchMangaUpdatesTitles(query), query);
  if (hits.length === 0) return { results: [], aliases: {} };

  const candidates = await searchMangaByTitles(hits.map((hit) => hit.title));
  const results: AniListMangaSearchResult[] = [];
  const aliases: Record<number, string> = {};
  hits.forEach((hit, i) => {
    const match =
      findExactTitleMatch(candidates[i] ?? [], hit.title) ??
      (isMangaUpdatesOnlyHit(hit) ? mangaUpdatesToSearchResult(hit) : null);
    if (!match || results.some((result) => result.id === match.id)) return;
    results.push(match);
    if (normalizeTitle(hit.hitTitle) !== normalizeTitle(hit.title)) {
      aliases[match.id] = hit.hitTitle;
    }
  });
  return { results, aliases };
}
