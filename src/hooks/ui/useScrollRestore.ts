import { useCallback, useEffect, useRef } from 'react';
import { useNavigationType } from 'react-router-dom';

/** Bis der Inhalt hoch genug ist bzw. ScrollToTop nicht mehr dazwischenfunkt. */
const MIN_RESTORE_FRAMES = 3;
const MAX_RESTORE_FRAMES = 30;

/** Die Keep-Alive-Tabs halten ein verstecktes `.mobile-content` im DOM — gemeint ist das sichtbare. */
function findScroller(selector: string): HTMLElement | null {
  const matches = Array.from(document.querySelectorAll<HTMLElement>(selector));
  return matches.find((el) => el.getClientRects().length > 0) ?? matches[0] ?? null;
}

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
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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

    let frames = 0;
    const apply = () => {
      if (!mountedRef.current) return;
      const container = findScroller(selector);
      if (!container) return;
      if (Math.abs(container.scrollTop - scrollY) > 1) container.scrollTop = scrollY;
      frames += 1;
      const settled = Math.abs(container.scrollTop - scrollY) <= 1;
      if (frames < MAX_RESTORE_FRAMES && (frames < MIN_RESTORE_FRAMES || !settled)) {
        requestAnimationFrame(apply);
      }
    };
    requestAnimationFrame(() => requestAnimationFrame(apply));
  }, [key, selector, navigationType, restoreOnPop]);

  // Save on scroll (debounced)
  useEffect(() => {
    const container = findScroller(selector);
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
    const container = findScroller(selector);
    if (container && container.scrollTop > 0) {
      sessionStorage.setItem(key, String(container.scrollTop));
    }
  }, [key, selector]);

  return { saveNow };
}
