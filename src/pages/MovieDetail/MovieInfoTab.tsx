import { Info } from '@mui/icons-material';
import { memo } from 'react';
import { Movie } from '../../types/Movie';

interface MovieInfoTabProps {
  movie: Movie;
  isMobile: boolean;
  tmdbOverview: string | null;
}

export const MovieInfoTab = memo(({ movie, isMobile, tmdbOverview }: MovieInfoTabProps) => {
  const mobileClass = isMobile ? '--mobile' : '';

  return (
    <div className={`md-info ${isMobile ? 'md-info--mobile' : ''}`}>
      {/* Overview */}
      {(movie.beschreibung || movie.overview || tmdbOverview) && (
        <div className={`md-info__section md-info__section${mobileClass}`}>
          <h3 className={`md-info__heading md-info__heading${mobileClass}`}>
            <Info style={{ fontSize: isMobile ? '16px' : '18px' }} />
            Handlung
          </h3>
          <p className={`md-info__text md-info__text${mobileClass}`}>
            {movie.beschreibung || movie.overview || tmdbOverview}
          </p>
        </div>
      )}

      {/* Genres */}
      {movie.genre?.genres && movie.genre.genres.length > 0 && (
        <div className={`md-info__section md-info__section${mobileClass}`}>
          <h3
            style={{
              fontSize: isMobile ? '14px' : '16px',
              fontWeight: 600,
              marginBottom: isMobile ? '8px' : '12px',
            }}
          >
            Genres
          </h3>
          <div className="md-genres">
            {movie.genre.genres.map((genre: string) => (
              <span key={genre} className="md-genre-tag">
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Additional Info Grid */}
      {movie.status && (
        <div className="md-info-grid">
          <div className="md-info-card">
            <p className="md-info-card__label">Status</p>
            <p className="md-info-card__value">
              {movie.status === 'Released' ? 'Veröffentlicht' : movie.status}
            </p>
          </div>
        </div>
      )}
    </div>
  );
});

MovieInfoTab.displayName = 'MovieInfoTab';
