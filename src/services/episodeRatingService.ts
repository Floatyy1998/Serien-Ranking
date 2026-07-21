import { paths, updateWithSeriesVersion } from './db/ref';

/**
 * Setzt (oder entfernt) die eigene Folgenbewertung im kompakten Watch-Format:
 * seriesWatch/{sid}/seasons/{seasonIndex}/eps/{episodeId}/r = 1–10.
 * Bumpt serienVersion, damit andere Geräte den Delta-Sync ziehen.
 * rating null/0 = Bewertung entfernen.
 */
export async function setEpisodeRating(
  uid: string,
  seriesId: number,
  seasonIndex: number,
  episodeId: number,
  rating: number | null
): Promise<void> {
  const value = rating && rating >= 1 && rating <= 10 ? Math.round(rating) : null;
  const epPath = `${paths.seriesWatchItem(uid, seriesId)}/seasons/${seasonIndex}/eps/${episodeId}/r`;
  await updateWithSeriesVersion(uid, { [epPath]: value });
}
