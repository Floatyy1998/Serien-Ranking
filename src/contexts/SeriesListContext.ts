import { createContext, useContext } from 'react';
import type { Series } from '../types/Series';

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
  clearNewSeasons: () => void;
  clearInactiveSeries: () => void;
  clearInactiveRewatches: () => void;
  clearCompletedSeries: () => void;
  clearUnratedSeries: () => void;
  recheckForNewSeasons: () => void;
  refetchSeries: () => void;
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
  clearNewSeasons: () => {},
  clearInactiveSeries: () => {},
  clearInactiveRewatches: () => {},
  clearCompletedSeries: () => {},
  clearUnratedSeries: () => {},
  recheckForNewSeasons: () => {},
  refetchSeries: () => {},
  toggleHideSeries: async () => {},
  isOffline: false,
  isStale: false,
});

export const useSeriesList = () => useContext(SeriesListContext);
