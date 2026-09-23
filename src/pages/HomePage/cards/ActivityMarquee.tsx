/**
 * ActivityMarquee - subtle horizontal ticker showing the latest friend activity
 * straight on the HomePage. Pulls from the existing friend-activity stream;
 * no extra Firebase fetch. Click anywhere on the strip to deep-link into
 * the Activity feed.
 */

import { memo, useEffect, useMemo, useRef } from 'react';
import { motion, useMotionValue } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsContext';
import { useReducedMotion } from '../../../hooks/ui/useReducedMotion';
import { useTransitionNavigate } from '../../../hooks/ui/useTransitionNavigate';
import type { FriendActivity } from '../../../types/Friend';
import { t } from '../../../services/i18n';

// Leisurely reading pace – px per second. Lower = slower.
const MARQUEE_PIXELS_PER_SECOND = 48;

const MAX_ENTRIES = 14;

/**
 * Naechste Position des Bandes. Eine volle Runde wird zurueckgesetzt, damit die
 * zweite Kopie nahtlos uebernimmt — per Modulo, weil nach einer kuerzeren
 * Liste mehrere Runden auf einmal aufzuholen sein koennen.
 */
export function naechstePosition(aktuell: number, deltaMs: number, lap: number): number {
  const next = aktuell - (deltaMs / 1000) * MARQUEE_PIXELS_PER_SECOND;
  return next <= -lap ? -(-next % lap) : next;
}

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

  // Measure one lap's actual rendered width so the scroll speed is exact
  // regardless of font fallback or label content. The track holds two laps
  // (#0 = visible, #1 = pre-rendered tail), so scrollWidth/2 is one lap.
  const lapRef = useRef<HTMLSpanElement | null>(null);
  // Die Breite liegt im Ref, nicht im State: sie ist nur fuer die Schleife da,
  // und eine 0 darf sie nie anhalten (siehe unten).
  const lapWidthRef = useRef(0);

  // Drive the scroll via a MotionValue + rAF loop. This lets us pause
  // *at the current x* on hover instead of animating back to 0.
  const x = useMotionValue(0);
  const isPausedRef = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      x.set(0);
      return;
    }
    let rafId = 0;
    let lastT = 0;
    const tick = (t: number) => {
      rafId = requestAnimationFrame(tick);
      if (lastT === 0) {
        lastT = t;
        return;
      }
      // Nach einem Tab-Wechsel liegen Sekunden zwischen zwei Frames — ohne
      // Deckel springt das Band beim Zurueckkommen weit nach vorn.
      const delta = Math.min(t - lastT, 100);
      lastT = t;
      if (isPausedRef.current) return;

      // Die Breite kommt aus dem DOM statt aus dem Render: beim Wechsel auf die
      // Startseite (View Transition) steht das frisch eingehaengte Band beim
      // ersten Messen noch ohne Layout da. Frueher hielt diese eine 0 das Band
      // dauerhaft an — jetzt versucht es die Schleife im naechsten Frame erneut.
      let lap = lapWidthRef.current;
      if (lap === 0) {
        lap = lapRef.current?.scrollWidth ?? 0;
        if (lap === 0) return;
        lapWidthRef.current = lap;
      }

      x.set(naechstePosition(x.get(), delta, lap));
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [prefersReducedMotion, x]);

  const entries = useMemo(() => {
    const sorted = [...friendActivities]
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .slice(0, MAX_ENTRIES);
    return sorted
      .map((a) => ({ id: a.id, label: formatActivity(a) }))
      .filter((e): e is { id: string; label: string } => e.label !== null);
  }, [friendActivities]);

  // Neu messen, sobald sich die Liste aendert, eine Schrift nachlaedt oder das
  // Fenster seine Breite aendert — der Beobachter deckt alle drei ab. Eine
  // Messung von 0 wird verworfen statt uebernommen.
  useEffect(() => {
    const el = lapRef.current;
    if (!el) {
      lapWidthRef.current = 0;
      return;
    }
    const messen = () => {
      const breite = el.scrollWidth;
      if (breite > 0) lapWidthRef.current = breite;
    };
    messen();
    const beobachter = new ResizeObserver(messen);
    beobachter.observe(el);
    return () => beobachter.disconnect();
  }, [entries]);

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
      // Nur eine echte Maus haelt an: ein Tipp auf dem Handy loest in manchen
      // Browsern ein Enter ohne Leave aus und liesse das Band stehen.
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') isPausedRef.current = true;
      }}
      onPointerLeave={() => {
        isPausedRef.current = false;
      }}
      onFocus={() => {
        isPausedRef.current = true;
      }}
      onBlur={() => {
        isPausedRef.current = false;
      }}
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
