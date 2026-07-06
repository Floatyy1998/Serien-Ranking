/**
 * Feature „Serien-Kalender" — QUERFORMAT-Karte („Premieren-Ticket").
 *
 * Port der AnimeSeasonCard (teilt sich deren CSS, `as-*`-Klassen aus
 * AnimeSeasonPage.css): scharfes 2/3-Poster links, rechts der Text-Block —
 * Datums-Pill + Premieren-Chip („NEU" in Primary bzw. „STAFFEL 3" neutral) +
 * „In deiner Liste"-Badge oben, Titel (2 Zeilen), Meta („Netflix · ★ 8.2"),
 * Genre-Zeile, 3-Zeilen-Beschreibung mit „mehr lesen" und die Provider-Logos
 * unten. Anders als beim Anime-Kalender kommen alle Felder fertig
 * hydratisiert vom Backend-Export — keine Klick-Auflösung, kein Spinner.
 * Klick auf die ganze Karte → SeriesDetail (tmdbId ist bekannt).
 */

import React, { useState } from 'react';
import { CircularProgress } from '@mui/material';
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
  datePillText,
  isSameDay,
  parsePremiereDate,
  premiereBadge,
} from './tvPremiereFormat';
import type { TvPremiereStaticEntry } from '../../lib/staticCatalog';

/** Provider-Logo mit sicherer (nicht-null) Logo-URL. */
type LogoProvider = { name: string; logo: string };

/**
 * Provider-Logo-Strip im MiniProviderBadges-Look (Logo + Radius 5px +
 * Schatten, „+N"-Chip). Links wie überall: Provider-Deep-Link, stopPropagation.
 */
function ProviderLogos({
  providers,
  size,
  searchTitle,
}: {
  providers: LogoProvider[];
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

interface SerienKalenderCardProps {
  entry: TvPremiereStaticEntry;
  /** Serie ist in der Nutzerliste (Badge statt „+"-Button). */
  inList: boolean;
  /** „Jetzt" (ms) — von der Page eingefroren, für stabile Datumsvergleiche. */
  now: number;
  /** Karten-Tap → SeriesDetail. */
  onOpen: () => void;
  /** „+"-Button: direkt zur Liste adden (nur wenn nicht in der Liste). */
  onAdd?: () => void;
  /** Add läuft gerade — Spinner im „+"-Button, Klicks gesperrt. */
  adding?: boolean;
  /** Index für den CSS-Entry-Stagger (wird als --as-i gedeckelt gesetzt). */
  staggerIndex?: number;
}

export const SerienKalenderCard: React.FC<SerienKalenderCardProps> = ({
  entry,
  inList,
  now,
  onOpen,
  onAdd,
  adding = false,
  staggerIndex = 0,
}) => {
  const { currentTheme } = useTheme();
  const placeholder = useThemedPlaceholder();
  /** Beschreibung aufgeklappt („mehr lesen" — navigiert NICHT). */
  const [descExpanded, setDescExpanded] = useState(false);

  const title = entry.title || 'Unbekannter Titel';
  const cover = entry.poster || '';
  const providers = (entry.providers || []).filter(
    (p): p is LogoProvider => typeof p.logo === 'string' && p.logo.length > 0
  );
  const metaLine = buildMetaLine(entry);
  const description = entry.overviewDe || '';

  const badge = premiereBadge(entry);

  // ── Datums-Pill ────────────────────────────────────────────────────────────
  const startDate = parsePremiereDate(entry.premiereDate);
  const nowDate = new Date(now);
  const startOfTomorrow = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate() + 1
  ).getTime();

  let pillText: string;
  let pillBg: string;
  if (startDate && isSameDay(startDate, nowDate)) {
    pillText = 'HEUTE';
    pillBg = currentTheme.accent;
  } else if (startDate && startDate.getTime() >= startOfTomorrow) {
    // Zukünftige Premiere: prominentes Datums-Band in Accent.
    pillText = datePillText(startDate);
    pillBg = currentTheme.accent;
  } else if (startDate) {
    // Bereits gelaufen (Vormonat): Datum neutral, kein Accent-Highlight.
    pillText = datePillText(startDate);
    pillBg = currentTheme.background.surfaceElevated;
  } else {
    pillText = 'TBA';
    pillBg = currentTheme.background.surfaceElevated;
  }
  const pillColor = getOptimalTextColor(pillBg);

  const handleOpen = () => {
    hapticTap();
    onOpen();
  };

  return (
    <div
      className="as-grid-item"
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
      style={{ '--as-i': Math.min(staggerIndex, 14) } as React.CSSProperties}
    >
      <article className="as-card">
        {/* ── Poster links, volle Kartenhöhe (themed Placeholder als Fallback) ── */}
        <img
          src={cover || placeholder}
          alt={`Poster von ${title}`}
          loading="lazy"
          decoding="async"
          className="as-card-poster"
          style={{ background: currentTheme.background.surfaceElevated }}
        />

        {/* ── Text-Block rechts ── */}
        <div className="as-card-body">
          <div className="as-card-toprow">
            <span className="as-card-chips">
              <span className="as-card-pill" style={{ background: pillBg, color: pillColor }}>
                {pillText}
              </span>
              <span
                className="as-card-chip"
                style={
                  badge.isNew
                    ? {
                        background: `${currentTheme.primary}1f`,
                        border: `1px solid ${currentTheme.primary}66`,
                        color: lightenColor(currentTheme.primary, 0.3),
                      }
                    : {
                        background: 'var(--glass-light)',
                        border: '1px solid var(--glass-border-medium)',
                        color: currentTheme.text.muted,
                      }
                }
              >
                {badge.label}
              </span>
            </span>
            {inList ? (
              <span
                className="as-card-inlist-badge"
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
                className="as-card-add"
                title="Zur Liste hinzufügen"
                aria-label={`${title} zur Liste hinzufügen`}
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
                  <CircularProgress size={12} style={{ color: currentTheme.accent }} />
                ) : (
                  <Add style={{ fontSize: '15px' }} />
                )}
              </button>
            ) : null}
          </div>
          <h3 className="as-card-title">{title}</h3>
          {/* Meta IMMER rendern (Platzhalter hält die Zeilenhöhe). */}
          <p className="as-card-meta">{metaLine || ' '}</p>
          {/* Genre-Zeile (max. 3, App-Vokabular) — immer gerendert für
              einheitliche Kartenhöhen. */}
          <p className="as-card-genres">
            {entry.genres?.length ? entry.genres.slice(0, 3).join(' · ') : ' '}
          </p>
          {/* Beschreibung IMMER rendern (Platzhalter reserviert die 3-Zeilen-
              Min-Höhe) — sonst sind Karten ohne Overview kürzer als ihre
              Zeilen-Nachbarn (Grid ist align-items: start). */}
          <p className={descExpanded ? 'as-card-desc as-card-desc--open' : 'as-card-desc'}>
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
            {descExpanded ? 'weniger anzeigen' : 'mehr lesen'}
          </button>
          <div className="as-card-providers">
            <ProviderLogos providers={providers} size={20} searchTitle={title} />
          </div>
        </div>
      </article>
    </div>
  );
};
