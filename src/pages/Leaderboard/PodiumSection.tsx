import { WorkspacePremium } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { NameBadges } from '../../components/ui/display/NameBadges';
import { UserAvatar } from '../../components/ui/media/UserAvatar';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import type { LeaderboardEntry, RankingCategory } from '../../types/Leaderboard';
import { formatValue } from './leaderboardUtils';

/** Medaillenfarben sind Semantik, kein Theme — sie liegen aber nur als Kante
 *  und Schein auf dem Glas, nie als Flaeche (wird auf Dunkel zu Matsch). */
const MEDALS = ['#f3c969', '#cfd6df', '#d79663'];

interface PodiumSectionProps {
  topThree: LeaderboardEntry[];
  category: RankingCategory;
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

  // Vorsprung der Spitze auf Platz 2 — fuellt die rechte Haelfte des Throns
  // mit einer Aussage statt mit Leere.
  const lead = topThree.length > 1 ? topThree[0].value - topThree[1].value : 0;

  return (
    <div className="lb-stage">
      {topThree.map((entry, index) => {
        const medal = MEDALS[index];
        const isFirst = index === 0;
        const openProfile = () => {
          if (!entry.isCurrentUser) navigate(`/friend/${entry.uid}`);
        };

        const value = (
          <span className="lb-champ-value" style={{ color: currentTheme.text.secondary }}>
            {formatValue(entry.value, category)}
            {unit && <em>{unit}</em>}
          </span>
        );

        return (
          <motion.div
            key={entry.uid}
            className={`lb-champ ${isFirst ? 'lb-champ--first' : ''}`}
            style={{ ['--medal' as string]: medal }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            onClick={openProfile}
            role={entry.isCurrentUser ? undefined : 'button'}
            tabIndex={entry.isCurrentUser ? undefined : 0}
            aria-label={
              entry.isCurrentUser
                ? undefined
                : t('Profil von {name} öffnen', { name: entry.displayName })
            }
            onKeyDown={(event) => {
              if (entry.isCurrentUser) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                openProfile();
              }
            }}
          >
            <div className="lb-champ-avatar">
              <UserAvatar
                userId={entry.uid}
                username={entry.displayName}
                photoURL={entry.photoURL}
                size={isFirst ? 68 : 48}
                navigable={false}
                bordered={false}
              />
              {!isFirst && (
                <span className="lb-champ-crest" style={{ color: medal }}>
                  {entry.rank}
                </span>
              )}
            </div>

            <div className="lb-champ-info">
              <span className="lb-champ-tag" style={{ color: medal }}>
                {isFirst && <WorkspacePremium style={{ fontSize: 14 }} />}
                {isFirst ? t('Spitzenreiter') : t('Platz {n}', { n: entry.rank })}
              </span>

              <span
                className="lb-champ-name"
                style={{
                  color: entry.isCurrentUser ? currentTheme.primary : currentTheme.text.secondary,
                }}
              >
                <span className="lb-champ-name-text">
                  {entry.isCurrentUser ? t('Du') : entry.displayName}
                </span>
                <NameBadges uid={entry.uid} />
              </span>

              {isFirst && value}
            </div>

            {!isFirst && value}

            {isFirst && lead > 0 && (
              <div className="lb-champ-lead">
                <span className="lb-champ-lead-label" style={{ color: currentTheme.text.muted }}>
                  {t('Vorsprung')}
                </span>
                <span className="lb-champ-lead-value" style={{ color: medal }}>
                  {formatValue(lead, category)}
                  {unit && <em>{unit}</em>}
                </span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
});
