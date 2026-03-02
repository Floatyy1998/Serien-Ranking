/**
 * MoviesTab - Gemeinsame Filme Anzeige
 */

import { Favorite, Movie } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { TasteMatchResult } from '../../services/tasteMatchService';
import { ACCENT_COLORS } from './constants';
import { SharedItemCard } from './SharedItemCard';

interface MoviesTabProps {
  result: TasteMatchResult;
  cardBg: string;
}

export const MoviesTab: React.FC<MoviesTabProps> = React.memo(({ result, cardBg }) => {
  const sharedMovies = result.movieOverlap.sharedMovies;
  const perfectMatches = sharedMovies.filter((m) => m.ratingDiff !== undefined && m.ratingDiff < 1);

  return (
    <motion.div
      key="movies"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {sharedMovies.length > 0 ? (
        <>
          <div
            className="tm-section-header"
            style={{
              background: cardBg,
              border: `1px solid ${ACCENT_COLORS.movies}20`,
            }}
          >
            <Movie style={{ fontSize: 20, color: ACCENT_COLORS.movies }} />
            <span className="tm-section-header__text">{sharedMovies.length} gemeinsame Filme</span>
            {perfectMatches.length > 0 && (
              <span
                className="tm-section-header__badge"
                style={{
                  color: ACCENT_COLORS.match,
                  background: `${ACCENT_COLORS.match}15`,
                }}
              >
                <Favorite style={{ fontSize: 12 }} />
                {perfectMatches.length} perfekte Matches
              </span>
            )}
          </div>
          {sharedMovies.map((item, i) => (
            <SharedItemCard key={item.id} item={item} index={i} type="movie" bgColor={cardBg} />
          ))}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="tm-empty-state"
          style={{ background: cardBg }}
        >
          <div className="tm-empty-state__icon" style={{ background: `${ACCENT_COLORS.movies}15` }}>
            <Movie style={{ fontSize: 36, color: ACCENT_COLORS.movies, opacity: 0.6 }} />
          </div>
          <p className="tm-empty-state__title">Keine gemeinsamen Filme</p>
          <p className="tm-empty-state__subtitle">Schaut ihr verschiedene Filme?</p>
        </motion.div>
      )}
    </motion.div>
  );
});

MoviesTab.displayName = 'MoviesTab';
