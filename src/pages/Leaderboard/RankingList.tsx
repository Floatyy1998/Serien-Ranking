import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import type { LeaderboardCategory, LeaderboardEntry } from '../../types/Leaderboard';
import { formatValue } from './leaderboardUtils';

interface RankingListProps {
  entries: LeaderboardEntry[];
  category: LeaderboardCategory;
  unit: string;
}

export const RankingList = React.memo(function RankingList({
  entries,
  category,
  unit,
}: RankingListProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  if (entries.length === 0) return null;

  return (
    <div className="lb-rankings">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.uid}
          className="lb-rank-card"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.05 }}
          onClick={() => {
            if (!entry.isCurrentUser) {
              navigate(`/friend/${entry.uid}`);
            }
          }}
          style={{
            background: entry.isCurrentUser
              ? `${currentTheme.primary}18`
              : currentTheme.background.surface,
            border: entry.isCurrentUser ? `1px solid ${currentTheme.primary}40` : undefined,
            cursor: entry.isCurrentUser ? 'default' : 'pointer',
          }}
        >
          <span className="lb-rank-num" style={{ color: currentTheme.text.secondary }}>
            {entry.rank}
          </span>

          <div className="lb-rank-avatar" style={{ background: currentTheme.background.card }}>
            {entry.photoURL ? (
              <img src={entry.photoURL} alt={entry.displayName} />
            ) : (
              <span style={{ fontSize: 16, fontWeight: 700, color: currentTheme.text.secondary }}>
                {entry.displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="lb-rank-info">
            <span
              className="lb-rank-name"
              style={{
                fontWeight: entry.isCurrentUser ? 700 : 500,
                color: entry.isCurrentUser ? currentTheme.primary : currentTheme.text.primary,
              }}
            >
              {entry.isCurrentUser ? 'Du' : entry.displayName}
            </span>
            {entry.username && !entry.isCurrentUser && (
              <span className="lb-rank-username" style={{ color: currentTheme.text.secondary }}>
                @{entry.username}
              </span>
            )}
          </div>

          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: currentTheme.text.primary,
              whiteSpace: 'nowrap',
            }}
          >
            {formatValue(entry.value, category)}{' '}
            <span style={{ fontSize: 12, fontWeight: 400, color: currentTheme.text.secondary }}>
              {unit}
            </span>
          </span>
        </motion.div>
      ))}
    </div>
  );
});
