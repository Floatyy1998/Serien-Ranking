import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useCommunityRating } from '../../hooks/useCommunityRatings';
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
  /** Kein Link (pointer-events aus). */
  disabled: boolean;
  /** Zusätzlich ausgegraut (fehlende Datenquelle) — TV-RANK ist nur nicht klickbar. */
  dim?: boolean;
}

export const RatingsCard = memo<RatingsCardProps>(
  ({ series, localSeries, tmdbRating, imdbRating, seriesId, isMobile, noMargin }) => {
    const { currentTheme } = useTheme();
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

    // Anonymer Community-Durchschnitt der TV-Rank-Nutzer (ab 5 Bewertungen).
    const community = useCommunityRating('series', seriesId);

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
        labelColor: currentTheme.background.default,
        pillBg: 'rgba(245, 197, 24, 0.15)',
        pillBorder: 'rgba(245, 197, 24, 0.3)',
        value: `${imdbRating?.rating?.toFixed(1) || '0.0'}/10`,
        votes: `(${((parseInt(imdbRating?.votes?.replace(/,/g, '') ?? '', 10) || 0) / 1000).toFixed(1)}k)`,
        href: `https://www.imdb.com/title/${imdbId}`,
        disabled: !hasImdb,
        dim: !hasImdb,
      },
    ];

    if (community) {
      badges.push({
        key: 'tvrank',
        label: 'TV-RANK',
        labelBg: currentTheme.primary,
        labelColor: currentTheme.background.default,
        pillBg: `color-mix(in srgb, ${currentTheme.primary} 15%, transparent)`,
        pillBorder: `color-mix(in srgb, ${currentTheme.primary} 30%, transparent)`,
        value: `${community.a.toFixed(1)}/10`,
        votes: `(${community.c})`,
        href: '',
        disabled: true,
      });
    }

    return (
      <div
        className="detail-ratings-card"
        style={{
          gap: isMobile ? '8px' : '12px',
          marginBottom: noMargin ? 0 : isMobile ? '12px' : '12px',
          // Zentriert: ein umgebrochener dritter Chip (TV-RANK) strandet so
          // nicht linksbündig, sondern sitzt mittig unter der ersten Reihe.
          justifyContent: 'center',
        }}
      >
        {badges.map((badge) => (
          <a
            key={badge.key}
            href={badge.href}
            target="_blank"
            rel="noopener noreferrer"
            className="detail-ratings-card__badge"
            style={{
              padding: isMobile ? '4px 8px' : '4px 10px',
              background: badge.pillBg,
              borderColor: badge.pillBorder,
              fontSize: isMobile ? '12px' : '13px',
              opacity: badge.dim ? 0.5 : 1,
              pointerEvents: badge.disabled ? 'none' : 'auto',
            }}
          >
            <span
              className="detail-ratings-card__label"
              style={{ background: badge.labelBg, color: badge.labelColor, whiteSpace: 'nowrap' }}
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
