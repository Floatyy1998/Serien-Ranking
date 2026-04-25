/**
 * ProfileItemCard - Cinematic poster card for FriendProfile and PublicProfile pages.
 *
 * Mirrors the visual language of the /ratings page (RatingItemCard) but without
 * the user-specific watch-progress bar (since friend/public hooks don't load
 * episode-level watch state).
 */

import { Star } from '@mui/icons-material';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './ProfileItemCard.css';

export interface ProfileCardProvider {
  id: number;
  name: string;
  logo: string;
}

interface CardTheme {
  primary: string;
  secondary?: string;
  accent?: string;
  background: { default: string; surface: string };
  text: { primary: string; muted?: string; secondary?: string };
  status?: { success?: string; warning?: string };
}

const PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(
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

/* ------------------------------------------------------------------ */
/*  Provider Badge area with popup                                     */
/* ------------------------------------------------------------------ */

function ProviderBadgeArea({
  providers,
  bgColor,
  textColor,
}: {
  providers: ProfileCardProvider[];
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

  useEffect(() => {
    if (!showPopup || !popupRef.current) return;
    const el = popupRef.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    if (rect.right > vw - 8) {
      setPopupPos((prev) => ({ ...prev, left: Math.max(8, vw - rect.width - 8) }));
    }
  }, [showPopup]);

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

  const MAX_DESKTOP = 3;
  const visible = providers.slice(0, MAX_DESKTOP);
  const overflow = providers.length - MAX_DESKTOP;

  return (
    <div className="pic-provider-badges">
      <div
        ref={badgeRef}
        className="pic-provider-badge"
        style={{
          background: bgColor,
          cursor: providers.length > 1 ? 'pointer' : 'default',
          position: 'relative',
        }}
        onClick={providers.length > 1 ? toggle : undefined}
      >
        <img src={visible[0].logo} alt={visible[0].name} />
        {providers.length > 1 && (
          <span
            className="pic-provider-count pic-provider-count--mobile"
            style={{ color: textColor }}
          >
            +{providers.length - 1}
          </span>
        )}
      </div>

      {visible.slice(1).map((p) => (
        <div
          key={p.name}
          className="pic-provider-badge pic-provider-badge--desktop"
          style={{ background: bgColor }}
        >
          <img src={p.logo} alt={p.name} />
        </div>
      ))}

      {overflow > 0 && (
        <div
          className="pic-provider-badge pic-provider-badge--desktop"
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

      {showPopup &&
        createPortal(
          <div
            ref={popupRef}
            className="pic-provider-popup"
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
              <div key={p.name} className="pic-provider-popup-item">
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

/* ------------------------------------------------------------------ */
/*  Main card                                                          */
/* ------------------------------------------------------------------ */

interface ProfileItemCardProps {
  title: string;
  posterUrl: string;
  isMovie: boolean;
  rating: number;
  /** Optional progress (0-100). When undefined, no progress bar is rendered. */
  progress?: number;
  providers: ProfileCardProvider[];
  year?: string;
  genres?: string;
  index?: number;
  currentTheme: CardTheme;
  onClick: () => void;
}

export const ProfileItemCard = React.memo<ProfileItemCardProps>(
  ({
    title,
    posterUrl,
    isMovie,
    rating,
    progress,
    providers,
    year,
    genres,
    currentTheme,
    onClick,
  }) => {
    const warningColor = currentTheme.status?.warning ?? '#ffc107';
    const successColor = currentTheme.status?.success ?? '#10b981';
    const accentColor = currentTheme.accent ?? currentTheme.primary;
    const mutedColor = currentTheme.text.muted ?? currentTheme.text.secondary ?? '#9aa0a6';

    return (
      <div className="pic-grid-item" onClick={onClick}>
        <div className="pic-card">
          <img
            src={posterUrl || PLACEHOLDER_SVG}
            alt={title}
            loading="lazy"
            decoding="async"
            className="pic-card-poster"
            onError={handleImgError}
            style={{ background: currentTheme.background.surface }}
          />

          <div className="pic-card-overlay">
            <div className="pic-card-top">
              <div className="pic-card-top-left">
                {providers.length > 0 && (
                  <ProviderBadgeArea
                    providers={providers}
                    bgColor={`${currentTheme.background.default}dd`}
                    textColor={mutedColor}
                  />
                )}
              </div>
            </div>

            <div className="pic-card-bottom">
              <h2 className="pic-card-title">{title}</h2>

              <div className="pic-card-meta">
                {rating > 0 && (
                  <span className="pic-card-rating" style={{ color: warningColor }}>
                    <Star className="pic-card-meta-icon" />
                    {rating.toFixed(1)}
                  </span>
                )}

                {rating > 0 && year && <span className="pic-card-dot">&bull;</span>}
                {year && <span>{year}</span>}

                {year && genres && <span className="pic-card-dot">&bull;</span>}
                {genres && <span className="pic-card-genres">{genres}</span>}
              </div>

              {!isMovie && progress != null && progress > 0 && (
                <div className="pic-card-progress">
                  <div className="pic-card-progress-track">
                    <div
                      className="pic-card-progress-fill"
                      style={{
                        width: `${progress}%`,
                        background:
                          progress === 100
                            ? successColor
                            : `linear-gradient(90deg, ${currentTheme.primary}, ${accentColor})`,
                      }}
                    />
                  </div>
                  <span
                    className="pic-card-progress-text"
                    style={{ color: progress === 100 ? successColor : currentTheme.primary }}
                  >
                    {progress === 100 ? 'Fertig' : `${Math.round(progress)}%`}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ProfileItemCard.displayName = 'ProfileItemCard';
