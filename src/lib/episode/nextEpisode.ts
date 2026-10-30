/**
 * nextEpisode – gemeinsame Positionslogik für „die nächste Folge".
 *
 * Bisher galt überall: nächste Folge = erste ungesehene, ausgestrahlte Folge
 * in Staffelreihenfolge. Wer nicht bei Staffel 1 anfängt (Reality-TV, Einstieg
 * bei der aktuellen Staffel), bekam deshalb dauerhaft S1E1 vorgeschlagen.
 *
 * Neue Regel: Anker ist die zuletzt gesehene Folge (jüngster Zeitstempel). Ab
 * dort geht es vorwärts zur nächsten offenen Folge; erst wenn danach nichts
 * Offenes mehr kommt, wird von vorn gesucht (Wrap auf die älteste Lücke).
 *
 * Positionen sind Array-Indizes in `series.seasons[seasonIndex].episodes[episodeIndex]`
 * – dieselben Indizes, mit denen die Watch-Daten geschrieben werden.
 */

import type { Series } from '../../types/Series';
import { hasEpisodeAired } from '../../utils/episodeDate';

type Season = Series['seasons'][number];
type Episode = Season['episodes'][number];

export interface EpisodePosition {
  seasonIndex: number;
  episodeIndex: number;
}

const watchStamp = (ep: Episode): string => ep.lastWatchedAt || ep.firstWatchedAt || '';

/**
 * Zuletzt gesehene Folge nach Zeitstempel (`lastWatchedAt`, sonst
 * `firstWatchedAt`). Bei Gleichstand – etwa nach einem Staffel-Bulk-Mark – oder
 * ohne Zeitstempel (Legacy-Rows) gewinnt die in Staffelreihenfolge spätere Folge.
 * null, wenn noch nichts gesehen wurde.
 */
export function findLastWatchedPosition(series: Series): EpisodePosition | null {
  const seasons = series.seasons;
  if (!seasons) return null;
  let best: EpisodePosition | null = null;
  let bestStamp = '';
  for (let j = 0; j < seasons.length; j++) {
    const episodes = seasons[j]?.episodes;
    if (!episodes) continue;
    for (let k = 0; k < episodes.length; k++) {
      const ep = episodes[k];
      if (!ep?.watched) continue;
      const stamp = watchStamp(ep);
      if (!best || stamp >= bestStamp) {
        best = { seasonIndex: j, episodeIndex: k };
        bestStamp = stamp;
      }
    }
  }
  return best;
}

function scanOpen(
  seasons: Series['seasons'],
  startSeason: number,
  startEpisode: number
): EpisodePosition | null {
  for (let j = startSeason; j < seasons.length; j++) {
    const episodes = seasons[j]?.episodes;
    if (!episodes) continue;
    for (let k = j === startSeason ? startEpisode : 0; k < episodes.length; k++) {
      const ep = episodes[k];
      if (ep && !ep.watched && hasEpisodeAired(ep)) return { seasonIndex: j, episodeIndex: k };
    }
  }
  return null;
}

/**
 * Nächste offene Folge (ungesehen + ausgestrahlt): ab der zuletzt gesehenen
 * Folge vorwärts, sonst von vorn. null, wenn nichts Offenes mehr da ist.
 */
export function findNextEpisodePosition(series: Series): EpisodePosition | null {
  const seasons = series.seasons;
  if (!seasons) return null;
  const anchor = findLastWatchedPosition(series);
  if (anchor) {
    const after = scanOpen(seasons, anchor.seasonIndex, anchor.episodeIndex + 1);
    if (after) return after;
  }
  return scanOpen(seasons, 0, 0);
}

/** Zeitstempel, der sicher jünger ist als jede bereits gesehene Folge. */
function stampAfter(series: Series, offsetMs: number): string {
  let latest = '';
  for (const season of series.seasons || []) {
    for (const ep of season?.episodes || []) {
      if (!ep?.watched) continue;
      const stamp = watchStamp(ep);
      if (stamp > latest) latest = stamp;
    }
  }
  const latestMs = latest ? Date.parse(latest) : 0;
  const base = Math.max(Date.now(), Number.isFinite(latestMs) ? latestMs : 0);
  return new Date(base + offsetMs).toISOString();
}

/**
 * Klont die Serie und hakt die nächsten `count` offenen Folgen ab – jede mit
 * einem Zeitstempel, der den Anker weiterwandern lässt. Damit liefert
 * {@link findNextEpisodePosition} auf dem Klon dieselbe Folge, die der echte
 * Mark-Write als nächstes treffen würde (optimistischer Binge ohne Doppel-Mark).
 */
export function advanceSeriesNextEpisodes(
  series: Series,
  count: number
): { series: Series; marked: EpisodePosition[] } {
  const marked: EpisodePosition[] = [];
  if (count <= 0 || !series.seasons) return { series, marked };
  let current = series;
  for (let i = 0; i < count; i++) {
    const pos = findNextEpisodePosition(current);
    if (!pos) break;
    const stamp = stampAfter(current, i + 1);
    const seasons = current.seasons.map((season, j) => {
      if (j !== pos.seasonIndex || !season?.episodes) return season;
      const episodes = season.episodes.map((ep, k) =>
        k === pos.episodeIndex ? { ...ep, watched: true, lastWatchedAt: stamp } : ep
      );
      return { ...season, episodes };
    });
    current = { ...current, seasons };
    marked.push(pos);
  }
  return { series: current, marked };
}
