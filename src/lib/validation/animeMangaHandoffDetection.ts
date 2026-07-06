import firebase from 'firebase/compat/app';
import type { Series } from '../../types/Series';
import { normalizeSeasons, normalizeEpisodes, isEpisodeWatched } from '../episode/seriesMetrics';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { fetchStaticAnimeManga } from '../staticCatalog';
import { getSnoozedUntil, cleanupSnoozes } from '../settings/notificationSettings';

export interface AnimeMangaHandoff {
  series: Series;
  /** 1-basierte, gerade abgeschlossene Staffel. */
  seasonNumber: number;
  /** AniList-id des Quell-Mangas. */
  mangaId: number;
  mangaTitle: string;
  /** Gesamt-Kapitelzahl des Mangas (falls bekannt). */
  totalChapters: number | null;
  /** KI-geschätztes End-Kapitel dieser Staffel (approximativ). */
  estimatedChapter: number;
  confidence?: 'high' | 'med' | 'low';
}

/**
 * Findet Animes, bei denen der Nutzer eine komplett ausgestrahlte Staffel
 * vollständig gesehen hat und für die ein Anime→Manga-Anschluss (aus dem
 * statischen `anime-manga.json`) existiert. Meldet pro Serie die **höchste**
 * solche abgeschlossene Staffel — so kommt beim Weiterschauen genau eine
 * „lies den Manga weiter"-Notification pro neu beendeter Staffel.
 *
 * Ein-Shot pro (Serie, Staffel): einmal dismissed → kommt nicht wieder (bis der
 * Nutzer eine höhere Staffel abschließt). Respektiert die Snooze-Tabelle.
 */
export async function detectAnimeMangaHandoff(
  seriesList: Series[],
  userId: string
): Promise<AnimeMangaHandoff[]> {
  const bridge = await fetchStaticAnimeManga();
  if (!bridge || Object.keys(bridge).length === 0) return [];

  const now = Date.now();
  const [notifiedSnap, snoozed] = await Promise.all([
    firebase.database().ref(`users/${userId}/animeMangaNotifications`).once('value'),
    getSnoozedUntil('animeManga', userId),
  ]);
  const notified =
    (notifiedSnap.val() as Record<string, { dismissed: boolean; timestamp: number }>) || {};

  const out: AnimeMangaHandoff[] = [];

  for (const series of seriesList) {
    if (series.hidden) continue;
    const entry = bridge[String(series.id)];
    if (!entry) continue;

    // Höchste vollständig ausgestrahlte + komplett gesehene Staffel mit Schätzung.
    let bestSeason = 0;
    let bestChapter = 0;
    for (const season of normalizeSeasons(series.seasons)) {
      const seasonNum = (season.seasonNumber ?? 0) + 1;
      const est = entry.s?.[String(seasonNum)];
      if (est == null) continue;

      const eps = normalizeEpisodes(season.episodes);
      if (eps.length === 0) continue;
      if (!eps.every((ep) => hasEpisodeAired(ep))) continue;
      if (!eps.every((ep) => isEpisodeWatched(ep))) continue;

      if (seasonNum > bestSeason) {
        bestSeason = seasonNum;
        bestChapter = est;
      }
    }
    if (bestSeason === 0) continue;

    const key = `${series.id}-${bestSeason}`;
    if (notified[key]?.dismissed) continue;
    const snoozedUntil = snoozed[key];
    if (typeof snoozedUntil === 'number' && snoozedUntil > now) continue;

    out.push({
      series,
      seasonNumber: bestSeason,
      mangaId: entry.m,
      mangaTitle: entry.t,
      totalChapters: entry.c ?? null,
      estimatedChapter: bestChapter,
      confidence: entry.cf,
    });
  }

  // Aufräumen: Dismiss-Einträge für Serien entfernen, die nicht mehr in der Liste sind.
  const currentIds = new Set(seriesList.map((s) => String(s.id)));
  const cleanup: Record<string, null> = {};
  for (const key of Object.keys(notified)) {
    const seriesId = key.split('-')[0];
    if (!currentIds.has(seriesId)) {
      cleanup[`users/${userId}/animeMangaNotifications/${key}`] = null;
    }
  }
  if (Object.keys(cleanup).length > 0) {
    try {
      await firebase.database().ref().update(cleanup);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[AnimeMangaHandoff] Failed to cleanup notifications: ${message}`);
    }
  }
  await cleanupSnoozes('animeManga', userId, currentIds);

  return out;
}
