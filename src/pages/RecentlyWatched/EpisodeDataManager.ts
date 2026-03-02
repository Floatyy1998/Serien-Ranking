/**
 * EpisodeDataManager - Intelligent episode data manager
 * Handles caching, date grouping, and episode extraction from series data.
 */
import type { Series } from '../../types/Series';

export interface WatchedEpisode {
  seriesId: number;
  seriesName: string;
  seriesPoster: string;
  seriesNmr: number;
  seasonIndex: number;
  episodeIndex: number;
  episodeName: string;
  episodeNumber: number;
  seasonNumber: number;
  firstWatchedAt: Date;
  watchCount: number;
  daysAgo: number;
  dateSource: 'firstWatched' | 'lastWatched' | 'airDate' | 'estimated';
}

export interface DateGroup {
  date: string;
  displayDate: string;
  episodes: WatchedEpisode[];
  loaded: boolean;
  loading: boolean;
}

export class EpisodeDataManager {
  private cache = new Map<string, WatchedEpisode[]>();
  private dateGroups = new Map<string, DateGroup>();

  constructor(
    private seriesList: Series[],
    private daysToShow: number,
    private searchQuery: string
  ) {
    this.initializeDateGroups();
  }

  private initializeDateGroups() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < this.daysToShow; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      const dateKey = date.toDateString();
      const displayDate = this.getDisplayDate(date, i);

      this.dateGroups.set(dateKey, {
        date: dateKey,
        displayDate,
        episodes: [],
        loaded: false,
        loading: false,
      });
    }
  }

  private getDisplayDate(date: Date, daysAgo: number): string {
    if (daysAgo === 0) return 'Heute';
    if (daysAgo === 1) return 'Gestern';
    if (daysAgo === 2) return 'Vorgestern';

    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }

  private getImageUrl(posterObj: string | { poster: string } | null | undefined): string {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  }

  async loadEpisodesForDateRange(startDate: string, endDate: string): Promise<void> {
    const cacheKey = `${startDate}-${endDate}`;

    if (this.cache.has(cacheKey)) {
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    const episodes: WatchedEpisode[] = [];

    const filteredSeries = this.searchQuery
      ? this.seriesList.filter((series) =>
          series.title?.toLowerCase().includes(this.searchQuery.toLowerCase())
        )
      : this.seriesList;

    for (const series of filteredSeries) {
      if (!series.seasons) continue;

      const seasonsArray = Array.isArray(series.seasons)
        ? series.seasons
        : Object.values(series.seasons);

      for (let seasonIdx = 0; seasonIdx < seasonsArray.length; seasonIdx++) {
        const season = seasonsArray[seasonIdx] as Series['seasons'][number];
        if (!season?.episodes) continue;

        const episodesArray = Array.isArray(season.episodes)
          ? season.episodes
          : Object.values(season.episodes);

        for (let episodeIndex = 0; episodeIndex < episodesArray.length; episodeIndex++) {
          const episode = episodesArray[
            episodeIndex
          ] as Series['seasons'][number]['episodes'][number];

          const isWatched = !!(
            episode?.watched === true ||
            (episode?.watched as unknown) === 1 ||
            (episode?.watched as unknown) === 'true' ||
            (episode?.watchCount && episode.watchCount > 0) ||
            episode?.firstWatchedAt ||
            episode?.lastWatchedAt
          );

          if (!isWatched) continue;

          let watchedDate: Date;
          let dateSource: 'firstWatched' | 'lastWatched' | 'airDate' | 'estimated';

          if (episode.firstWatchedAt) {
            watchedDate = new Date(episode.firstWatchedAt);
            dateSource = 'firstWatched';
          } else if (episode.lastWatchedAt) {
            watchedDate = new Date(episode.lastWatchedAt);
            dateSource = 'lastWatched';
          } else if (episode.air_date) {
            watchedDate = new Date(episode.air_date);
            dateSource = 'airDate';
          } else {
            watchedDate = new Date();
            const estimatedDaysAgo =
              seasonIdx * 20 + episodeIndex * 2 + Math.floor(Math.random() * 7);
            watchedDate.setDate(watchedDate.getDate() - estimatedDaysAgo);
            dateSource = 'estimated';
          }

          if (isNaN(watchedDate.getTime())) continue;
          watchedDate.setHours(0, 0, 0, 0);

          const watchedTime = watchedDate.getTime();
          const startTime = start.getTime();
          const endTime = end.getTime();

          if (watchedTime >= startTime && watchedTime <= endTime) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const daysAgo = Math.floor(
              (today.getTime() - watchedDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            episodes.push({
              seriesId: series.id,
              seriesName: series.title || '',
              seriesPoster: this.getImageUrl(series.poster),
              seriesNmr: series.nmr,
              seasonIndex: seasonIdx,
              episodeIndex,
              episodeName: episode.name || `Episode ${episodeIndex + 1}`,
              episodeNumber: episodeIndex + 1,
              seasonNumber: (season.seasonNumber ?? seasonIdx) + 1,
              firstWatchedAt: watchedDate,
              watchCount: episode.watchCount || 1,
              daysAgo,
              dateSource,
            });
          }
        }
      }
    }

    episodes.sort((a, b) => b.firstWatchedAt.getTime() - a.firstWatchedAt.getTime());
    this.cache.set(cacheKey, episodes);

    for (const episode of episodes) {
      const dateKey = episode.firstWatchedAt.toDateString();
      let group = this.dateGroups.get(dateKey);

      if (!group) {
        const date = new Date(episode.firstWatchedAt);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const daysAgo = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        const displayDate = this.getDisplayDate(date, daysAgo);

        group = {
          date: dateKey,
          displayDate,
          episodes: [],
          loaded: true,
          loading: false,
        };
        this.dateGroups.set(dateKey, group);
      }

      group.episodes.push(episode);
    }
  }

  getEpisodesForDate(dateKey: string): WatchedEpisode[] {
    const group = this.dateGroups.get(dateKey);
    return group?.episodes || [];
  }

  getDateGroups(): DateGroup[] {
    return Array.from(this.dateGroups.values());
  }

  markDateGroupLoaded(dateKey: string) {
    const group = this.dateGroups.get(dateKey);
    if (group) {
      group.loaded = true;
      group.loading = false;
    }
  }

  markDateGroupLoading(dateKey: string) {
    const group = this.dateGroups.get(dateKey);
    if (group) {
      group.loading = true;
    }
  }

  clearCache() {
    this.cache.clear();
    this.dateGroups.clear();
  }
}
