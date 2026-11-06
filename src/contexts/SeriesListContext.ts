import { createContext, useContext } from 'react';
import type { Series } from '../types/Series';
import type { ProviderChangeInfo, AnimeMangaHandoff } from './seriesListDetection';

export type SeriesNotificationList = 'new-season' | 'inactive' | 'inactive-rewatch' | 'unrated';

export interface SeriesListContextType {
  seriesList: Series[];
  allSeriesList: Series[];
  hiddenSeriesList: Series[];
  loading: boolean;
  seriesWithNewSeasons: Series[];
  inactiveSeries: Series[];
  inactiveRewatches: Series[];
  unratedSeries: Series[];
  providerChanges: ProviderChangeInfo[];
  hiddenProviderChanges: ProviderChangeInfo[];
  animeMangaHandoffs: AnimeMangaHandoff[];
  clearNewSeasons: () => void;
  clearInactiveSeries: () => void;
  clearInactiveRewatches: () => void;
  clearUnratedSeries: () => void;
  clearProviderChanges: () => void;
  clearHiddenProviderChanges: () => void;
  clearAnimeMangaHandoffs: () => void;
  resolveSeriesNotification: (lists: SeriesNotificationList[], seriesId: number) => void;
  recheckForNewSeasons: () => void;
  refetchSeries: () => void;
  refetchAfterAdd: (newSeriesId?: number | string) => Promise<void>;
  toggleHideSeries: (nmr: number, hidden: boolean) => Promise<void>;
  isOffline: boolean;
  isStale: boolean;
  // Test functions for development
  simulateNewSeason?: (seriesId: number) => void;
  forceDetection?: () => void;
}

export const SeriesListContext = createContext<SeriesListContextType>({
  seriesList: [],
  allSeriesList: [],
  hiddenSeriesList: [],
  loading: true,
  seriesWithNewSeasons: [],
  inactiveSeries: [],
  inactiveRewatches: [],
  unratedSeries: [],
  providerChanges: [],
  hiddenProviderChanges: [],
  animeMangaHandoffs: [],
  clearNewSeasons: () => {},
  clearInactiveSeries: () => {},
  clearInactiveRewatches: () => {},
  clearUnratedSeries: () => {},
  clearProviderChanges: () => {},
  clearHiddenProviderChanges: () => {},
  clearAnimeMangaHandoffs: () => {},
  resolveSeriesNotification: () => {},
  recheckForNewSeasons: () => {},
  refetchSeries: () => {},
  refetchAfterAdd: async () => {},
  toggleHideSeries: async () => {},
  isOffline: false,
  isStale: false,
});

export const useSeriesList = () => useContext(SeriesListContext);
