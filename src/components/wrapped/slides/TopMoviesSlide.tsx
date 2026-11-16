import React from 'react';
import { t } from '../../../services/i18n';
import type { TopMovieEntry } from '../../../types/Wrapped';
import { EmptyStage, TopList, type SlideProps } from '../kit';
import { tmdbImage } from '../kitHelpers';

interface TopMoviesSlideProps extends SlideProps {
  topMovies: TopMovieEntry[];
  maxDisplay?: number;
}

const value = (movie: TopMovieEntry): string =>
  movie.rating
    ? `${movie.rating.toFixed(1)} / 10`
    : t('{h} Std {m} Min', {
        h: Math.floor(movie.minutesWatched / 60),
        m: movie.minutesWatched % 60,
      });

export const TopMoviesSlide: React.FC<TopMoviesSlideProps> = ({
  topMovies,
  maxDisplay = 5,
  active,
  posters,
}) => {
  const [top, ...rest] = topMovies.slice(0, maxDisplay);
  if (!top) {
    return (
      <EmptyStage
        active={active}
        posters={posters}
        title={t('Keine Filme dieses Jahr')}
        hint={t('Zeit für einen Filmabend!')}
      />
    );
  }
  return (
    <TopList
      active={active}
      kicker={t('Dein Film des Jahres')}
      hero={{
        key: top.id,
        title: top.title,
        heroImage: tmdbImage(top.poster, 'w500'),
        value: value(top),
      }}
      rest={rest.map((m) => ({
        key: m.id,
        title: m.title,
        image: tmdbImage(m.poster, 'w154'),
        value: value(m),
      }))}
    />
  );
};

export default TopMoviesSlide;
