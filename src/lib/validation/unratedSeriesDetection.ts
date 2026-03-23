import firebase from 'firebase/compat/app';
import { Series } from '../../types/Series';
import { normalizeSeasons, normalizeEpisodes } from '../episode/seriesMetrics';
import { calculateOverallRating } from '../rating/rating';
import { hasEpisodeAired } from '../../utils/episodeDate';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Finds the last fully-aired season where all episodes have been watched.
 * Returns the season number (1-based) or null.
 */
function getLastCompletedAiredSeason(series: Series): number | null {
  const seasons = normalizeSeasons(series.seasons);
  let lastCompleted: number | null = null;

  for (const season of seasons) {
    const eps = normalizeEpisodes(season.episodes);
    if (eps.length === 0) continue;

    const allAired = eps.every((ep) => hasEpisodeAired(ep));
    if (!allAired) continue;

    const allWatched = eps.every((ep) => ep.watched);
    if (!allWatched) continue;

    const seasonNum = (season.seasonNumber ?? 0) + 1;
    if (lastCompleted === null || seasonNum > lastCompleted) {
      lastCompleted = seasonNum;
    }
  }

  return lastCompleted;
}

/**
 * Gets the timestamp when the last episode of a season was watched.
 */
function getSeasonCompletionDate(series: Series, seasonNum: number): number | null {
  const seasons = normalizeSeasons(series.seasons);
  const season = seasons.find((s) => (s.seasonNumber ?? 0) + 1 === seasonNum);
  if (!season) return null;

  const eps = normalizeEpisodes(season.episodes);
  let latest = 0;

  for (const ep of eps) {
    const ts = ep.lastWatchedAt || ep.firstWatchedAt || '';
    if (ts) {
      const d = new Date(ts).getTime();
      if (d > latest) latest = d;
    }
  }

  return latest > 0 ? latest : null;
}

function isSeriesRated(series: Series): boolean {
  const rating = calculateOverallRating(series);
  return parseFloat(rating) > 0;
}

/**
 * Returns true if the series has a season that is currently airing
 * (some episodes aired, some not yet).
 */
function hasCurrentlyAiringSeason(series: Series): boolean {
  const seasons = normalizeSeasons(series.seasons);
  for (const season of seasons) {
    const eps = normalizeEpisodes(season.episodes);
    if (eps.length === 0) continue;
    const someAired = eps.some((ep) => hasEpisodeAired(ep));
    const allAired = eps.every((ep) => hasEpisodeAired(ep));
    if (someAired && !allAired) return true;
  }
  return false;
}

/**
 * Detects series where the user completed watching a fully-aired season
 * at least 7 days ago but hasn't rated the series yet.
 * Skips series that currently have a season airing.
 */
export async function detectUnratedSeries(seriesList: Series[], userId: string): Promise<Series[]> {
  const now = Date.now();
  const dismissedRef = firebase.database().ref(`users/${userId}/unratedSeriesNotifications`);
  const dismissedSnap = await dismissedRef.once('value');
  const dismissed = dismissedSnap.val() || {};

  const unrated: Series[] = [];

  for (const series of seriesList) {
    if (isSeriesRated(series)) continue;

    // Skip if a season is currently airing
    if (hasCurrentlyAiringSeason(series)) continue;

    // Skip dismissed (with 30-day cooldown)
    const seriesKey = String(series.id ?? series.nmr);
    const dismissEntry = dismissed[seriesKey];
    if (dismissEntry?.dismissed) {
      const dismissedAt = dismissEntry.timestamp || 0;
      if (now - dismissedAt < SEVEN_DAYS_MS) continue;
    }

    const lastCompletedSeason = getLastCompletedAiredSeason(series);
    if (!lastCompletedSeason) continue;

    // Skip if there are MORE aired seasons after the last completed one
    // (user is likely still watching the series)
    const airedSeasons = normalizeSeasons(series.seasons).filter((s) => {
      const eps = normalizeEpisodes(s.episodes);
      return eps.length > 0 && eps.every((ep) => hasEpisodeAired(ep));
    });
    const totalAiredSeasons = airedSeasons.length;
    if (lastCompletedSeason < totalAiredSeasons) continue;

    const completionDate = getSeasonCompletionDate(series, lastCompletedSeason);
    if (!completionDate) continue;

    const daysSinceCompletion = now - completionDate;
    if (daysSinceCompletion >= SEVEN_DAYS_MS) {
      unrated.push(series);
    }
  }

  return unrated;
}
