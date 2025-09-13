import {
  ArrowDownward,
  ArrowUpward,
  Check,
  DragHandle,
  Edit,
  FilterList,
  PlayCircle,
  Repeat,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { getFormattedDate } from '../lib/date/date.utils';
import { getNextRewatchEpisode, hasActiveRewatch } from '../lib/validation/rewatch.utils';
import { Series } from '../types/Series';
import { HorizontalScrollContainer } from '../components/HorizontalScrollContainer';

interface NextEpisode {
  seriesId: number;
  seriesTitle: string;
  poster: string;
  seasonIndex: number;
  episodeIndex: number;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate?: string;
  isRewatch?: boolean;
  currentWatchCount?: number;
  targetWatchCount?: number;
}

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
  const [watchlistOrder, setWatchlistOrder] = useState<number[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [currentTouchIndex, setCurrentTouchIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [swipingEpisodes, setSwipingEpisodes] = useState<Set<string>>(new Set());
  const [dragOffsets, setDragOffsets] = useState<{ [key: string]: number }>({});
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
  const [hiddenEpisodes, setHiddenEpisodes] = useState<Set<string>>(new Set());
  const [swipeDirections, setSwipeDirections] = useState<Record<string, 'left' | 'right'>>({});
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

  // Load watchlist order from Firebase
  useEffect(() => {
    if (!user) return;

    const orderRef = firebase.database().ref(`users/${user.uid}/watchlistOrder`);
    orderRef.on('value', (snapshot) => {
      const order = snapshot.val();
      if (order && Array.isArray(order)) {
        setWatchlistOrder(order);
      }
    });

    return () => orderRef.off();
  }, [user]);

  // Handle drag state changes and prevent scroll during drag
  useEffect(() => {
    if (draggedIndex !== null && editModeActive) {
      // Prevent ALL scrolling during drag (except auto-scroll)
      const preventScroll = (e: Event) => {
        // Always prevent default scroll when dragging
        if (e.cancelable) {
          e.preventDefault();
        }
      };

      // Add to both document and container
      const container = document.querySelector('.episodes-scroll-container');

      document.addEventListener('touchmove', preventScroll, { passive: false });
      if (container) {
        container.addEventListener('touchmove', preventScroll, { passive: false });
      }

      return () => {
        document.removeEventListener('touchmove', preventScroll);
        if (container) {
          container.removeEventListener('touchmove', preventScroll);
        }
      };
    } else {
      // Clear auto-scroll when drag ends
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
        isAutoScrollingRef.current = false;
      }
      if (autoScrollAnimationRef.current) {
        cancelAnimationFrame(autoScrollAnimationRef.current);
        autoScrollAnimationRef.current = null;
      }
    }
  }, [draggedIndex, editModeActive]);

  // Helper functions
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

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

  // Get next unwatched episodes from series with progress
  const nextEpisodes = useMemo(() => {
    const episodes: NextEpisode[] = [];
    const rewatches: NextEpisode[] = [];
    const today = new Date();

    // All series in watchlist
    const seriesInWatchlist = seriesList.filter((series) => {
      if (!series.watchlist) return false; // MUST be in watchlist
      // Check if seasons exists and has content
      if (!series.seasons) return false;
      // Handle both array and object formats
      const seasonsArray = Array.isArray(series.seasons)
        ? series.seasons
        : Object.values(series.seasons);
      if (!seasonsArray.length) return false;
      return true;
    });

    seriesInWatchlist.forEach((series: Series) => {
      // Apply filter if set
      if (filterInput) {
        const searchTerm = filterInput.toLowerCase();
        if (!series.title?.toLowerCase().includes(searchTerm)) {
          return;
        }
      }

      // Convert seasons to array if needed
      const seasonsArray: typeof series.seasons = Array.isArray(series.seasons)
        ? series.seasons
        : (Object.values(series.seasons) as typeof series.seasons);

      // If showing rewatches, ONLY show series with active rewatches
      if (showRewatches) {
        if (hasActiveRewatch(series)) {
          const rewatchEpisode = getNextRewatchEpisode(series);
          if (rewatchEpisode) {
            // Find the correct season index based on seasonNumber
            const seasonIndex = seasonsArray.findIndex(
              (s) => s.seasonNumber === rewatchEpisode.seasonNumber
            );
            if (seasonIndex !== -1) {
              rewatches.push({
                seriesId: series.id,
                seriesTitle: series.title,
                poster: getImageUrl(series.poster),
                seasonIndex: seasonIndex,
                episodeIndex: rewatchEpisode.episodeIndex,
                seasonNumber: rewatchEpisode.seasonNumber,
                episodeNumber: rewatchEpisode.episodeIndex + 1,
                episodeName: rewatchEpisode.name || `Episode ${rewatchEpisode.episodeIndex + 1}`,
                airDate: rewatchEpisode.air_date,
                isRewatch: true,
                currentWatchCount: rewatchEpisode.currentWatchCount,
                targetWatchCount: rewatchEpisode.targetWatchCount,
              });
            }
          }
        }
      } else {
        // Normal mode: show next unwatched episodes
        let foundUnwatched = false;

        // Find first unwatched episode that has already aired
        for (const [seasonIndex, season] of seasonsArray.entries()) {
          const episodesList: typeof season.episodes = Array.isArray(season.episodes)
            ? season.episodes
            : season.episodes
              ? (Object.values(season.episodes) as typeof season.episodes)
              : [];

          if (!episodesList.length) continue;

          for (const [episodeIndex, episode] of episodesList.entries()) {
            if (episode.watched) continue;

            // Check if episode has aired
            if (!episode.air_date) continue; // Skip episodes without air date
            const airDate = new Date(episode.air_date);
            if (airDate > today) continue; // Skip future episodes
            episodes.push({
              seriesId: series.id,
              seriesTitle: series.title,
              poster: getImageUrl(series.poster),
              seasonIndex,
              episodeIndex,
              seasonNumber: season.seasonNumber,
              episodeNumber: episodeIndex + 1,
              episodeName: episode.name || `Episode ${episodeIndex + 1}`,
              airDate: episode.air_date,
            });
            foundUnwatched = true;
            break; // Only first unwatched per series
          }

          if (foundUnwatched) break;
        }
      }
    });

    // Return only the appropriate episodes based on mode
    const sortedEpisodes = showRewatches ? rewatches : episodes;

    if (!customOrderActive) {
      const [field, order] = sortOption.split('-');
      const orderMultiplier = order === 'asc' ? 1 : -1;

      sortedEpisodes.sort((a, b) => {
        if (field === 'name') {
          return a.seriesTitle.localeCompare(b.seriesTitle) * orderMultiplier;
        } else if (field === 'date') {
          if (a.airDate && b.airDate) {
            return (
              (new Date(a.airDate).getTime() - new Date(b.airDate).getTime()) * orderMultiplier
            );
          }
          return 0;
        }
        return 0;
      });
    } else if (watchlistOrder.length > 0) {
      // Apply custom order
      sortedEpisodes.sort((a, b) => {
        const indexA = watchlistOrder.indexOf(a.seriesId);
        const indexB = watchlistOrder.indexOf(b.seriesId);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }

    return sortedEpisodes;
  }, [seriesList, filterInput, showRewatches, sortOption, customOrderActive, watchlistOrder]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent | React.TouchEvent, index: number) => {
    setDraggedIndex(index);
    if ('dataTransfer' in e) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setCurrentTouchIndex(index);
    }
    
    // Auto-scroll for desktop drag
    if (draggedIndex !== null) {
      const mouseY = e.clientY;
      const viewportHeight = window.innerHeight;
      const scrollThreshold = 150;
      
      const isNearTop = mouseY < scrollThreshold;
      const isNearBottom = mouseY > viewportHeight - scrollThreshold;
      
      // Start auto-scroll if near edges
      if ((isNearTop || isNearBottom) && !autoScrollIntervalRef.current) {
        autoScrollIntervalRef.current = setInterval(() => {
          const container = document.querySelector('.episodes-scroll-container') as HTMLElement;
          if (!container || draggedIndex === null) {
            if (autoScrollIntervalRef.current) {
              clearInterval(autoScrollIntervalRef.current);
              autoScrollIntervalRef.current = null;
            }
            return;
          }
          
          const scrollTop = container.scrollTop;
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          const maxScroll = Math.max(0, scrollHeight - clientHeight);
          
          // Get current mouse position from the latest event
          const currentMouseY = e.clientY;
          const currentIsNearTop = currentMouseY < scrollThreshold;
          const currentIsNearBottom = currentMouseY > viewportHeight - scrollThreshold;
          
          if (currentIsNearTop && scrollTop > 0) {
            const distanceFromTop = Math.max(1, scrollThreshold - currentMouseY);
            const speedFactor = distanceFromTop / scrollThreshold;
            const scrollAmount = Math.ceil(100 * speedFactor);
            container.scrollTop = Math.max(0, scrollTop - scrollAmount);
          } else if (currentIsNearBottom && scrollTop < maxScroll) {
            const distanceFromBottom = currentMouseY - (viewportHeight - scrollThreshold);
            const speedFactor = distanceFromBottom / scrollThreshold;
            const scrollAmount = Math.ceil(100 * speedFactor);
            container.scrollTop = Math.min(maxScroll, scrollTop + scrollAmount);
          }
        }, 20);
      } else if (!isNearTop && !isNearBottom && autoScrollIntervalRef.current) {
        // Stop auto-scroll when moved away from edges
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    }
  };

  const handleDrop = async (e: React.DragEvent | React.TouchEvent, dropIndex: number) => {
    e.preventDefault();
    
    // Clear auto-scroll on drop
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newEpisodes = [...nextEpisodes];
    const draggedItem = newEpisodes[draggedIndex];
    newEpisodes.splice(draggedIndex, 1);
    newEpisodes.splice(dropIndex, 0, draggedItem);

    // Update order in Firebase
    if (user && editModeActive) {
      const newOrder = newEpisodes.map((ep) => ep.seriesId);
      // Remove duplicates and keep first occurrence
      const uniqueOrder = [...new Set(newOrder)];
      setWatchlistOrder(uniqueOrder);
      await firebase.database().ref(`users/${user.uid}/watchlistOrder`).set(uniqueOrder);
    }

    setDraggedIndex(null);
  };

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const dragDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollAnimationRef = useRef<number | null>(null);
  const currentTouchPositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchPositionRef = useRef<{ x: number; y: number } | null>(null);
  const touchDirectionRef = useRef<'up' | 'down' | null>(null);
  const isAutoScrollingRef = useRef<boolean>(false);

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    if (!editModeActive) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    };

    // Start drag after a delay to allow normal scrolling
    dragDelayTimerRef.current = setTimeout(() => {
      // Prevent any ongoing scrolling when drag starts
      if (document.scrollingElement) {
        document.scrollingElement.scrollTop = document.scrollingElement.scrollTop;
      }
      setDraggedIndex(index);
      setCurrentTouchIndex(index);
    }, 150); // Reduced delay to 150ms for better responsiveness
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!editModeActive) return;

    const touch = e.touches[0];

    // Track movement direction
    if (lastTouchPositionRef.current && draggedIndex !== null) {
      const deltaY = touch.clientY - lastTouchPositionRef.current.y;
      if (Math.abs(deltaY) > 2) {
        // Only update if significant movement
        touchDirectionRef.current = deltaY < 0 ? 'up' : 'down';
      }
    }

    // Update current and last touch position
    lastTouchPositionRef.current = currentTouchPositionRef.current;
    currentTouchPositionRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };

    // If drag hasn't started yet, check if movement exceeds threshold
    if (draggedIndex === null && touchStartRef.current && dragDelayTimerRef.current) {
      const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      // If user has moved significantly, cancel the drag delay (they're scrolling)
      if (deltaX > 10 || deltaY > 10) {
        clearTimeout(dragDelayTimerRef.current);
        dragDelayTimerRef.current = null;
        touchStartRef.current = null;
        return;
      }
    }

    // Only proceed with drag logic if drag has actually started
    if (draggedIndex === null) return;

    // Find the element under the current touch position
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    if (elementBelow) {
      // Find the closest episode card
      const card = elementBelow.closest('.episode-card');
      if (card) {
        // Get all episode cards
        const allCards = Array.from(document.querySelectorAll('.episode-card'));
        const targetIndex = allCards.indexOf(card as HTMLElement);

        if (targetIndex !== -1 && targetIndex !== draggedIndex) {
          setCurrentTouchIndex(targetIndex);
        }
      }
    }

    const currentY = touch.clientY;
    const viewportHeight = window.innerHeight;
    const scrollThreshold = 150; // Start scrolling when within 150px of edge
    const stopThreshold = 180; // Stop only when moved 180px away from edge (hysteresis)

    // Check if we're near edges AND moving in that direction
    const isNearTop = currentY < scrollThreshold;
    const isNearBottom = currentY > viewportHeight - scrollThreshold;
    const isMovingUp = touchDirectionRef.current === 'up';
    const isMovingDown = touchDirectionRef.current === 'down';

    // Only auto-scroll if near edge AND moving towards it
    const shouldStartScrollUp = isNearTop && isMovingUp;
    const shouldStartScrollDown = isNearBottom && isMovingDown;
    const shouldStopScroll = currentY > stopThreshold && currentY < viewportHeight - stopThreshold;

    // Start auto-scrolling if near edges and not already scrolling
    if ((shouldStartScrollUp || shouldStartScrollDown) && !isAutoScrollingRef.current) {
      isAutoScrollingRef.current = true;

      // Clear any existing interval first
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
      }

      autoScrollIntervalRef.current = setInterval(() => {
        // Check if drag is still active - use refs to get current values
        if (!currentTouchPositionRef.current) {
          isAutoScrollingRef.current = false;
          if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current);
            autoScrollIntervalRef.current = null;
          }
          return;
        }

        // Use the current touch position from the ref
        const touchY = currentTouchPositionRef.current.y;
        const scrollThreshold = 150; // Same threshold as in main function
        const viewportHeight = window.innerHeight;
        const isNearTop = touchY < scrollThreshold;
        const isNearBottom = touchY > viewportHeight - scrollThreshold;

        // Only scroll if still near edges
        if (!isNearTop && !isNearBottom) {
          isAutoScrollingRef.current = false;
          clearInterval(autoScrollIntervalRef.current!);
          autoScrollIntervalRef.current = null;
          return;
        }

        // Get container element
        const container = document.querySelector('.episodes-scroll-container') as HTMLElement;
        if (!container) {
          isAutoScrollingRef.current = false;
          clearInterval(autoScrollIntervalRef.current!);
          autoScrollIntervalRef.current = null;
          return;
        }

        // Get container scroll position and dimensions
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight;
        const clientHeight = container.clientHeight;
        const maxScroll = Math.max(0, scrollHeight - clientHeight);

        // Check if container has content to scroll
        const hasScrollableContent = scrollHeight > clientHeight;

        // If page isn't scrollable, stop auto-scroll
        if (!hasScrollableContent) {
          isAutoScrollingRef.current = false;
          clearInterval(autoScrollIntervalRef.current!);
          autoScrollIntervalRef.current = null;
          return;
        }

        if (isNearTop && scrollTop > 0) {
          // Calculate scroll speed based on distance from edge
          const distanceFromTop = Math.max(1, scrollThreshold - touchY);
          const speedFactor = distanceFromTop / scrollThreshold;
          const scrollAmount = Math.ceil(1500 * speedFactor); // MASSIVE speed increase to 1500

          // Scroll container up
          container.scrollTop = Math.max(0, scrollTop - scrollAmount);
        } else if (isNearBottom && scrollTop < maxScroll) {
          // Calculate scroll speed based on distance from edge
          const distanceFromBottom = touchY - (viewportHeight - scrollThreshold);
          const speedFactor = distanceFromBottom / scrollThreshold;
          const scrollAmount = Math.ceil(1500 * speedFactor); // MASSIVE speed increase to 1500

          // Scroll container down
          container.scrollTop = Math.min(maxScroll, scrollTop + scrollAmount);
        }
      }, 10); // Run every 10ms (100fps) for smoother, faster scrolling
    } else if (shouldStopScroll && isAutoScrollingRef.current) {
      // Stop auto-scrolling only when moved far enough away from edges
      isAutoScrollingRef.current = false;
      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }
    }

    // Find the element under the touch point using elementFromPoint
    // We need to temporarily hide the dragged element to find what's underneath
    const draggedElement = document.querySelectorAll('.episode-card')[draggedIndex] as HTMLElement;
    if (draggedElement) {
      draggedElement.style.pointerEvents = 'none';
    }

    const elementAtPoint = document.elementFromPoint(touch.clientX, currentY);

    if (draggedElement) {
      draggedElement.style.pointerEvents = '';
    }

    if (elementAtPoint) {
      const episodeCard = elementAtPoint.closest('.episode-card');
      if (episodeCard) {
        const elements = document.querySelectorAll('.episode-card');
        const index = Array.from(elements).indexOf(episodeCard);
        if (index !== -1) {
          setCurrentTouchIndex(index);
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    // Clear the drag delay timer if it's still running
    if (dragDelayTimerRef.current) {
      clearTimeout(dragDelayTimerRef.current);
      dragDelayTimerRef.current = null;
    }

    // Clear auto-scroll if active
    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    // Cancel animation frame
    if (autoScrollAnimationRef.current) {
      cancelAnimationFrame(autoScrollAnimationRef.current);
      autoScrollAnimationRef.current = null;
    }

    // Clear flags
    isAutoScrollingRef.current = false;
    touchStartRef.current = null;
    currentTouchPositionRef.current = null;

    if (draggedIndex === null || currentTouchIndex === null || draggedIndex === currentTouchIndex) {
      setDraggedIndex(null);
      setCurrentTouchIndex(null);
      return;
    }

    const newEpisodes = [...nextEpisodes];
    const draggedItem = newEpisodes[draggedIndex];
    newEpisodes.splice(draggedIndex, 1);
    newEpisodes.splice(currentTouchIndex, 0, draggedItem);

    // Update order in Firebase
    if (user && editModeActive) {
      const newOrder = newEpisodes.map((ep) => ep.seriesId);
      const uniqueOrder = [...new Set(newOrder)];
      setWatchlistOrder(uniqueOrder);
      await firebase.database().ref(`users/${user.uid}/watchlistOrder`).set(uniqueOrder);
    }

    setDraggedIndex(null);
    setCurrentTouchIndex(null);
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

          // Badge-System für Rewatch
          const { updateEpisodeCounters } = await import(
            '../features/badges/minimalActivityLogger'
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
            '../features/badges/minimalActivityLogger'
          );
          await updateEpisodeCounters(user.uid, false, episode.airDate);
        }
      } catch (error) {}
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
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
          flexShrink: 0,
        }}
      >
        <div style={{ marginBottom: '16px' }}>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              margin: 0,
              background: currentTheme.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Als Nächstes
          </h1>
          <p
            style={{
              color: currentTheme.text.secondary,
              fontSize: '14px',
              margin: '4px 0 0 0',
            }}
          >
            {nextEpisodes.length} nächste Episoden
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {customOrderActive && (
            <button
              onClick={() => setEditModeActive(!editModeActive)}
              style={{
                padding: '10px',
                background: editModeActive ? `${currentTheme.primary}33` : `${currentTheme.text.primary}0D`,
                border: `1px solid ${editModeActive ? currentTheme.primary : currentTheme.border.default}`,
                borderRadius: '12px',
                color: editModeActive ? currentTheme.primary : currentTheme.text.primary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Edit />
            </button>
          )}
          
          <button
            onClick={() => setShowFilter(!showFilter)}
            style={{
              padding: '10px',
              background: showFilter ? `${currentTheme.primary}33` : `${currentTheme.text.primary}0D`,
              border: `1px solid ${currentTheme.border.default}`,
              borderRadius: '12px',
              color: currentTheme.text.primary,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FilterList />
          </button>
        </div>

        {/* Filter Section */}
        {showFilter && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: `${currentTheme.text.primary}0D`,
              borderRadius: '8px',
            }}
          >
            <input
              type="text"
              placeholder="Serie suchen..."
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: `${currentTheme.text.primary}0D`,
                border: `1px solid ${currentTheme.border.default}`,
                borderRadius: '8px',
                color: currentTheme.text.primary,
                fontSize: '14px',
                marginBottom: '12px',
              }}
            />

            <HorizontalScrollContainer gap={8} style={{}}>
              <button
                onClick={() => setShowRewatches(!showRewatches)}
                style={{
                  padding: '8px 12px',
                  background: showRewatches
                    ? `${currentTheme.status.warning}33`
                    : `${currentTheme.text.primary}0D`,
                  border: `1px solid ${showRewatches ? `${currentTheme.status.warning}4D` : currentTheme.border.default}`,
                  borderRadius: '8px',
                  color: showRewatches ? currentTheme.status.warning : currentTheme.text.primary,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <Repeat style={{ fontSize: '16px' }} />
                Rewatches
              </button>

              <button
                onClick={() => {
                  setCustomOrderActive(!customOrderActive);
                  if (customOrderActive) {
                    setEditModeActive(false);
                  }
                }}
                style={{
                  padding: '8px 12px',
                  background: customOrderActive
                    ? `${currentTheme.primary}33`
                    : `${currentTheme.text.primary}0D`,
                  border: `1px solid ${customOrderActive ? `${currentTheme.primary}4D` : currentTheme.border.default}`,
                  borderRadius: '8px',
                  color: customOrderActive ? currentTheme.primary : currentTheme.text.primary,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                <DragHandle style={{ fontSize: '16px' }} />
                Benutzerdefiniert
              </button>

              <button
                onClick={() => toggleSort('name')}
                style={{
                  padding: '8px 12px',
                  background:
                    !customOrderActive && sortOption.startsWith('name')
                      ? `${currentTheme.primary}33`
                      : `${currentTheme.text.primary}0D`,
                  border: `1px solid ${!customOrderActive && sortOption.startsWith('name') ? `${currentTheme.primary}4D` : currentTheme.border.default}`,
                  borderRadius: '8px',
                  color:
                    !customOrderActive && sortOption.startsWith('name')
                      ? currentTheme.primary
                      : currentTheme.text.primary,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
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
              </button>

              <button
                onClick={() => toggleSort('date')}
                style={{
                  padding: '8px 12px',
                  background:
                    !customOrderActive && sortOption.startsWith('date')
                      ? `${currentTheme.primary}33`
                      : `${currentTheme.text.primary}0D`,
                  border: `1px solid ${!customOrderActive && sortOption.startsWith('date') ? `${currentTheme.primary}4D` : currentTheme.border.default}`,
                  borderRadius: '8px',
                  color:
                    !customOrderActive && sortOption.startsWith('date')
                      ? currentTheme.primary
                      : currentTheme.text.primary,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
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
              </button>
            </HorizontalScrollContainer>
          </div>
        )}
      </header>

      {/* Scrollable Content Container */}
      <div
        className="episodes-scroll-container"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px',
          WebkitOverflowScrolling: 'touch',
          position: 'relative',
          // Disable touch scrolling when dragging
          touchAction: draggedIndex !== null && editModeActive ? 'none' : 'auto',
        }}
      >
        {nextEpisodes.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: currentTheme.text.muted,
            }}
          >
            <PlayCircle style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
            <h3>Keine neuen Episoden</h3>
            <p>Schaue eine Serie an um hier die nächsten Episoden zu sehen!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence mode="popLayout">
              {nextEpisodes
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
                          editModeActive ? (e) => handleDragStart(e as any, index) : undefined
                        }
                        onDragOver={editModeActive ? (e) => handleDragOver(e, index) : undefined}
                        onDrop={editModeActive ? (e) => handleDrop(e as any, index) : undefined}
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
                          onClick={() => navigate(`/series/${episode.seriesId}`)}
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
                          onClick={() =>
                            !editModeActive && navigate(`/series/${episode.seriesId}`)
                          }
                        >
                          <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 2px 0' }}>
                            {episode.seriesTitle}
                          </h4>
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
                                  position: 'relative',
                                  zIndex: 2,
                                }}
                              >
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
        <div style={{ height: '100px' }} />
      </div>
    </div>
  );
};
