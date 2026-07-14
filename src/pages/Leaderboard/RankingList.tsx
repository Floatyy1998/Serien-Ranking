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
      {entries.map((entry, i) => {
        const clickable = !entry.isCurrentUser;
        const openProfile = () => {
          if (clickable) navigate(`/friend/${entry.uid}`);
        };
        return (
          <motion.div
            key={entry.uid}
            className="lb-rank-card"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            // Stagger deckeln, sonst bekämen bei großen (globalen) Listen die letzten
            // Zeilen mehrere Sekunden Verzögerung und wirken blank/kaputt.
            transition={{ delay: 0.3 + Math.min(i, 20) * 0.05 }}
            onClick={openProfile}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-label={clickable ? `Profil von ${entry.displayName} öffnen` : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openProfile();
                    }
                  }
                : undefined
            }
            style={{
              background: entry.isCurrentUser ? 'var(--theme-primary-12)' : 'var(--glass-subtle)',
              border: entry.isCurrentUser ? '1px solid var(--theme-primary-30)' : undefined,
              cursor: entry.isCurrentUser ? 'default' : 'pointer',
            }}
          >
            <span className="lb-rank-num" style={{ color: currentTheme.text.muted }}>
              {entry.rank}
            </span>

            <div className="lb-rank-avatar" style={{ background: currentTheme.background.card }}>
              {entry.photoURL ? (
                <img src={entry.photoURL} alt={entry.displayName} loading="lazy" decoding="async" />
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
                  fontWeight: entry.isCurrentUser ? 800 : 600,
                  color: entry.isCurrentUser ? currentTheme.primary : currentTheme.text.secondary,
                }}
              >
                {entry.isCurrentUser ? 'Du' : entry.displayName}
              </span>
              {entry.username && !entry.isCurrentUser && (
                <span className="lb-rank-username" style={{ color: currentTheme.text.muted }}>
                  @{entry.username}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: currentTheme.text.secondary,
                whiteSpace: 'nowrap',
                opacity: entry.value > 0 ? 1 : 0.4,
              }}
            >
              {formatValue(entry.value, category)}{' '}
              <span style={{ fontSize: 12, fontWeight: 400, color: currentTheme.text.muted }}>
                {unit}
              </span>
            </span>
          </motion.div>
        );
      })}
    </div>
  );
});
