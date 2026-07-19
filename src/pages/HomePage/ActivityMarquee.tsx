/**
 * ActivityMarquee - subtle horizontal ticker showing the latest friend activity
 * straight on the HomePage. Pulls from the existing friend-activity stream;
 * no extra Firebase fetch. Click anywhere on the strip to deep-link into
 * the Activity feed.
 */

import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTransitionNavigate } from '../../hooks/useTransitionNavigate';
import type { FriendActivity } from '../../types/Friend';
import { t } from '../../services/i18n';

// Leisurely reading pace – px per second. Lower = slower.
const MARQUEE_PIXELS_PER_SECOND = 48;

const MAX_ENTRIES = 14;

function formatActivity(a: FriendActivity): string | null {
  const who = a.userName || t('Jemand');
  switch (a.type) {
    case 'series_added':
      return t('{who} hat „{title}" hinzugefügt', { who, title: a.itemTitle });
    case 'movie_added':
      return t('{who} hat „{title}" hinzugefügt', { who, title: a.itemTitle });
    case 'series_added_to_watchlist':
    case 'movie_added_to_watchlist':
      return t('{who} hat „{title}" auf die Watchlist gesetzt', { who, title: a.itemTitle });
    case 'episode_watched':
      return t('{who} hat eine Folge von „{title}" gesehen', { who, title: a.itemTitle });
    case 'episodes_watched':
      return t('{who} bingt gerade „{title}"', { who, title: a.itemTitle });
    case 'series_rated':
    case 'movie_rated':
    case 'rating_updated':
    case 'rating_updated_movie':
      return typeof a.rating === 'number'
        ? t('{who} hat „{title}" mit {rating} bewertet', {
            who,
            title: a.itemTitle,
            rating: a.rating.toFixed(1),
          })
        : t('{who} hat „{title}" bewertet', { who, title: a.itemTitle });
    case 'series_deleted':
    case 'movie_deleted':
    case 'series_removed_from_watchlist':
    case 'movie_removed_from_watchlist':
      return null; // skip negative noise
    default:
      return null;
  }
}

export const ActivityMarquee = memo(function ActivityMarquee() {
  const { currentTheme } = useTheme();
  const navigate = useTransitionNavigate();
  const { friendActivities } = useOptimizedFriends();
  const prefersReducedMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState(false);

  // Measure one lap's actual rendered width so the scroll speed is exact
  // regardless of font fallback or label content. The track holds two laps
  // (#0 = visible, #1 = pre-rendered tail), so scrollWidth/2 is one lap.
  const lapRef = useRef<HTMLSpanElement | null>(null);
  const [lapWidth, setLapWidth] = useState(0);

  // Drive the scroll via a MotionValue + rAF loop. This lets us pause
  // *at the current x* on hover instead of animating back to 0.
  const x = useMotionValue(0);
  const isPausedRef = useRef(false);
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    if (prefersReducedMotion || lapWidth === 0) {
      x.set(0);
      return;
    }
    let rafId = 0;
    let lastT = 0;
    const tick = (t: number) => {
      if (lastT === 0) {
        lastT = t;
        rafId = requestAnimationFrame(tick);
        return;
      }
      const delta = t - lastT;
      lastT = t;
      if (!isPausedRef.current) {
        let next = x.get() - (delta / 1000) * MARQUEE_PIXELS_PER_SECOND;
        // Seamless wrap: when we've scrolled a full lap, jump back by lap
        // length so the second copy seamlessly takes over.
        if (next <= -lapWidth) next += lapWidth;
        x.set(next);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [prefersReducedMotion, lapWidth, x]);

  const entries = useMemo(() => {
    const sorted = [...friendActivities]
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .slice(0, MAX_ENTRIES);
    return sorted
      .map((a) => ({ id: a.id, label: formatActivity(a) }))
      .filter((e): e is { id: string; label: string } => e.label !== null);
  }, [friendActivities]);

  // Re-measure whenever the entry list changes or the viewport resizes.
  useLayoutEffect(() => {
    const el = lapRef.current;
    if (!el) return;
    setLapWidth(el.scrollWidth);
  }, [entries]);

  useEffect(() => {
    const onResize = () => {
      const el = lapRef.current;
      if (el) setLapWidth(el.scrollWidth);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (entries.length === 0) return null;

  const separator = (
    <span
      aria-hidden
      style={{
        margin: '0 14px',
        color: currentTheme.text.muted,
        opacity: 0.6,
      }}
    >
      ·
    </span>
  );

  const renderLap = (refIt: boolean) => (
    <span
      ref={refIt ? lapRef : undefined}
      style={{
        display: 'inline-flex',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
    >
      {entries.map((e) => (
        <span
          key={e.id}
          style={{
            whiteSpace: 'nowrap',
            color: currentTheme.text.secondary,
            fontSize: 12.5,
            fontWeight: 500,
            letterSpacing: '-0.01em',
          }}
        >
          {e.label}
          {separator}
        </span>
      ))}
    </span>
  );

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      onClick={() => navigate('/activity')}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-label={t('Aktivitäten deiner Freunde anzeigen')}
      style={{
        position: 'relative',
        width: 'calc(100% - 40px)',
        margin: '0 auto 14px',
        padding: '7px 0',
        borderRadius: 999,
        background: `linear-gradient(135deg, color-mix(in srgb, ${currentTheme.primary} 8%, transparent), color-mix(in srgb, ${currentTheme.accent} 5%, transparent)), var(--glass-subtle)`,
        border: `1px solid color-mix(in srgb, ${currentTheme.primary} 18%, transparent)`,
        boxShadow: 'var(--glass-specular)',
        WebkitBackdropFilter: 'var(--glass-filter-sm)',
        backdropFilter: 'var(--glass-filter-sm)',
        overflow: 'hidden',
        cursor: 'pointer',
        display: 'block',
        fontFamily: 'inherit',
      }}
    >
      {/* Side fades for that subtle "ticker" feel */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: 32,
          background: `linear-gradient(to right, ${currentTheme.background.default}, transparent)`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          width: 32,
          background: `linear-gradient(to left, ${currentTheme.background.default}, transparent)`,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />
      <motion.div
        style={{
          display: 'flex',
          width: 'max-content',
          willChange: 'transform',
          x,
        }}
      >
        {renderLap(true)}
        {renderLap(false)}
      </motion.div>
    </motion.button>
  );
});

ActivityMarquee.displayName = 'ActivityMarquee';
