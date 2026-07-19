import React from 'react';
import { t } from '../../services/i18n';

interface SkeletonProps {
  /** width/height in px or any valid CSS length */
  width?: number | string;
  height?: number | string;
  /** Border-radius preset */
  shape?: 'rect' | 'card' | 'circle' | 'pill' | 'text';
  /** Inline-style escape hatch */
  style?: React.CSSProperties;
  className?: string;
}

const RADIUS: Record<NonNullable<SkeletonProps['shape']>, string> = {
  rect: '6px',
  card: '16px',
  circle: '50%',
  pill: '9999px',
  text: '4px',
};

/**
 * Single shimmer-skeleton primitive. Pair it with composed presets below.
 * Uses the existing `.skeleton-shimmer` class from global.css so animation +
 * colors stay consistent with the design tokens.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  shape = 'rect',
  style,
  className,
}) => (
  <div
    aria-hidden
    className={`skeleton-shimmer ${className ?? ''}`}
    style={{
      width,
      height,
      borderRadius: RADIUS[shape],
      flexShrink: 0,
      ...style,
    }}
  />
);

/** Poster card with title + meta below. Used for HomePage carousels and lists. */
export const SkeletonPosterCard: React.FC<{ width?: number }> = ({ width = 140 }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      width,
      flexShrink: 0,
    }}
  >
    <Skeleton width={width} height={width * 1.5} shape="card" />
    <Skeleton width="80%" height={12} shape="text" />
    <Skeleton width="50%" height={10} shape="text" />
  </div>
);

/** Horizontal row of poster cards — for carousel sections during initial load. */
export const SkeletonPosterRow: React.FC<{ count?: number; posterWidth?: number }> = ({
  count = 6,
  posterWidth = 140,
}) => (
  <div
    style={{
      display: 'flex',
      gap: 12,
      overflow: 'hidden',
      padding: '0 20px',
    }}
    role="status"
    aria-label={t('Lade Inhalte')}
  >
    {Array.from({ length: count }, (_, i) => (
      <SkeletonPosterCard key={i} width={posterWidth} />
    ))}
  </div>
);

/** List row with avatar/circle + two text lines. For Ratings, Activity, Friend lists. */
export const SkeletonListRow: React.FC<{ avatarShape?: 'circle' | 'card' }> = ({
  avatarShape = 'circle',
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 0',
    }}
  >
    <Skeleton width={42} height={42} shape={avatarShape} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Skeleton width="60%" height={14} shape="text" />
      <Skeleton width="40%" height={12} shape="text" />
    </div>
  </div>
);

/** Grid of rating cards — Ratings page initial load. */
export const SkeletonRatingsGrid: React.FC<{ count?: number }> = ({ count = 12 }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
      gap: 16,
      padding: '0 16px',
    }}
    role="status"
    aria-label={t('Lade Bewertungen')}
  >
    {Array.from({ length: count }, (_, i) => (
      <SkeletonPosterCard key={i} />
    ))}
  </div>
);
