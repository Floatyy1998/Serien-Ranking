import { isMangaUpdatesId, toMangaUpdatesSeriesId } from '../../lib/manga/mangaSource';
import { mangaUpdatesToSearchResult } from '../../lib/manga/mangaUpdatesAdapter';
import type { AniListMangaSearchResult } from '../../types/Manga';
import { getMangaById } from './anilistService';
import { getMangaUpdatesSeries } from './mangaUpdatesService';

export async function getMangaDetails(id: number): Promise<AniListMangaSearchResult> {
  if (!isMangaUpdatesId(id)) return getMangaById(id);
  return mangaUpdatesToSearchResult(await getMangaUpdatesSeries(toMangaUpdatesSeriesId(id)));
}
