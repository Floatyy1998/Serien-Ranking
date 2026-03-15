/**
 * BadgeCard - Individual badge display component
 * Extracted from BadgesPage for better separation of concerns
 */

import { Lock } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { Badge, BadgeProgress } from '../../features/badges/badgeDefinitions';
import { BadgeIcon } from '../../features/badges/BadgeIcons';
import type { useTheme } from '../../contexts/ThemeContext';
import { trackBadgeCardClicked } from '../../firebase/analytics';

type ThemeColors = ReturnType<typeof useTheme>['currentTheme'];

export const getRarityColor = (rarity: string, theme: ThemeColors): string => {
  switch (rarity) {
    case 'common':
      return theme.text.muted;
    case 'rare':
      return theme.primary;
    case 'epic':
      return 'var(--theme-secondary-gradient, #8b5cf6)';
    case 'legendary':
      return theme.status.warning;
    default:
      return theme.text.muted;
  }
};

const getRarityLabel = (rarity: string): string => {
  switch (rarity) {
    case 'common':
      return 'Gewöhnlich';
    case 'rare':
      return 'Selten';
    case 'epic':
      return 'Episch';
    case 'legendary':
      return 'Legendär';
    default:
      return rarity;
  }
};

const formatTimeRemaining = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
};

interface BadgeCardProps {
  badge: Badge;
  index: number;
  theme: ThemeColors;
  earned: boolean;
  progress: BadgeProgress | undefined;
  isNextTier: boolean;
}

export const BadgeCard = React.memo(
  ({ badge, index, theme, earned, progress, isNextTier }: BadgeCardProps) => {
    const rarityColor = getRarityColor(badge.rarity, theme);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => trackBadgeCardClicked(badge.id)}
        className="badge-card-wrapper"
        style={{
          background: earned
            ? `linear-gradient(145deg, ${badge.color}25, ${theme.background.surface})`
            : theme.background.surface,
          border: earned
            ? `2px solid ${badge.color}60`
            : isNextTier
              ? `2px solid ${badge.color}40`
              : `1px solid ${theme.border.default}`,
          borderRadius: '20px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: earned
            ? `0 8px 32px ${badge.color}20`
            : '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
          contentVisibility: 'auto',
        }}
      >
        {/* Decorative Glow */}
        {earned && (
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              right: '-30%',
              width: '150px',
              height: '150px',
              background: `radial-gradient(circle, ${badge.color}30, transparent)`,
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Rarity Label */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              background: `${rarityColor}15`,
              border: `1px solid ${rarityColor}30`,
              fontSize: '11px',
              fontWeight: 700,
              color: rarityColor,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {getRarityLabel(badge.rarity)}
          </div>
          {earned && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${theme.status.success}, #22c55e)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 8px ${theme.status.success}50`,
              }}
            >
              <span style={{ fontSize: '13px' }}>&#10003;</span>
            </motion.div>
          )}
          {isNextTier && !earned && (
            <div
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${badge.color}, ${badge.color}cc)`,
                fontSize: '9px',
                fontWeight: 700,
                color: 'white',
              }}
            >
              NEXT
            </div>
          )}
        </div>

        {/* Badge Icon Container */}
        <div style={{ textAlign: 'center', marginBottom: '14px', position: 'relative', zIndex: 1 }}>
          <motion.div
            whileHover={{ rotate: earned ? [0, -5, 5, 0] : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: earned
                ? `linear-gradient(145deg, ${badge.color}, ${badge.color}cc)`
                : isNextTier
                  ? `linear-gradient(145deg, ${badge.color}40, ${badge.color}20)`
                  : `${theme.background.paper}`,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: earned ? `0 8px 24px ${badge.color}40` : 'none',
            }}
          >
            <BadgeIcon
              badgeId={badge.id}
              sx={{
                fontSize: '2.8rem',
                color: earned ? 'white' : theme.text.muted,
                opacity: earned ? 1 : 0.5,
              }}
            />
            {!earned && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(10, 14, 26, 0.6)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock style={{ color: theme.text.secondary, fontSize: '1.8rem' }} />
              </div>
            )}
          </motion.div>
        </div>

        {/* Badge Name + Description */}
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 700,
            margin: '0 0 6px 0',
            textAlign: 'center',
            color: earned ? badge.color : theme.text.primary,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {badge.name}
        </h2>

        <p
          style={{
            fontSize: '13px',
            color: theme.text.muted,
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.4,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {badge.description}
        </p>

        {/* Progress Bar (nur fuer unearned) */}
        {progress && !earned && (
          <div style={{ marginTop: '14px', position: 'relative', zIndex: 1 }}>
            <div
              style={{
                height: '6px',
                borderRadius: '3px',
                backgroundColor: `${badge.color}20`,
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((progress.current / progress.total) * 100, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: progress.sessionActive
                    ? `linear-gradient(90deg, ${badge.color}, ${badge.color}cc)`
                    : `linear-gradient(90deg, ${badge.color}80, ${badge.color}60)`,
                  borderRadius: '3px',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '12px',
                  color: progress.sessionActive ? badge.color : theme.text.muted,
                  fontWeight: progress.sessionActive ? 600 : 400,
                }}
              >
                {progress.current} / {progress.total}
              </span>
              {progress.sessionActive && progress.timeRemaining && (
                <span
                  style={{
                    fontSize: '11px',
                    color: badge.color,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: `${badge.color}15`,
                  }}
                >
                  {formatTimeRemaining(progress.timeRemaining)}
                </span>
              )}
            </div>
          </div>
        )}
      </motion.div>
    );
  }
);

BadgeCard.displayName = 'BadgeCard';
