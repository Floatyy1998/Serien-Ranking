import { memo, useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { buildThemedPlaceholderDataUrl } from '../../utils/themedPlaceholder';

/**
 * Poster-Bild mit automatischem Retry + Themed-Placeholder-Fallback.
 *
 * Warum: TMDB-Poster (image.tmdb.org) schlagen auf mobilen/gedrosselten
 * Netzen oder beim Ausreizen des Browser-Verbindungslimits sporadisch fehl.
 * Ein nacktes <img loading="lazy"> bleibt dann DAUERHAFT leer — kein zweiter
 * Versuch. Diese Komponente lädt bei Fehler bis zu 2× neu (Cache-Buster, damit
 * eine gecachte Fehlantwort nicht wiederverwendet wird) und zeigt danach das
 * THEME-adaptive Placeholder (buildThemedPlaceholderDataUrl, wie die Suche) —
 * passt sich an das aktuelle Theme an, kein fester Cyan/Violett-Look.
 */

interface PosterImageProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
  loading?: 'lazy' | 'eager';
}

const MAX_RETRIES = 2;

export const PosterImage = memo(
  ({ src, alt, style, className, loading = 'lazy' }: PosterImageProps) => {
    const { currentTheme } = useTheme();
    const [attempt, setAttempt] = useState(0);
    const [failed, setFailed] = useState(false);

    const placeholder = useMemo(
      () =>
        buildThemedPlaceholderDataUrl(
          currentTheme.primary,
          currentTheme.secondary || currentTheme.accent
        ),
      [currentTheme.primary, currentTheme.secondary, currentTheme.accent]
    );

    // src-Wechsel (Recycling im Carousel) → Zustand zurücksetzen.
    useEffect(() => {
      setAttempt(0);
      setFailed(false);
    }, [src]);

    // Cache-Buster ab dem ersten Retry — erzwingt eine frische Anfrage.
    const resolvedSrc =
      failed || !src
        ? placeholder
        : attempt === 0
          ? src
          : `${src}${src.includes('?') ? '&' : '?'}retry=${attempt}`;

    return (
      <img
        key={failed ? 'placeholder' : attempt}
        src={resolvedSrc}
        alt={alt}
        decoding="async"
        loading={loading}
        className={className}
        style={style}
        // Eigenes Retry + Fallback → globaler Retry-Handler überspringt dieses Bild.
        data-poster-image="true"
        onError={() => {
          if (attempt < MAX_RETRIES) {
            const next = attempt + 1;
            // Kleiner Backoff, damit ein kurzer Netz-Aussetzer abklingen kann.
            setTimeout(() => setAttempt(next), 350 * next);
          } else {
            setFailed(true);
          }
        }}
      />
    );
  }
);

PosterImage.displayName = 'PosterImage';
