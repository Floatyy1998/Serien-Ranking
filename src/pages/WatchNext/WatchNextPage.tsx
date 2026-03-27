import React from 'react';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import Edit from '@mui/icons-material/Edit';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import FilterList from '@mui/icons-material/FilterList';
import PlayCircle from '@mui/icons-material/PlayCircle';
import Repeat from '@mui/icons-material/Repeat';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { useNavigate, useNavigationType, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useWatchNextEpisodes } from '../../hooks/useWatchNextEpisodes';
import { useEpisodeDragDrop } from '../../hooks/useEpisodeDragDrop';
import { GradientText, PageLayout, ScrollToTopButton } from '../../components/ui';
import { hasActiveRewatch } from '../../lib/validation/rewatch.utils';
import { useWatchNextSwipe } from './useWatchNextSwipe';
import { SwipeableEpisodeRow } from '../../components/ui';
import { EpisodeDiscussionButton } from '../../components/Discussion';
import { chipLabel, chipColor } from '../../utils/episodeChips';
import { SortBar } from './SortBar';
import { ProviderFilter } from './ProviderFilter';
import './WatchNextPage.css';

export const WatchNextPage = () => {
  const { user = null } = useAuth() || {};
  const { seriesList } = useSeriesList();
  const { currentTheme } = useTheme();
  const [searchParams] = useSearchParams();
  const navigationType = useNavigationType(); // 'POP' = back button, 'PUSH' = fresh navigation

  const [, startTransition] = useTransition();

  // UI State
  const [showFilter, setShowFilter] = useState(false);
  const [filterInput, setFilterInput] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
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
    handleSwipeCleanup,
    handleEpisodeComplete,
  } = useWatchNextSwipe({ user, seriesList });
  const navigate = useNavigate();

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

  // Debounce filter input — avoids re-filtering on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => setDebouncedFilter(filterInput));
    }, 250);
    return () => clearTimeout(timer);
  }, [filterInput]);

  // First call to get initial episodes (needed by drag/drop hook)
  const nextEpisodes = useWatchNextEpisodes(
    seriesList,
    debouncedFilter,
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
    debouncedFilter,
    showRewatches,
    sortOption,
    customOrderActive,
    watchlistOrder,
    providerFilter
  );

  // Scroll position restore — nur bei "Zurück"-Navigation (POP), nicht bei direktem Seitenaufruf
  const scrollRestoredRef = useRef(false);
  useEffect(() => {
    const saved = sessionStorage.getItem('watchNext-scroll');
    if (saved && !scrollRestoredRef.current && navigationType === 'POP') {
      scrollRestoredRef.current = true;
      const scrollY = parseInt(saved, 10);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const container = document.querySelector('.episodes-scroll-container') as HTMLElement;
          if (container) container.scrollTop = scrollY;
        });
      });
    }
    if (navigationType !== 'POP') {
      sessionStorage.removeItem('watchNext-scroll');
    }
  }, [navigationType]);

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

  // Save preferences to localStorage (initial sync)
  useEffect(() => {
    if (searchParams.get('rewatches') !== 'open') {
      localStorage.setItem('watchNextHideRewatches', 'true');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist preferences — consolidated to one effect
  useEffect(() => {
    localStorage.setItem('watchNextHideRewatches', (!showRewatches).toString());
    localStorage.setItem('watchNextCustomOrderActive', customOrderActive.toString());
    localStorage.setItem('watchNextSortOption', sortOption);
    if (providerFilter) {
      localStorage.setItem('watchNextProvider', providerFilter);
    } else {
      localStorage.removeItem('watchNextProvider');
    }
  }, [showRewatches, customOrderActive, sortOption, providerFilter]);

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
    startTransition(() => setSortOption(newOption));
  };

  const toggleCustomOrder = () => {
    const newValue = !customOrderActive;
    startTransition(() => setCustomOrderActive(newValue));
    if (customOrderActive) {
      setEditModeActive(false);
    }
  };

  // Swipe hint — show once for new users
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    return !localStorage.getItem('watchNextSwipeHintSeen');
  });

  useEffect(() => {
    if (showSwipeHint && actualNextEpisodes.length > 0) {
      localStorage.setItem('watchNextSwipeHintSeen', '1');
      const timer = setTimeout(() => setShowSwipeHint(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showSwipeHint, actualNextEpisodes.length]);

  const isMobile = window.innerWidth < 768;

  const theme = {
    primary: currentTheme.primary,
    accent: currentTheme.accent,
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
                    className={`watch-next-header__btn${editModeActive ? ' watch-next-header__btn--active' : ''}`}
                    style={
                      {
                        background: editModeActive
                          ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                          : `rgba(255,255,255,0.05)`,
                        color: editModeActive
                          ? currentTheme.text.secondary
                          : currentTheme.text.primary,
                        '--btn-active-shadow': `0 4px 15px ${currentTheme.primary}40`,
                      } as React.CSSProperties
                    }
                  >
                    <Edit />
                  </motion.button>
                </Tooltip>
              )}

              <Tooltip title="Filter" arrow>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowFilter(!showFilter)}
                  className={`watch-next-header__btn${showFilter ? ' watch-next-header__btn--active' : ''}`}
                  style={
                    {
                      background: showFilter
                        ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                        : `rgba(255,255,255,0.05)`,
                      color: showFilter ? currentTheme.text.secondary : currentTheme.text.primary,
                      '--btn-active-shadow': `0 4px 15px ${currentTheme.primary}40`,
                    } as React.CSSProperties
                  }
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
                  onSelect={(p) => startTransition(() => setProviderFilter(p))}
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
                  ? `${currentTheme.accent || '#f59e0b'}20`
                  : `${currentTheme.accent || '#f59e0b'}10`,
                border: `1px solid ${currentTheme.accent || '#f59e0b'}${showRewatches ? '50' : '30'}`,
              }}
            >
              <div className="watch-next-rewatch-toggle__content">
                <div className="watch-next-rewatch-toggle__label">
                  <Repeat style={{ fontSize: '15px', color: currentTheme.accent || '#f59e0b' }} />
                  {activeRewatchCount} aktive {activeRewatchCount === 1 ? 'Rewatch' : 'Rewatches'}
                </div>
                {showRewatches ? (
                  <ExpandLess style={{ fontSize: '18px', color: currentTheme.text.muted }} />
                ) : (
                  <ExpandMore style={{ fontSize: '18px', color: currentTheme.text.muted }} />
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
                <PlayCircle style={{ fontSize: '44px', color: currentTheme.primary }} />
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
                  .map((episode, index, arr) => {
                    const episodeKey = getEpisodeKey(episode);
                    // Show separator between rewatches and normal episodes
                    const prevEpisode = index > 0 ? arr[index - 1] : null;
                    const showSeparator = prevEpisode?.isRewatch && !episode.isRewatch;
                    return (
                      <div key={episodeKey} style={{ position: 'relative' }}>
                        {showSwipeHint && index === 0 && (
                          <div className="swipe-hint-overlay">
                            <span className="swipe-hint-label">
                              <ChevronLeft style={{ fontSize: '16px' }} />
                              Swipen
                            </span>
                          </div>
                        )}
                        {showSeparator && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '12px',
                              padding: '8px 4px 4px',
                            }}
                          >
                            <div
                              style={{
                                flex: 1,
                                height: '1px',
                                background: `linear-gradient(90deg, ${currentTheme.status.success}40, transparent)`,
                              }}
                            />
                            <span
                              style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: currentTheme.status.success,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Weiterschauen
                            </span>
                            <div
                              style={{
                                flex: 1,
                                height: '1px',
                                background: `linear-gradient(90deg, transparent, ${currentTheme.status.success}40)`,
                              }}
                            />
                          </div>
                        )}
                        <SwipeableEpisodeRow
                          itemKey={episodeKey}
                          poster={episode.poster}
                          posterAlt={episode.seriesTitle}
                          accentColor={
                            episode.isRewatch ? currentTheme.accent : currentTheme.status.success
                          }
                          isCompleting={completingEpisodes.has(episodeKey)}
                          isSwiping={swipingEpisodes.has(episodeKey)}
                          dragOffset={dragOffsets[episodeKey] || 0}
                          swipeDirection={swipeDirections[episodeKey]}
                          onSwipeStart={() => handleSwipeDragStart(episodeKey)}
                          onSwipeDrag={(offset) =>
                            handleSwipeDrag(episodeKey, { offset: { x: offset, y: 0 } } as never)
                          }
                          onSwipeEnd={() => handleSwipeCleanup(episodeKey)}
                          onComplete={(dir) => handleEpisodeComplete(episode, dir)}
                          onPosterClick={() =>
                            navigate(
                              `/episode/${episode.seriesId}/s/${episode.seasonNumber + 1}/e/${episode.episodeNumber}`
                            )
                          }
                          posterOverlay={
                            episode.providerLogo ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w92${episode.providerLogo}`}
                                alt={episode.providerName || ''}
                                style={{
                                  position: 'absolute',
                                  bottom: -3,
                                  right: -3,
                                  width: 26,
                                  height: 26,
                                  borderRadius: 7,
                                  objectFit: 'cover',
                                  boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                                  border: '1.5px solid rgba(15,20,35,1)',
                                }}
                              />
                            ) : undefined
                          }
                          index={index}
                          isEditMode={editModeActive}
                          draggedIndex={draggedIndex}
                          currentTouchIndex={currentTouchIndex}
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          content={
                            <>
                              <h2
                                style={{
                                  fontSize: isMobile ? '13px' : '16px',
                                  fontWeight: 700,
                                  margin: '0 0 2px 0',
                                  letterSpacing: '-0.01em',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {episode.seriesTitle}
                              </h2>
                              <p
                                style={{
                                  fontSize: isMobile ? '11px' : '14px',
                                  fontWeight: 500,
                                  margin: 0,
                                  color: episode.chipType
                                    ? chipColor(episode.chipType)
                                    : episode.isRewatch
                                      ? currentTheme.accent
                                      : currentTheme.status.success,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                S{(episode.seasonNumber ?? 0) + 1} E{episode.episodeNumber}
                                {episode.isRewatch
                                  ? ` \u2022 ${episode.currentWatchCount}x \u2192 ${episode.targetWatchCount}x`
                                  : episode.episodeName
                                    ? ` \u2022 ${episode.episodeName}`
                                    : ''}
                                {episode.chipType && (
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      padding: '1px 5px',
                                      borderRadius: 4,
                                      marginLeft: 6,
                                      background: `${chipColor(episode.chipType)}20`,
                                      color: chipColor(episode.chipType),
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.3px',
                                      whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {chipLabel(episode.chipType)}
                                  </span>
                                )}
                              </p>
                              <p
                                style={{
                                  fontSize: isMobile ? '10px' : '13px',
                                  margin: '2px 0 0 0',
                                  color: currentTheme.text.muted,
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {episode.remainingEpisodes > 0
                                  ? `${episode.currentSeasonOf} \u00b7 ${episode.remainingEpisodes} \u00fcbrig${episode.estimatedMinutesLeft >= 60 ? ` \u00b7 ~${Math.round(episode.estimatedMinutesLeft / 60)}h` : episode.estimatedMinutesLeft > 0 ? ` \u00b7 ~${episode.estimatedMinutesLeft}min` : ''}`
                                  : episode.isRewatch
                                    ? episode.currentSeasonOf
                                    : 'Wartet auf neue Folgen'}
                              </p>
                              <div
                                style={{
                                  marginTop: '6px',
                                  height: '3px',
                                  background: 'rgba(255,255,255,0.08)',
                                  borderRadius: '2px',
                                  overflow: 'hidden',
                                  position: 'relative',
                                }}
                              >
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: 0,
                                    height: '100%',
                                    width: `${episode.progress}%`,
                                    background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                                    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                  }}
                                />
                              </div>
                            </>
                          }
                          action={
                            <EpisodeDiscussionButton
                              seriesId={episode.seriesId}
                              seasonNumber={episode.seasonNumber + 1}
                              episodeNumber={episode.episodeNumber}
                            />
                          }
                        />
                      </div>
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
