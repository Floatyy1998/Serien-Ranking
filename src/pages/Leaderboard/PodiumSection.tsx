import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import type { LeaderboardCategory, LeaderboardEntry } from '../../types/Leaderboard';
import { formatValue } from './leaderboardUtils';
import { t } from '../../services/i18n';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const PODIUM_HEIGHTS = [190, 148, 122];
const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd

interface PodiumSectionProps {
  topThree: LeaderboardEntry[];
  category: LeaderboardCategory;
  unit: string;
}

export const PodiumSection = React.memo(function PodiumSection({
  topThree,
  category,
  unit,
}: PodiumSectionProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  if (topThree.length === 0) return null;

  return (
    <div className="lb-podium">
      {PODIUM_ORDER.map((podiumIndex) => {
        const entry = topThree[podiumIndex];
        if (!entry) return <div key={podiumIndex} style={{ flex: 1 }} />;

        const medal = MEDAL_COLORS[podiumIndex];
        const height = PODIUM_HEIGHTS[podiumIndex];
        const isFirst = podiumIndex === 0;
        const avatarSize = isFirst ? 96 : 72;
        // Lange Werte („123h 35m") schrumpfen statt auf schmalen Mobile-
        // Podesten umzubrechen.
        const valueText = formatValue(entry.value, category);
        const compact = valueText.length >= 7;
        const valueFontSize = isFirst ? (compact ? 24 : 40) : compact ? 18 : 28;

        return (
          <motion.div
            key={entry.uid}
            className="lb-podium-slot"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: podiumIndex * 0.15, duration: 0.5, type: 'spring', damping: 15 }}
            onClick={() => {
              if (!entry.isCurrentUser) navigate(`/friend/${entry.uid}`);
            }}
            style={{ cursor: entry.isCurrentUser ? 'default' : 'pointer' }}
          >
            {/* Avatar with glow ring + rank badge */}
            <div style={{ position: 'relative', marginBottom: 10 }}>
              {isFirst && <span className="lb-podium-crown">👑</span>}
              <div
                className="lb-podium-avatar"
                style={{
                  width: avatarSize,
                  height: avatarSize,
                  border: `3px solid ${medal}`,
                  background: currentTheme.background.card,
                  boxShadow: isFirst
                    ? `0 0 28px ${medal}55, 0 0 64px ${medal}25`
                    : `0 6px 20px ${medal}35`,
                  marginBottom: 0,
                }}
              >
                {entry.photoURL ? (
                  <img
                    src={entry.photoURL}
                    alt={entry.displayName}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span
                    style={{
                      fontSize: isFirst ? 34 : 26,
                      fontWeight: 700,
                      color: currentTheme.text.secondary,
                    }}
                  >
                    {entry.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span
                className="lb-podium-rankbadge"
                style={{
                  width: isFirst ? 28 : 24,
                  height: isFirst ? 28 : 24,
                  fontSize: isFirst ? 14 : 12,
                  background: `linear-gradient(135deg, ${medal}, color-mix(in srgb, ${medal} 70%, #fff))`,
                  boxShadow: `0 2px 10px ${medal}60`,
                }}
              >
                {entry.rank}
              </span>
            </div>

            {/* Name */}
            <span
              className="lb-podium-name"
              style={{
                fontWeight: entry.isCurrentUser ? 800 : 600,
                color: entry.isCurrentUser ? currentTheme.primary : currentTheme.text.secondary,
              }}
            >
              {entry.isCurrentUser ? t('Du') : entry.displayName.split(' ')[0]}
            </span>

            {/* Podium block */}
            <div
              className="lb-podium-block"
              style={{
                height: `${height}px`,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
                borderTop: `2px solid ${medal}`,
                borderLeft: '1px solid rgba(255,255,255,0.08)',
                borderRight: '1px solid rgba(255,255,255,0.08)',
                borderBottom: 'none',
                boxShadow: `inset 0 22px 44px -26px ${medal}70, var(--shadow-lg)`,
              }}
            >
              <span
                style={{
                  fontSize: valueFontSize,
                  fontWeight: 900,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                  maxWidth: '100%',
                  color: currentTheme.text.secondary,
                  textShadow: `0 0 24px ${medal}40`,
                }}
              >
                {valueText}
              </span>
              {unit && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: `${medal}cc`,
                  }}
                >
                  {unit}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
