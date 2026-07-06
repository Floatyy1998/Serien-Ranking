/**
 * RatingCompactRow — Zeile der Listen-Ansicht der Ratings-Seite.
 *
 * Eine Glass-Card pro Titel: Rang (bei Rating-Sortierung), Poster, Titel,
 * Jahr/Genres, Status-Zeile (nächste Folge + Fortschritt bzw. „Komplett
 * gesehen"), Provider-Badges, prominenter Score-Block und (für Serien mit
 * offener nächster Folge) ein 1-Tap-„gesehen"-Button, der die volle
 * Mark-Pipeline nutzt (markNextEpisodeWatched: Firebase + Undo + Fanout).
 *
 * Navigation läuft wie im Grid über die Event-Delegation des Containers
 * (className ratings-grid-item + data-id/data-movie) — Button und
 * Provider-Badges sind dort ausgenommen.
 */

import { Check } from '@mui/icons-material';
import React, { useMemo, useState } from 'react';
import type { useTheme } from '../../contexts/ThemeContext';
import { findNextEpisode, markNextEpisodeWatched } from '../../hooks/markNextEpisode';
import type { Series } from '../../types/Series';
import { PLACEHOLDER_SVG, ProviderBadgeArea } from './RatingItemCard';
import type { PreparedItem } from './useRatingsData';

interface RatingCompactRowProps {
  item: PreparedItem;
  /** Rohes Series-Objekt (nur für Serien; Filme haben keins). */
  series?: Series;
  uid?: string;
  theme: ReturnType<typeof useTheme>['currentTheme'];
  /**
   * Platzierung in der nach Rating sortierten Liste (1-basiert). Nur gesetzt,
   * wenn die aktive Sortierung tatsächlich rating-desc ist — sonst wäre die
   * Nummer irreführend. Unbewertete Items zeigen keinen Rang.
   */
  rank?: number;
}

export const RatingCompactRow = React.memo<RatingCompactRowProps>(
  ({ item, series, uid, theme, rank }) => {
    const [busy, setBusy] = useState(false);

    const next = useMemo(
      () => (!item.isMovie && series ? findNextEpisode(series) : null),
      [item.isMovie, series]
    );

    const yearGenres = [item.year, item.genres].filter(Boolean).join(' • ');
    const isComplete = !item.isMovie && !next && item.progress === 100;
    const inProgress = !item.isMovie && item.progress > 0 && item.progress < 100;

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
        {rank !== undefined && (
          <span className="ratings-row-rank" style={{ color: theme.text.muted }}>
            {item.rating > 0 ? rank : ''}
          </span>
        )}

        <img
          src={item.posterUrl || PLACEHOLDER_SVG}
          alt=""
          loading="lazy"
          decoding="async"
          className="ratings-row-thumb"
          style={{
            background: theme.background.surface,
            viewTransitionName: `poster-${item.isMovie ? 'movie' : 'series'}-${item.id}`,
          }}
        />

        <div className="ratings-row-meta">
          <span className="ratings-row-title">{item.title}</span>

          {yearGenres && (
            <span className="ratings-row-sub" style={{ color: theme.text.muted }}>
              {yearGenres}
            </span>
          )}

          {(next || isComplete || inProgress || item.watchlist) && (
            <span className="ratings-row-status">
              {next && (
                <span className="ratings-row-next" style={{ color: theme.text.muted }}>
                  {`Weiter: S${next.seasonNumber} E${next.episodeNumber}${next.episodeName ? ` „${next.episodeName}"` : ''}`}
                </span>
              )}
              {isComplete && (
                <span className="ratings-row-done" style={{ color: theme.status.success }}>
                  ✓ Komplett gesehen
                </span>
              )}
              {inProgress && (
                <>
                  <span className="ratings-row-bar">
                    <i style={{ width: `${item.progress}%`, background: theme.primary }} />
                  </span>
                  <span className="ratings-row-percent" style={{ color: theme.primary }}>
                    {Math.round(item.progress)}%
                  </span>
                </>
              )}
              {item.watchlist && (
                <span
                  className="ratings-row-watchlist"
                  style={{
                    color: theme.status.info.main,
                    borderColor: `${theme.status.info.main}55`,
                    background: `${theme.status.info.main}14`,
                  }}
                >
                  Watchlist
                </span>
              )}
            </span>
          )}
        </div>

        {item.providers.length > 0 && (
          <div className="ratings-row-providers">
            <ProviderBadgeArea
              providers={item.providers}
              bgColor={`${theme.background.default}dd`}
              textColor={theme.text.muted}
              searchTitle={item.title}
            />
          </div>
        )}

        <span
          className="ratings-row-score"
          style={{ color: item.rating > 0 ? 'var(--theme-accent)' : theme.text.muted }}
          aria-label={item.rating > 0 ? `Bewertung ${item.rating.toFixed(1)}` : 'Unbewertet'}
        >
          {item.rating > 0 ? (
            <>
              <span className="ratings-row-score-star">★</span>
              <span className="ratings-row-score-value">{item.rating.toFixed(1)}</span>
            </>
          ) : (
            <span className="ratings-row-score-value">–</span>
          )}
        </span>

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
