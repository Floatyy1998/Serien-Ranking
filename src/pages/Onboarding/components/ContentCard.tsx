import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { memo, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import type { OnboardingItem } from '../hooks/useOnboardingSearch';
import { t } from '../../../services/i18n';

export type WatchSummary =
  | { kind: 'none' }
  | { kind: 'total' }
  | { kind: 'upToEpisode'; seasonNumber: number; episodeNumber: number };

interface Props {
  item: OnboardingItem;
  isAdded: boolean;
  isPending: boolean;
  summary?: WatchSummary;
  onPrimaryTap: (item: OnboardingItem) => void;
  onRemove?: (item: OnboardingItem) => void;
}

function summaryLabel(s: WatchSummary | undefined): string | null {
  if (!s || s.kind === 'none') return null;
  if (s.kind === 'total') return t('gesehen · komplett');
  return t('bei s{s} · e{e}', { s: s.seasonNumber, e: s.episodeNumber });
}

const Plus = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const Check = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M5 12l5 5L20 7"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ContentCard: React.FC<Props> = memo(
  ({ item, isAdded, isPending, summary, onPrimaryTap, onRemove }) => {
    const ref = useRef<HTMLDivElement>(null);
    const rx = useMotionValue(0);
    const ry = useMotionValue(0);
    const rxSpring = useSpring(rx, { stiffness: 200, damping: 20 });
    const rySpring = useSpring(ry, { stiffness: 200, damping: 20 });
    const transform = useTransform(
      [rxSpring, rySpring],
      ([x, y]) => `perspective(900px) rotateX(${y}deg) rotateY(${x}deg)`
    );

    const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const nx = (e.clientX - rect.left) / rect.width - 0.5;
      const ny = (e.clientY - rect.top) / rect.height - 0.5;
      rx.set(nx * 7);
      ry.set(-ny * 6);
    };
    const onLeave = () => {
      rx.set(0);
      ry.set(0);
    };

    const posterUrl = item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : '';
    const year = (item.first_air_date || item.release_date || '').slice(0, 4);
    const rating = item.vote_average && item.vote_average > 0 ? item.vote_average.toFixed(1) : null;
    const title = item.title || item.name || '';
    const sLabel = summaryLabel(summary);

    const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onPrimaryTap(item);
      }
    };

    return (
      <motion.div
        ref={ref}
        role="button"
        tabIndex={0}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        onClick={() => onPrimaryTap(item)}
        onKeyDown={onKey}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.3 }}
        className={`ob-card ${isAdded ? 'ob-card--added' : ''}`}
        style={{ transform }}
      >
        <div
          className="ob-card__poster"
          style={{ backgroundImage: posterUrl ? `url(${posterUrl})` : undefined }}
        >
          {/* Shadow rendered as separate layer for depth */}
          {posterUrl && (
            <div
              className="ob-card__shadow"
              style={{
                backgroundImage: `url(${posterUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
              aria-hidden
            />
          )}

          {isPending && (
            <div className="ob-card__loading">
              <div className="ob-card__spinner" />
            </div>
          )}

          {rating && (
            <div className="ob-card__rating ob-mono" style={{ fontSize: 10 }}>
              {rating}
            </div>
          )}

          <div className="ob-card__action" aria-hidden>
            {isAdded ? Check : Plus}
          </div>

          {isAdded && sLabel && (
            <div className="ob-card__pill ob-mono" style={{ fontSize: 10 }}>
              {sLabel}
            </div>
          )}
        </div>

        <div className="ob-card__meta">
          <h3 className="ob-card__title">{title}</h3>
          <span className="ob-card__year ob-mono" style={{ fontSize: 10 }}>
            {year}
          </span>
        </div>

        {isAdded && onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(item);
            }}
            className="ob-link"
            style={{ padding: '4px 0', alignSelf: 'flex-start', fontSize: 10 }}
          >
            {t('entfernen')}
          </button>
        )}
      </motion.div>
    );
  }
);
ContentCard.displayName = 'ContentCard';
