/**
 * Export der Watch-Daten als portables TV-Rank-JSON (re-importierbar, Backup)
 * und generisches CSV (TMDB-Ids → von Trakt-Tools u. ä. konsumierbar).
 * Pure Builder — I/O (Download) macht services/export.
 */
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';
import { normalizeSeasons, normalizeEpisodes, isEpisodeWatched } from '../episode/seriesMetrics';
import { calculateOverallRating } from '../rating/rating';

export interface ExportEpisode {
  season: number;
  episode: number;
  /** Katalog-Episoden-Id (TVMaze/TMDB) — Schlüssel im compact-Watch-Format. */
  episodeId: number;
  title?: string;
  firstWatchedAt?: string;
  lastWatchedAt?: string;
  watchCount: number;
}

export interface ExportSeries {
  tmdbId: number;
  title: string;
  watchlist?: boolean;
  episodes: ExportEpisode[];
}

export interface ExportMovie {
  tmdbId: number;
  title: string;
  watched: boolean;
  watchedAt?: string;
  rating?: number;
  watchlist?: boolean;
}

export interface TvRankExport {
  format: 'tvrank';
  version: 1;
  exportedAt: string;
  series: ExportSeries[];
  movies: ExportMovie[];
}

export function buildExportData(seriesList: Series[], movieList: Movie[]): TvRankExport {
  const series: ExportSeries[] = [];
  for (const s of seriesList) {
    const episodes: ExportEpisode[] = [];
    for (const season of normalizeSeasons(s.seasons)) {
      const seasonNumber = (season.seasonNumber ?? 0) + 1;
      normalizeEpisodes(season.episodes).forEach((ep, idx) => {
        if (!isEpisodeWatched(ep)) return;
        episodes.push({
          season: seasonNumber,
          episode: ep.episode_number ?? idx + 1,
          episodeId: ep.id,
          ...(ep.name && { title: ep.name }),
          ...(ep.firstWatchedAt && { firstWatchedAt: ep.firstWatchedAt }),
          ...(ep.lastWatchedAt && { lastWatchedAt: ep.lastWatchedAt }),
          watchCount: Math.max(1, ep.watchCount ?? 1),
        });
      });
    }
    if (episodes.length === 0 && !s.watchlist) continue;
    series.push({
      tmdbId: s.id,
      title: s.title || '',
      ...(s.watchlist && { watchlist: true }),
      episodes,
    });
  }

  const movies: ExportMovie[] = [];
  for (const m of movieList) {
    const overall = parseFloat(calculateOverallRating(m));
    const watched = m.watched === true || overall > 0;
    if (!watched && !m.watchlist) continue;
    movies.push({
      tmdbId: m.id,
      title: m.title || '',
      watched,
      ...(m.watchedAt && { watchedAt: m.watchedAt }),
      ...(overall > 0 && { rating: overall }),
      ...(m.watchlist && { watchlist: true }),
    });
  }

  return {
    format: 'tvrank',
    version: 1,
    exportedAt: new Date().toISOString(),
    series,
    movies,
  };
}

const csvEscape = (value: string | number | undefined): string => {
  const str = value == null ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

/** Eine Zeile pro gesehener Episode bzw. Film — generisch weiterverarbeitbar. */
export function buildWatchCsv(data: TvRankExport): string {
  const rows: string[] = [
    'type,tmdbId,title,season,episode,episodeTitle,watchCount,firstWatchedAt,lastWatchedAt,rating',
  ];
  for (const s of data.series) {
    for (const ep of s.episodes) {
      rows.push(
        [
          'episode',
          s.tmdbId,
          csvEscape(s.title),
          ep.season,
          ep.episode,
          csvEscape(ep.title),
          ep.watchCount,
          csvEscape(ep.firstWatchedAt),
          csvEscape(ep.lastWatchedAt),
          '',
        ].join(',')
      );
    }
  }
  for (const m of data.movies) {
    if (!m.watched) continue;
    rows.push(
      [
        'movie',
        m.tmdbId,
        csvEscape(m.title),
        '',
        '',
        '',
        1,
        csvEscape(m.watchedAt),
        '',
        m.rating ?? '',
      ].join(',')
    );
  }
  return rows.join('\n');
}
