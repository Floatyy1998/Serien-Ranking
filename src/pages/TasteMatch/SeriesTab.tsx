/**
 * SeriesTab - Gemeinsame Serien Anzeige
 */

import { Favorite, Tv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import type { TasteMatchResult } from '../../services/tasteMatchService';
import { ACCENT_COLORS } from './constants';
import { SharedItemCard } from './SharedItemCard';

interface SeriesTabProps {
  result: TasteMatchResult;
  cardBg: string;
}

export const SeriesTab: React.FC<SeriesTabProps> = React.memo(({ result, cardBg }) => {
  const sharedSeries = result.seriesOverlap.sharedSeries;
  const perfectMatches = sharedSeries.filter((s) => s.ratingDiff !== undefined && s.ratingDiff < 1);

  return (
    <motion.div
      key="series"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {sharedSeries.length > 0 ? (
        <>
          <div
            className="tm-section-header"
            style={{
              background: cardBg,
              border: `1px solid ${ACCENT_COLORS.series}20`,
            }}
          >
            <Tv style={{ fontSize: 20, color: ACCENT_COLORS.series }} />
            <span className="tm-section-header__text">{sharedSeries.length} gemeinsame Serien</span>
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
          {sharedSeries.map((item, i) => (
            <SharedItemCard key={item.id} item={item} index={i} type="series" bgColor={cardBg} />
          ))}
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="tm-empty-state"
          style={{ background: cardBg }}
        >
          <div className="tm-empty-state__icon" style={{ background: `${ACCENT_COLORS.series}15` }}>
            <Tv style={{ fontSize: 36, color: ACCENT_COLORS.series, opacity: 0.6 }} />
          </div>
          <p className="tm-empty-state__title">Keine gemeinsamen Serien</p>
          <p className="tm-empty-state__subtitle">Schaut ihr verschiedene Serien?</p>
        </motion.div>
      )}
    </motion.div>
  );
});

SeriesTab.displayName = 'SeriesTab';
