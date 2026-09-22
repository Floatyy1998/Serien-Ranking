import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NameBadges } from '../../components/ui/display/NameBadges';
import { UserAvatar } from '../../components/ui/media/UserAvatar';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import type { LeaderboardEntry, RankingCategory } from '../../types/Leaderboard';
import { formatValue } from './leaderboardUtils';

interface RankingListProps {
  entries: LeaderboardEntry[];
  category: RankingCategory;
  unit: string;
  /** Wert der Spitze — daran haengt die Balkenlaenge aller Zeilen. */
  leaderValue?: number;
}

/** Ein sichtbarer Sockel, damit auch kleine Werte als Balken lesbar bleiben. */
const share = (value: number, leader: number): number =>
  leader > 0 && value > 0 ? Math.max(6, Math.round((value / leader) * 100)) : 0;

export const RankingList = React.memo(function RankingList({
  entries,
  category,
  unit,
  leaderValue,
}: RankingListProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  if (entries.length === 0) return null;

  const leader = leaderValue ?? Math.max(...entries.map((entry) => entry.value), 0);

  return (
    <div className="lb-race">
      {entries.map((entry, index) => {
        const clickable = !entry.isCurrentUser;
        const openProfile = () => {
          if (clickable) navigate(`/friend/${entry.uid}`);
        };

        return (
          <motion.div
            key={entry.uid}
            className={`lb-lane ${entry.isCurrentUser ? 'lb-lane--self' : ''}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            // Stagger deckeln, sonst bekaemen bei grossen (globalen) Listen die
            // letzten Zeilen mehrere Sekunden Verzoegerung und wirken kaputt.
            transition={{ delay: Math.min(index, 18) * 0.035, duration: 0.3 }}
            onClick={openProfile}
            role={clickable ? 'button' : undefined}
            tabIndex={clickable ? 0 : undefined}
            aria-label={
              clickable ? t('Profil von {name} öffnen', { name: entry.displayName }) : undefined
            }
            onKeyDown={
              clickable
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openProfile();
                    }
                  }
                : undefined
            }
          >
            <span className="lb-lane-rank" style={{ color: currentTheme.text.muted }}>
              {entry.rank}
            </span>

            <div className="lb-lane-avatar">
              <UserAvatar
                userId={entry.uid}
                username={entry.displayName}
                photoURL={entry.photoURL}
                size={38}
                navigable={false}
                bordered={false}
              />
            </div>

            <div className="lb-lane-body">
              <div className="lb-lane-top">
                <span
                  className="lb-lane-name"
                  style={{
                    color: entry.isCurrentUser ? currentTheme.primary : currentTheme.text.secondary,
                  }}
                >
                  <span className="lb-lane-name-text">
                    {entry.isCurrentUser ? t('Du') : entry.displayName}
                  </span>
                  <NameBadges uid={entry.uid} />
                </span>

                <span
                  className="lb-lane-value"
                  style={{
                    color: currentTheme.text.secondary,
                    opacity: entry.value > 0 ? 1 : 0.45,
                  }}
                >
                  {formatValue(entry.value, category)}
                  {unit && <em style={{ color: currentTheme.text.muted }}>{unit}</em>}
                </span>
              </div>

              <div className="lb-lane-track">
                <motion.span
                  className="lb-lane-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${share(entry.value, leader)}%` }}
                  transition={{ duration: 0.65, delay: 0.1 + Math.min(index, 18) * 0.035 }}
                />
              </div>

              {entry.detail != null && entry.detail > 0 && (
                <span className="lb-lane-detail" style={{ color: currentTheme.text.muted }}>
                  {t('davon {n} komplett', { n: entry.detail })}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});
