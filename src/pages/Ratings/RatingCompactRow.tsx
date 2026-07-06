/**
 * RatingCompactRow — D5 Kompakt-Zeile für den Dichte-Modus der Ratings-Seite.
 *
 * Eine Zeile pro Titel: Mini-Poster, Titel, Fortschritts-Zeile und (für Serien
 * mit offener nächster Folge) ein 1-Tap-„gesehen"-Button, der die volle
 * Mark-Pipeline nutzt (markNextEpisodeWatched: Firebase + Undo + Fanout).
 *
 * Navigation läuft wie im Grid über die Event-Delegation des Containers
 * (className ratings-grid-item + data-id/data-movie) — der Button stoppt die
 * Propagation.
 */

import { Check } from '@mui/icons-material';
import React, { useMemo, useState } from 'react';
import type { useTheme } from '../../contexts/ThemeContext';
import { findNextEpisode, markNextEpisodeWatched } from '../../hooks/markNextEpisode';
import type { Series } from '../../types/Series';
import { PLACEHOLDER_SVG } from './RatingItemCard';
import type { PreparedItem } from './useRatingsData';

interface RatingCompactRowProps {
  item: PreparedItem;
  /** Rohes Series-Objekt (nur für Serien; Filme haben keins). */
  series?: Series;
  uid?: string;
  theme: ReturnType<typeof useTheme>['currentTheme'];
}

export const RatingCompactRow = React.memo<RatingCompactRowProps>(
  ({ item, series, uid, theme }) => {
    const [busy, setBusy] = useState(false);

    const next = useMemo(
      () => (!item.isMovie && series ? findNextEpisode(series) : null),
      [item.isMovie, series]
    );

    const subline = item.isMovie
      ? [item.year, item.genres].filter(Boolean).join(' • ')
      : next
        ? `Weiter: S${next.seasonNumber} E${next.episodeNumber}${next.episodeName ? ` „${next.episodeName}"` : ''}`
        : item.progress === 100
          ? 'Komplett gesehen'
          : [item.year, item.genres].filter(Boolean).join(' • ');

    const handleMark = async (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!uid || !series || busy) return;
      setBusy(true);
      try {
        await markNextEpisodeWatched(uid, series);
      } finally {
        setBusy(false);
      }
    };

    return (
      <div
        className="ratings-grid-item ratings-row"
        data-id={item.id}
        data-movie={item.isMovie || undefined}
        data-poster={item.posterUrl || undefined}
      >
        <img
          src={item.posterUrl || PLACEHOLDER_SVG}
          alt=""
          loading="lazy"
          decoding="async"
          className="ratings-row-thumb"
          style={{ background: theme.background.surface }}
        />

        <div className="ratings-row-meta">
          <span className="ratings-row-title">{item.title}</span>
          <span className="ratings-row-sub" style={{ color: theme.text.muted }}>
            {item.rating > 0 && (
              <b style={{ color: theme.status.warning }}>★ {item.rating.toFixed(1)}</b>
            )}
            {item.rating > 0 && subline ? ' • ' : ''}
            {subline}
          </span>
          {!item.isMovie && item.progress > 0 && (
            <span className="ratings-row-bar">
              <i
                style={{
                  width: `${item.progress}%`,
                  background: item.progress === 100 ? theme.status.success : theme.primary,
                }}
              />
            </span>
          )}
        </div>

        {!item.isMovie && next && (
          <button
            type="button"
            className="ratings-row-mark"
            onClick={handleMark}
            disabled={busy || !uid}
            aria-label={`S${next.seasonNumber} E${next.episodeNumber} als gesehen markieren`}
            style={{
              color: theme.primary,
              borderColor: `${theme.primary}66`,
              background: `${theme.primary}1a`,
            }}
          >
            <Check fontSize="small" />
          </button>
        )}
      </div>
    );
  }
);

RatingCompactRow.displayName = 'RatingCompactRow';
