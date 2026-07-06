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
import { useDrawInProgress } from '../../hooks/useDrawInProgress';
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

  // Show up to 2 provider logos; from the 3rd provider on, the 3rd slot becomes
  // a "+N" badge instead of a logo (2 providers -> both logos, no badge).
  const MAX_LOGOS = 2;
  const overflow = providers.length - MAX_LOGOS;
  const visible = overflow > 0 ? providers.slice(0, MAX_LOGOS) : providers;

  // Renders a single provider badge as a deep link when a search URL is known,
  // otherwise as a plain div (no broken anchor).
  const renderBadge = (p: PreparedItem['providers'][number]) => {
    const url = getProviderSearchUrl(p.name, searchTitle);
    const className = 'ratings-provider-badge';
    const style: React.CSSProperties = { background: bgColor };
    const content = <img src={p.logo} alt={p.name} loading="lazy" decoding="async" />;
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
      {/* Actual provider logos (up to MAX_VISIBLE) */}
      {visible.map((p) => (
        <React.Fragment key={p.name}>{renderBadge(p)}</React.Fragment>
      ))}

      {/* "+N" badge — same size as a logo, sits to the right of them (not
          overlaid). Only shown when there are MORE providers than are visible. */}
      {overflow > 0 && (
        <button
          type="button"
          className="ratings-provider-badge ratings-provider-count-badge"
          style={{ background: bgColor, color: textColor }}
          onClick={openPopup}
          aria-label={`${overflow} weitere Anbieter`}
          aria-expanded={showPopup}
        >
          +{overflow}
        </button>
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
                    <img src={p.logo} alt={p.name} loading="lazy" decoding="async" />
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
                  <img src={p.logo} alt={p.name} loading="lazy" decoding="async" />
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

export const RatingItemCard = React.memo<RatingItemCardProps>(({ item, theme }) => {
  // D1: --prog wird per rAF animiert ans Karten-Element geschrieben
  // (Draw-In des Fortschritts-Rings), nicht als statischer Inline-Style.
  const cardRef = useRef<HTMLDivElement>(null);
  useDrawInProgress(cardRef, item.isMovie ? 0 : item.progress);

  return (
    // data-poster is read by the grid's click handler so the Detail page poster
    // is already in the browser cache by the time React mounts the route.
    <div
      className="ratings-grid-item"
      data-id={item.id}
      data-movie={item.isMovie || undefined}
      data-poster={item.posterUrl || undefined}
    >
      {/* Card container — no overflow:hidden (iOS Safari fix).
          D1: Serien mit Fortschritt bekommen einen umlaufenden Fortschritts-Ring
          (conic-gradient im ::after, gespeist aus --prog/--ring-color). */}
      <div
        ref={cardRef}
        className={`ratings-card${
          !item.isMovie && item.progress > 0
            ? ` ratings-card--ring${item.progress === 100 ? ' ratings-card--ring-done' : ''}`
            : ''
        }`}
        style={
          {
            '--ring-color': item.progress === 100 ? theme.status.success : theme.primary,
          } as React.CSSProperties
        }
      >
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

            {/* Fortschritt (Serien): der Ring um die Karte trägt die Visualisierung,
              hier bleibt nur der präzise Text (D1 ersetzt den alten Balken). */}
            {!item.isMovie && item.progress > 0 && (
              <div className="ratings-card-progress">
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
  );
});

RatingItemCard.displayName = 'RatingItemCard';
