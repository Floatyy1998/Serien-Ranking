import { Info } from '@mui/icons-material';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { Movie } from '../../types/Movie';

interface MovieInfoTabProps {
  movie: Movie;
  isMobile: boolean;
  tmdbOverview: string | null;
}

export const MovieInfoTab = memo(({ movie, isMobile, tmdbOverview }: MovieInfoTabProps) => {
  const { currentTheme } = useTheme();
  const mobileClass = isMobile ? '--mobile' : '';

  return (
    <div className={`md-info ${isMobile ? 'md-info--mobile' : ''}`}>
      {/* Overview */}
      {(movie.beschreibung || movie.overview || tmdbOverview) && (
        <div className={`md-info__section md-info__section${mobileClass}`}>
          <h3
            className={`md-info__heading md-info__heading${mobileClass}`}
            style={{ color: currentTheme.text.primary }}
          >
            <Info style={{ fontSize: isMobile ? '16px' : '18px', color: currentTheme.accent }} />
            Handlung
          </h3>
          <p
            className={`md-info__text md-info__text${mobileClass}`}
            style={{ color: currentTheme.text.secondary }}
          >
            {movie.beschreibung || movie.overview || tmdbOverview}
          </p>
        </div>
      )}
    </div>
  );
});

MovieInfoTab.displayName = 'MovieInfoTab';
