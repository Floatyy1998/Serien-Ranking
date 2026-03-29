/**
 * Analytics module - lightweight tracking.
 *
 * Only essential events are stored via Firebase RTDB (whitelist in analyticsService).
 * Events: page_view, login, logout, sign_up, series/movie added/deleted, episode watched/unwatched, rating saved/deleted.
 */
import { analyticsService } from '../services/analyticsService';

// ─── Consent & Init ──────────────────────────────────────────────────────

const CONSENT_KEY = 'analytics-consent';

export function getAnalyticsConsent(): boolean | null {
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === null) return null;
  return value === 'true';
}

export function setAnalyticsConsent(accepted: boolean) {
  analyticsService.setEnabled(accepted);
}

export function initAnalyticsIfConsented() {
  analyticsService.init();
}

export function logPageView(pageName: string) {
  analyticsService.track('page_view', { page: pageName });
  analyticsService.updateCurrentPage(pageName);
}

export function setAnalyticsUser(uid: string | null) {
  analyticsService.setUser(uid);
}

// ─── Essential events (actually tracked) ─────────────────────────────────

// Auth
export const trackLogin = (method: string) => analyticsService.track('login', { method });
export const trackRegister = (method: string) => analyticsService.track('sign_up', { method });
export const trackLogout = () => analyticsService.track('logout');

// Series & Movies
export const trackSeriesAdded = (id: string, name: string, source: string) =>
  analyticsService.track('series_added', { series_id: id, series_name: name, source });
export const trackSeriesDeleted = (id: string, name: string) =>
  analyticsService.track('series_deleted', { series_id: id, series_name: name });
export const trackMovieAdded = (id: string, name: string, source: string) =>
  analyticsService.track('movie_added', { movie_id: id, movie_name: name, source });
export const trackMovieDeleted = (id: string, name: string) =>
  analyticsService.track('movie_deleted', { movie_id: id, movie_name: name });

// Episodes
export const trackEpisodeWatched = (
  seriesName: string,
  season: number,
  episode: number,
  extra?: {
    tmdbId?: string | number;
    genres?: string[];
    runtime?: number;
    isRewatch?: boolean;
    source?: string;
  }
) => {
  const now = new Date();
  analyticsService.track('episode_watched', {
    series_name: seriesName,
    season: String(season),
    episode: String(episode),
    hour: String(now.getHours()),
    day_of_week: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()],
    tmdb_id: extra?.tmdbId ? String(extra.tmdbId) : '',
    genres: extra?.genres?.join(',') || '',
    runtime_min: extra?.runtime ? String(Math.round(extra.runtime)) : '',
    is_rewatch: String(!!extra?.isRewatch),
    source: extra?.source || 'app',
  });
};
export const trackEpisodeUnwatched = (seriesName: string, season: number, episode: number) =>
  analyticsService.track('episode_unwatched', { series_name: seriesName, season, episode });

// Ratings
export const trackRatingSaved = (id: string, type: string, rating: number) =>
  analyticsService.track('rating_saved', { item_id: id, item_type: type, rating });
export const trackRatingDeleted = (id: string, type: string) =>
  analyticsService.track('rating_deleted', { item_id: id, item_type: type });
