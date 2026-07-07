import { dbGet, dbRef, dbUpdate, paths, userPath } from '../../services/db/ref';
import type { Series } from '../../types/Series';
import { normalizeSeasons, normalizeEpisodes, isEpisodeWatched } from '../episode/seriesMetrics';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { fetchStaticAnimeManga } from '../../services/staticCatalog';
import { getSnoozedUntil, cleanupSnoozes } from '../settings/notificationSettings';

/** Nur Staffeln melden, die in diesem Fenster fertig geschaut wurden. */
const HANDOFF_RECENCY_MS = 7 * 24 * 60 * 60 * 1000;

/** Neuester Watch-Zeitstempel (ms) einer Staffel, oder 0 wenn keiner bekannt. */
function seasonCompletionAt(
  eps: Array<{ lastWatchedAt?: string; firstWatchedAt?: string }>
): number {
  let latest = 0;
  for (const ep of eps) {
    const ts = ep.lastWatchedAt || ep.firstWatchedAt;
    if (!ts) continue;
    const d = new Date(ts).getTime();
    if (d > latest) latest = d;
  }
  return latest;
}

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
  const [notifiedRaw, snoozed] = await Promise.all([
    dbGet<Record<string, { dismissed: boolean; timestamp: number }>>(
      paths.notificationState(userId, 'animeMangaNotifications')
    ),
    getSnoozedUntil('animeManga', userId),
  ]);
  const notified = notifiedRaw || {};

  const out: AnimeMangaHandoff[] = [];

  for (const series of seriesList) {
    if (series.hidden) continue;
    const entry = bridge[String(series.id)];
    if (!entry) continue;

    // Höchste vollständig ausgestrahlte + komplett gesehene Staffel mit Schätzung.
    let bestSeason = 0;
    let bestChapter = 0;
    let bestCompletion = 0;
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
        bestCompletion = seasonCompletionAt(eps);
      }
    }
    if (bestSeason === 0) continue;

    // NICHT rückwirkend: nur Staffeln, die *kürzlich* fertig geschaut wurden.
    // Ohne diesen Filter würde die Detection beim Feature-Start für die gesamte
    // Anime-Historie feuern (hunderte Notifications). Fehlt der Zeitstempel
    // (Alt-Daten ohne firstWatchedAt), wird bewusst NICHT gemeldet.
    if (!bestCompletion || now - bestCompletion > HANDOFF_RECENCY_MS) continue;

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
      cleanup[userPath(userId, 'animeMangaNotifications', key)] = null;
    }
  }
  if (Object.keys(cleanup).length > 0) {
    try {
      await dbUpdate(cleanup);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[AnimeMangaHandoff] Failed to cleanup notifications: ${message}`);
    }
  }
  await cleanupSnoozes('animeManga', userId, currentIds);

  return out;
}

/**
 * Persistiert das Dismiss eines Handoffs, damit die Notification für diese
 * (Serie, Staffel) nicht wiederkommt. Best-effort.
 */
export async function markAnimeMangaHandoffDismissed(
  userId: string,
  seriesId: number,
  seasonNumber: number
): Promise<void> {
  try {
    await dbRef(userPath(userId, 'animeMangaNotifications', `${seriesId}-${seasonNumber}`)).set({
      dismissed: true,
      timestamp: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[AnimeMangaHandoff] Failed to persist dismiss: ${message}`);
  }
}
