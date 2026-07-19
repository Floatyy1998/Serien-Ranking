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
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Add, CheckCircle } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { getOptimalTextColor, lightenColor } from '../../theme/colorUtils';
import { useThemedPlaceholder } from '../../utils/themedPlaceholder';
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
  formatBadgeDe,
  isSameDay,
  shortCountdown,
  startDateToDate,
  stripDescription,
} from './animeFormat';
import type { TmdbProviderInfo } from './resolveTmdbId';
import type { SeasonAnime } from '../../services/anilistSeasonService';
import { t } from '../../services/i18n';

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
          ? t('{name}: Titel kopieren + Suche öffnen', { name: provider.name })
          : t('{title} öffnen', { title: provider.name });
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
  /** TMDB-vote_average (10er-Skala) — solange fehlend: AniList-Fallback. */
  tmdbRating?: number | null;
  /** App-relevante TMDB-Genres (ohne Animation) — Zeile unter der Meta. */
  genres?: string[];
  /** Karten-Tap: SeriesDetail (Match/Resolve übernimmt die Page). */
  onOpen: () => void;
  /** „+"-Button: direkt zur Liste adden (nur wenn nicht in der Liste). */
  onAdd?: () => void;
  /** Add läuft gerade — Spinner im „+"-Button, Klicks gesperrt. */
  adding?: boolean;
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
  tmdbRating,
  genres,
  onOpen,
  onAdd,
  adding = false,
  staggerIndex = 0,
}) => {
  const { currentTheme } = useTheme();
  const placeholder = useThemedPlaceholder();
  // „Jetzt" einmalig beim Mount einfrieren — react-hooks/purity verbietet
  // Date.now() im Render; Minuten-Drift ist für Datumsvergleiche irrelevant.
  const [now] = useState(() => Date.now());
  /** Beschreibung aufgeklappt („mehr lesen" — navigiert NICHT). */
  const [descExpanded, setDescExpanded] = useState(false);

  const title = anime.title.english || anime.title.romaji || t('Unbekannter Titel');
  const cover = anime.coverImage?.large || '';
  const tint = anime.coverImage?.color || null;
  const providers = tmdbProviders ?? [];
  const metaLine = buildMetaLine(anime, sinceLabel, tmdbRating);
  const description = overviewDe || stripDescription(anime.description);

  // Fortsetzungs-Chip: „STAFFEL 2"/„PART 2"/„FORTSETZUNG" neutral, „NEU" in
  // Primary. „Fortlaufend"-Einträge tragen die Info schon in der Meta-Zeile.
  const contLabel = sinceLabel ? null : continuationLabel(anime);
  const showNewChip = !sinceLabel && !contLabel;

  // Format-Badge auf JEDER Karte: „Serie" neutral, „Film" in Secondary,
  // OVA/ONA/Special/Kurzserie neutral mit eigenem Label.
  const isMovie = anime.format === 'MOVIE';
  const formatBadge = formatBadgeDe(anime.format);

  // Datum-Pill
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
      : t('läuft');
    pillBg = anime.nextAiringEpisode ? currentTheme.accent : currentTheme.status.success;
  } else if (hasFullDate && startDate && isSameDay(startDate, nowDate)) {
    pillText = t('HEUTE');
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
    pillText = t('BEENDET');
    pillBg = currentTheme.background.surfaceElevated;
  } else if (anime.status === 'RELEASING' || (startDate && startDate.getTime() <= now)) {
    pillText = t('LÄUFT');
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

        {/* Poster links, volle Kartenhöhe (themed Placeholder als Fallback) */}
        <img
          src={cover || placeholder}
          alt={t('Cover von {title}', { title })}
          loading="lazy"
          decoding="async"
          className="as-card-poster"
          style={{ background: tint || currentTheme.background.surfaceElevated }}
        />

        {/* Text-Block rechts */}
        <div className="as-card-body">
          <div className="as-card-toprow">
            <span className="as-card-chips">
              <span className="as-card-pill" style={{ background: pillBg, color: pillColor }}>
                {pillText}
              </span>
              <span
                className="as-card-chip"
                style={
                  isMovie
                    ? {
                        background: `${currentTheme.secondary}1f`,
                        border: `1px solid ${currentTheme.secondary}66`,
                        color: lightenColor(currentTheme.secondary, 0.3),
                      }
                    : {
                        background: 'var(--glass-light)',
                        border: '1px solid var(--glass-border-medium)',
                        color: currentTheme.text.muted,
                      }
                }
              >
                {formatBadge}
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
                  {t('Neu')}
                </span>
              )}
            </span>
            {inList ? (
              <span
                className="as-card-inlist-badge"
                style={{ background: `${currentTheme.primary}dd` }}
                title={t('In deiner Liste')}
              >
                <CheckCircle
                  style={{ fontSize: '13px', color: getOptimalTextColor(currentTheme.primary) }}
                />
              </span>
            ) : onAdd ? (
              <button
                type="button"
                className="as-card-add"
                title={t('Zur Liste hinzufügen')}
                aria-label={t('{title} zur Liste hinzufügen', { title })}
                aria-busy={adding}
                onClick={(event) => {
                  event.stopPropagation();
                  if (adding) return;
                  hapticTap();
                  onAdd();
                }}
                style={{ color: currentTheme.text.secondary }}
              >
                {adding ? (
                  <LoadingSpinner inline size={12} borderWidth={2} color={currentTheme.accent} />
                ) : (
                  <Add style={{ fontSize: '15px' }} />
                )}
              </button>
            ) : null}
          </div>
          <h3 className="as-card-title">{title}</h3>
          {/* Meta IMMER rendern (Platzhalter hält die Zeilenhöhe) — sonst sind
              Karten ohne Meta-Zeile niedriger als ihre Zeilen-Nachbarn. */}
          <p className="as-card-meta">{metaLine || ' '}</p>
          {/* Genre-Zeile (max. 3, App-Vokabular) — immer gerendert, damit die
              Kartenhöhen einheitlich bleiben. */}
          <p className="as-card-genres as-fade" key={genres?.length ? 'genres' : 'genres-none'}>
            {genres?.length ? genres.slice(0, 3).join(' · ') : ' '}
          </p>
          {/* Beschreibung IMMER rendern (Platzhalter reserviert die CSS-
              min-height) — sonst sind Karten ohne Beschreibung kürzer als ihre
              Zeilen-Nachbarn (Grid ist align-items: start). key wechselt bei
              Hydration (en → de) → sanfter Fade. */}
          <p
            className={
              descExpanded ? 'as-card-desc as-card-desc--open as-fade' : 'as-card-desc as-fade'
            }
            key={overviewDe ? 'desc-de' : 'desc-fallback'}
          >
            {description || ' '}
          </p>
          {/* Button-Zeile IMMER reservieren (unsichtbar ohne langen Text),
              damit Karten mit/ohne „mehr lesen" exakt gleich hoch bleiben. */}
          <button
            type="button"
            className="as-card-more"
            style={{
              color: lightenColor(currentTheme.primary, 0.2),
              visibility: description.length > 160 ? 'visible' : 'hidden',
            }}
            tabIndex={description.length > 160 ? 0 : -1}
            aria-hidden={description.length <= 160}
            onClick={(event) => {
              event.stopPropagation();
              setDescExpanded((value) => !value);
            }}
          >
            {descExpanded ? t('weniger anzeigen') : t('mehr lesen')}
          </button>
          <div className="as-card-providers as-fade" key={providers.length ? 'prov' : 'prov-none'}>
            <ProviderLogos providers={providers} size={20} searchTitle={title} />
          </div>
        </div>

        {/* Spinner-Overlay während der Klick-Auflösung */}
        {resolving && (
          <div className="as-card-resolving">
            <LoadingSpinner inline size={28} color={currentTheme.accent} />
          </div>
        )}
      </article>
    </div>
  );
};
