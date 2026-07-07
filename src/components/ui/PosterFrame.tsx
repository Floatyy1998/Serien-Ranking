import React, { useCallback } from 'react';
import { getImageUrl, type TmdbImageSize } from '../../utils/imageUrl';
import { handleImgError } from '../../lib/posterPlaceholder';

interface PosterFrameProps {
  /** TMDB poster path (wird via getImageUrl aufgelöst) ODER fertige URL. */
  posterPath?: string | null;
  /** Alternativ direkt eine fertige Bild-URL (z.B. bereits aufgelöst). */
  posterUrl?: string;
  alt: string;
  imageSize?: TmdbImageSize;
  /** Bottom-to-top-Scrim für lesbare Overlays. Default an. */
  scrim?: boolean;
  scrimColor?: string;
  radius?: string;
  boxShadow?: string;
  background?: string;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  /** Klasse/Style fürs <img> — für Karten, deren CSS das Bild über Klassen stylt. */
  imgClassName?: string;
  imgStyle?: React.CSSProperties;
  /** Overlays (Badges, Buttons, Rang, Ring, Info-Panel) — card-spezifisch. */
  children?: React.ReactNode;
}

/**
 * Gemeinsames Poster-Gerüst aller Poster-Karten (Discover/Search/Rating/…):
 * 2:3-Bild mit zentralem Fehler-Fallback (`lib/posterPlaceholder`), optionalem
 * Gradient-Scrim und einem Overlay-Slot. Jede Karte legt ihre eigenen Overlays
 * als `children` darüber — dadurch bleiben Eigenheiten (Rang, Ring, Info-Panel,
 * Deep-Links) unverändert erhalten, während das duplizierte Grundgerüst
 * einmalig hier lebt.
 */
export const PosterFrame: React.FC<PosterFrameProps> = ({
  posterPath,
  posterUrl,
  alt,
  imageSize = 'w500',
  scrim = true,
  scrimColor,
  radius = 'var(--radius-lg)',
  boxShadow,
  background,
  onClick,
  ariaLabel,
  className,
  style,
  imgClassName,
  imgStyle,
  children,
}) => {
  const src = posterUrl ?? getImageUrl(posterPath ?? null, imageSize);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!onClick) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  const interactive = Boolean(onClick);

  return (
    <div
      className={className}
      onClick={onClick}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? ariaLabel : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '2 / 3',
        borderRadius: radius,
        overflow: 'hidden',
        cursor: interactive ? 'pointer' : undefined,
        boxShadow,
        background,
        ...style,
      }}
    >
      <img
        src={src}
        alt={alt}
        onError={handleImgError}
        loading="lazy"
        decoding="async"
        className={imgClassName}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...imgStyle }}
      />
      {scrim && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '60%',
            background: scrimColor
              ? `linear-gradient(to top, ${scrimColor} 0%, transparent 100%)`
              : 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />
      )}
      {children}
    </div>
  );
};
