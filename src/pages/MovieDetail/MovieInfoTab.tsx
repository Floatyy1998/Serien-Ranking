import { memo } from 'react';
import { t } from '../../services/i18n';
import type { Movie } from '../../types/Movie';

interface MovieInfoTabProps {
  movie: Movie;
  isMobile: boolean;
  tmdbOverview: string | null;
}

export const MovieInfoTab = memo(({ movie, isMobile, tmdbOverview }: MovieInfoTabProps) => {
  const overview = movie.beschreibung || movie.overview || tmdbOverview;

  // Breite Ansichten zeigen die Handlung bereits auf der Bühne.
  if (!isMobile || !overview) return null;

  return (
    <section className="dk-slot md-info__section">
      <h2 className="dk-section__title">{t('Handlung')}</h2>
      <p className="dk-text">{overview}</p>
    </section>
  );
});

MovieInfoTab.displayName = 'MovieInfoTab';
