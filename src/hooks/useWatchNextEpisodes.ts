import { useMemo } from 'react';
import { Series } from '../types/Series';
import { getNextRewatchEpisode, hasActiveRewatch } from '../lib/validation/rewatch.utils';
import { getImageUrl } from '../utils/imageUrl';

export interface NextEpisode {
  seriesId: number;
  seriesTitle: string;
  poster: string;
  seasonIndex: number;
  episodeIndex: number;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate?: string;
  runtime?: number;
  isRewatch?: boolean;
  currentWatchCount?: number;
  targetWatchCount?: number;
}

export const useWatchNextEpisodes = (
  seriesList: Series[],
  filterInput: string,
  showRewatches: boolean,
  sortOption: string,
  customOrderActive: boolean,
  watchlistOrder: number[]
): NextEpisode[] => {
  return useMemo(() => {
    const episodes: NextEpisode[] = [];
    const rewatches: NextEpisode[] = [];
    const today = new Date();

    // All series in watchlist
    const seriesInWatchlist = seriesList.filter((series) => {
      if (!series.watchlist) return false; // MUST be in watchlist
      // Check if seasons exists and has content
      if (!series.seasons) return false;
      // Handle both array and object formats
      const seasonsArray = Array.isArray(series.seasons)
        ? series.seasons
        : Object.values(series.seasons);
      if (!seasonsArray.length) return false;
      return true;
    });

    seriesInWatchlist.forEach((series: Series) => {
      // Apply filter if set
      if (filterInput) {
        const searchTerm = filterInput.toLowerCase();
        if (!series.title?.toLowerCase().includes(searchTerm)) {
          return;
        }
      }

      // Convert seasons to array if needed
      const seasonsArray: typeof series.seasons = Array.isArray(series.seasons)
        ? series.seasons
        : (Object.values(series.seasons) as typeof series.seasons);

      // If showing rewatches, ONLY show series with active rewatches
      if (showRewatches) {
        if (hasActiveRewatch(series)) {
          const rewatchEpisode = getNextRewatchEpisode(series);
          if (rewatchEpisode) {
            // Find the correct season index based on seasonNumber
            const seasonIndex = seasonsArray.findIndex(
              (s) => s.seasonNumber === rewatchEpisode.seasonNumber
            );
            if (seasonIndex !== -1) {
              const ep = seasonsArray[seasonIndex]?.episodes?.[rewatchEpisode.episodeIndex];
              rewatches.push({
                seriesId: series.id,
                seriesTitle: series.title,
                poster: getImageUrl(series.poster),
                seasonIndex: seasonIndex,
                episodeIndex: rewatchEpisode.episodeIndex,
                seasonNumber: rewatchEpisode.seasonNumber,
                episodeNumber: rewatchEpisode.episodeIndex + 1,
                episodeName: rewatchEpisode.name || `Episode ${rewatchEpisode.episodeIndex + 1}`,
                airDate: rewatchEpisode.air_date,
                runtime: ep?.runtime || series.episodeRuntime || 45,
                isRewatch: true,
                currentWatchCount: rewatchEpisode.currentWatchCount,
                targetWatchCount: rewatchEpisode.targetWatchCount,
              });
            }
          }
        }
      } else {
        // Normal mode: show next unwatched episodes
        let foundUnwatched = false;

        // Find first unwatched episode that has already aired
        for (const [seasonIndex, season] of seasonsArray.entries()) {
          const episodesList: typeof season.episodes = Array.isArray(season.episodes)
            ? season.episodes
            : season.episodes
              ? (Object.values(season.episodes) as typeof season.episodes)
              : [];

          if (!episodesList.length) continue;

          for (const [episodeIndex, episode] of episodesList.entries()) {
            if (episode.watched) continue;

            // Check if episode has aired
            if (!episode.air_date) continue; // Skip episodes without air date
            const airDate = new Date(episode.air_date);
            if (airDate > today) continue; // Skip future episodes
            episodes.push({
              seriesId: series.id,
              seriesTitle: series.title,
              poster: getImageUrl(series.poster),
              seasonIndex,
              episodeIndex,
              seasonNumber: season.seasonNumber,
              episodeNumber: episodeIndex + 1,
              episodeName: episode.name || `Episode ${episodeIndex + 1}`,
              airDate: episode.air_date,
              runtime: episode.runtime || series.episodeRuntime || 45,
            });
            foundUnwatched = true;
            break; // Only first unwatched per series
          }

          if (foundUnwatched) break;
        }
      }
    });

    // Return only the appropriate episodes based on mode
    const sortedEpisodes = showRewatches ? rewatches : episodes;

    if (!customOrderActive) {
      const [field, order] = sortOption.split('-');
      const orderMultiplier = order === 'asc' ? 1 : -1;

      sortedEpisodes.sort((a, b) => {
        if (field === 'name') {
          return a.seriesTitle.localeCompare(b.seriesTitle) * orderMultiplier;
        } else if (field === 'date') {
          if (a.airDate && b.airDate) {
            return (
              (new Date(a.airDate).getTime() - new Date(b.airDate).getTime()) * orderMultiplier
            );
          }
          return 0;
        }
        return 0;
      });
    } else if (watchlistOrder.length > 0) {
      // Apply custom order
      sortedEpisodes.sort((a, b) => {
        const indexA = watchlistOrder.indexOf(a.seriesId);
        const indexB = watchlistOrder.indexOf(b.seriesId);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    return sortedEpisodes;
  }, [seriesList, filterInput, showRewatches, sortOption, customOrderActive, watchlistOrder]);
};
