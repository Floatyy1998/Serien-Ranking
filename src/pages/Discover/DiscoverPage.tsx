import {
  CalendarToday,
  Check,
  FilterList,
  Movie as MovieIcon,
  NewReleases,
  Recommend,
  Search,
  Star,
  TrendingUp,
  Whatshot,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useDiscoverFetch } from './useDiscoverFetch';
import { useDiscoverFilters } from './useDiscoverFilters';
import { DiscoverContent } from './DiscoverContent';
import {
  Dialog,
  GradientText,
  LoadingSpinner,
  PageLayout,
  ScrollToTopButton,
  TabSwitcher,
} from '../../components/ui';
import './DiscoverPage.css';

export const DiscoverPage = memo(() => {
  const { currentTheme } = useTheme();

  const {
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
  } = useDiscoverFilters();

  const {
    results,
    loading,
    searchResults,
    searchLoading,
    recommendations,
    recommendationsLoading,
    addingItem,
    snackbar,
    dialog,
    setDialog,
    fetchFromTMDB,
    fetchRecommendations,
    addToList,
    setupScrollListener,
  } = useDiscoverFetch(
    activeTab,
    activeCategory,
    selectedGenre,
    showSearch,
    searchQuery,
    isRestoring
  );

  // Wire up restore callbacks
  useEffect(() => {
    fetchRecommendationsOnRestore.current = () => fetchRecommendations(true);
    fetchFromTMDBOnRestore.current = () => fetchFromTMDB(true);
  }, [fetchRecommendations, fetchFromTMDB]);

  // Setup scroll listener
  useEffect(() => {
    return setupScrollListener(activeCategory);
  }, [setupScrollListener, activeCategory]);

  // Category configuration for premium styling
  const categories = [
    { id: 'trending', label: 'Trend', icon: TrendingUp, color: currentTheme.primary },
    { id: 'popular', label: 'Beliebt', icon: Whatshot, color: currentTheme.status.error },
    { id: 'top_rated', label: 'Top', icon: Star, color: currentTheme.accent },
    {
      id: 'upcoming',
      label: activeTab === 'movies' ? 'Neu' : 'Läuft',
      icon: NewReleases,
      color: currentTheme.status.success,
    },
    {
      id: 'recommendations',
      label: 'Für dich',
      icon: Recommend,
      color: currentTheme.accent,
    },
  ] as const;

  return (
    <PageLayout style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Fixed Header and Controls */}
      <div
        data-header="discover-header"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: `${currentTheme.background.default}e8`,
          backdropFilter: 'blur(28px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
        }}
      >
        <div
          style={{
            background: `linear-gradient(180deg, ${currentTheme.primary}15 0%, transparent 100%)`,
          }}
        >
          {/* Premium Header */}
          <header
            style={{
              padding: '14px 20px',
              paddingTop: 'calc(14px + env(safe-area-inset-top))',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <GradientText
                as="h1"
                style={{
                  fontSize: '24px',
                  fontWeight: 800,
                  margin: 0,
                }}
              >
                Entdecken
              </GradientText>

              <div style={{ display: 'flex', gap: '8px' }}>
                {!showSearch && activeCategory !== 'recommendations' && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                      padding: '10px',
                      background: selectedGenre
                        ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                        : currentTheme.background.surface,
                      border: selectedGenre ? 'none' : `1px solid ${currentTheme.border.default}`,
                      borderRadius: '12px',
                      color: selectedGenre
                        ? currentTheme.text.secondary
                        : currentTheme.text.primary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: selectedGenre ? `0 4px 12px ${currentTheme.primary}40` : 'none',
                    }}
                    title={
                      selectedGenre
                        ? genres.find((g) => g.id === selectedGenre)?.name
                        : 'Genre Filter'
                    }
                  >
                    <FilterList style={{ fontSize: '20px' }} />
                  </motion.button>
                )}

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    const newValue = !showSearch;
                    setShowSearch(newValue);
                    if (newValue) {
                      setShowFilters(false);
                    }
                  }}
                  style={{
                    padding: '10px',
                    background: showSearch
                      ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                      : currentTheme.background.surface,
                    border: showSearch ? 'none' : `1px solid ${currentTheme.border.default}`,
                    borderRadius: '12px',
                    color: showSearch ? currentTheme.text.secondary : currentTheme.text.primary,
                    cursor: 'pointer',
                    boxShadow: showSearch ? `0 4px 12px ${currentTheme.primary}40` : 'none',
                  }}
                >
                  <Search style={{ fontSize: '20px' }} />
                </motion.button>
              </div>
            </div>
          </header>

          {/* Premium Search Input */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ padding: '0 20px 12px 20px', overflow: 'hidden' }}
              >
                <input
                  type="text"
                  placeholder={`${activeTab === 'series' ? 'Serien' : 'Filme'} suchen...`}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                    border: `1px solid rgba(255, 255, 255, 0.06)`,
                    borderRadius: '14px',
                    color: currentTheme.text.primary,
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Premium Tab Switcher */}
          <TabSwitcher
            tabs={[
              { id: 'series', label: 'Serien', icon: CalendarToday },
              { id: 'movies', label: 'Filme', icon: MovieIcon },
            ]}
            activeTab={activeTab}
            onTabChange={(id) => {
              setActiveTab(id as 'series' | 'movies');
              setShowSearch(false);
            }}
            style={{ margin: '8px 20px 0 20px' }}
          />

          {/* Premium Categories */}
          {!showSearch && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '8px',
                padding: '8px 20px 14px 20px',
              }}
            >
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <motion.button
                    key={cat.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setActiveCategory(cat.id);
                    }}
                    style={{
                      padding: '10px 4px',
                      background: isActive
                        ? `linear-gradient(135deg, ${cat.color}25, ${cat.color}0a)`
                        : 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                      border: isActive
                        ? `1px solid ${cat.color}40`
                        : `1px solid rgba(255, 255, 255, 0.05)`,
                      borderRadius: '12px',
                      color: isActive ? cat.color : currentTheme.text.secondary,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isActive ? `0 4px 16px -4px ${cat.color}20` : 'none',
                    }}
                  >
                    <Icon style={{ fontSize: '20px' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>{cat.label}</span>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* Premium Genre Filter Dropdown */}
          <AnimatePresence>
            {showFilters && !showSearch && activeCategory !== 'recommendations' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ padding: '0 20px 14px 20px', overflow: 'hidden' }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '8px',
                    maxHeight: '160px',
                    overflowY: 'auto',
                    padding: '12px',
                    background: currentTheme.background.surface,
                    borderRadius: '14px',
                    border: `1px solid ${currentTheme.border.default}`,
                  }}
                >
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedGenre(null);
                      setShowFilters(false);
                    }}
                    style={{
                      padding: '8px 10px',
                      background: !selectedGenre
                        ? `linear-gradient(135deg, ${currentTheme.primary}30, ${currentTheme.primary}10)`
                        : 'transparent',
                      border: !selectedGenre
                        ? `1px solid ${currentTheme.primary}50`
                        : `1px solid ${currentTheme.border.default}`,
                      borderRadius: '10px',
                      color: !selectedGenre ? currentTheme.primary : currentTheme.text.primary,
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    Alle
                  </motion.button>
                  {genres.map((genre) => (
                    <motion.button
                      key={genre.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedGenre(genre.id);
                        setShowFilters(false);
                      }}
                      style={{
                        padding: '8px 10px',
                        background:
                          selectedGenre === genre.id
                            ? `linear-gradient(135deg, ${currentTheme.primary}30, ${currentTheme.primary}10)`
                            : 'transparent',
                        border:
                          selectedGenre === genre.id
                            ? `1px solid ${currentTheme.primary}50`
                            : `1px solid ${currentTheme.border.default}`,
                        borderRadius: '10px',
                        color:
                          selectedGenre === genre.id
                            ? currentTheme.primary
                            : currentTheme.text.primary,
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {genre.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div
        className="mobile-discover-container"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Spacer for fixed header */}
        <div style={{ height: `${headerHeight}px` }} />

        <div style={{ padding: '16px 20px' }}>
          <DiscoverContent
            activeCategory={activeCategory}
            showSearch={showSearch}
            searchQuery={searchQuery}
            isDesktop={isDesktop}
            currentTheme={currentTheme}
            results={results}
            searchResults={searchResults}
            searchLoading={searchLoading}
            recommendations={recommendations}
            recommendationsLoading={recommendationsLoading}
            addingItem={addingItem}
            handleItemClick={handleItemClick}
            addToList={addToList}
          />

          {/* Premium Loading indicator */}
          {((loading && !showSearch && activeCategory !== 'recommendations') ||
            (recommendationsLoading &&
              activeCategory === 'recommendations' &&
              recommendations.length > 0)) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <LoadingSpinner size={36} />
            </motion.div>
          )}

          {/* Bottom padding */}
          <div style={{ height: '80px' }} />
        </div>
      </div>

      {/* Premium Snackbar for success feedback */}
      <AnimatePresence>
        {snackbar.open && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{
              position: 'fixed',
              bottom: '100px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: `linear-gradient(135deg, ${currentTheme.status.success}, ${currentTheme.status?.success || '#22c55e'})`,
              color: currentTheme.text.secondary,
              padding: '14px 24px',
              borderRadius: '16px',
              boxShadow: `0 12px 40px -8px ${currentTheme.status.success}50, 0 4px 12px -4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.15)`,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              maxWidth: 'calc(100% - 40px)',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check style={{ fontSize: '18px' }} />
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600 }}>{snackbar.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog for alerts */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        message={dialog.message}
        type={dialog.type}
      />
      <ScrollToTopButton scrollContainerSelector=".mobile-discover-container" />
    </PageLayout>
  );
});

DiscoverPage.displayName = 'DiscoverPage';
