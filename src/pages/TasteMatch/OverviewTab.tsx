/**
 * OverviewTab - Providers Card + Quick Stats Grid
 */

import { Category, Movie, Star, Tv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import type { TasteMatchResult } from '../../services/tasteMatchService';
import { ACCENT_COLORS } from './constants';

interface OverviewTabProps {
  result: TasteMatchResult;
  cardBg: string;
}

export const OverviewTab: React.FC<OverviewTabProps> = React.memo(({ result, cardBg }) => {
  const stats = [
    {
      value: result.seriesOverlap.sharedSeries.length,
      label: 'Gemeinsame Serien',
      color: ACCENT_COLORS.series,
      icon: <Tv style={{ fontSize: 20 }} />,
      delay: 0.1,
    },
    {
      value: result.movieOverlap.sharedMovies.length,
      label: 'Gemeinsame Filme',
      color: ACCENT_COLORS.movies,
      icon: <Movie style={{ fontSize: 20 }} />,
      delay: 0.15,
    },
    {
      value: result.genreMatch.sharedGenres.filter(
        (g) => g.userPercentage > 0 && g.friendPercentage > 0
      ).length,
      label: 'Gemeinsame Genres',
      color: ACCENT_COLORS.genres,
      icon: <Category style={{ fontSize: 20 }} />,
      delay: 0.2,
    },
    {
      value: result.ratingMatch.sameRatingCount,
      label: 'Gleiche Bewertungen',
      color: ACCENT_COLORS.ratings,
      icon: <Star style={{ fontSize: 20 }} />,
      delay: 0.25,
    },
  ];

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Shared Providers - Premium Card */}
      {result.providerMatch.sharedProviders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="tm-providers-card"
          style={{
            background: cardBg,
            border: `1px solid ${ACCENT_COLORS.providers}25`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <div
            className="tm-providers-card__glow"
            style={{
              background: `radial-gradient(circle, ${ACCENT_COLORS.providers}20, transparent 70%)`,
            }}
          />
          <div className="tm-providers-card__title" style={{ color: ACCENT_COLORS.providers }}>
            <Tv style={{ fontSize: 18 }} />
            Gemeinsame Streaming-Dienste
          </div>
          <div className="tm-providers-card__list">
            {result.providerMatch.sharedProviders.map((provider, idx) => (
              <motion.span
                key={provider}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="tm-provider-chip"
                style={{
                  background: `linear-gradient(135deg, ${ACCENT_COLORS.providers}25, ${ACCENT_COLORS.providers}15)`,
                  border: `1px solid ${ACCENT_COLORS.providers}35`,
                }}
              >
                {provider}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Premium Quick Stats Grid */}
      <div className="tm-quick-stats">
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: stat.delay, type: 'spring', stiffness: 200 }}
            whileHover={{ scale: 1.03, y: -2 }}
            className="tm-quick-stat"
            style={{
              background: cardBg,
              border: `1px solid ${stat.color}20`,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            }}
          >
            <div
              className="tm-quick-stat__glow"
              style={{
                background: `radial-gradient(circle, ${stat.color}15, transparent 70%)`,
              }}
            />
            <div className="tm-quick-stat__content">
              <div
                className="tm-quick-stat__icon-wrap"
                style={{ background: `${stat.color}20`, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div
                className="tm-quick-stat__value"
                style={{
                  color: stat.color,
                  textShadow: `0 0 20px ${stat.color}40`,
                }}
              >
                {stat.value}
              </div>
              <div className="tm-quick-stat__label">{stat.label}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
});

OverviewTab.displayName = 'OverviewTab';
