import {
  FilterList,
  NewReleases,
  PlaylistAdd,
  Schedule,
  Star,
  Bookmark,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { useEffect, useState } from 'react';
import { genreMenuItems, providerMenuItems } from '../../config/menuItems';
import { SearchInput } from './SearchInput';
import { BottomSheet } from './BottomSheet';
import { GradientText } from './GradientText';

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
  hasBottomNav?: boolean; // Optional prop to adjust FAB position
  initialFilters?: {
    genre?: string;
    provider?: string;
    quickFilter?: string;
    search?: string;
    sortBy?: string;
  };
}

const seriesQuickFilters = [
  { value: 'unrated', label: 'Ohne Bewertung', icon: Star },
  { value: 'new-episodes', label: 'Neue Episoden', icon: NewReleases },
  { value: 'started', label: 'Begonnen', icon: Schedule },
  { value: 'recently-added', label: 'Zuletzt Hinzugefügt', icon: PlaylistAdd },
];

const movieQuickFilters = [
  { value: 'unrated', label: 'Ohne Bewertung', icon: Star },
  { value: 'unreleased', label: 'Unveröffentlicht', icon: Schedule },
  { value: 'recently-added', label: 'Zuletzt Hinzugefügt', icon: PlaylistAdd },
];

const ratingsQuickFilters = [
  { value: 'watchlist', label: 'Watchlist', icon: Bookmark },
  { value: 'unrated', label: 'Ohne Bewertung', icon: Star },
  { value: 'started', label: 'Begonnen', icon: Schedule },
  { value: 'not-started', label: 'Noch nicht begonnen', icon: Schedule },
  { value: 'ongoing', label: 'Fortlaufend', icon: Schedule },
  { value: 'recently-added', label: 'Zuletzt Hinzugefügt', icon: PlaylistAdd },
];

export const QuickFilter: React.FC<QuickFilterProps> = ({
  onFilterChange,
  isMovieMode = false,
  isRatingsMode = false,
  hasBottomNav = true, // Default to true for most pages
  initialFilters = {},
}) => {
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
  }, [
    selectedGenre,
    selectedProvider,
    selectedQuickFilter,
    searchQuery,
    selectedSort,
    onFilterChange,
  ]);

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
            bottom: hasBottomNav ? '120px' : '30px', // Adjust based on navbar presence
            right: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            borderRadius: '50%',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
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
                background: '#ff4757',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              {activeFiltersCount}
            </span>
          )}
        </button>
      </Tooltip>

      {/* Filter Panel */}
      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        bottomOffset={hasBottomNav ? '83px' : '0px'}
      >
        <div
          style={{
            width: '90%',
            alignSelf: 'center',
            paddingBottom: '24px',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <GradientText
              as="h2"
              from="#667eea"
              to="#764ba2"
              style={{
                fontSize: '20px',
                fontWeight: 700,
                margin: 0,
              }}
            >
              Filter & Sortierung
            </GradientText>

            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                style={{
                  background: 'rgba(255, 71, 87, 0.1)',
                  border: '1px solid rgba(255, 71, 87, 0.3)',
                  borderRadius: '20px',
                  padding: '6px 12px',
                  color: '#ff4757',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Zurücksetzen
              </button>
            )}
          </div>

          {/* Search */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.7)',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              Suche
            </label>
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`${isMovieMode ? 'Film' : 'Serie'} suchen...`}
            />
          </div>

          {/* Quick Filters */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.7)',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              Schnellfilter
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
              }}
            >
              {quickFilters.map((filter) => {
                const Icon = filter.icon;
                const isActive = selectedQuickFilter === filter.value;

                return (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedQuickFilter(isActive ? '' : filter.value)}
                    style={{
                      padding: '12px',
                      background: isActive
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isActive ? 'transparent' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '13px',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon style={{ fontSize: '16px' }} />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort Options - Only for Ratings Mode */}
          {isRatingsMode && (
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'block',
                  marginBottom: '12px',
                }}
              >
                Sortierung
              </label>
              <select
                value={selectedSort}
                onChange={(e) => setSelectedSort(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '14px',
                }}
              >
                <option
                  value="rating-desc"
                  style={{
                    background: 'var(--color-background-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Beste zuerst
                </option>
                <option
                  value="rating-asc"
                  style={{
                    background: 'var(--color-background-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Schlechteste zuerst
                </option>
                <option
                  value="name-asc"
                  style={{
                    background: 'var(--color-background-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Name A-Z
                </option>
                <option
                  value="name-desc"
                  style={{
                    background: 'var(--color-background-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Name Z-A
                </option>
                <option
                  value="date-desc"
                  style={{
                    background: 'var(--color-background-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Neueste zuerst
                </option>
              </select>
            </div>
          )}

          {/* Genre Filter */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.7)',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              Genre
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
            >
              {genreMenuItems.map((genre) => {
                const isActive = selectedGenre === genre.value;

                return (
                  <button
                    key={genre.value}
                    onClick={() => setSelectedGenre(isActive ? '' : genre.value)}
                    style={{
                      padding: '10px',
                      background: isActive
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: `1px solid ${isActive ? 'transparent' : 'rgba(255, 255, 255, 0.1)'}`,
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {genre.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider Filter */}
          <div>
            <label
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'rgba(255, 255, 255, 0.7)',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              Streaming-Anbieter
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
              }}
            >
              {providerMenuItems.map((provider) => {
                const isActive = selectedProvider === provider.value;

                return (
                  <Tooltip key={provider.value} title={provider.label} arrow>
                    <button
                      onClick={() => setSelectedProvider(isActive ? '' : provider.value)}
                      style={{
                        padding: '12px',
                        background: isActive
                          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          : 'rgba(255, 255, 255, 0.05)',
                        border: `1px solid ${isActive ? 'transparent' : 'rgba(255, 255, 255, 0.1)'}`,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {(provider as { icon?: string }).icon ? (
                        <img
                          src={(provider as { icon?: string }).icon}
                          alt={provider.label}
                          style={{
                            width: '24px',
                            height: '24px',
                            objectFit: 'contain',
                            filter: isActive ? 'brightness(1.2)' : 'none',
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'white',
                            textAlign: 'center',
                            lineHeight: '1.2',
                          }}
                        >
                          {provider.label}
                        </span>
                      )}
                    </button>
                  </Tooltip>
                );
              })}
            </div>
          </div>
        </div>
      </BottomSheet>
    </>
  );
};
