import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { genreIdMapForMovies, genreIdMapForSeries } from '../../config/menuItems';
import type { DiscoverItem } from './DiscoverItemCard';

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
  fetchRecommendationsOnRestore: React.MutableRefObject<(() => void) | null>;
  fetchFromTMDBOnRestore: React.MutableRefObject<(() => void) | null>;
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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [headerHeight, setHeaderHeight] = useState(220);

  // Refs to allow fetch hooks to be called from restore logic
  const fetchRecommendationsOnRestore = { current: null } as React.MutableRefObject<
    (() => void) | null
  >;
  const fetchFromTMDBOnRestore = { current: null } as React.MutableRefObject<(() => void) | null>;

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
      setIsDesktop(window.innerWidth >= 768);
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
        setIsRestoring(true);
        const filters = JSON.parse(savedState);
        setActiveTab(filters.activeTab || 'series');
        setActiveCategory(filters.activeCategory || 'trending');
        setSelectedGenre(filters.selectedGenre || null);
        setShowFilters(filters.showFilters || false);
        setSearchQuery(filters.searchQuery || '');
        setShowSearch(filters.showSearch || false);

        setTimeout(() => {
          setIsRestoring(false);
          setTimeout(() => {
            if (!showSearch) {
              if (filters.activeCategory === 'recommendations') {
                fetchRecommendationsOnRestore.current?.();
              } else {
                fetchFromTMDBOnRestore.current?.();
              }
            }
          }, 100);
        }, 100);
      }
      sessionStorage.removeItem('comingFromDetail');
      sessionStorage.removeItem('discoverFilters');
    } else {
      setActiveTab('series');
      setActiveCategory('trending');
      setSelectedGenre(null);
      setShowFilters(false);
      setSearchQuery('');
      setShowSearch(false);
    }
  }, []);

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
    fetchRecommendationsOnRestore,
    fetchFromTMDBOnRestore,
  };
};
