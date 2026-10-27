/**
 * ActivityMarquee - subtle horizontal ticker showing the latest friend activity
 * straight on the HomePage. Pulls from the existing friend-activity stream;
 * no extra Firebase fetch. Click anywhere on the strip to deep-link into
 * the Activity feed.
 */

import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsContext';
import { useReducedMotion } from '../../../hooks/ui/useReducedMotion';
import { useTransitionNavigate } from '../../../hooks/ui/useTransitionNavigate';
import type { FriendActivity } from '../../../types/Friend';
import { t } from '../../../services/i18n';
import './ActivityMarquee.css';

// Leisurely reading pace – px per second. Lower = slower.
const MARQUEE_PIXELS_PER_SECOND = 48;

const MAX_ENTRIES = 14;

/** Dauer einer Runde in Sekunden — die CSS-Animation schiebt das Band um genau eine Rundenbreite. */
export function marqueeDuration(lapPx: number): number {
  return lapPx > 0 ? lapPx / MARQUEE_PIXELS_PER_SECOND : 0;
}

/** Lesen-Seite: nur Bücher und Manga; Serien-Startseite: nur Serien und Filme. */
const isReadingActivity = (a: FriendActivity) =>
  a.itemType === 'book' ||
  a.itemType === 'manga' ||
  a.type.startsWith('book_') ||
  a.type.startsWith('manga_');

function formatActivity(a: FriendActivity): string | null {
  const who = a.userName || t('Jemand');
  switch (a.type) {
    case 'series_added':
    case 'manga_added':
    case 'book_added':
      return t('{who} hat „{title}" hinzugefügt', { who, title: a.itemTitle });
    case 'manga_finished':
    case 'book_finished':
      return t('{who} hat „{title}" fertig gelesen', { who, title: a.itemTitle });
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
    case 'manga_rated':
    case 'book_rated':
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

export const ActivityMarquee = memo(function ActivityMarquee({
  scope,
}: {
  scope?: 'watch' | 'read';
}) {
  const { currentTheme } = useTheme();
  const navigate = useTransitionNavigate();
  const { friendActivities } = useOptimizedFriends();
  const prefersReducedMotion = useReducedMotion();

  // Measure one lap's actual rendered width so the scroll speed is exact
  // regardless of font fallback or label content. The track holds two laps
  // (#0 = visible, #1 = pre-rendered tail), so scrollWidth/2 is one lap.
  const lapRef = useRef<HTMLSpanElement | null>(null);
  // Die Rundenbreite bestimmt die Dauer der CSS-Animation; 0 heißt noch nicht gemessen (Band steht).
  const [lap, setLap] = useState(0);
  // Eine echte Maus hält das Band an Ort und Stelle an (animation-play-state), kein Zurückspringen.
  const [paused, setPaused] = useState(false);

  const entries = useMemo(() => {
    const sorted = friendActivities
      .filter((a) => !scope || (scope === 'read') === isReadingActivity(a))
      .sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
      .slice(0, MAX_ENTRIES);
    return sorted
      .map((a) => ({ id: a.id, label: formatActivity(a) }))
      .filter((e): e is { id: string; label: string } => e.label !== null);
  }, [friendActivities, scope]);

  // Neu messen, sobald sich die Liste aendert, eine Schrift nachlaedt oder das
  // Fenster seine Breite aendert — der Beobachter deckt alle drei ab. Eine
  // Messung von 0 wird verworfen statt uebernommen.
  useEffect(() => {
    const el = lapRef.current;
    if (!el) {
      setLap(0);
      return;
    }
    const messen = () => {
      const breite = el.scrollWidth;
      if (breite > 0) setLap((prev) => (Math.abs(prev - breite) > 1 ? breite : prev));
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
        if (event.pointerType === 'mouse') setPaused(true);
      }}
      onPointerLeave={() => {
        setPaused(false);
      }}
      onFocus={() => {
        setPaused(true);
      }}
      onBlur={() => {
        setPaused(false);
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
      <div
        className={`activity-marquee__track${
          prefersReducedMotion || lap === 0 ? ' activity-marquee__track--still' : ''
        }`}
        style={
          {
            '--marquee-lap': `${lap}px`,
            animationDuration: `${marqueeDuration(lap)}s`,
            animationPlayState: paused ? 'paused' : 'running',
          } as React.CSSProperties
        }
      >
        {renderLap(true)}
        {renderLap(false)}
      </div>
    </motion.button>
  );
});

ActivityMarquee.displayName = 'ActivityMarquee';
