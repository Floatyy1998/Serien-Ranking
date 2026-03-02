/**
 * GenresTab - Genre-Vergleich mit Legende und Balkendiagrammen
 */

import { Category } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { TasteMatchResult } from '../../services/tasteMatchService';
import {
  USER_COLOR,
  USER_GRADIENT,
  FRIEND_COLOR,
  FRIEND_GRADIENT,
  ACCENT_COLORS,
} from './constants';
import { GenreBar } from './GenreBar';

interface GenresTabProps {
  result: TasteMatchResult;
  userName: string;
  friendName: string;
  cardBg: string;
}

export const GenresTab: React.FC<GenresTabProps> = React.memo(
  ({ result, userName, friendName, cardBg }) => {
    const activeGenres = result.genreMatch.sharedGenres.filter(
      (g) => g.userPercentage > 0 || g.friendPercentage > 0
    );

    return (
      <motion.div
        key="genres"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        {/* Premium Legend Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="tm-genre-legend"
          style={{ background: cardBg }}
        >
          <div className="tm-genre-legend__item">
            <div
              className="tm-genre-legend__swatch"
              style={{
                background: USER_GRADIENT,
                boxShadow: `0 4px 12px ${USER_COLOR}40`,
              }}
            >
              <span className="tm-genre-legend__swatch-text">
                {userName.slice(0, 1).toUpperCase()}
              </span>
            </div>
            <span className="tm-genre-legend__name" style={{ color: USER_COLOR }}>
              {userName}
            </span>
          </div>
          <div className="tm-genre-legend__divider" />
          <div className="tm-genre-legend__item">
            <div
              className="tm-genre-legend__swatch"
              style={{
                background: FRIEND_GRADIENT,
                boxShadow: `0 4px 12px ${FRIEND_COLOR}40`,
              }}
            >
              <span className="tm-genre-legend__swatch-text">
                {friendName.slice(0, 1).toUpperCase()}
              </span>
            </div>
            <span className="tm-genre-legend__name" style={{ color: FRIEND_COLOR }}>
              {friendName}
            </span>
          </div>
        </motion.div>

        {/* Genre comparison section header */}
        <div className="tm-genre-section-header">
          <Category style={{ fontSize: 18, color: ACCENT_COLORS.genres }} />
          <span className="tm-genre-section-header__text">Genre-Vergleich</span>
          <span className="tm-genre-section-header__count">{activeGenres.length} Genres</span>
        </div>

        {activeGenres.slice(0, 12).map((genre, i) => (
          <GenreBar
            key={genre.genre}
            genre={genre}
            index={i}
            userName={userName}
            friendName={friendName}
            bgColor={cardBg}
          />
        ))}
      </motion.div>
    );
  }
);

GenresTab.displayName = 'GenresTab';
