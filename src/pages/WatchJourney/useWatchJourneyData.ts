import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../App';
import {
  calculateMultiYearTrends,
  calculateWatchJourney,
  MultiYearTrendsData,
  WatchJourneyData,
} from '../../services/watchJourneyService';
import { TabType } from './types';

// Available years (from current year down to 2026)
const getAvailableYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= 2026; y--) {
    years.push(y);
  }
  return years;
};

const VALID_TABS: TabType[] = [
  'genre',
  'provider',
  'heatmap',
  'activity',
  'trends',
  'serien',
  'insights',
];

export interface UseWatchJourneyDataResult {
  loading: boolean;
  data: WatchJourneyData | null;
  trendsData: MultiYearTrendsData | null;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  showYearPicker: boolean;
  setShowYearPicker: (show: boolean) => void;
  toggleYearPicker: () => void;
  selectYear: (year: number) => void;
  chartWidth: number;
  availableYears: number[];
  hasData: boolean;
}

export const useWatchJourneyData = (): UseWatchJourneyDataResult => {
  const { user } = useAuth()!;
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WatchJourneyData | null>(null);
  const [trendsData, setTrendsData] = useState<MultiYearTrendsData | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const tabParam = searchParams.get('tab') as TabType;
    return tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'trends';
  });

  const [chartWidth, setChartWidth] = useState(window.innerWidth - 40);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showYearPicker, setShowYearPicker] = useState(false);

  const availableYears = getAvailableYears();

  // Load watch journey data
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [journeyData, multiYearData] = await Promise.all([
          calculateWatchJourney(user.uid, selectedYear),
          calculateMultiYearTrends(user.uid, availableYears),
        ]);
        setData(journeyData);
        setTrendsData(multiYearData);
      } catch (error) {
        console.error('Error loading watch journey:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user, selectedYear]);

  // Responsive chart width
  useEffect(() => {
    const updateWidth = () => setChartWidth(window.innerWidth - 40);
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Sync activeTab with URL parameters
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  const toggleYearPicker = () => setShowYearPicker((prev) => !prev);

  const selectYear = (year: number) => {
    setSelectedYear(year);
    setShowYearPicker(false);
  };

  const hasData = !!data && data.totalEpisodes + data.totalMovies > 0;

  return {
    loading,
    data,
    trendsData,
    activeTab,
    setActiveTab: (tab: TabType) => {
      setActiveTab(tab);
    },
    selectedYear,
    setSelectedYear,
    showYearPicker,
    setShowYearPicker,
    toggleYearPicker,
    selectYear,
    chartWidth,
    availableYears,
    hasData,
  };
};
