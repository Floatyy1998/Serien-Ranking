import { ArrowBack, ArrowUpward } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useBackNavigation } from '../../hooks/ui/useBackNavigation';
import { useIsNavRoot } from '../../hooks/ui/useIsNavRoot';
import { useReducedMotion } from '../../hooks/ui/useReducedMotion';
import { tapScaleTight } from '../../lib/motion';
import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { HomeLogoIcon } from '../ui/layout/BackButton';
import { currentScroller, isRendered, scrollPageToTop, setActiveScroller } from './pageScroller';
import './ScrollEscapeHost.css';

const NAV_AFTER = 120;
const lastTop = new WeakMap<Element, number>();

// Nur seitengroße Scroller im App-Layout zählen — Karussells, Sheets und Portal-Overlays nicht.
const isPageScroller = (el: HTMLElement) =>
  el.clientHeight >= window.innerHeight * 0.5 &&
  !!el.closest('.mobile-layout') &&
  !el.closest('[role="dialog"], [data-no-scroll-escape]');

const backButtonVisible = () =>
  Array.from(document.querySelectorAll('[data-back-button]')).some((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
  });

const isTyping = () => {
  const el = document.activeElement;
  return !!el && (el.matches('input, textarea, select') || (el as HTMLElement).isContentEditable);
};

const baseBottom = () => {
  const fab = Array.from(document.querySelectorAll<HTMLElement>('[data-fab]')).find(isRendered);
  if (fab?.style.bottom) return `calc(${fab.style.bottom} + ${fab.offsetHeight + 12}px)`;
  return document.querySelector('.mobile-bottom-navigation')
    ? 'calc(var(--dock-top) + 12px)'
    : 'calc(var(--safe-bottom) + 20px)';
};

interface EscapeState {
  up: boolean;
  nav: boolean;
  bottom: string;
}

const HIDDEN: EscapeState = { up: false, nav: false, bottom: '' };

/** Mitwandernde Leiste: Nach-oben auf jeder langen Seite, Zurück + Home sobald die eigenen aus dem Bild sind. */
export const ScrollEscapeHost = () => {
  const { pathname } = useLocation();
  const isNavRoot = useIsNavRoot();
  const { currentTheme } = useTheme();
  const reduceMotion = useReducedMotion();
  const { goBack, goHome, homeLabel } = useBackNavigation();
  const [state, setState] = useState<EscapeState>(HIDDEN);

  useEffect(() => {
    let frame = 0;

    const evaluate = () => {
      frame = 0;
      const el = currentScroller();
      if (!el || isTyping()) {
        setState(HIDDEN);
        return;
      }
      const top = el.scrollTop;
      const up = top > Math.max(400, el.clientHeight * 0.6);
      const nav = !isNavRoot && top > NAV_AFTER && !backButtonVisible();
      const bottom = up || nav ? baseBottom() : '';
      setState((prev) =>
        prev.up === up && prev.nav === nav && prev.bottom === bottom ? prev : { up, nav, bottom }
      );
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(evaluate);
    };

    const onScroll = (e: Event) => {
      const el = e.target;
      if (!(el instanceof HTMLElement)) return;
      const prevTop = lastTop.get(el) ?? 0;
      lastTop.set(el, el.scrollTop);
      // Waagerechtes Wischen lässt scrollTop unverändert
      if (el.scrollTop === prevTop || !isPageScroller(el)) return;
      setActiveScroller(el);
      schedule();
    };

    setActiveScroller(null);
    setState(HIDDEN);
    // MainTabs stellt die Scroll-Position eines Tabs erst nach dem Wechsel wieder her
    const settle = window.setTimeout(schedule, 150);

    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    window.addEventListener('resize', schedule);
    return () => {
      window.clearTimeout(settle);
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener('scroll', onScroll, { capture: true });
      document.removeEventListener('focusin', schedule);
      document.removeEventListener('focusout', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [pathname, isNavRoot]);

  const pop = reduceMotion
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 12 },
      };

  return (
    <div className="scroll-escape" style={{ bottom: state.bottom || undefined }}>
      <AnimatePresence>
        {state.nav && (
          <motion.div
            key="nav"
            layout={!reduceMotion}
            className="scroll-escape__nav"
            style={{ background: `${currentTheme.background.default}d9` }}
            {...pop}
          >
            <motion.button
              type="button"
              className="scroll-escape__btn"
              onClick={goBack}
              whileTap={tapScaleTight}
              aria-label={t('Zurück')}
              title={t('Zurück')}
            >
              <ArrowBack style={{ fontSize: 20 }} />
            </motion.button>
            <motion.button
              type="button"
              className="scroll-escape__btn"
              onClick={goHome}
              whileTap={tapScaleTight}
              aria-label={homeLabel}
              title={homeLabel}
            >
              <HomeLogoIcon />
            </motion.button>
          </motion.div>
        )}
        {state.up && (
          <motion.button
            key="up"
            type="button"
            className="scroll-escape__up"
            onClick={scrollPageToTop}
            whileTap={tapScaleTight}
            aria-label={t('Zum Seitenanfang')}
            title={t('Zum Seitenanfang')}
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              boxShadow: `0 4px 16px ${currentTheme.primary}60`,
              color: getOptimalTextColor(currentTheme.primary),
            }}
            {...pop}
          >
            <ArrowUpward style={{ fontSize: 24 }} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
