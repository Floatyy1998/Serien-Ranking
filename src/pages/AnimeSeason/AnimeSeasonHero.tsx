/**
 * Feature „Anime-Season-Kalender" — Cinematic Hero-Spotlight mit Live-Countdown.
 *
 * Volle Breite über den Sektionen: die nächste große Premiere der Season
 * (bzw. der populärste laufende Neustart als Fallback). AniList-bannerImage
 * als Backdrop (cover, dunkler Scrim + dezentes Grain); OHNE Banner kein
 * Mega-Blur mehr (sah auf Ultrawide wie ein Matsch-Fleck aus) — stattdessen
 * ein Gradient aus der AniList-Coverfarbe + das geblurrte Cover nur als
 * dezente Textur. Davor IMMER das scharfe 2/3-Poster als stehende Karte.
 *
 * Signature-Moment: läuft ein Countdown zur Premiere (exakt via
 * nextAiringEpisode.airingAt für Ep 1, sonst Mitternacht des Startdatums),
 * ticken darunter Glass-Tiles TAGE · STD · MIN · SEK. Titel + Ziffern sind
 * BEWUSST solid weiß (Shadow/Glow) statt GradientText — Gradient-Schrift
 * war über hellen Backdrops bzw. mit dunklem Accent schlecht lesbar.
 * Bei reduced motion tickt nur der Minutenwert (keine Sekunden-Kachel).
 * Läuft der Anime schon, ersetzt die Success-Startzeile den Countdown.
 * Klick → SeriesDetail; Hydration faded nach.
 */

import React, { useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useDeviceType } from '../../hooks/useDeviceType';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { getOptimalTextColor, lightenColor } from '../../theme/colorUtils';
import { hapticTap } from '../../lib/haptics';
import { MiniProviderBadges } from '../HomePage/sections/MiniProviderBadges';
import {
  buildMetaLine,
  continuationLabel,
  formatStartLong,
  isSameDay,
  shortCountdown,
  startDateToDate,
  stripDescription,
} from './animeFormat';
import type { TmdbProviderInfo } from './resolveTmdbId';
import type { SeasonAnime } from '../../services/anilistSeasonService';

interface AnimeSeasonHeroProps {
  anime: SeasonAnime;
  /** Eyebrow-Zeile, z. B. „Nächste große Premiere" / „Season-Highlight". */
  eyebrow: string;
  inList: boolean;
  resolving: boolean;
  overviewDe: string | null;
  tmdbProviders: TmdbProviderInfo[] | null | undefined;
  onOpen: () => void;
}

/** Exakter Premieren-Zeitpunkt (ms): airingAt von Ep 1, sonst Mitternacht
 *  des Startdatums. airingAt (japanischer TV-Termin) zählt nur, wenn es auf
 *  DENSELBEN Tag fällt — das Startdatum kann von der Page bereits auf den
 *  Kalender-Termin der eigenen Liste (TVMaze) korrigiert worden sein. */
function premiereTarget(anime: SeasonAnime): number | null {
  const date = startDateToDate(anime.startDate);
  if (anime.nextAiringEpisode && anime.nextAiringEpisode.episode === 1) {
    const airing = new Date(anime.nextAiringEpisode.airingAt * 1000);
    if (!date || isSameDay(airing, date)) return airing.getTime();
  }
  return date ? date.getTime() : null;
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
    // Sekunden-Kachel nur ohne reduced motion (sonst tickt nichts sichtbar).
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

export const AnimeSeasonHero: React.FC<AnimeSeasonHeroProps> = ({
  anime,
  eyebrow,
  inList,
  resolving,
  overviewDe,
  tmdbProviders,
  onOpen,
}) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  // Einmalig eingefroren (react-hooks/purity: kein Date.now() im Render).
  const [now] = useState(() => new Date());

  const title = anime.title.english || anime.title.romaji || 'Unbekannter Titel';
  const banner = anime.bannerImage || '';
  const cover = anime.coverImage?.large || '';
  const coverColor = anime.coverImage?.color || currentTheme.primary;
  const description = overviewDe || stripDescription(anime.description);
  // „Staffel 2 · GoHands · 12 Ep. · ★ 76%" — Fortsetzungs-Info zuerst.
  const metaLine = [continuationLabel(anime), buildMetaLine(anime)].filter(Boolean).join(' · ');
  const providers = tmdbProviders ?? [];

  // Startzeile: zukünftig groß in Accent, laufend in Success. Accent wird
  // fürs Dunkel aufgehellt — dunkle Accents (z. B. #008a6e) soffen sonst ab.
  const brightAccent = lightenColor(currentTheme.accent, 0.35);
  const startDate = startDateToDate(anime.startDate);
  const target = premiereTarget(anime);
  const isFuture = !!target && target > now.getTime();
  let startLine: string;
  let startColor: string;
  if (startDate && isSameDay(startDate, now)) {
    startLine = isFuture ? 'Startet HEUTE' : 'HEUTE gestartet';
    startColor = brightAccent;
  } else if (isFuture && startDate) {
    startLine = formatStartLong(startDate, now);
    startColor = brightAccent;
  } else if (anime.nextAiringEpisode) {
    startLine = `Läuft · Ep ${anime.nextAiringEpisode.episode} in ${shortCountdown(
      anime.nextAiringEpisode.timeUntilAiring
    )}`;
    startColor = currentTheme.status.success;
  } else {
    startLine = 'Läuft';
    startColor = currentTheme.status.success;
  }

  const handleOpen = () => {
    if (resolving) return;
    hapticTap();
    onOpen();
  };

  return (
    <section
      className="as-hero"
      role="button"
      tabIndex={0}
      aria-label={title}
      aria-busy={resolving}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpen();
        }
      }}
    >
      {/* Backdrop: bannerImage cover — ohne Banner Coverfarben-Gradient
          über Theme-Hintergrund + geblurrtes Cover nur als dezente Textur. */}
      {banner ? (
        <img src={banner} alt="" aria-hidden decoding="async" className="as-hero-backdrop" />
      ) : (
        <>
          <div
            className="as-hero-backdrop"
            aria-hidden
            style={{
              background: `linear-gradient(115deg, ${coverColor}55 0%, ${coverColor}22 40%, transparent 75%), ${currentTheme.background.surface}`,
            }}
          />
          {cover && (
            <img
              src={cover}
              alt=""
              aria-hidden
              decoding="async"
              className="as-hero-backdrop as-hero-backdrop--texture"
            />
          )}
        </>
      )}
      <div className="as-hero-scrim" aria-hidden />
      <div className="as-hero-grain" aria-hidden />
      <div className="as-card-gloss" aria-hidden />

      {inList && (
        <span
          className="as-card-inlist-badge as-hero-inlist"
          style={{ background: `${currentTheme.primary}dd` }}
          title="In deiner Liste"
        >
          <CheckCircle
            style={{ fontSize: '13px', color: getOptimalTextColor(currentTheme.primary) }}
          />
        </span>
      )}

      <div className="as-hero-content">
        {/* Scharfes 2/3-Poster als stehende Karte vor dem Backdrop */}
        {cover && (
          <img
            src={cover}
            alt={`Poster von ${title}`}
            loading="lazy"
            decoding="async"
            className="as-hero-poster"
            style={{ background: anime.coverImage?.color || currentTheme.background.surface }}
          />
        )}

        <div className="as-hero-stack">
          <p className="as-hero-eyebrow" style={{ color: brightAccent }}>
            {eyebrow}
          </p>
          {/* Solid weiß + Cinematic-Shadow statt GradientText — lesbar auf
              jedem Backdrop (Gradient soff über hellen Bannern ab). */}
          <h2 className="as-hero-title">{title}</h2>
          <p className="as-hero-start" style={{ color: startColor }}>
            {startLine}
          </p>
          {isFuture && target && <CountdownTiles target={target} />}
          {metaLine && <p className="as-hero-meta">{metaLine}</p>}
          {description && (
            <p className="as-hero-desc as-fade" key={overviewDe ? 'desc-de' : 'desc-fallback'}>
              {description}
            </p>
          )}
          {providers.length > 0 && (
            <div className="as-card-providers as-fade" key="prov">
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

      {resolving && (
        <div className="as-card-resolving">
          <CircularProgress size={32} style={{ color: currentTheme.accent }} />
        </div>
      )}
    </section>
  );
};
