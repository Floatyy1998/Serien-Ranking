import { useEffect, useRef } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeOptions {
  threshold?: number; // Minimum distance for swipe detection (default: 50px)
  restraint?: number; // Maximum perpendicular distance (default: 100px)
  allowedTime?: number; // Maximum time for swipe (default: 300ms)
}

export const useSwipeGestures = (
  handlers: SwipeHandlers,
  options: SwipeOptions = {}
) => {
  const {
    threshold = 50,
    restraint = 100,
    allowedTime = 300
  } = options;

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.pageX,
        y: touch.pageY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.pageX - touchStartRef.current.x;
      const deltaY = touch.pageY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Check if it's a valid swipe (not too slow)
      if (deltaTime > allowedTime) {
        touchStartRef.current = null;
        return;
      }

      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);

      // Horizontal swipe
      if (absX > absY && absX > threshold && absY < restraint) {
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      }
      // Vertical swipe
      else if (absY > absX && absY > threshold && absX < restraint) {
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }

      touchStartRef.current = null;
    };

    const element = elementRef.current || document.body;
    
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, threshold, restraint, allowedTime]);

  return elementRef;
};