/**
 * ActivityEntryCard - Single activity entry with poster, title, action, rating, and time
 */

import { Movie as MovieIcon, Star, Tv as TvIcon } from '@mui/icons-material';
import React from 'react';
import type { FriendActivity } from '../../types/Friend';

interface ActivityEntryCardProps {
  activity: FriendActivity;
  posterUrl: string | undefined;
  itemTitle: string;
  theme: {
    background: { default: string };
    text: { primary: string; secondary: string; muted: string };
    primary: string;
    accent: string;
    status: { error: string; warning: string };
  };
  onClick: () => void;
}

export const ActivityEntryCard = React.memo(
  ({ activity, posterUrl, itemTitle, theme, onClick }: ActivityEntryCardProps) => {
    const isMovie =
      activity.type === 'movie_added' ||
      activity.type === 'movie_rated' ||
      activity.type === 'rating_updated_movie' ||
      activity.itemType === 'movie';

    const rating = activity.rating;
    const hasRating = rating && rating > 0;
    const isAdded = activity.type === 'movie_added' || activity.type === 'series_added';
    const isRated =
      activity.type === 'movie_rated' ||
      activity.type === 'series_rated' ||
      activity.type === 'rating_updated_movie' ||
      activity.type === 'rating_updated';
    const isWatchlisted =
      activity.type === 'series_added_to_watchlist' || activity.type === 'movie_added_to_watchlist';

    return (
      <div
        className="activity-entry"
        onClick={onClick}
        style={{
          display: 'flex',
          gap: '12px',
          padding: '12px',
          background: theme.background.default,
          borderRadius: '12px',
          cursor: 'pointer',
        }}
      >
        {posterUrl && posterUrl !== '/placeholder.jpg' && (
          <div
            style={{
              width: '55px',
              height: '82px',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <img
              src={posterUrl}
              alt={itemTitle}
              loading="lazy"
              decoding="async"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {isMovie ? (
              <MovieIcon style={{ fontSize: '16px', color: theme.status.error }} />
            ) : (
              <TvIcon style={{ fontSize: '16px', color: theme.primary }} />
            )}
            <span
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: theme.text.primary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {itemTitle}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: theme.text.secondary }}>
              {isAdded
                ? 'Hinzugefuegt'
                : isWatchlisted
                  ? 'Auf Watchlist'
                  : isRated || hasRating
                    ? 'Bewertet'
                    : 'Aktivitaet'}
            </span>
            {hasRating && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 8px',
                  background: `${theme.accent}20`,
                  borderRadius: '10px',
                }}
              >
                <Star style={{ fontSize: '13px', color: theme.accent }} />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: theme.accent,
                  }}
                >
                  {rating}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ActivityEntryCard.displayName = 'ActivityEntryCard';
