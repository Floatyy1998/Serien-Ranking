import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { genreIdMapForMovies, genreIdMapForSeries } from '../../config/menuItems';
import { useDeviceType } from '../../hooks/useDeviceType';
import type { DiscoverItem } from './discoverItemHelpers';

interface UseDiscoverFiltersResult {
  activeTab: 'series' | 'movies';
  setActiveTab: React.Dispatch<React.SetStateAction<'series' | 'movies'>>;
  activeCategory: 'trending' | 'popular' | 'top_rated' | 'upcoming' | 'recommendations';
  setActiveCategory: React.Dispatch<
    React.SetStateAction<'trending' | 'popular' | 'top_rated' | 'upcoming' | 'recommendations'>
  >;
  selectedGenre: number | null;
  setSelectedGenre: React.Dispatch<React.SetStateAction<number | null>>;
  showFilters: boolean;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  showSearch: boolean;
  setShowSearch: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  isRestoring: boolean;
  isDesktop: boolean;
  headerHeight: number;
  genres: { id: number; name: string }[];
  handleItemClick: (item: DiscoverItem) => void;
  fetchRecommendationsOnRestoreRef: React.MutableRefObject<(() => void) | null>;
  fetchFromTMDBOnRestoreRef: React.MutableRefObject<(() => void) | null>;
}

export const useDiscoverFilters = (): UseDiscoverFiltersResult => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'series' | 'movies'>('series');
  const [activeCategory, setActiveCategory] = useState<
    'trending' | 'popular' | 'top_rated' | 'upcoming' | 'recommendations'
  >('trending');
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const { isDesktop } = useDeviceType();
  const [headerHeight, setHeaderHeight] = useState(220);

  // Refs to allow fetch hooks to be called from restore logic
  const fetchRecommendationsOnRestoreRef = useRef<(() => void) | null>(null);
  const fetchFromTMDBOnRestoreRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerElement = document.querySelector('[data-header="discover-header"]');
      if (headerElement) {
        const height = headerElement.getBoundingClientRect().height;
        setHeaderHeight(height + 10);
      }
    };

    updateHeaderHeight();
    const handleResize = () => {
      updateHeaderHeight();
    };

    window.addEventListener('resize', handleResize);
    const timeoutId = setTimeout(updateHeaderHeight, 100);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [showSearch, showFilters, activeTab, activeCategory]);

  useEffect(() => {
    const isComingFromDetail = sessionStorage.getItem('comingFromDetail') === 'true';

    if (isComingFromDetail) {
      const savedState = sessionStorage.getItem('discoverFilters');
      if (savedState) {
        const filters = JSON.parse(savedState);

        // Batch state restoration via setTimeout to avoid synchronous setState in effect
        setTimeout(() => {
          setIsRestoring(true);
          setActiveTab(filters.activeTab || 'series');
          setActiveCategory(filters.activeCategory || 'trending');
          setSelectedGenre(filters.selectedGenre || null);
          setShowFilters(filters.showFilters || false);
          setSearchQuery(filters.searchQuery || '');
          setShowSearch(filters.showSearch || false);

          setTimeout(() => {
            setIsRestoring(false);
            setTimeout(() => {
              if (!filters.showSearch) {
                if (filters.activeCategory === 'recommendations') {
                  fetchRecommendationsOnRestoreRef.current?.();
                } else {
                  fetchFromTMDBOnRestoreRef.current?.();
                }
              }
            }, 100);
          }, 100);
        }, 0);
      }
      sessionStorage.removeItem('comingFromDetail');
      sessionStorage.removeItem('discoverFilters');
    }
    // Default state is already set via useState initializers, no need to reset
  }, [fetchFromTMDBOnRestoreRef, fetchRecommendationsOnRestoreRef]);

  const handleItemClick = (item: DiscoverItem) => {
    const filterState = {
      activeTab,
      activeCategory,
      selectedGenre,
      showFilters,
      searchQuery,
      showSearch,
    };
    sessionStorage.setItem('discoverFilters', JSON.stringify(filterState));
    sessionStorage.setItem('comingFromDetail', 'true');
    navigate(item.type === 'series' ? `/series/${item.id}` : `/movie/${item.id}`);
  };

  const genres = useMemo(
    () => (activeTab === 'series' ? genreIdMapForSeries : genreIdMapForMovies),
    [activeTab]
  );

  return {
    activeTab,
    setActiveTab,
    activeCategory,
    setActiveCategory,
    selectedGenre,
    setSelectedGenre,
    showFilters,
    setShowFilters,
    showSearch,
    setShowSearch,
    searchQuery,
    setSearchQuery,
    isRestoring,
    isDesktop,
    headerHeight,
    genres,
    handleItemClick,
    fetchRecommendationsOnRestoreRef,
    fetchFromTMDBOnRestoreRef,
  };
};
