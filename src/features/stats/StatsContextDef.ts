import { createContext, useContext } from 'react';
import type { StatsData } from '../../types/StatsData';

interface StatsContextType {
  seriesStatsData: StatsData | null;
  movieStatsData: StatsData | null;
}

export const StatsContext = createContext<StatsContextType>({
  seriesStatsData: null,
  movieStatsData: null,
});

export const useStats = () => useContext(StatsContext);
