import { useCallback, useEffect, useRef, useState } from 'react';
import { dbRef, userPath } from '../services/db/ref';
import type { NextEpisode } from './useWatchNextEpisodes';

interface UseEpisodeDragDropOptions {
  nextEpisodes: NextEpisode[];
  user: { uid: string } | null;
  editModeActive: boolean;
}

interface UseEpisodeDragDropReturn {
  draggedIndex: number | null;
  currentTouchIndex: number | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleDragStart: (e: React.DragEvent | React.TouchEvent, index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDrop: (e: React.DragEvent | React.TouchEvent, dropIndex: number) => Promise<void>;
  handleTouchStart: (e: React.TouchEvent, index: number) => void;
  handleTouchMove: (e: React.TouchEvent) => void;
  handleTouchEnd: () => Promise<void>;
  setWatchlistOrder: React.Dispatch<React.SetStateAction<number[]>>;
  watchlistOrder: number[];
}

export const useEpisodeDragDrop = ({
  nextEpisodes,
  user,
  editModeActive,
}: UseEpisodeDragDropOptions): UseEpisodeDragDropReturn => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [currentTouchIndex, setCurrentTouchIndex] = useState<number | null>(null);
  const [watchlistOrder, setWatchlistOrder] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const dragDelayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoScrollAnimationRef = useRef<number | null>(null);
  const currentTouchPositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastTouchPositionRef = useRef<{ x: number; y: number } | null>(null);
  const touchDirectionRef = useRef<'up' | 'down' | null>(null);
  const isAutoScrollingRef = useRef<boolean>(false);

  // Load watchlist order from Firebase
  useEffect(() => {
    if (!user) return;

    const orderRef = dbRef(userPath(user.uid, 'watchlistOrder'));
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
        if (e.cancelable) {
          e.preventDefault();
        }
      };

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

  const handleDragStart = useCallback((e: React.DragEvent | React.TouchEvent, index: number) => {
    setDraggedIndex(index);
    if ('dataTransfer' in e) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
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
          clearInterval(autoScrollIntervalRef.current);
          autoScrollIntervalRef.current = null;
        }
      }
    },
    [draggedIndex]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent | React.TouchEvent, dropIndex: number) => {
      e.preventDefault();

      if (autoScrollIntervalRef.current) {
        clearInterval(autoScrollIntervalRef.current);
        autoScrollIntervalRef.current = null;
      }

      if (draggedIndex === null || draggedIndex === dropIndex) return;

      const newEpisodes = [...nextEpisodes];
      const draggedItem = newEpisodes[draggedIndex];
      newEpisodes.splice(draggedIndex, 1);
      newEpisodes.splice(dropIndex, 0, draggedItem);

      if (user && editModeActive) {
        const newOrder = newEpisodes.map((ep) => ep.seriesId);
        const uniqueOrder = [...new Set(newOrder)];
        setWatchlistOrder(uniqueOrder);
        await dbRef(userPath(user.uid, 'watchlistOrder')).set(uniqueOrder);
      }

      setDraggedIndex(null);
    },
    [draggedIndex, nextEpisodes, user, editModeActive]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, index: number) => {
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
          // Force stop momentum scrolling by reading and re-setting scrollTop
          const { scrollTop } = document.scrollingElement;
          document.scrollingElement.scrollTop = scrollTop;
        }
        setDraggedIndex(index);
        setCurrentTouchIndex(index);
      }, 150);
    },
    [editModeActive]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!editModeActive) return;

      const touch = e.touches[0];

      // Track movement direction
      if (lastTouchPositionRef.current && draggedIndex !== null) {
        const deltaY = touch.clientY - lastTouchPositionRef.current.y;
        if (Math.abs(deltaY) > 2) {
          touchDirectionRef.current = deltaY < 0 ? 'up' : 'down';
        }
      }

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

      if (draggedIndex === null) return;

      const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
      if (elementBelow) {
        const card = elementBelow.closest('.episode-card');
        if (card) {
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

      const isNearTop = currentY < scrollThreshold;
      const isNearBottom = currentY > viewportHeight - scrollThreshold;
      const isMovingUp = touchDirectionRef.current === 'up';
      const isMovingDown = touchDirectionRef.current === 'down';

      // Only auto-scroll if near edge AND moving towards it
      const shouldStartScrollUp = isNearTop && isMovingUp;
      const shouldStartScrollDown = isNearBottom && isMovingDown;
      const shouldStopScroll =
        currentY > stopThreshold && currentY < viewportHeight - stopThreshold;

      if ((shouldStartScrollUp || shouldStartScrollDown) && !isAutoScrollingRef.current) {
        isAutoScrollingRef.current = true;

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

          const touchY = currentTouchPositionRef.current.y;
          const scrollThreshold = 150; // Same threshold as in main function
          const viewportHeight = window.innerHeight;
          const isNearTop = touchY < scrollThreshold;
          const isNearBottom = touchY > viewportHeight - scrollThreshold;

          if (!isNearTop && !isNearBottom) {
            isAutoScrollingRef.current = false;
            clearInterval(autoScrollIntervalRef.current ?? undefined);
            autoScrollIntervalRef.current = null;
            return;
          }

          const container = document.querySelector('.episodes-scroll-container') as HTMLElement;
          if (!container) {
            isAutoScrollingRef.current = false;
            clearInterval(autoScrollIntervalRef.current ?? undefined);
            autoScrollIntervalRef.current = null;
            return;
          }

          const scrollTop = container.scrollTop;
          const scrollHeight = container.scrollHeight;
          const clientHeight = container.clientHeight;
          const maxScroll = Math.max(0, scrollHeight - clientHeight);

          const hasScrollableContent = scrollHeight > clientHeight;
          if (!hasScrollableContent) {
            isAutoScrollingRef.current = false;
            clearInterval(autoScrollIntervalRef.current ?? undefined);
            autoScrollIntervalRef.current = null;
            return;
          }

          if (isNearTop && scrollTop > 0) {
            // Scroll speed skaliert mit Distanz zur Kante
            const distanceFromTop = Math.max(1, scrollThreshold - touchY);
            const speedFactor = distanceFromTop / scrollThreshold;
            const scrollAmount = Math.ceil(1500 * speedFactor);
            container.scrollTop = Math.max(0, scrollTop - scrollAmount);
          } else if (isNearBottom && scrollTop < maxScroll) {
            const distanceFromBottom = touchY - (viewportHeight - scrollThreshold);
            const speedFactor = distanceFromBottom / scrollThreshold;
            const scrollAmount = Math.ceil(1500 * speedFactor);
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
      const draggedElement = document.querySelectorAll('.episode-card')[
        draggedIndex
      ] as HTMLElement;
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
    },
    [editModeActive, draggedIndex]
  );

  const handleTouchEnd = useCallback(async () => {
    if (dragDelayTimerRef.current) {
      clearTimeout(dragDelayTimerRef.current);
      dragDelayTimerRef.current = null;
    }

    if (autoScrollIntervalRef.current) {
      clearInterval(autoScrollIntervalRef.current);
      autoScrollIntervalRef.current = null;
    }

    if (autoScrollAnimationRef.current) {
      cancelAnimationFrame(autoScrollAnimationRef.current);
      autoScrollAnimationRef.current = null;
    }

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

    if (user && editModeActive) {
      const newOrder = newEpisodes.map((ep) => ep.seriesId);
      const uniqueOrder = [...new Set(newOrder)];
      setWatchlistOrder(uniqueOrder);
      await dbRef(userPath(user.uid, 'watchlistOrder')).set(uniqueOrder);
    }

    setDraggedIndex(null);
    setCurrentTouchIndex(null);
  }, [draggedIndex, currentTouchIndex, nextEpisodes, user, editModeActive]);

  return {
    draggedIndex,
    currentTouchIndex,
    containerRef,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setWatchlistOrder,
    watchlistOrder,
  };
};
