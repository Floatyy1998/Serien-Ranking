import { createContext, useContext } from 'react';
import type { Series } from '../types/Series';
import type { ProviderChangeInfo, AnimeMangaHandoff } from './seriesListDetection';

export interface SeriesListContextType {
  seriesList: Series[];
  allSeriesList: Series[];
  hiddenSeriesList: Series[];
  loading: boolean;
  seriesWithNewSeasons: Series[];
  inactiveSeries: Series[];
  inactiveRewatches: Series[];
  completedSeries: Series[];
  unratedSeries: Series[];
  providerChanges: ProviderChangeInfo[];
  animeMangaHandoffs: AnimeMangaHandoff[];
  clearNewSeasons: () => void;
  clearInactiveSeries: () => void;
  clearInactiveRewatches: () => void;
  clearCompletedSeries: () => void;
  clearUnratedSeries: () => void;
  clearProviderChanges: () => void;
  clearAnimeMangaHandoffs: () => void;
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
  completedSeries: [],
  unratedSeries: [],
  providerChanges: [],
  animeMangaHandoffs: [],
  clearNewSeasons: () => {},
  clearInactiveSeries: () => {},
  clearInactiveRewatches: () => {},
  clearCompletedSeries: () => {},
  clearUnratedSeries: () => {},
  clearProviderChanges: () => {},
  clearAnimeMangaHandoffs: () => {},
  recheckForNewSeasons: () => {},
  refetchSeries: () => {},
  refetchAfterAdd: async () => {},
  toggleHideSeries: async () => {},
  isOffline: false,
  isStale: false,
});

export const useSeriesList = () => useContext(SeriesListContext);
