import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import type { LeaderboardCategory, LeaderboardEntry } from '../../types/Leaderboard';
import { formatValue } from './leaderboardUtils';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const PODIUM_HEIGHTS = [150, 115, 95];
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
        const avatarSize = isFirst ? 68 : 52;

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
            {/* Avatar with glow ring */}
            <div
              className="lb-podium-avatar"
              style={{
                width: avatarSize,
                height: avatarSize,
                border: `3px solid ${medal}`,
                background: currentTheme.background.card,
                boxShadow: isFirst
                  ? `0 0 20px ${medal}50, 0 0 40px ${medal}25`
                  : `0 4px 16px ${medal}30`,
              }}
            >
              {isFirst && <span className="lb-podium-crown">👑</span>}
              {entry.photoURL ? (
                <img src={entry.photoURL} alt={entry.displayName} />
              ) : (
                <span
                  style={{
                    fontSize: isFirst ? 26 : 20,
                    fontWeight: 700,
                    color: currentTheme.text.secondary,
                  }}
                >
                  {entry.displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            {/* Name */}
            <span
              className="lb-podium-name"
              style={{
                fontWeight: entry.isCurrentUser ? 700 : 500,
                color: entry.isCurrentUser ? currentTheme.primary : currentTheme.text.primary,
              }}
            >
              {entry.isCurrentUser ? 'Du' : entry.displayName.split(' ')[0]}
            </span>

            {/* Podium block */}
            <div
              className="lb-podium-block"
              style={{
                height: `${height}px`,
                background: `linear-gradient(180deg, ${medal}25, ${medal}08)`,
                border: `1px solid ${medal}30`,
                borderBottom: 'none',
              }}
            >
              <span style={{ fontSize: isFirst ? 28 : 22, fontWeight: 800, color: medal }}>
                #{entry.rank}
              </span>
              <span
                style={{
                  fontSize: isFirst ? 20 : 16,
                  fontWeight: 700,
                  color: currentTheme.text.primary,
                }}
              >
                {formatValue(entry.value, category)}
              </span>
              <span style={{ fontSize: 11, color: currentTheme.text.secondary }}>{unit}</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
