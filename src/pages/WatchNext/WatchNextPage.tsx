import {
  ArrowDownward,
  ArrowUpward,
  Check,
  DragHandle,
  Edit,
  ExpandLess,
  ExpandMore,
  FilterList,
  PlayCircle,
  Repeat,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { EpisodeDiscussionButton } from '../../components/Discussion';
import { getFormattedDate } from '../../lib/date/date.utils';
import { petService } from '../../services/petService';
import { WatchActivityService } from '../../services/watchActivityService';
import { useWatchNextEpisodes, NextEpisode } from '../../hooks/useWatchNextEpisodes';
import { useEpisodeDragDrop } from '../../hooks/useEpisodeDragDrop';
import { GradientText, HorizontalScrollContainer, PageLayout, ScrollToTopButton } from '../../components/ui';
import { hasActiveRewatch } from '../../lib/validation/rewatch.utils';

export const WatchNextPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { currentTheme } = useTheme();
  const [showFilter, setShowFilter] = useState(false);
  const [filterInput, setFilterInput] = useState('');
  // Always start with rewatches hidden on /watchlist
  const [showRewatches, setShowRewatches] = useState(false);
  const [customOrderActive, setCustomOrderActive] = useState(
    localStorage.getItem('watchNextCustomOrderActive') === 'true'
  );
  const [editModeActive, setEditModeActive] = useState(false);
  const [sortOption, setSortOption] = useState(
    localStorage.getItem('watchNextSortOption') || 'name-asc'
  );
  const [swipingEpisodes, setSwipingEpisodes] = useState<Set<string>>(new Set());
  const [dragOffsets, setDragOffsets] = useState<{ [key: string]: number }>({});
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
  const [hiddenEpisodes, setHiddenEpisodes] = useState<Set<string>>(new Set());
  const [swipeDirections, setSwipeDirections] = useState<Record<string, 'left' | 'right'>>({});

  // Use extracted hooks
  const nextEpisodes = useWatchNextEpisodes(
    seriesList,
    filterInput,
    showRewatches,
    sortOption,
    customOrderActive,
    // watchlistOrder from drag/drop hook below - we need the value, so we access it after
    [] // placeholder, will be overridden
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
  } = useEpisodeDragDrop({
    nextEpisodes,
    user,
    editModeActive,
  });

  // Re-compute nextEpisodes with actual watchlistOrder from drag/drop hook
  const actualNextEpisodes = useWatchNextEpisodes(
    seriesList,
    filterInput,
    showRewatches,
    sortOption,
    customOrderActive,
    watchlistOrder
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

  // Save scroll position on scroll (debounced)
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

  // Removed tabs - only show next episodes

  // Save preferences to localStorage and ensure rewatches start hidden
  useEffect(() => {
    // Always set to false (hide rewatches) on mount
    setShowRewatches(false);
    localStorage.setItem('watchNextHideRewatches', 'true');
  }, []); // Only run on mount

  // Save when showRewatches changes after initial mount
  useEffect(() => {
    localStorage.setItem('watchNextHideRewatches', (!showRewatches).toString());
  }, [showRewatches]);

  useEffect(() => {
    localStorage.setItem('watchNextCustomOrderActive', customOrderActive.toString());
  }, [customOrderActive]);

  useEffect(() => {
    localStorage.setItem('watchNextSortOption', sortOption);
  }, [sortOption]);

  // Count active rewatches for the dropdown header
  const activeRewatchCount = useMemo(() => {
    return seriesList.filter(s => s.watchlist && hasActiveRewatch(s)).length;
  }, [seriesList]);

  // Toggle sort function
  const toggleSort = (field: string) => {
    if (customOrderActive) {
      setCustomOrderActive(false);
      setSortOption(`${field}-asc`);
    } else if (sortOption.startsWith(field)) {
      setSortOption(`${field}-${sortOption.endsWith('asc') ? 'desc' : 'asc'}`);
    } else {
      setSortOption(`${field}-asc`);
    }
  };

  // Handle episode swipe to complete
  const handleEpisodeComplete = async (
    episode: NextEpisode,
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;

    // Store swipe direction for exit animation
    setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));

    // Add to completing set for animation
    setCompletingEpisodes((prev) => new Set(prev).add(episodeKey));

    // Mark episode as watched in Firebase
    if (user) {
      const series = seriesList.find((s) => s.id === episode.seriesId);
      if (!series) return;

      try {
        const watchedRef = firebase
          .database()
          .ref(
            `${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watched`
          );
        await watchedRef.set(true);

        // Handle rewatch: increment watchCount
        if (episode.isRewatch) {
          const watchCountRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watchCount`
            );
          const newCount = (episode.currentWatchCount || 0) + 1;
          await watchCountRef.set(newCount);

          // Update lastWatchedAt for rewatches
          const lastWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/lastWatchedAt`
            );
          await lastWatchedRef.set(new Date().toISOString());

          // Badge-System für Rewatch
          const { updateEpisodeCounters } = await import(
            '../../features/badges/minimalActivityLogger'
          );
          await updateEpisodeCounters(user.uid, true, episode.airDate);
        } else {
          // Update firstWatchedAt if not set
          const firstWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/firstWatchedAt`
            );
          const snapshot = await firstWatchedRef.once('value');
          if (!snapshot.val()) {
            await firstWatchedRef.set(new Date().toISOString());
          }

          // Always update lastWatchedAt
          const lastWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/lastWatchedAt`
            );
          await lastWatchedRef.set(new Date().toISOString());

          // Pet XP geben mit Genre-Bonus
          const { petService } = await import('../../services/petService');
          await petService.watchedSeriesWithGenreAllPets(user.uid, series.genre?.genres || []);

          // Also update watchCount if needed
          const watchCountRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watchCount`
            );
          const watchCountSnapshot = await watchCountRef.once('value');
          const currentCount = watchCountSnapshot.val() || 0;
          await watchCountRef.set(currentCount + 1);

          // Badge-System für normale Episode
          const { updateEpisodeCounters } = await import(
            '../../features/badges/minimalActivityLogger'
          );
          await updateEpisodeCounters(user.uid, false, episode.airDate);
        }

        // XP für das Pet vergeben mit Genre-Bonus (nur bei nicht-Rewatch)
        if (!episode.isRewatch) {
          await petService.watchedSeriesWithGenreAllPets(user.uid, series.genre?.genres || []);
        }

        // Wrapped 2026: Episode-Watch loggen
        WatchActivityService.logEpisodeWatch(
          user.uid,
          series.id,
          series.title || series.name || 'Unbekannte Serie',
          episode.seasonIndex + 1, // seasonNumber (1-basiert)
          episode.episodeIndex + 1, // episodeNumber (1-basiert)
          episode.runtime || series.episodeRuntime || 45,
          episode.isRewatch || false,
          series.genre?.genres,
          series.provider?.provider?.map(p => p.name)
        );
      } catch (error) {
        console.error('Failed to mark episode as watched:', error);
      }
    }

    // After animation, hide the episode
    setTimeout(() => {
      setHiddenEpisodes((prev) => new Set(prev).add(episodeKey));
      setCompletingEpisodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(episodeKey);
        return newSet;
      });
    }, 300);
  };

  return (
    <PageLayout style={{ height: '100vh', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >

      {/* Premium Glassmorphism Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          padding: '16px 20px',
          paddingTop: 'calc(16px + env(safe-area-inset-top))',
          background: `${currentTheme.background.default}90`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          flexShrink: 0,
          position: 'relative',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <GradientText as="h1" to={currentTheme.status.success} style={{
                fontSize: '22px',
                fontWeight: 800,
                margin: 0,
              }}
            >
              Als Nächstes
            </GradientText>
            <p
              style={{
                color: currentTheme.text.secondary,
                fontSize: '13px',
                margin: '4px 0 0 0',
              }}
            >
              {actualNextEpisodes.length} nächste Episoden
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {customOrderActive && (
              <Tooltip title="Reihenfolge bearbeiten" arrow>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setEditModeActive(!editModeActive)}
                  style={{
                    padding: '10px',
                    background: editModeActive
                      ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                      : 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '12px',
                    color: editModeActive ? 'white' : currentTheme.text.primary,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                style={{
                  padding: '10px',
                  background: showFilter
                    ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                    : 'rgba(255, 255, 255, 0.05)',
                  border: 'none',
                  borderRadius: '12px',
                  color: showFilter ? 'white' : currentTheme.text.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: showFilter ? `0 4px 15px ${currentTheme.primary}40` : 'none',
                }}
              >
                <FilterList />
              </motion.button>
            </Tooltip>
          </div>
        </div>

        {/* Premium Filter Section */}
        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{
                marginTop: '8px',
                padding: '14px',
                background: 'rgba(255, 255, 255, 0.04)',
                borderRadius: '14px',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                overflow: 'hidden',
              }}
            >
              <input
                type="text"
                placeholder="Serie suchen..."
                value={filterInput}
                onChange={(e) => setFilterInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  color: currentTheme.text.primary,
                  fontSize: '14px',
                  marginBottom: '12px',
                  outline: 'none',
                }}
              />

              <HorizontalScrollContainer gap={8} style={{}}>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setCustomOrderActive(!customOrderActive);
                    if (customOrderActive) {
                      setEditModeActive(false);
                    }
                  }}
                  style={{
                    padding: '8px 14px',
                    background: customOrderActive
                      ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                      : 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '10px',
                    color: customOrderActive ? 'white' : currentTheme.text.primary,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: customOrderActive ? `0 4px 12px ${currentTheme.primary}40` : 'none',
                  }}
                >
                  <DragHandle style={{ fontSize: '16px' }} />
                  Benutzerdefiniert
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSort('name')}
                  style={{
                    padding: '8px 14px',
                    background:
                      !customOrderActive && sortOption.startsWith('name')
                        ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                        : 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '10px',
                    color:
                      !customOrderActive && sortOption.startsWith('name')
                        ? 'white'
                        : currentTheme.text.primary,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: !customOrderActive && sortOption.startsWith('name') ? `0 4px 12px ${currentTheme.primary}40` : 'none',
                  }}
                >
                  Name
                  {!customOrderActive &&
                    sortOption.startsWith('name') &&
                    (sortOption.endsWith('asc') ? (
                      <ArrowUpward style={{ fontSize: '14px' }} />
                    ) : (
                      <ArrowDownward style={{ fontSize: '14px' }} />
                    ))}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSort('date')}
                  style={{
                    padding: '8px 14px',
                    background:
                      !customOrderActive && sortOption.startsWith('date')
                        ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                        : 'rgba(255, 255, 255, 0.05)',
                    border: 'none',
                    borderRadius: '10px',
                    color:
                      !customOrderActive && sortOption.startsWith('date')
                        ? 'white'
                        : currentTheme.text.primary,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: !customOrderActive && sortOption.startsWith('date') ? `0 4px 12px ${currentTheme.primary}40` : 'none',
                  }}
                >
                  Datum
                  {!customOrderActive &&
                    sortOption.startsWith('date') &&
                    (sortOption.endsWith('asc') ? (
                      <ArrowUpward style={{ fontSize: '14px' }} />
                    ) : (
                      <ArrowDownward style={{ fontSize: '14px' }} />
                    ))}
                </motion.button>
              </HorizontalScrollContainer>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Scrollable Content Container */}
      <div
        className="episodes-scroll-container hide-scrollbar"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          // Disable touch scrolling when dragging
          touchAction: draggedIndex !== null && editModeActive ? 'none' : 'auto',
          // Force hide scrollbar for this specific container
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Rewatch Dropdown Toggle */}
        {activeRewatchCount > 0 && (
          <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowRewatches(!showRewatches)}
            style={{
              padding: '12px 16px',
              background: showRewatches
                ? `${currentTheme.status?.warning || '#f59e0b'}20`
                : `${currentTheme.status?.warning || '#f59e0b'}10`,
              border: `1px solid ${currentTheme.status?.warning || '#f59e0b'}${showRewatches ? '50' : '30'}`,
              borderRadius: '12px',
              marginBottom: '12px',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Repeat style={{ fontSize: '14px', color: currentTheme.status?.warning || '#f59e0b' }} />
                {activeRewatchCount} aktive {activeRewatchCount === 1 ? 'Rewatch' : 'Rewatches'}
              </div>
              {showRewatches
                ? <ExpandLess style={{ fontSize: '18px', opacity: 0.5 }} />
                : <ExpandMore style={{ fontSize: '18px', opacity: 0.5 }} />
              }
            </div>
          </motion.div>
        )}

        {actualNextEpisodes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: 'center',
              padding: '60px 30px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              margin: '20px 0',
            }}
          >
            <div
              style={{
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.status.success}15)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <PlayCircle style={{ fontSize: '44px', color: currentTheme.primary, opacity: 0.7 }} />
            </div>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: currentTheme.text.primary,
              margin: '0 0 8px 0',
            }}>
              Keine neuen Episoden
            </h2>
            <p style={{
              fontSize: '14px',
              color: currentTheme.text.muted,
              margin: 0,
              lineHeight: 1.5,
            }}>
              Schaue eine Serie an um hier<br />die nächsten Episoden zu sehen!
            </p>
          </motion.div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence mode="popLayout">
              {actualNextEpisodes
                .filter(
                  (episode) =>
                    !hiddenEpisodes.has(
                      `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`
                    )
                )
                .map((episode, index) => {
                  const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
                  const isCompleting = completingEpisodes.has(episodeKey);
                  const isSwiping = swipingEpisodes.has(episodeKey);

                  return (
                    <motion.div
                      key={episodeKey}
                      data-block-swipe
                      data-index={index}
                      className="episode-card"
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{
                        opacity: isCompleting ? 0.5 : 1,
                        y: 0,
                        scale: isCompleting ? 0.95 : 1,
                      }}
                      exit={{
                        opacity: 0,
                        x: swipeDirections[episodeKey] === 'left' ? -300 : 300,
                        transition: { duration: 0.3 },
                      }}
                      style={{
                        position: 'relative',
                      }}
                    >
                      {/* Swipe Overlay for episodes - only when edit mode is NOT active */}
                      {!editModeActive && (
                        <motion.div
                          drag="x"
                          dragConstraints={{ left: 0, right: 0 }}
                          dragElastic={1}
                          dragSnapToOrigin={true}
                          onDragStart={() => {
                            setSwipingEpisodes((prev) => new Set(prev).add(episodeKey));
                          }}
                          onDrag={(_event, info: PanInfo) => {
                            setDragOffsets((prev) => ({
                              ...prev,
                              [episodeKey]: info.offset.x,
                            }));
                          }}
                          onDragEnd={(event, info: PanInfo) => {
                            event.stopPropagation();
                            setSwipingEpisodes((prev) => {
                              const newSet = new Set(prev);
                              newSet.delete(episodeKey);
                              return newSet;
                            });
                            setDragOffsets((prev) => {
                              const newOffsets = { ...prev };
                              delete newOffsets[episodeKey];
                              return newOffsets;
                            });

                            if (Math.abs(info.offset.x) > 100 && Math.abs(info.velocity.x) > 50) {
                              const direction = info.offset.x > 0 ? 'right' : 'left';
                              handleEpisodeComplete(episode, direction);
                            }
                          }}
                          whileDrag={{ scale: 1.02 }}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: '60px', // Start after the poster
                            right: '100px', // Leave space for the button on the right
                            bottom: 0,
                            zIndex: 1,
                          }}
                        />
                      )}

                      {/* Card content */}
                      <div
                        draggable={editModeActive}
                        onDragStart={
                          editModeActive ? (e: React.DragEvent<HTMLDivElement>) => handleDragStart(e, index) : undefined
                        }
                        onDragOver={editModeActive ? (e) => handleDragOver(e, index) : undefined}
                        onDrop={editModeActive ? (e: React.DragEvent<HTMLDivElement>) => handleDrop(e, index) : undefined}
                        onTouchStart={
                          editModeActive ? (e) => handleTouchStart(e, index) : undefined
                        }
                        onTouchMove={editModeActive ? handleTouchMove : undefined}
                        onTouchEnd={editModeActive ? handleTouchEnd : undefined}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          background: isCompleting
                            ? 'linear-gradient(90deg, rgba(76, 209, 55, 0.2), rgba(0, 212, 170, 0.05))'
                            : episode.isRewatch
                              ? `${currentTheme.status.warning}0D`
                              : `rgba(76, 209, 55, ${Math.min((Math.abs(dragOffsets[episodeKey] || 0) / 100) * 0.15, 0.15)})`,
                          border: `1px solid ${
                            isCompleting
                              ? 'rgba(76, 209, 55, 0.5)'
                              : currentTouchIndex === index &&
                                  draggedIndex !== null &&
                                  draggedIndex !== index
                                ? currentTheme.primary
                                : episode.isRewatch
                                  ? `${currentTheme.status.warning}4D`
                                  : `rgba(76, 209, 55, ${0.2 + Math.min((Math.abs(dragOffsets[episodeKey] || 0) / 100) * 0.3, 0.3)})`
                          }`,
                          borderRadius: '10px',
                          padding:
                            currentTouchIndex === index &&
                            draggedIndex !== null &&
                            draggedIndex !== index
                              ? '7px'
                              : '8px',
                          cursor: editModeActive ? 'move' : 'pointer',
                          opacity: draggedIndex === index ? 0.6 : 1,
                          transform:
                            draggedIndex === index
                              ? 'scale(1.05)'
                              : currentTouchIndex === index &&
                                  draggedIndex !== null &&
                                  draggedIndex !== index
                                ? 'scale(1.02)'
                                : 'scale(1)',
                          boxShadow:
                            draggedIndex === index
                              ? `0 8px 24px ${currentTheme.primary}40`
                              : currentTouchIndex === index &&
                                  draggedIndex !== null &&
                                  draggedIndex !== index
                                ? `0 4px 12px ${currentTheme.primary}30`
                                : 'none',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden',
                        }}
                      >
                        {/* Swipe Indicator Background */}
                        <motion.div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background:
                              'linear-gradient(90deg, transparent, rgba(76, 209, 55, 0.3))',
                            opacity: 0,
                          }}
                          animate={{
                            opacity: isSwiping ? 1 : 0,
                          }}
                        />
                        {/* Simple checkmark indicator */}
                        {isCompleting && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              zIndex: 10,
                            }}
                          >
                            <Check
                              style={{ fontSize: '28px', color: currentTheme.status.success }}
                            />
                          </motion.div>
                        )}
                        <img
                          src={episode.poster}
                          alt={episode.seriesTitle}
                          onClick={() => {
                            navigate(`/episode/${episode.seriesId}/s/${episode.seasonNumber + 1}/e/${episode.episodeNumber}`);
                          }}
                          style={{
                            width: '48px',
                            height: '72px',
                            objectFit: 'cover',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            position: 'relative',
                            zIndex: 2,
                          }}
                        />
                        <div
                          style={{
                            flex: 1,
                            pointerEvents: editModeActive ? 'auto' : 'none',
                            position: 'relative',
                            zIndex: 2,
                          }}
                          onClick={() => {
                            if (!editModeActive) {
                              navigate(`/episode/${episode.seriesId}/s/${episode.seasonNumber + 1}/e/${episode.episodeNumber}`);
                            }
                          }}
                        >
                          <h2 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 2px 0' }}>
                            {episode.seriesTitle}
                          </h2>
                          <p
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              margin: '0 0 2px 0',
                              color: episode.isRewatch
                                ? currentTheme.status.warning
                                : currentTheme.status.success,
                            }}
                          >
                            S{(episode.seasonNumber ?? 0) + 1} E{episode.episodeNumber}
                            {episode.isRewatch &&
                              ` • ${episode.currentWatchCount}x → ${episode.targetWatchCount}x`}
                          </p>
                          <p
                            style={{
                              fontSize: '12px',
                              margin: 0,
                              color: currentTheme.text.muted,
                            }}
                          >
                            {episode.episodeName}
                          </p>
                          {episode.airDate && (
                            <p
                              style={{
                                fontSize: '11px',
                                margin: '4px 0 0 0',
                                color: currentTheme.text.muted,
                              }}
                            >
                              {getFormattedDate(episode.airDate)}
                            </p>
                          )}
                        </div>
                        {editModeActive && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '12px 8px',
                              color: currentTheme.text.muted,
                              cursor: 'grab',
                            }}
                          >
                            <DragHandle style={{ fontSize: '24px' }} />
                          </div>
                        )}

                        {/* Button/Icon on the right side - show when edit mode is NOT active */}
                        {!editModeActive && (
                          <AnimatePresence mode="wait">
                            {isCompleting ? (
                              <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0, rotate: 180 }}
                                style={{
                                  padding: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  position: 'relative',
                                  zIndex: 2,
                                }}
                              >
                                <Check
                                  style={{ fontSize: '24px', color: currentTheme.status.success }}
                                />
                              </motion.div>
                            ) : (
                              <motion.div
                                animate={{ x: isSwiping ? 10 : 0 }}
                                style={{
                                  padding: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '8px',
                                  position: 'relative',
                                  zIndex: 2,
                                }}
                              >
                                <EpisodeDiscussionButton
                                  seriesId={episode.seriesId}
                                  seasonNumber={episode.seasonNumber + 1}
                                  episodeNumber={episode.episodeNumber}
                                />
                                <PlayCircle
                                  style={{
                                    fontSize: '24px',
                                    color: episode.isRewatch
                                      ? currentTheme.status.warning
                                      : currentTheme.status.success,
                                  }}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
            </AnimatePresence>
          </div>
        )}

        {/* Padding at bottom to prevent last item being hidden by navbar */}
        <div
          style={{
            height: 'calc(120px + env(safe-area-inset-bottom))',
            paddingBottom: 'calc(20px + env(safe-area-inset-bottom))',
          }}
        />
      </div>
      </div>
      <ScrollToTopButton scrollContainerSelector=".episodes-scroll-container" />
    </PageLayout>
  );
};
