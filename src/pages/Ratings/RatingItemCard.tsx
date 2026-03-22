/**
 * RatingItemCard - Memoized grid item for the ratings grid.
 *
 * No Framer Motion on grid items (performance).
 * Uses CSS classes for layout, inline styles ONLY for theme colors.
 */

import { Star, WatchLater } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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

// ─── Provider Badge with Popup ──────────────────────────────────────────

function ProviderBadgeArea({
  providers,
  bgColor,
  textColor,
}: {
  providers: PreparedItem['providers'];
  bgColor: string;
  textColor: string;
}) {
  const [showPopup, setShowPopup] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowPopup((v) => {
      if (!v && badgeRef.current) {
        const rect = badgeRef.current.getBoundingClientRect();
        setPopupPos({ top: rect.bottom + 4, left: rect.left });
      }
      return !v;
    });
  }, []);

  // Reposition popup if it overflows the viewport
  useEffect(() => {
    if (!showPopup || !popupRef.current) return;
    const el = popupRef.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    if (rect.right > vw - 8) {
      setPopupPos((prev) => ({ ...prev, left: Math.max(8, vw - rect.width - 8) }));
    }
  }, [showPopup]);

  // Close on outside click
  useEffect(() => {
    if (!showPopup) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        badgeRef.current &&
        !badgeRef.current.contains(target) &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        setShowPopup(false);
      }
    };
    document.addEventListener('pointerdown', handler, true);
    return () => document.removeEventListener('pointerdown', handler, true);
  }, [showPopup]);

  // Desktop: show up to 3 logos, Mobile: show 1 logo
  // Extra logos (index 1,2) get a CSS class that hides them on mobile
  const MAX_DESKTOP = 3;
  const visible = providers.slice(0, MAX_DESKTOP);
  const overflow = providers.length - MAX_DESKTOP;

  return (
    <div className="ratings-provider-badges">
      {/* First provider always visible */}
      <div
        ref={badgeRef}
        className="ratings-provider-badge"
        style={{
          background: bgColor,
          cursor: providers.length > 1 ? 'pointer' : 'default',
          position: 'relative',
        }}
        onClick={providers.length > 1 ? toggle : undefined}
      >
        <img src={visible[0].logo} alt={visible[0].name} />
        {/* Mobile-only counter on first badge */}
        {providers.length > 1 && (
          <span
            className="ratings-provider-count ratings-provider-count--mobile"
            style={{ color: textColor }}
          >
            +{providers.length - 1}
          </span>
        )}
      </div>

      {/* Extra provider logos (desktop only, hidden on mobile) */}
      {visible.slice(1).map((p) => (
        <div
          key={p.name}
          className="ratings-provider-badge ratings-provider-badge--desktop"
          style={{ background: bgColor }}
        >
          <img src={p.logo} alt={p.name} />
        </div>
      ))}

      {/* Desktop overflow counter */}
      {overflow > 0 && (
        <div
          className="ratings-provider-badge ratings-provider-badge--desktop"
          style={{
            background: bgColor,
            fontSize: '11px',
            fontWeight: 700,
            color: textColor,
            cursor: 'pointer',
          }}
          onClick={toggle}
        >
          +{overflow}
        </div>
      )}

      {/* Portal popup so it's not clipped by overflow:hidden */}
      {showPopup &&
        createPortal(
          <div
            ref={popupRef}
            className="ratings-provider-popup"
            style={{
              background: bgColor,
              top: popupPos.top,
              left: popupPos.left,
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {providers.map((p) => (
              <div key={p.name} className="ratings-provider-popup-item">
                <img src={p.logo} alt={p.name} />
                <span style={{ color: textColor }}>{p.name}</span>
              </div>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
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
        <ProviderBadgeArea
          providers={item.providers}
          bgColor={`${theme.background.default}dd`}
          textColor={theme.text.muted}
        />
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
                    ? `linear-gradient(90deg, ${theme.status.success}, ${theme.status.success}cc)`
                    : `linear-gradient(90deg, ${theme.primary}, ${theme.accent || theme.primary})`,
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
