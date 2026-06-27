/**
 * RatingItemCard - Cinematic poster card for the ratings grid.
 *
 * No Framer Motion on grid items (performance).
 * Uses CSS classes for layout, inline styles ONLY for theme colors.
 */

import { Star, WatchLater } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { useTheme } from '../../contexts/ThemeContextDef';
import {
  getProviderSearchUrl,
  handleProviderLinkClick,
  providerNeedsClipboardCopy,
} from '../../lib/providerLinks';
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
  searchTitle,
}: {
  providers: PreparedItem['providers'];
  bgColor: string;
  textColor: string;
  searchTitle: string;
}) {
  const [showPopup, setShowPopup] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPos, setPopupPos] = useState({ top: 0, left: 0 });

  const openPopup = useCallback((e: React.MouseEvent) => {
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
  const MAX_DESKTOP = 3;
  const visible = providers.slice(0, MAX_DESKTOP);
  const overflow = providers.length - MAX_DESKTOP;

  // Renders a single provider badge as a deep link when a search URL is known,
  // otherwise as a plain div (no broken anchor). The mobile +N counter overlay
  // is rendered as an absolute-positioned span that intercepts its own click
  // to open the popup instead of navigating to the link.
  const renderBadge = (p: PreparedItem['providers'][number], extraClass = '') => {
    const url = getProviderSearchUrl(p.name, searchTitle);
    const className = `ratings-provider-badge${extraClass ? ` ${extraClass}` : ''}`;
    const style: React.CSSProperties = { background: bgColor };
    const content = <img src={p.logo} alt={p.name} />;
    const tooltip = providerNeedsClipboardCopy(p.name)
      ? `${p.name}: Titel kopieren + Suche öffnen`
      : `${p.name} öffnen`;
    if (!url) {
      return (
        <div className={className} style={style} title={p.name}>
          {content}
        </div>
      );
    }
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={{ ...style, textDecoration: 'none' }}
        onClick={(e) => handleProviderLinkClick(e, p.name, searchTitle, url)}
        title={tooltip}
      >
        {content}
      </a>
    );
  };

  return (
    <div className="ratings-provider-badges" ref={badgeRef}>
      {/* First provider — direct link, with optional +N popup trigger overlay */}
      <div style={{ position: 'relative' }}>
        {renderBadge(visible[0])}
        {/* Mobile-only +N overlay opens the popup with the full list. */}
        {providers.length > 1 && (
          <span
            className="ratings-provider-count ratings-provider-count--mobile"
            style={{ color: textColor, cursor: 'pointer' }}
            onClick={openPopup}
          >
            +{providers.length - 1}
          </span>
        )}
      </div>

      {/* Extra provider logos (desktop only, hidden on mobile) */}
      {visible.slice(1).map((p) => (
        <React.Fragment key={p.name}>
          {renderBadge(p, 'ratings-provider-badge--desktop')}
        </React.Fragment>
      ))}

      {/* Desktop overflow counter — opens popup with the full list */}
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
          onClick={openPopup}
        >
          +{overflow}
        </div>
      )}

      {/* Portal popup so it's not clipped by parent overflow rules */}
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
            }}
          >
            {providers.map((p) => {
              const url = getProviderSearchUrl(p.name, searchTitle);
              if (!url) {
                return (
                  <div key={p.name} className="ratings-provider-popup-item">
                    <img src={p.logo} alt={p.name} />
                    <span style={{ color: textColor }}>{p.name}</span>
                  </div>
                );
              }
              return (
                <a
                  key={p.name}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ratings-provider-popup-item"
                  style={{ textDecoration: 'none' }}
                  onClick={(e) => {
                    handleProviderLinkClick(e, p.name, searchTitle, url);
                    setShowPopup(false);
                  }}
                >
                  <img src={p.logo} alt={p.name} />
                  <span style={{ color: textColor }}>{p.name}</span>
                </a>
              );
            })}
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
  // data-poster is read by the grid's click handler so the Detail page poster
  // is already in the browser cache by the time React mounts the route.
  <div
    className="ratings-grid-item"
    data-id={item.id}
    data-movie={item.isMovie || undefined}
    data-poster={item.posterUrl || undefined}
  >
    {/* Card container — no overflow:hidden (iOS Safari fix) */}
    <div className="ratings-card">
      {/* Poster image — shared element for the View Transitions API.
          The `view-transition-name` must be unique per element, so we key it
          by media type + id. Browsers without VT support ignore the style.
          See global.css → @view-transition. */}
      <img
        src={item.posterUrl || PLACEHOLDER_SVG}
        alt={item.title}
        loading="lazy"
        decoding="async"
        className="ratings-card-poster"
        onError={handleImgError}
        style={{
          background: theme.background.surface,
          viewTransitionName: `poster-${item.isMovie ? 'movie' : 'series'}-${item.id}`,
        }}
      />

      {/* Full overlay */}
      <div className="ratings-card-overlay">
        {/* Top row: providers left, type+watchlist+rating right */}
        <div className="ratings-card-top">
          {/* Left: provider badges */}
          <div className="ratings-card-top-left">
            {item.providers.length > 0 && (
              <ProviderBadgeArea
                providers={item.providers}
                bgColor={`${theme.background.default}dd`}
                textColor={theme.text.muted}
                searchTitle={item.title}
              />
            )}
          </div>

          {/* Right: watchlist badge */}
          <div className="ratings-card-top-right">
            {item.watchlist && (
              <Tooltip title="Auf deiner Watchlist" arrow>
                <div
                  className="ratings-card-watchlist-badge"
                  style={{ background: `${theme.status.info}dd` }}
                >
                  <WatchLater style={{ fontSize: '13px', color: '#fff' }} />
                </div>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Bottom: gradient + title + meta */}
        <div className="ratings-card-bottom">
          <h2 className="ratings-card-title">{item.title}</h2>

          <div className="ratings-card-meta">
            {/* Rating */}
            {item.rating > 0 && (
              <span className="ratings-card-rating" style={{ color: theme.status.warning }}>
                <Star className="ratings-card-meta-icon" />
                {item.rating.toFixed(1)}
              </span>
            )}

            {/* Year */}
            {item.rating > 0 && item.year && <span className="ratings-card-dot">&bull;</span>}
            {item.year && <span>{item.year}</span>}

            {/* Genres */}
            {item.year && item.genres && <span className="ratings-card-dot">&bull;</span>}
            {item.genres && <span className="ratings-card-genres">{item.genres}</span>}
          </div>

          {/* Progress bar for series */}
          {!item.isMovie && item.progress > 0 && (
            <div className="ratings-card-progress">
              <div className="ratings-card-progress-track">
                <div
                  className="ratings-card-progress-fill"
                  style={{
                    width: `${item.progress}%`,
                    background:
                      item.progress === 100
                        ? theme.status.success
                        : `linear-gradient(90deg, ${theme.primary}, ${theme.accent || theme.primary})`,
                  }}
                />
              </div>
              <span
                className="ratings-card-progress-text"
                style={{
                  color: item.progress === 100 ? theme.status.success : theme.primary,
                }}
              >
                {item.progress === 100 ? 'Fertig' : `${Math.round(item.progress)}%`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
));

RatingItemCard.displayName = 'RatingItemCard';
