/**
 * Feature „Anime-Season-Kalender" — QUERFORMAT-Karte („Premieren-Ticket").
 *
 * Eine einheitliche, liegende Karte: scharfes 2/3-Poster links (volle
 * Kartenhöhe), rechts der Text-Block — Datum-Pill + Fortsetzungs-Chip
 * („STAFFEL 2"/„PART 2"/„FORTSETZUNG" neutral bzw. „NEU" in Primary, aus
 * continuationLabel) + „In deiner Liste"-Badge oben, Titel (2 Zeilen),
 * Meta („Studio · 12 Ep. · ★ 76%"), 3-Zeilen-Beschreibung (deutsch nach
 * Hydration, sonst AniList-englisch) und die Provider-Logos unten. Hinter dem Text liegt ein dezenter Farb-Tint aus der
 * AniList-Coverfarbe (billiger als ein geblurrtes Zweitbild, gibt jeder
 * Karte ihre eigene Stimmung). Bewusst KEIN Hochformat-Poster-Grid mehr —
 * die kleinen Kacheln waren zu klein und trugen keinen Text.
 *
 * Datum-Pill: „SA · 4. JULI"/„HEUTE" (accent), „LÄUFT" (success),
 * Fortlaufend „Ep 14 · in 2d", „BEENDET"/„TBA" (neutral). Provider sind
 * ausschließlich die hydratisierten TMDB-Logos (App-normalisiert) bzw. die
 * aus der eigenen Liste — kein Text-Chip-Fallback (Chips flackerten nur bis
 * zur Hydration). Klick auf die ganze Karte → SeriesDetail; während einer
 * Klick-Auflösung Spinner-Overlay + Klicksperre. Kein framer-motion pro
 * Karte — Stagger/Hover laufen über CSS (AnimeSeasonPage.css).
 */

import React, { useState } from 'react';
import { CircularProgress } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContextDef';
import { getOptimalTextColor, lightenColor } from '../../theme/colorUtils';
import { hapticTap } from '../../lib/haptics';
import {
  getProviderSearchUrl,
  handleProviderLinkClick,
  providerNeedsClipboardCopy,
} from '../../lib/providerLinks';
import {
  buildMetaLine,
  continuationLabel,
  datePillText,
  isSameDay,
  shortCountdown,
  startDateToDate,
  stripDescription,
} from './animeFormat';
import type { TmdbProviderInfo } from './resolveTmdbId';
import type { SeasonAnime } from '../../services/anilistSeasonService';

/**
 * Provider-Logo-Strip im MiniProviderBadges-Look (Logo + Radius 5px +
 * Schatten, „+N"-Chip). Links wie überall: Provider-Deep-Link, stopPropagation.
 */
function ProviderLogos({
  providers,
  size,
  searchTitle,
}: {
  providers: TmdbProviderInfo[];
  size: number;
  searchTitle: string;
}) {
  if (!providers.length) return null;
  const visible = providers.slice(0, 4);
  const overflow = providers.length - visible.length;

  const logoStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '5px',
    objectFit: 'cover',
    display: 'block',
    boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
  };

  return (
    <span
      style={{ display: 'flex', gap: '4px', lineHeight: 0 }}
      onClick={(event) => event.stopPropagation()}
    >
      {visible.map((provider) => {
        const url = getProviderSearchUrl(provider.name, searchTitle);
        const titleAttr = providerNeedsClipboardCopy(provider.name)
          ? `${provider.name}: Titel kopieren + Suche öffnen`
          : `${provider.name} öffnen`;
        const img = (
          <img
            src={provider.logo}
            alt={provider.name}
            title={titleAttr}
            loading="lazy"
            decoding="async"
            style={logoStyle}
          />
        );
        return url ? (
          <a
            key={provider.name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: 'contents' }}
            onClick={(event) => handleProviderLinkClick(event, provider.name, searchTitle, url)}
          >
            {img}
          </a>
        ) : (
          <React.Fragment key={provider.name}>{img}</React.Fragment>
        );
      })}
      {overflow > 0 && (
        <span
          style={{
            width: size,
            height: size,
            borderRadius: '5px',
            background: 'rgba(0,0,0,0.6)',
            border: '1px solid var(--glass-border-medium)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '9px',
            fontWeight: 700,
            color: 'rgba(255,255,255,0.85)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          }}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}

interface AnimeSeasonCardProps {
  anime: SeasonAnime;
  /** Serie ist in der Nutzerliste (Badge neben der Datum-Pill). */
  inList: boolean;
  /** Klick-Auflösung läuft — Spinner-Overlay, Klicks gesperrt. */
  resolving: boolean;
  /** „Fortlaufend"-Einträge: Label der Ursprungs-Season („Frühling 2026"). */
  sinceLabel?: string;
  /** Deutsche Beschreibung (TMDB-overview bzw. eigene Liste), null solange keine. */
  overviewDe: string | null;
  /** TMDB-Provider-Logos (DE-Flatrate bzw. eigene Liste); undefined = unresolved. */
  tmdbProviders: TmdbProviderInfo[] | null | undefined;
  /** Karten-Tap: SeriesDetail (Match/Resolve übernimmt die Page). */
  onOpen: () => void;
  /** Index für den CSS-Entry-Stagger (wird als --as-i gedeckelt gesetzt). */
  staggerIndex?: number;
}

export const AnimeSeasonCard: React.FC<AnimeSeasonCardProps> = ({
  anime,
  inList,
  resolving,
  sinceLabel,
  overviewDe,
  tmdbProviders,
  onOpen,
  staggerIndex = 0,
}) => {
  const { currentTheme } = useTheme();
  // „Jetzt" einmalig beim Mount einfrieren — react-hooks/purity verbietet
  // Date.now() im Render; Minuten-Drift ist für Datumsvergleiche irrelevant.
  const [now] = useState(() => Date.now());

  const title = anime.title.english || anime.title.romaji || 'Unbekannter Titel';
  const cover = anime.coverImage?.large || '';
  const tint = anime.coverImage?.color || null;
  const providers = tmdbProviders ?? [];
  const metaLine = buildMetaLine(anime, sinceLabel);
  const description = overviewDe || stripDescription(anime.description);

  // Fortsetzungs-Chip: „STAFFEL 2"/„PART 2"/„FORTSETZUNG" neutral, „NEU" in
  // Primary. „Fortlaufend"-Einträge tragen die Info schon in der Meta-Zeile.
  const contLabel = sinceLabel ? null : continuationLabel(anime);
  const showNewChip = !sinceLabel && !contLabel;

  // ── Datum-Pill ─────────────────────────────────────────────────────────────
  const startDate = startDateToDate(anime.startDate);
  // Ohne Tages-Angabe fällt startDateToDate auf den Monatsersten — dann kein
  // Datums-Band zeigen (die Timeline führt den Eintrag unter „Start noch offen").
  const hasFullDate = !!startDate && !!anime.startDate?.day;
  const nowDate = new Date(now);
  const startOfTomorrow = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate() + 1
  ).getTime();

  let pillText: string;
  let pillBg: string;
  if (sinceLabel) {
    pillText = anime.nextAiringEpisode
      ? `Ep ${anime.nextAiringEpisode.episode} · in ${shortCountdown(anime.nextAiringEpisode.timeUntilAiring)}`
      : 'läuft';
    pillBg = anime.nextAiringEpisode ? currentTheme.accent : currentTheme.status.success;
  } else if (hasFullDate && startDate && isSameDay(startDate, nowDate)) {
    pillText = 'HEUTE';
    pillBg = currentTheme.accent;
  } else if (hasFullDate && startDate && startDate.getTime() >= startOfTomorrow) {
    // Zukünftiger STARTTAG schlägt den AniList-Status: bei JST-Vorpremieren
    // flippt der Status schon vor dem Startdatum auf RELEASING — sonst
    // stünde „LÄUFT" unter einem „Morgen"-Node der Timeline. Das Datums-
    // Band („SA · 4. JULI") hält Karte und Timeline konsistent.
    pillText = datePillText(startDate);
    pillBg = currentTheme.accent;
  } else if (anime.status === 'NOT_YET_RELEASED') {
    pillText = hasFullDate && startDate ? datePillText(startDate) : 'TBA';
    pillBg = hasFullDate ? currentTheme.accent : currentTheme.background.surfaceElevated;
  } else if (anime.status === 'FINISHED') {
    pillText = 'BEENDET';
    pillBg = currentTheme.background.surfaceElevated;
  } else if (anime.status === 'RELEASING' || (startDate && startDate.getTime() <= now)) {
    pillText = 'LÄUFT';
    pillBg = currentTheme.status.success;
  } else {
    pillText = 'TBA';
    pillBg = currentTheme.background.surfaceElevated;
  }
  const pillColor = getOptimalTextColor(pillBg);

  const handleOpen = () => {
    if (resolving) return;
    hapticTap();
    onOpen();
  };

  return (
    <div
      className="as-grid-item"
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
      style={{ '--as-i': Math.min(staggerIndex, 14) } as React.CSSProperties}
    >
      <article className="as-card">
        {/* Farb-Tint aus der Coverfarbe — der kräftige Teil liegt unter dem
            Poster, der Text-Block bekommt nur den leichten Auslauf (lesbar). */}
        {tint && (
          <div
            className="as-card-tint"
            aria-hidden
            style={{
              background: `linear-gradient(115deg, ${tint}59 0%, ${tint}1f 45%, transparent 72%)`,
            }}
          />
        )}

        {/* ── Poster links, volle Kartenhöhe ── */}
        {cover ? (
          <img
            src={cover}
            alt={`Cover von ${title}`}
            loading="lazy"
            decoding="async"
            className="as-card-poster"
            style={{ background: tint || currentTheme.background.surfaceElevated }}
          />
        ) : (
          <div
            className="as-card-poster as-card-poster--empty"
            style={{ background: currentTheme.background.surfaceElevated }}
          >
            Kein Poster
          </div>
        )}

        {/* ── Text-Block rechts ── */}
        <div className="as-card-body">
          <div className="as-card-toprow">
            <span className="as-card-chips">
              <span className="as-card-pill" style={{ background: pillBg, color: pillColor }}>
                {pillText}
              </span>
              {contLabel && (
                <span
                  className="as-card-chip"
                  style={{
                    background: 'var(--glass-light)',
                    border: '1px solid var(--glass-border-medium)',
                    color: currentTheme.text.muted,
                  }}
                >
                  {contLabel}
                </span>
              )}
              {showNewChip && (
                <span
                  className="as-card-chip"
                  style={{
                    background: `${currentTheme.primary}1f`,
                    border: `1px solid ${currentTheme.primary}66`,
                    color: lightenColor(currentTheme.primary, 0.3),
                  }}
                >
                  Neu
                </span>
              )}
            </span>
            {inList && (
              <span
                className="as-card-inlist-badge"
                style={{ background: `${currentTheme.primary}dd` }}
                title="In deiner Liste"
              >
                <CheckCircle
                  style={{ fontSize: '13px', color: getOptimalTextColor(currentTheme.primary) }}
                />
              </span>
            )}
          </div>
          <h3 className="as-card-title">{title}</h3>
          {metaLine && <p className="as-card-meta">{metaLine}</p>}
          {description && (
            /* key wechselt bei Hydration (en → de) → sanfter Fade; min-height
               in CSS hält die Kartenhöhe stabil (kein Layout-Sprung). */
            <p className="as-card-desc as-fade" key={overviewDe ? 'desc-de' : 'desc-fallback'}>
              {description}
            </p>
          )}
          <div className="as-card-providers as-fade" key={providers.length ? 'prov' : 'prov-none'}>
            <ProviderLogos providers={providers} size={20} searchTitle={title} />
          </div>
        </div>

        {/* Spinner-Overlay während der Klick-Auflösung */}
        {resolving && (
          <div className="as-card-resolving">
            <CircularProgress size={28} style={{ color: currentTheme.accent }} />
          </div>
        )}
      </article>
    </div>
  );
};
