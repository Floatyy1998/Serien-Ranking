import { tmdbLogoUrl } from '../../hooks/useProviderLogos';
import { normalizeProviderName } from '../../services/detection/providerChangeDetection';
import { getEpisodeAirDate } from '../../utils/episodeDate';
import type { CatalogEpisode, CatalogSeason } from '../../types/CatalogTypes';
import type { SeasonAnime } from '../../services/anilistSeasonService';
import type { Series } from '../../types/Series';
import { t } from '../../services/i18n';
import { dayLabel, isSameDay, relativeDayLabel } from './animeFormat';
import type { TmdbProviderInfo } from './resolveTmdbId';

export interface DecoratedAnime {
  anime: SeasonAnime;
  match?: Series;
  /** Nur „Fortlaufend": Label der Ursprungs-Season („Frühling 2026"). */
  sinceLabel?: string;
}

/** Tages-Gruppe der Premieren-Timeline. */
export interface DayGroup {
  key: string;
  /** „FREITAG · 3. JULI" bzw. „Start noch offen". */
  label: string;
  /** „Heute" / „Morgen" / „in 5 Tagen" — null außerhalb der nahen Zukunft. */
  relative: string | null;
  isToday: boolean;
  /** Premiere liegt in der Vergangenheit — gedimmter Node/Label. */
  isPast: boolean;
  /** Kein volles Startdatum — dashed Node am Timeline-Ende. */
  isTba: boolean;
  items: DecoratedAnime[];
}

/** Volles Startdatum (Jahr+Monat+Tag) — sonst null → „Start noch offen". */
export function fullStartDate(anime: SeasonAnime): Date | null {
  const sd = anime.startDate;
  if (!sd?.year || !sd.month || !sd.day) return null;
  return new Date(sd.year, sd.month - 1, sd.day);
}

export const byPopularity = (a: DecoratedAnime, b: DecoratedAnime) =>
  (b.anime.popularity ?? 0) - (a.anime.popularity ?? 0);

/** Braucht der Eintrag eine TMDB-Auflösung? Listen-Matches nur, wenn ihnen
 *  Katalog-Daten fehlen (vote_average führt der Katalog nicht, beschreibung
 *  teils nicht) — Provider kommen für Matches weiter aus der Liste. */
export const needsResolveEntry = (entry: DecoratedAnime) =>
  !entry.match ||
  !(typeof entry.match.vote_average === 'number' && entry.match.vote_average > 0) ||
  !entry.match.beschreibung?.trim();

/** Fenster, in dem eine Katalog-Episode als „dieselbe Premiere" gilt. */
const CALENDAR_MATCH_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Premierentermin aus dem eigenen Kalender (Katalog/TVMaze, inkl.
 * Midnight-Quirk-Korrektur): die Episode der gematchten Serie, deren
 * Sendetermin dem AniList-Startdatum am nächsten liegt (±3 Tage).
 * AniList liefert den japanischen TV-Termin — der DE-Simulcast im eigenen
 * Kalender kann davon abweichen; für Serien in der Liste soll der
 * Season-Kalender exakt dasselbe Datum zeigen wie der Serien-Kalender.
 */
function calendarPremiereDate(match: Series, anilistDate: Date): Date | null {
  let best: Date | null = null;
  let bestDiff = CALENDAR_MATCH_WINDOW_MS + 1;
  for (const season of match.seasons ?? []) {
    for (const episode of season.episodes ?? []) {
      const date = getEpisodeAirDate(episode);
      if (!date) continue;
      const diff = Math.abs(date.getTime() - anilistDate.getTime());
      if (diff <= CALENDAR_MATCH_WINDOW_MS && diff < bestDiff) {
        best = date;
        bestDiff = diff;
      }
    }
  }
  return best;
}

/** AniList-Eintrag mit dem Kalender-Datum der eigenen Liste überschreiben
 *  (nur wenn eine Katalog-Episode im ±3-Tage-Fenster existiert). */
export function withCalendarDate(anime: SeasonAnime, match: Series): SeasonAnime {
  const anilistDate = fullStartDate(anime);
  if (!anilistDate) return anime;
  const calendarDate = calendarPremiereDate(match, anilistDate);
  if (!calendarDate) return anime;
  const corrected = {
    year: calendarDate.getFullYear(),
    month: calendarDate.getMonth() + 1,
    day: calendarDate.getDate(),
  };
  const sd = anime.startDate;
  if (sd?.year === corrected.year && sd.month === corrected.month && sd.day === corrected.day) {
    return anime;
  }
  return { ...anime, startDate: corrected };
}

/** Premierentermin aus dem STATISCHEN Katalog (Bulk-Seasons, alle Serien —
 *  auch die ohne Listen-Eintrag; der Backend-Cron nimmt Seasonal-Anime mit
 *  DE-Provider automatisch auf): Episode im ±3-Tage-Fenster ums
 *  AniList-Datum, gleiche Quelle wie der Serien-Kalender. */
export function catalogBulkPremiereDate(
  seasons: Record<string, CatalogSeason>,
  anilistDate: Date
): Date | null {
  let best: Date | null = null;
  let bestDiff = CALENDAR_MATCH_WINDOW_MS + 1;
  for (const season of Object.values(seasons)) {
    // Sparse-Object-Quirk: episodes kann bei manchen Katalog-Einträgen als
    // Objekt statt Array serialisiert sein (vgl. seriesAdapter.ensureArray).
    const rawEpisodes = season?.episodes;
    const episodes: CatalogEpisode[] = Array.isArray(rawEpisodes)
      ? rawEpisodes
      : rawEpisodes && typeof rawEpisodes === 'object'
        ? (Object.values(rawEpisodes) as CatalogEpisode[])
        : [];
    for (const episode of episodes) {
      if (!episode) continue; // sparse Arrays: Index 0 kann fehlen
      const date = getEpisodeAirDate({
        airstamp: episode.airstamp ?? undefined,
        airDate: episode.airDate ?? undefined,
      });
      if (!date) continue;
      const diff = Math.abs(date.getTime() - anilistDate.getTime());
      if (diff <= CALENDAR_MATCH_WINDOW_MS && diff < bestDiff) {
        best = date;
        bestDiff = diff;
      }
    }
  }
  return best;
}

/** AniList-Eintrag mit einem Date-Objekt überschreiben (Tag-Genauigkeit). */
export function withDate(anime: SeasonAnime, date: Date): SeasonAnime {
  const corrected = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
  const sd = anime.startDate;
  if (sd?.year === corrected.year && sd.month === corrected.month && sd.day === corrected.day) {
    return anime;
  }
  return { ...anime, startDate: corrected };
}

/** AniList-Startdatum mit dem TVMaze-geprüften Termin („YYYY-MM-DD") aus der
 *  progressiven Auflösung überschreiben. */
export function withPremiereDate(anime: SeasonAnime, iso: string): SeasonAnime {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return anime;
  const sd = anime.startDate;
  if (sd?.year === year && sd.month === month && sd.day === day) return anime;
  return { ...anime, startDate: { year, month, day } };
}

/** ALLE Season-Neustarts nach Premieren-TAG gruppieren — die Timeline
 *  beginnt beim Season-Start (Vergangenheit gedimmt), Datum-lose ans Ende. */
export function buildDayGroups(entries: DecoratedAnime[], now: Date): DayGroup[] {
  const byDay = new Map<number, { date: Date; items: DecoratedAnime[] }>();
  const tba: DecoratedAnime[] = [];
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  for (const entry of entries) {
    const date = fullStartDate(entry.anime);
    if (!date) {
      tba.push(entry);
      continue;
    }
    const bucket = byDay.get(date.getTime());
    if (bucket) bucket.items.push(entry);
    else byDay.set(date.getTime(), { date, items: [entry] });
  }

  const groups: DayGroup[] = [...byDay.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map(({ date, items }) => ({
      key: `d-${date.getTime()}`,
      label: dayLabel(date),
      relative: relativeDayLabel(date, now),
      isToday: isSameDay(date, now),
      isPast: date.getTime() < startOfToday,
      isTba: false,
      items: items.sort(byPopularity),
    }));

  if (tba.length) {
    groups.push({
      key: 'tba',
      label: t('Start noch offen'),
      relative: null,
      isToday: false,
      isPast: false,
      isTba: true,
      items: tba.sort(byPopularity),
    });
  }
  return groups;
}

/** Hero-Kandidat: früheste zukünftige Premiere, sonst populärster Neustart. */
export function pickHero(entries: DecoratedAnime[], now: Date): DecoratedAnime | null {
  const future = entries
    .filter((entry) => {
      const date = fullStartDate(entry.anime);
      return !!date && date.getTime() > now.getTime();
    })
    .sort(
      (a, b) =>
        (fullStartDate(a.anime)?.getTime() ?? 0) - (fullStartDate(b.anime)?.getTime() ?? 0) ||
        (b.anime.popularity ?? 0) - (a.anime.popularity ?? 0)
    );
  if (future.length) return future[0];

  const running = entries.filter((entry) => entry.anime.status === 'RELEASING');
  if (!running.length) return null;
  return running.reduce((best, entry) =>
    (entry.anime.popularity ?? 0) > (best.anime.popularity ?? 0) ? entry : best
  );
}

/** Provider-Logos aus dem eigenen Series-Objekt — dieselbe Normalisierung
 *  (normalizeProviderName) wie Detail-Seiten/Home, dedupliziert. */
export function seriesProviders(series: Series): TmdbProviderInfo[] {
  const list = series.provider?.provider;
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const result: TmdbProviderInfo[] = [];
  for (const entry of list) {
    if (!entry?.name) continue;
    const normalized = normalizeProviderName(entry.name);
    if (!normalized || seen.has(normalized)) continue;
    const logo = tmdbLogoUrl(entry.logo, 'w92');
    if (!logo) continue;
    seen.add(normalized);
    result.push({ name: normalized, logo });
  }
  return result;
}

/** Studios eines AniList-Eintrags (alle Nodes, leere raus). */
export function animeStudios(anime: SeasonAnime): string[] {
  return (anime.studios?.nodes ?? []).map((n) => n?.name).filter((n): n is string => !!n);
}
