import { Edit, ExpandLess, ExpandMore, FilterList, PlayCircle, Repeat } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { useWatchNextEpisodes } from '../../hooks/useWatchNextEpisodes';
import { useEpisodeDragDrop } from '../../hooks/useEpisodeDragDrop';
import { GradientText, PageLayout, ScrollToTopButton } from '../../components/ui';
import { hasActiveRewatch } from '../../lib/validation/rewatch.utils';
import { useWatchNextSwipe } from './useWatchNextSwipe';
import { EpisodeCard } from './EpisodeCard';
import { SortBar } from './SortBar';
import { ProviderFilter } from './ProviderFilter';
import './WatchNextPage.css';

export const WatchNextPage = () => {
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { currentTheme } = useTheme();
  const [searchParams] = useSearchParams();

  // UI State
  const [showFilter, setShowFilter] = useState(false);
  const [filterInput, setFilterInput] = useState('');
  const [showRewatches, setShowRewatches] = useState(searchParams.get('rewatches') === 'open');
  const [editModeActive, setEditModeActive] = useState(false);
  const [customOrderActive, setCustomOrderActive] = useState(
    localStorage.getItem('watchNextCustomOrderActive') === 'true'
  );
  const [sortOption, setSortOption] = useState(
    localStorage.getItem('watchNextSortOption') || 'name-asc'
  );
  const [providerFilter, setProviderFilter] = useState<string | null>(
    localStorage.getItem('watchNextProvider') || null
  );

  // Swipe hook
  const {
    swipingEpisodes,
    completingEpisodes,
    hiddenEpisodes,
    dragOffsets,
    swipeDirections,
    getEpisodeKey,
    handleSwipeDragStart,
    handleSwipeDrag,
    handleSwipeDragEnd,
  } = useWatchNextSwipe({ user, seriesList });

  // Extract unique providers from watchlist series
  const availableProviders = useMemo(() => {
    const providerSet = new Map<string, string>();
    seriesList
      .filter((s) => s.watchlist)
      .forEach((s) => {
        s.provider?.provider?.forEach((p) => {
          if (p.name && !providerSet.has(p.name)) {
            providerSet.set(p.name, p.logo || '');
          }
        });
      });
    return Array.from(providerSet.entries())
      .map(([name, logo]) => ({ name, logo }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [seriesList]);

  // First call to get initial episodes (needed by drag/drop hook)
  const nextEpisodes = useWatchNextEpisodes(
    seriesList,
    filterInput,
    showRewatches,
    sortOption,
    customOrderActive,
    [],
    providerFilter
  );

  const {
    draggedIndex,
    currentTouchIndex,
    containerRef,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    watchlistOrder,
  } = useEpisodeDragDrop({ nextEpisodes, user, editModeActive });

  // Re-compute with actual watchlistOrder
  const actualNextEpisodes = useWatchNextEpisodes(
    seriesList,
    filterInput,
    showRewatches,
    sortOption,
    customOrderActive,
    watchlistOrder,
    providerFilter
  );

  // Scroll position restore
  const scrollRestoredRef = useRef(false);
  useEffect(() => {
    const saved = sessionStorage.getItem('watchNext-scroll');
    if (saved && !scrollRestoredRef.current) {
      scrollRestoredRef.current = true;
      const scrollY = parseInt(saved, 10);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const container = document.querySelector('.episodes-scroll-container') as HTMLElement;
          if (container) container.scrollTop = scrollY;
        });
      });
      sessionStorage.removeItem('watchNext-scroll');
    }
  }, []);

  useEffect(() => {
    const container = document.querySelector('.episodes-scroll-container') as HTMLElement;
    if (!container) return;
    let timeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        sessionStorage.setItem('watchNext-scroll', String(container.scrollTop));
      }, 100);
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timeout);
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    if (searchParams.get('rewatches') !== 'open') {
      setShowRewatches(false);
      localStorage.setItem('watchNextHideRewatches', 'true');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    localStorage.setItem('watchNextHideRewatches', (!showRewatches).toString());
  }, [showRewatches]);

  useEffect(() => {
    localStorage.setItem('watchNextCustomOrderActive', customOrderActive.toString());
  }, [customOrderActive]);

  useEffect(() => {
    localStorage.setItem('watchNextSortOption', sortOption);
  }, [sortOption]);

  useEffect(() => {
    if (providerFilter) {
      localStorage.setItem('watchNextProvider', providerFilter);
    } else {
      localStorage.removeItem('watchNextProvider');
    }
  }, [providerFilter]);

  // Count active rewatches
  const activeRewatchCount = useMemo(() => {
    return seriesList.filter((s) => s.watchlist && hasActiveRewatch(s)).length;
  }, [seriesList]);

  // Sort toggle
  const toggleSort = (field: string) => {
    let newOption: string;
    if (customOrderActive) {
      setCustomOrderActive(false);
      newOption = `${field}-asc`;
    } else if (sortOption.startsWith(field)) {
      newOption = `${field}-${sortOption.endsWith('asc') ? 'desc' : 'asc'}`;
    } else {
      newOption = `${field}-asc`;
    }
    setSortOption(newOption);
  };

  const toggleCustomOrder = () => {
    const newValue = !customOrderActive;
    setCustomOrderActive(newValue);
    if (customOrderActive) {
      setEditModeActive(false);
    }
  };

  const theme = {
    primary: currentTheme.primary,
    text: currentTheme.text,
    status: currentTheme.status,
    background: currentTheme.background,
  };

  return (
    <PageLayout
      style={{ height: '100vh', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        ref={containerRef}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
      >
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="watch-next-header"
          style={{ background: `${currentTheme.background.default}90` }}
        >
          <div className="watch-next-header__top">
            <div>
              <GradientText
                as="h1"
                to={currentTheme.status.success}
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  margin: 0,
                }}
              >
                Als Nächstes
              </GradientText>
              <p
                style={{
                  color: currentTheme.text.secondary,
                  fontSize: '14px',
                  margin: '4px 0 0 0',
                }}
              >
                {actualNextEpisodes.length} nächste Episoden
              </p>
            </div>

            <div className="watch-next-header__actions">
              {customOrderActive && (
                <Tooltip title="Reihenfolge bearbeiten" arrow>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const newVal = !editModeActive;
                      setEditModeActive(newVal);
                    }}
                    className="watch-next-header__btn"
                    style={{
                      background: editModeActive
                        ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                        : 'rgba(255, 255, 255, 0.05)',
                      color: editModeActive ? 'white' : currentTheme.text.primary,
                      boxShadow: editModeActive ? `0 4px 15px ${currentTheme.primary}40` : 'none',
                    }}
                  >
                    <Edit />
                  </motion.button>
                </Tooltip>
              )}

              <Tooltip title="Filter" arrow>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilter(!showFilter)}
                  className="watch-next-header__btn"
                  style={{
                    background: showFilter
                      ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                      : 'rgba(255, 255, 255, 0.05)',
                    color: showFilter ? 'white' : currentTheme.text.primary,
                    boxShadow: showFilter ? `0 4px 15px ${currentTheme.primary}40` : 'none',
                  }}
                >
                  <FilterList />
                </motion.button>
              </Tooltip>
            </div>
          </div>

          {/* Filter Section */}
          <AnimatePresence>
            {showFilter && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="watch-next-filter"
              >
                <input
                  type="text"
                  placeholder="Serie suchen..."
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                  className="watch-next-filter__input"
                  style={{ color: currentTheme.text.primary }}
                />

                <SortBar
                  sortOption={sortOption}
                  customOrderActive={customOrderActive}
                  onSort={toggleSort}
                  onToggleCustom={toggleCustomOrder}
                  theme={theme}
                />

                <ProviderFilter
                  providers={availableProviders}
                  selected={providerFilter}
                  onSelect={(p) => {
                    setProviderFilter(p);
                  }}
                  theme={theme}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Scrollable Content */}
        <div
          className="episodes-scroll-container watch-next-scroll hide-scrollbar"
          style={{
            touchAction: draggedIndex !== null && editModeActive ? 'none' : 'auto',
          }}
        >
          {/* Rewatch Toggle */}
          {activeRewatchCount > 0 && (
            <motion.div
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowRewatches(!showRewatches)}
              className="watch-next-rewatch-toggle"
              style={{
                background: showRewatches
                  ? `${currentTheme.status?.warning || '#f59e0b'}20`
                  : `${currentTheme.status?.warning || '#f59e0b'}10`,
                border: `1px solid ${currentTheme.status?.warning || '#f59e0b'}${showRewatches ? '50' : '30'}`,
              }}
            >
              <div className="watch-next-rewatch-toggle__content">
                <div className="watch-next-rewatch-toggle__label">
                  <Repeat
                    style={{ fontSize: '15px', color: currentTheme.status?.warning || '#f59e0b' }}
                  />
                  {activeRewatchCount} aktive {activeRewatchCount === 1 ? 'Rewatch' : 'Rewatches'}
                </div>
                {showRewatches ? (
                  <ExpandLess style={{ fontSize: '18px', opacity: 0.5 }} />
                ) : (
                  <ExpandMore style={{ fontSize: '18px', opacity: 0.5 }} />
                )}
              </div>
            </motion.div>
          )}

          {actualNextEpisodes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="watch-next-empty"
            >
              <div
                className="watch-next-empty__icon"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.status.success}15)`,
                }}
              >
                <PlayCircle
                  style={{ fontSize: '44px', color: currentTheme.primary, opacity: 0.7 }}
                />
              </div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: currentTheme.text.primary,
                  margin: '0 0 8px 0',
                }}
              >
                Keine neuen Episoden
              </h2>
              <p
                style={{
                  fontSize: '15px',
                  color: currentTheme.text.muted,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Schaue eine Serie an um hier
                <br />
                die nächsten Episoden zu sehen!
              </p>
            </motion.div>
          ) : (
            <div className="watch-next-episodes">
              <AnimatePresence mode="popLayout">
                {actualNextEpisodes
                  .filter((episode) => !hiddenEpisodes.has(getEpisodeKey(episode)))
                  .map((episode, index) => {
                    const episodeKey = getEpisodeKey(episode);
                    return (
                      <EpisodeCard
                        key={episodeKey}
                        episode={episode}
                        index={index}
                        theme={theme}
                        isEditMode={editModeActive}
                        isSwiping={swipingEpisodes.has(episodeKey)}
                        isCompleting={completingEpisodes.has(episodeKey)}
                        dragOffset={dragOffsets[episodeKey] || 0}
                        swipeDirection={swipeDirections[episodeKey]}
                        draggedIndex={draggedIndex}
                        currentTouchIndex={currentTouchIndex}
                        onSwipeDragStart={handleSwipeDragStart}
                        onSwipeDrag={handleSwipeDrag}
                        onSwipeDragEnd={handleSwipeDragEnd}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        episodeKey={episodeKey}
                      />
                    );
                  })}
              </AnimatePresence>
            </div>
          )}

          <div className="watch-next-bottom-pad" />
        </div>
      </div>
      <ScrollToTopButton scrollContainerSelector=".episodes-scroll-container" />
    </PageLayout>
  );
};
