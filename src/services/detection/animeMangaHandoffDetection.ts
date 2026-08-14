import { dbGet, dbRef, dbUpdate, paths, userPath } from '../db/ref';
import type { Series } from '../../types/Series';
import {
  normalizeSeasons,
  normalizeEpisodes,
  isEpisodeWatched,
} from '../../lib/episode/seriesMetrics';
import { hasEpisodeAired } from '../../utils/episodeDate';
import { fetchStaticAnimeManga } from '../staticCatalog';
import { getSnoozedUntil, cleanupSnoozes } from '../../lib/settings/notificationSettings';

/** Nur Staffeln melden, die in diesem Fenster fertig geschaut wurden. */
const HANDOFF_RECENCY_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Gibt es im Anime noch etwas zu schauen? Der Hinweis „lies im Manga weiter"
 * soll erst kommen, wenn nichts mehr nachkommt — nicht nach jedem Staffelfinale.
 *
 * Zwei Gründe sprechen dagegen:
 *  1. noch nicht gesehene, bereits ausgestrahlte Folgen (z. B. Staffel 2 liegt
 *     schon vor),
 *  2. Folgen mit Ausstrahlungsdatum in der Zukunft (laufende Staffel, nächste
 *     Woche geht es weiter).
 *
 * Der Serienstatus wird bewusst NICHT geprüft: zwischen zwei Anime-Staffeln
 * liegen oft Jahre, und genau dann will man den Manga weiterlesen. Ein Status
 * wie „Returning Series" ohne einen einzigen Termin darf das nicht verhindern.
 */
function hasMoreAnimeToWatch(series: Series): boolean {
  for (const season of normalizeSeasons(series.seasons)) {
    for (const ep of normalizeEpisodes(season.episodes)) {
      if (!hasEpisodeAired(ep)) return true; // kommt noch
      if (!isEpisodeWatched(ep)) return true; // liegt schon vor
    }
  }
  return false;
}

/** Neuester Watch-Zeitstempel (ms) einer Staffel, oder 0 wenn keiner bekannt. */
function seasonCompletionAt(
  eps: Array<{ lastWatchedAt?: string | number; firstWatchedAt?: string | number }>
): number {
  let latest = 0;
  for (const ep of eps) {
    const ts = ep.lastWatchedAt || ep.firstWatchedAt;
    if (!ts) continue;
    // Compact-Format speichert Unix-Sekunden — nicht als Millisekunden fehlinterpretieren
    const d = typeof ts === 'number' ? (ts < 1e12 ? ts * 1000 : ts) : new Date(ts).getTime();
    if (!isNaN(d) && d > latest) latest = d;
  }
  return latest;
}

export interface AnimeMangaHandoff {
  series: Series;
  /** 1-basierte letzte Staffel des Animes. */
  seasonNumber: number;
  /** AniList-id des Quell-Mangas. */
  mangaId: number;
  mangaTitle: string;
  /** Gesamt-Kapitelzahl des Mangas (falls bekannt). */
  totalChapters: number | null;
  /** KI-geschätztes Kapitel, an dem der Anime endet (approximativ). */
  estimatedChapter: number;
  confidence?: 'high' | 'med' | 'low';
}

/**
 * Findet Animes, die der Nutzer **auserzählt** hat und für die ein
 * Anime→Manga-Anschluss (aus dem statischen `anime-manga.json`) existiert.
 *
 * Auserzählt heißt: keine ungesehene ausgestrahlte Folge und keine Folge mit
 * Termin in der Zukunft. Frühere Fassungen meldeten nach JEDEM Staffelfinale —
 * auch wenn die nächste Staffel längst vorlag. Ein Hinweis zum Weiterlesen ist
 * nur sinnvoll, wenn im Anime nichts mehr nachkommt.
 *
 * Gemeldet wird die letzte Staffel mit Folgen; fehlt für sie eine Schätzung,
 * bleibt es still statt ein längst überholtes Kapitel zu nennen.
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
    if (!series || !series.id || series.hidden) continue;
    const entry = bridge[String(series.id)];
    if (!entry) continue;

    // Der Anime muss auserzählt sein — sonst wäre der Hinweis nach jedem
    // Staffelfinale da, obwohl noch Folgen warten oder nachkommen.
    if (hasMoreAnimeToWatch(series)) continue;

    // Ab hier ist alles gesehen: maßgeblich ist die LETZTE Staffel mit Folgen.
    // Eine ältere zu melden würde ein Kapitel nennen, das der Nutzer im Anime
    // längst hinter sich hat — dann lieber schweigen.
    let bestSeason = 0;
    let bestCompletion = 0;
    for (const season of normalizeSeasons(series.seasons)) {
      const eps = normalizeEpisodes(season.episodes);
      if (eps.length === 0) continue;
      const seasonNum = (season.seasonNumber ?? 0) + 1;
      if (seasonNum > bestSeason) {
        bestSeason = seasonNum;
        bestCompletion = seasonCompletionAt(eps);
      }
    }
    if (bestSeason === 0) continue;

    const bestChapter = entry.s?.[String(bestSeason)];
    if (bestChapter == null) continue;

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
