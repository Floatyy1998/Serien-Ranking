import { memo } from 'react';
import type { Series } from '../../types/Series';

interface RatingsCardProps {
  series: Series;
  localSeries: Series | undefined;
  tmdbRating: { vote_average: number; vote_count: number } | null;
  imdbRating: { rating: number; votes: string } | null;
  seriesId: string;
  isMobile: boolean;
  noMargin?: boolean;
}

interface RatingBadge {
  key: string;
  label: string;
  labelBg: string;
  labelColor: string;
  pillBg: string;
  pillBorder: string;
  value: string;
  votes: string;
  href: string;
  disabled: boolean;
}

export const RatingsCard = memo<RatingsCardProps>(
  ({ series, localSeries, tmdbRating, imdbRating, seriesId, isMobile, noMargin }) => {
    const tmdbValue = (
      tmdbRating?.vote_average ||
      series?.vote_average ||
      localSeries?.vote_average ||
      0
    ).toFixed(1);
    const tmdbVotes = (
      (tmdbRating?.vote_count || series?.vote_count || localSeries?.vote_count || 0) / 1000
    ).toFixed(1);

    const imdbId = series?.imdb?.imdb_id || localSeries?.imdb?.imdb_id || '';
    const hasImdb = !!imdbId;

    const badges: RatingBadge[] = [
      {
        key: 'tmdb',
        label: 'TMDB',
        labelBg: '#01b4e4',
        labelColor: '#0d253f',
        pillBg: 'rgba(0, 188, 212, 0.15)',
        pillBorder: 'rgba(0, 188, 212, 0.3)',
        value: `${tmdbValue}/10`,
        votes: `(${tmdbVotes}k)`,
        href: `https://www.themoviedb.org/tv/${seriesId}`,
        disabled: false,
      },
      {
        key: 'imdb',
        label: 'IMDb',
        labelBg: '#F5C518',
        labelColor: '#000',
        pillBg: 'rgba(245, 197, 24, 0.15)',
        pillBorder: 'rgba(245, 197, 24, 0.3)',
        value: `${imdbRating?.rating?.toFixed(1) || '0.0'}/10`,
        votes: `(${imdbRating ? (parseInt(imdbRating.votes.replace(/,/g, '')) / 1000).toFixed(1) : '0.0'}k)`,
        href: `https://www.imdb.com/title/${imdbId}`,
        disabled: !hasImdb,
      },
    ];

    return (
      <div
        className="ratings-card"
        style={{
          gap: isMobile ? '8px' : '12px',
          marginBottom: noMargin ? 0 : isMobile ? '12px' : '12px',
        }}
      >
        {badges.map((badge) => (
          <a
            key={badge.key}
            href={badge.href}
            target="_blank"
            rel="noopener noreferrer"
            className="ratings-card__badge"
            style={{
              padding: isMobile ? '4px 8px' : '4px 10px',
              background: badge.pillBg,
              borderColor: badge.pillBorder,
              fontSize: isMobile ? '12px' : '13px',
              opacity: badge.disabled ? 0.5 : 1,
              pointerEvents: badge.disabled ? 'none' : 'auto',
            }}
          >
            <span
              className="ratings-card__label"
              style={{ background: badge.labelBg, color: badge.labelColor }}
            >
              {badge.label}
            </span>
            <span style={{ fontWeight: 600 }}>{badge.value}</span>
            <span style={{ fontSize: '12px', opacity: 0.7 }}>{badge.votes}</span>
          </a>
        ))}
      </div>
    );
  }
);

RatingsCard.displayName = 'RatingsCard';
