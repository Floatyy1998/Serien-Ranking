import { useCallback, useEffect, useRef } from 'react';
import { useNavigationType } from 'react-router-dom';

/**
 * Saves and restores scroll position via sessionStorage.
 *
 * @param key        Unique storage key (e.g. 'watchNext-scroll')
 * @param selector   CSS selector for the scrollable container
 * @param options    Optional config
 *   - restoreOnPop: only restore when navigationType === 'POP' (default: false)
 *   - debounceMs:   debounce scroll save in ms (default: 100)
 */
export function useScrollRestore(
  key: string,
  selector: string,
  options?: { restoreOnPop?: boolean; debounceMs?: number }
) {
  const { restoreOnPop = false, debounceMs = 100 } = options ?? {};
  const navigationType = useNavigationType();
  const restoredRef = useRef(false);

  // Restore
  useEffect(() => {
    if (restoredRef.current) return;
    if (restoreOnPop && navigationType !== 'POP') {
      sessionStorage.removeItem(key);
      return;
    }

    const saved = sessionStorage.getItem(key);
    if (!saved) return;

    restoredRef.current = true;
    const scrollY = parseInt(saved, 10);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const container = document.querySelector(selector) as HTMLElement;
        if (container) container.scrollTop = scrollY;
      });
    });
  }, [key, selector, navigationType, restoreOnPop]);

  // Save on scroll (debounced)
  useEffect(() => {
    const container = document.querySelector(selector) as HTMLElement;
    if (!container) return;

    let timeout: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        sessionStorage.setItem(key, String(container.scrollTop));
      }, debounceMs);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      clearTimeout(timeout);
      container.removeEventListener('scroll', handleScroll);
    };
  }, [key, selector, debounceMs]);

  // Manual save (for pages that need to save at specific moments)
  const saveNow = useCallback(() => {
    const container = document.querySelector(selector) as HTMLElement;
    if (container && container.scrollTop > 0) {
      sessionStorage.setItem(key, String(container.scrollTop));
    }
  }, [key, selector]);

  return { saveNow };
}
