/**
 * RatingItemCard - Memoized grid item for the ratings grid.
 *
 * No Framer Motion on grid items (performance).
 * Uses CSS classes for layout, inline styles ONLY for theme colors.
 */

import { Star, WatchLater } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React from 'react';
import type { useTheme } from '../../contexts/ThemeContext';
import type { PreparedItem } from './useRatingsData';

// ─── Constants ──────────────────────────────────────────────────────────

export const PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="100%" height="100%" fill="#1a1a2e"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
    'fill="#666" font-family="Arial" font-size="14">Kein Poster</text></svg>'
)}`;

function handleImgError(e: React.SyntheticEvent<HTMLImageElement>) {
  const target = e.target as HTMLImageElement;
  if (!target.src.includes('data:image/svg')) {
    target.src = PLACEHOLDER_SVG;
  }
}

// ─── Props ──────────────────────────────────────────────────────────────

interface RatingItemCardProps {
  item: PreparedItem;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}

// ─── Component ──────────────────────────────────────────────────────────

export const RatingItemCard = React.memo<RatingItemCardProps>(({ item, theme }) => (
  <div className="ratings-grid-item" data-id={item.id} data-movie={item.isMovie || undefined}>
    <div className="ratings-poster-wrap">
      <img
        src={item.posterUrl || PLACEHOLDER_SVG}
        alt={item.title}
        loading="lazy"
        decoding="async"
        className="ratings-poster-img"
        onError={handleImgError}
        style={{ background: theme.background.surface }}
      />

      {item.providers.length > 0 && (
        <div className="ratings-provider-badges">
          {item.providers.map((p) => (
            <Tooltip key={p.name} title={p.name} arrow>
              <div
                className="ratings-provider-badge"
                style={{ background: `${theme.background.default}dd` }}
              >
                <img src={p.logo} alt={p.name} />
              </div>
            </Tooltip>
          ))}
        </div>
      )}

      {item.rating > 0 && (
        <Tooltip title={`Bewertung: ${item.rating.toFixed(1)}/10`} arrow>
          <div className="ratings-rating-badge">
            <Star className="ratings-star-icon" />
            <span className="ratings-rating-value">{item.rating.toFixed(1)}</span>
          </div>
        </Tooltip>
      )}

      {item.watchlist && (
        <Tooltip title="Auf deiner Watchlist" arrow>
          <div
            className="ratings-watchlist-badge"
            style={{ top: item.rating > 0 ? 42 : 6, background: `${theme.status.info}dd` }}
          >
            <WatchLater className="ratings-watchlist-icon" />
          </div>
        </Tooltip>
      )}

      {!item.isMovie && item.progress > 0 && (
        <Tooltip title={`${item.progress}% gesehen`} arrow>
          <div className="ratings-progress-track">
            <div
              className="ratings-progress-fill"
              style={{
                width: `${item.progress}%`,
                background:
                  item.progress === 100
                    ? `linear-gradient(90deg, ${theme.status.success}, #10b981)`
                    : `linear-gradient(90deg, ${theme.primary}, ${theme.secondary ?? 'var(--theme-secondary-gradient, #8b5cf6)'})`,
              }}
            />
          </div>
        </Tooltip>
      )}
    </div>

    <h2 className="ratings-item-title" style={{ color: theme.text.primary }}>
      {item.title}
    </h2>

    {!item.isMovie && item.progress > 0 && (
      <p
        className="ratings-item-meta"
        style={{
          color: item.progress === 100 ? theme.status.success : theme.primary,
          fontWeight: 600,
        }}
      >
        {item.progress === 100 ? 'Fertig' : `${Math.round(item.progress)}%`}
      </p>
    )}

    {item.isMovie && item.releaseDate && (
      <p className="ratings-item-meta" style={{ color: theme.text.muted }}>
        {item.releaseDate.split('-')[0]}
      </p>
    )}
  </div>
));

RatingItemCard.displayName = 'RatingItemCard';
