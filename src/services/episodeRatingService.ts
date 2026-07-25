import { paths, updateWithSeriesVersion } from './db/ref';

/**
 * Setzt (oder entfernt) die eigene Folgenbewertung im kompakten Watch-Format:
 * seriesWatch/{sid}/seasons/{seasonIndex}/eps/{episodeId}/r = 0.5–10 (eine
 * Nachkommastelle). Bumpt serienVersion, damit andere Geräte den Delta-Sync
 * ziehen. rating null / < 0.5 = Bewertung entfernen.
 */
export async function setEpisodeRating(
  uid: string,
  seriesId: number,
  seasonIndex: number,
  episodeId: number,
  rating: number | null
): Promise<void> {
  const value =
    rating && rating >= 0.5 && rating <= 10 ? Math.min(10, Math.round(rating * 10) / 10) : null;
  const epPath = `${paths.seriesWatchItem(uid, seriesId)}/seasons/${seasonIndex}/eps/${episodeId}/r`;
  await updateWithSeriesVersion(uid, { [epPath]: value });
}
