import { ArrowUpward } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ScrollToTopButtonProps {
  /** CSS selector for the scroll container, or 'window' to use window scroll */
  scrollContainerSelector?: string;
  /** Direct reference to the scroll container element */
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
  /** Scroll threshold before showing the button (default: 400) */
  threshold?: number;
  /** Extra bottom offset added on top of the auto-detected position */
  bottomOffset?: number;
}

export const ScrollToTopButton: React.FC<ScrollToTopButtonProps> = ({
  scrollContainerSelector,
  scrollContainerRef,
  threshold = 400,
  bottomOffset = 0,
}) => {
  const { currentTheme } = useTheme();
  const [show, setShow] = useState(false);
  const [hasNav, setHasNav] = useState(false);

  useEffect(() => {
    setHasNav(!!document.querySelector('.mobile-content.with-nav'));
  }, []);

  const getContainer = useCallback((): HTMLElement | Window | null => {
    if (scrollContainerRef?.current) return scrollContainerRef.current;
    if (scrollContainerSelector === 'window') return window;
    if (scrollContainerSelector) return document.querySelector<HTMLElement>(scrollContainerSelector);
    return null;
  }, [scrollContainerSelector, scrollContainerRef]);

  const getScrollTop = useCallback((container: HTMLElement | Window): number => {
    if (container instanceof Window) return window.scrollY;
    return container.scrollTop;
  }, []);

  useEffect(() => {
    const container = getContainer();
    if (!container) return;

    const target = container instanceof Window ? window : container;

    const handleScroll = () => {
      setShow(getScrollTop(container) > threshold);
    };

    target.addEventListener('scroll', handleScroll, { passive: true });
    return () => target.removeEventListener('scroll', handleScroll);
  }, [getContainer, getScrollTop, threshold]);

  const scrollToTop = () => {
    const container = getContainer();
    if (!container) return;

    if (container instanceof Window) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 83px navbar + 24px spacing = 107px with nav, 24px without
  const baseBottom = hasNav ? 107 : 24;
  const bottom = `calc(${baseBottom + bottomOffset}px + env(safe-area-inset-bottom))`;

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom,
            right: '24px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: 'none',
            background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
            boxShadow: `0 4px 16px ${currentTheme.primary}60`,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 100,
          }}
        >
          <ArrowUpward style={{ fontSize: 24 }} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
