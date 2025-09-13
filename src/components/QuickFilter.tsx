import { FilterList, NewReleases, PlaylistAdd, Schedule, Star, Bookmark } from '@mui/icons-material';
import { AnimatePresence, motion, useDragControls } from 'framer-motion';
import { useEffect, useState } from 'react';
import { genreMenuItems, providerMenuItems } from '../config/menuItems';

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
  { value: 'best-rated', label: 'Beste Bewertungen', icon: Star },
  { value: 'recently-rated', label: 'Zuletzt Bewertet', icon: Schedule },
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
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>(initialFilters.quickFilter || '');
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [selectedSort, setSelectedSort] = useState<string>(initialFilters.sortBy || 'rating-desc');
  const dragControls = useDragControls();

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

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 9998,
              }}
            />

            {/* Panel Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              drag="y"
              dragControls={dragControls}
              dragConstraints={{ top: 0 }}
              dragElastic={0.1}
              dragListener={false}
              onDragEnd={(_e, info) => {
                // Close if dragged down more than 50px or with velocity
                if (info.offset.y > 50 || info.velocity.y > 300) {
                  setIsOpen(false);
                }
              }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--color-background-elevated, #1a1a1a)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                maxHeight: hasBottomNav ? 'calc(80vh - 60px)' : '80vh',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 9999,
              }}
              onClick={(e) => e.stopPropagation()}
              onScroll={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {/* Drag Handle - Only this area triggers drag */}
              <div
                onPointerDown={(e) => dragControls.start(e)}
                style={{
                  paddingTop: '12px',
                  paddingBottom: '8px',
                  display: 'flex',
                  justifyContent: 'center',
                  cursor: 'grab',
                  touchAction: 'none',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '5px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    pointerEvents: 'none',
                  }}
                />
              </div>

              {/* Panel Scrollable Content */}
              <div
                style={{
                  padding: '24px',
                  paddingTop: '0',
                  paddingBottom: hasBottomNav
                    ? 'calc(60px + 24px + env(safe-area-inset-bottom))'
                    : 'calc(24px + env(safe-area-inset-bottom))',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  WebkitOverflowScrolling: 'touch',
                  flex: 1,
                  overscrollBehavior: 'contain',
                  touchAction: 'pan-y',
                }}
                onScroll={(e) => {
                  e.stopPropagation();
                  // Prevent parent scroll when at boundaries
                  const target = e.currentTarget;
                  if (target.scrollTop === 0 && (e as any).deltaY < 0) {
                    e.preventDefault();
                  }
                  if (
                    target.scrollTop + target.clientHeight >= target.scrollHeight &&
                    (e as any).deltaY > 0
                  ) {
                    e.preventDefault();
                  }
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
                  <h2
                    style={{
                      fontSize: '20px',
                      fontWeight: 700,
                      margin: 0,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Filter & Sortierung
                  </h2>

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
                  <input
                    type="text"
                    placeholder={`${isMovieMode ? 'Film' : 'Serie'} suchen...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '14px',
                    }}
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
                        <button
                          key={provider.value}
                          onClick={() => setSelectedProvider(isActive ? '' : provider.value)}
                          title={provider.label}
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
                          {(provider as any)?.icon ? (
                            <img
                              src={(provider as any).icon}
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
                                fontSize: '8px',
                                fontWeight: 600,
                                color: 'white',
                                textAlign: 'center',
                                lineHeight: '1.1',
                              }}
                            >
                              {provider.label}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
