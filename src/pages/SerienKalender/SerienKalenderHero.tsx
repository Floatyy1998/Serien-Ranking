/**
 * Feature „Serien-Kalender" — Cinematic Hero-Spotlight mit Live-Countdown.
 *
 * Port des AnimeSeasonHero (teilt sich dessen CSS, `as-hero-*`-Klassen): volle
 * Breite über den Sektionen, die nächste Premiere des Monats. TMDB-Backdrop
 * (w780) als Cover mit Scrim + Grain; ohne Backdrop ein Primary-Gradient über
 * dem Theme-Hintergrund. Davor das scharfe 2/3-Poster als stehende Karte.
 *
 * Signature-Moment: ist die Premiere noch in der Zukunft, ticken Glass-Tiles
 * TAGE · STD · MIN · SEK bis Mitternacht des Premierentags. Bei reduced motion
 * tickt nur der Minutenwert. Klick → SeriesDetail (tmdbId bekannt).
 */

import React, { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { Add, CheckCircle } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getOptimalTextColor, lightenColor } from '../../theme/colorUtils';
import { hapticTap } from '../../lib/haptics';
import { MiniProviderBadges } from '../HomePage/sections/MiniProviderBadges';
import { formatStartLong, isSameDay, parsePremiereDate } from './tvPremiereFormat';
import type { TvPremiereStaticEntry } from '../../lib/staticCatalog';

interface SerienKalenderHeroProps {
  entry: TvPremiereStaticEntry;
  /** Eyebrow-Zeile, z. B. „Nächste Premiere" / „Highlight des Monats". */
  eyebrow: string;
  inList: boolean;
  onOpen: () => void;
  onAdd?: () => void;
  adding?: boolean;
}

/** Countdown-Kacheln TAGE · STD · MIN (· SEK) — tickt live. */
function CountdownTiles({ target }: { target: number }) {
  const { currentTheme } = useTheme();
  const reducedMotion = useReducedMotion();
  const [nowTs, setNowTs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowTs(Date.now()), reducedMotion ? 60000 : 1000);
    return () => clearInterval(id);
  }, [reducedMotion]);

  const total = Math.max(0, Math.floor((target - nowTs) / 1000));
  const tiles: { value: number; label: string }[] = [
    { value: Math.floor(total / 86400), label: 'Tage' },
    { value: Math.floor((total % 86400) / 3600), label: 'Std' },
    { value: Math.floor((total % 3600) / 60), label: 'Min' },
    ...(reducedMotion ? [] : [{ value: total % 60, label: 'Sek' }]),
  ];

  return (
    <div className="as-countdown" role="timer" aria-label="Countdown bis zur Premiere">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="as-countdown-tile"
          style={{ borderColor: `${currentTheme.primary}33` }}
        >
          <span className="as-countdown-value">{String(tile.value).padStart(2, '0')}</span>
          <span className="as-countdown-label" style={{ color: 'rgba(255,255,255,0.65)' }}>
            {tile.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export const SerienKalenderHero: React.FC<SerienKalenderHeroProps> = ({
  entry,
  eyebrow,
  inList,
  onOpen,
  onAdd,
  adding = false,
}) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  // Einmalig eingefroren (react-hooks/purity: kein Date.now() im Render).
  const [now] = useState(() => new Date());
  const [descExpanded, setDescExpanded] = useState(false);

  const title = entry.title || 'Unbekannter Titel';
  const backdrop = entry.backdrop || '';
  const cover = entry.poster || '';
  const description = entry.overviewDe || '';
  const providers = (entry.providers || []).filter(
    (p): p is { name: string; logo: string } => typeof p.logo === 'string' && p.logo.length > 0
  );

  const metaLine = [
    entry.type === 'season' && entry.seasonNumber ? `Staffel ${entry.seasonNumber}` : null,
    entry.networks?.[0] ?? null,
    typeof entry.rating === 'number' && entry.rating > 0 ? `★ ${entry.rating.toFixed(1)}` : null,
    entry.genres?.slice(0, 2).join(' · ') || null,
  ]
    .filter(Boolean)
    .join(' · ');

  // Startzeile: zukünftig groß in Accent, gelaufen in Success.
  const brightAccent = lightenColor(currentTheme.accent, 0.35);
  const startDate = parsePremiereDate(entry.premiereDate);
  const target = startDate ? startDate.getTime() : null;
  const isFuture = !!target && target > now.getTime();
  let startLine: string;
  let startColor: string;
  if (startDate && isSameDay(startDate, now)) {
    startLine = isFuture ? 'Startet HEUTE' : 'HEUTE gestartet';
    startColor = brightAccent;
  } else if (isFuture && startDate) {
    startLine = formatStartLong(startDate, now);
    startColor = brightAccent;
  } else {
    startLine = 'Bereits gestartet';
    startColor = currentTheme.status.success;
  }

  const handleOpen = () => {
    hapticTap();
    onOpen();
  };

  return (
    <section
      className="as-hero"
      role="button"
      tabIndex={0}
      aria-label={title}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
      {/* Backdrop: TMDB-Backdrop (cover) — ohne Backdrop ein Primary-Gradient
          über dem Theme-Hintergrund. */}
      {backdrop ? (
        <img src={backdrop} alt="" aria-hidden decoding="async" className="as-hero-backdrop" />
      ) : (
        <div
          className="as-hero-backdrop"
          aria-hidden
          style={{
            background: `linear-gradient(115deg, ${currentTheme.primary}55 0%, ${currentTheme.primary}22 40%, transparent 75%), ${currentTheme.background.surface}`,
          }}
        />
      )}
      <div className="as-hero-scrim" aria-hidden />
      <div className="as-hero-grain" aria-hidden />
      <div className="as-card-gloss" aria-hidden />

      {inList ? (
        <span
          className="as-card-inlist-badge as-hero-inlist"
          style={{ background: `${currentTheme.primary}dd` }}
          title="In deiner Liste"
        >
          <CheckCircle
            style={{ fontSize: '13px', color: getOptimalTextColor(currentTheme.primary) }}
          />
        </span>
      ) : onAdd ? (
        <button
          type="button"
          className="as-card-add as-card-add--hero as-hero-inlist"
          title="Zur Liste hinzufügen"
          aria-label={`${title} zur Liste hinzufügen`}
          aria-busy={adding}
          onClick={(event) => {
            event.stopPropagation();
            if (adding) return;
            hapticTap();
            onAdd();
          }}
          style={{ color: '#fff' }}
        >
          {adding ? (
            <CircularProgress size={16} style={{ color: currentTheme.accent }} />
          ) : (
            <Add style={{ fontSize: '20px' }} />
          )}
        </button>
      ) : null}

      <div className="as-hero-content">
        {cover && (
          <img
            src={cover}
            alt={`Poster von ${title}`}
            loading="lazy"
            decoding="async"
            className="as-hero-poster"
            style={{ background: currentTheme.background.surface }}
          />
        )}

        <div className="as-hero-stack">
          <p className="as-hero-eyebrow" style={{ color: brightAccent }}>
            {eyebrow}
          </p>
          <h2 className="as-hero-title">{title}</h2>
          <p className="as-hero-start" style={{ color: startColor }}>
            {startLine}
          </p>
          {isFuture && target && <CountdownTiles target={target} />}
          {metaLine && <p className="as-hero-meta">{metaLine}</p>}
          {description && (
            <>
              <p className={descExpanded ? 'as-hero-desc as-hero-desc--open' : 'as-hero-desc'}>
                {description}
              </p>
              {description.length > 180 && (
                <button
                  type="button"
                  className="as-card-more"
                  style={{ color: lightenColor(currentTheme.primary, 0.25) }}
                  onClick={(event) => {
                    event.stopPropagation();
                    setDescExpanded((value) => !value);
                  }}
                >
                  {descExpanded ? 'weniger anzeigen' : 'mehr lesen'}
                </button>
              )}
            </>
          )}
          {providers.length > 0 && (
            <div className="as-card-providers" key="prov">
              <span style={{ display: 'contents' }} onClick={(event) => event.stopPropagation()}>
                <MiniProviderBadges
                  providers={providers}
                  isMobile={isMobile}
                  textColor="#fff"
                  searchTitle={title}
                />
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
