/**
 * Film-Kalender — Querformat-Karte im Serien-Kalender-Look (teilt die
 * `as-*`-Klassen aus AnimeSeasonPage.css): Poster links, rechts Datums-Pill +
 * Modus-Chip (KINO/STREAMING) + Status-Badge (gesehen / noch nicht gesehen)
 * bzw. „+"-Button, Titel, Meta (★ Rating · Status), Genre-Zeile, Regie und
 * Hauptrollen, Beschreibung mit „mehr lesen".
 * Karten-Tap → MovieDetail.
 */

import React, { useState } from 'react';
import { Add, CheckCircle, RadioButtonUnchecked } from '@mui/icons-material';
import { LoadingSpinner } from '../../components/ui/feedback/LoadingSpinner';
import { useTheme } from '../../contexts/ThemeContext';
import { getOptimalTextColor, lightenColor } from '../../theme/colorUtils';
import { useThemedPlaceholder } from '../../utils/themedPlaceholder';
import { hapticTap } from '../../lib/interaction/haptics';
import {
  getProviderSearchUrl,
  handleProviderLinkClick,
  providerNeedsClipboardCopy,
} from '../../lib/provider/providerLinks';
import { parsePremiereDate, isSameDay, datePillText } from '../SerienKalender/tvPremiereFormat';
import type { FilmReleaseEntry } from './filmReleaseData';
import { t } from '../../services/i18n';
import { mediaTargetProps } from '../../lib/interaction/mediaTarget';

/** Provider-Logo-Strip (MiniProviderBadges-Look): Deep-Link, stopPropagation. */
function ProviderLogos({
  providers,
  searchTitle,
}: {
  providers: { name: string; logo: string }[];
  searchTitle: string;
}) {
  if (!providers.length) return null;
  const visible = providers.slice(0, 4);
  const overflow = providers.length - visible.length;
  const logoStyle: React.CSSProperties = {
    width: 20,
    height: 20,
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
            width: 20,
            height: 20,
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

interface FilmKalenderCardProps {
  entry: FilmReleaseEntry;
  inList: boolean;
  watched: boolean;
  now: number;
  onOpen: () => void;
  onAdd?: () => void;
  adding?: boolean;
  staggerIndex?: number;
}

export const FilmKalenderCard: React.FC<FilmKalenderCardProps> = ({
  entry,
  inList,
  watched,
  now,
  onOpen,
  onAdd,
  adding = false,
  staggerIndex = 0,
}) => {
  const { currentTheme } = useTheme();
  const placeholder = useThemedPlaceholder();
  const [descExpanded, setDescExpanded] = useState(false);

  const title = entry.title || t('Unbekannter Titel');
  const description = entry.overview;

  const startDate = parsePremiereDate(entry.releaseDate);
  const nowDate = new Date(now);
  const startOfTomorrow = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate() + 1
  ).getTime();

  let pillText: string;
  let pillBg: string;
  if (startDate && isSameDay(startDate, nowDate)) {
    pillText = t('HEUTE');
    pillBg = currentTheme.accent;
  } else if (startDate && startDate.getTime() >= startOfTomorrow) {
    pillText = datePillText(startDate);
    pillBg = currentTheme.accent;
  } else if (startDate) {
    pillText = datePillText(startDate);
    pillBg = currentTheme.background.surfaceElevated;
  } else {
    pillText = 'TBA';
    pillBg = currentTheme.background.surfaceElevated;
  }
  const pillColor = getOptimalTextColor(pillBg);

  const isCinema = entry.mode === 'cinema';
  const metaLine = entry.rating ? `★ ${entry.rating.toFixed(1)}` : '';
  const statusLabel = !inList ? '' : watched ? t('Gesehen') : t('Noch nicht gesehen');
  const statusTint = lightenColor(currentTheme.primary, 0.3);
  const hasPeople = entry.directors.length > 0 || entry.cast.length > 0;
  const canExpand = description.length > (hasPeople ? 106 : 265);
  const descClass = [
    'as-card-desc',
    hasPeople ? 'as-card-desc--short' : 'as-card-desc--long',
    descExpanded ? 'as-card-desc--open' : '',
  ]
    .filter(Boolean)
    .join(' ');

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
      {...mediaTargetProps({ type: 'movie', id: entry.tmdbId, title, poster: entry.poster })}
      onClick={handleOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleOpen();
        }
      }}
      style={{ '--as-i': Math.min(staggerIndex, 14) } as React.CSSProperties}
    >
      <article className="as-card as-card--film">
        <img
          src={entry.poster || placeholder}
          alt={t('Poster von {title}', { title })}
          loading="lazy"
          decoding="async"
          className="as-card-poster"
          style={{ background: currentTheme.background.surfaceElevated }}
        />

        <div className="as-card-body">
          <div className="as-card-toprow">
            <span className="as-card-chips">
              <span className="as-card-pill" style={{ background: pillBg, color: pillColor }}>
                {pillText}
              </span>
              <span
                className="as-card-chip"
                style={
                  isCinema
                    ? {
                        background: `${currentTheme.primary}1f`,
                        border: `1px solid ${currentTheme.primary}66`,
                        color: lightenColor(currentTheme.primary, 0.3),
                      }
                    : {
                        background: `${currentTheme.accent}1f`,
                        border: `1px solid ${currentTheme.accent}66`,
                        color: lightenColor(currentTheme.accent, 0.3),
                      }
                }
              >
                {isCinema ? t('KINO') : t('STREAMING')}
              </span>
            </span>
            {inList ? (
              <span
                className="as-card-inlist-badge"
                style={
                  watched
                    ? { background: `${currentTheme.primary}dd` }
                    : {
                        background: `${currentTheme.primary}1f`,
                        boxShadow: `inset 0 0 0 1px ${currentTheme.primary}66`,
                      }
                }
                title={statusLabel}
                aria-label={statusLabel}
                role="img"
              >
                {watched ? (
                  <CheckCircle
                    style={{ fontSize: '13px', color: getOptimalTextColor(currentTheme.primary) }}
                  />
                ) : (
                  <RadioButtonUnchecked style={{ fontSize: '13px', color: statusTint }} />
                )}
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
          <p className="as-card-meta">
            {metaLine}
            {metaLine && statusLabel ? ' · ' : ''}
            {statusLabel && (
              <span className="as-card-status" style={watched ? { color: statusTint } : undefined}>
                {statusLabel}
              </span>
            )}
            {!metaLine && !statusLabel ? ' ' : ''}
          </p>
          <p className="as-card-genres">{entry.genres || ' '}</p>
          {hasPeople && (
            <div className="as-card-people">
              <p className="as-card-person">
                {entry.directors.length > 0
                  ? t('Regie: {names}', { names: entry.directors.join(', ') })
                  : null}
              </p>
              <p className="as-card-person as-card-person--cast">
                {entry.cast.length > 0 ? t('Mit {names}', { names: entry.cast.join(', ') }) : null}
              </p>
            </div>
          )}
          <p className={descClass}>{description || ' '}</p>
          <div className="as-card-footer">
            <button
              type="button"
              className="as-card-more"
              style={{
                color: lightenColor(currentTheme.primary, 0.2),
                visibility: canExpand ? 'visible' : 'hidden',
              }}
              tabIndex={canExpand ? 0 : -1}
              aria-hidden={!canExpand}
              onClick={(event) => {
                event.stopPropagation();
                setDescExpanded((value) => !value);
              }}
            >
              {descExpanded ? t('weniger anzeigen') : t('mehr lesen')}
            </button>
            {entry.providers.length > 0 && (
              <ProviderLogos providers={entry.providers} searchTitle={title} />
            )}
          </div>
        </div>
      </article>
    </div>
  );
};
