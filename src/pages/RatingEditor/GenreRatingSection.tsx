import type { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { t } from '../../services/i18n';

interface GenreRatingSectionProps {
  genreRatings: Record<string, number>;
  onGenreRatingChange: (genre: string, value: number) => void;
  /** Genres des Titels — stehen vorn, der Rest folgt darunter. */
  ownGenres?: string[];
}

const byName = (a: string, b: string) => {
  if (a === 'All') return -1;
  if (b === 'All') return 1;
  return a.localeCompare(b);
};

export const GenreRatingSection = ({
  genreRatings,
  onGenreRatingChange,
  ownGenres = [],
}: GenreRatingSectionProps) => {
  const all = Object.keys(genreRatings).sort(byName);
  const own = all.filter((genre) => ownGenres.includes(genre));
  const rest = all.filter((genre) => !ownGenres.includes(genre));

  const row = (genre: string) => {
    const value = genreRatings[genre];
    return (
      <div key={genre} className={`re-genre${value > 0 ? ' is-rated' : ''}`}>
        <div className="re-genre__head">
          <span className="re-genre__name">{genre}</span>
          <span className="re-genre__value">{value.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="10"
          step="0.1"
          value={value}
          onChange={(e) => onGenreRatingChange(genre, parseFloat(e.target.value))}
          className="re-genre__range"
          aria-label={t('Bewertung {genre}', { genre })}
          aria-valuetext={t('{value} von 10', { value: value.toFixed(1) })}
          style={{ '--re-fill': `${value * 10}%` } as CSSProperties}
        />
      </div>
    );
  };

  return (
    <motion.div
      key="genre"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="re-genres"
    >
      {own.length > 0 && (
        <section className="re-panel">
          <h2 className="re-h">{t('Genres dieses Titels')}</h2>
          <div className="re-genre-grid">{own.map(row)}</div>
        </section>
      )}
      <section className="re-panel">
        {own.length > 0 && <h2 className="re-h">{t('Weitere Genres')}</h2>}
        <div className="re-genre-grid">{rest.map(row)}</div>
      </section>
    </motion.div>
  );
};
