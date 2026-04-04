import { FilterList } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { BottomSheet } from './BottomSheet';
import { seriesQuickFilters, movieQuickFilters, ratingsQuickFilters } from './QuickFilterConstants';
import { QuickFilterPanel } from './QuickFilterPanel';

interface QuickFilterProps {
  onFilterChange: (filters: {
    genre?: string;
    provider?: string;
    quickFilter?: string;
    search?: string;
    sortBy?: string;
  }) => void;
  isMovieMode?: boolean;
  isRatingsMode?: boolean;
  hasBottomNav?: boolean;
  initialFilters?: {
    genre?: string;
    provider?: string;
    quickFilter?: string;
    search?: string;
    sortBy?: string;
  };
}

export const QuickFilter: React.FC<QuickFilterProps> = ({
  onFilterChange,
  isMovieMode = false,
  isRatingsMode = false,
  hasBottomNav = true,
  initialFilters = {},
}) => {
  const { currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialFilters.genre || '');
  const [selectedProvider, setSelectedProvider] = useState<string>(initialFilters.provider || '');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>(
    initialFilters.quickFilter || ''
  );
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedSort, setSelectedSort] = useState<string>(initialFilters.sortBy || 'rating-desc');
  const quickFilters = isRatingsMode
    ? ratingsQuickFilters
    : isMovieMode
      ? movieQuickFilters
      : seriesQuickFilters;
  const activeFiltersCount = [selectedGenre, selectedProvider, selectedQuickFilter].filter(
    Boolean
  ).length;

  // Lock body scroll when filter panel is open
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      const body = document.body;
      const documentElement = document.documentElement;

      // Store current position
      body.style.position = 'fixed';
      body.style.top = `-${scrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.overflow = 'hidden';

      // Also lock the html element on iOS
      documentElement.style.overflow = 'hidden';
      documentElement.style.height = '100%';
    } else {
      const body = document.body;
      const documentElement = document.documentElement;
      const scrollY = body.style.top;

      // Reset styles
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.overflow = '';

      documentElement.style.overflow = '';
      documentElement.style.height = '';

      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '';
    };
  }, [isOpen]);

  useEffect(() => {
    onFilterChange({
      genre: selectedGenre,
      provider: selectedProvider,
      quickFilter: selectedQuickFilter,
      search: searchQuery,
      sortBy: selectedSort,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onFilterChange is a callback, not a synced value
  }, [selectedGenre, selectedProvider, selectedQuickFilter, searchQuery, selectedSort]);

  const clearFilters = () => {
    setSelectedGenre('');
    setSelectedProvider('');
    setSelectedQuickFilter('');
    setSearchQuery('');
    setSelectedSort('rating-desc');
  };

  return (
    <>
      {/* Filter Button */}
      <Tooltip title="Filter & Sortierung" arrow>
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: hasBottomNav ? '95px' : '30px',
            right: '20px',
            background: `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.accent}cc 100%)`,
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: currentTheme.text.secondary,
            boxShadow: `0 4px 20px ${currentTheme.accent}50, 0 2px 8px rgba(0, 0, 0, 0.2)`,
            cursor: 'pointer',
            zIndex: 1000,
          }}
        >
          <FilterList />
          {activeFiltersCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: currentTheme.accent,
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 'bold',
              }}
            >
              {activeFiltersCount}
            </span>
          )}
        </button>
      </Tooltip>

      {/* Filter Panel */}
      <BottomSheet isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <QuickFilterPanel
          isMovieMode={isMovieMode}
          isRatingsMode={isRatingsMode}
          hasBottomNav={hasBottomNav}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          selectedGenre={selectedGenre}
          setSelectedGenre={setSelectedGenre}
          selectedProvider={selectedProvider}
          setSelectedProvider={setSelectedProvider}
          selectedQuickFilter={selectedQuickFilter}
          setSelectedQuickFilter={setSelectedQuickFilter}
          selectedSort={selectedSort}
          setSelectedSort={setSelectedSort}
          quickFilters={quickFilters}
          activeFiltersCount={activeFiltersCount}
          clearFilters={clearFilters}
        />
      </BottomSheet>
    </>
  );
};
