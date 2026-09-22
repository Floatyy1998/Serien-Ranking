import { EmojiEvents } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { NameBadges } from '../../components/ui/display/NameBadges';
import { UserAvatar } from '../../components/ui/media/UserAvatar';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import type { MonthlyTrophy } from '../../types/Leaderboard';

/** Nur als Kante und Ziffernfarbe — gefuellte Medaillen werden auf dunklem
 *  Grund zu Braun-Matsch. */
const MEDAL_COLORS = ['#f3c969', '#cfd6df', '#d79663'];

const MONTH_NAMES: Record<string, string> = {
  '01': t('Januar'),
  '02': t('Februar'),
  '03': t('März'),
  '04': t('April'),
  '05': t('Mai'),
  '06': t('Juni'),
  '07': t('Juli'),
  '08': t('August'),
  '09': t('September'),
  '10': t('Oktober'),
  '11': t('November'),
  '12': t('Dezember'),
};

function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  return `${MONTH_NAMES[month] || month} ${year}`;
}

function formatWatchtime(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${minutes}m`;
}

interface TrophyHistoryProps {
  trophies: MonthlyTrophy[];
  currentUserId?: string;
}

export const TrophyHistory = React.memo(function TrophyHistory({
  trophies,
  currentUserId,
}: TrophyHistoryProps) {
  const { currentTheme } = useTheme();

  if (trophies.length === 0) return null;

  return (
    <section>
      <h2 className="lb-trophy-header">
        <EmojiEvents style={{ fontSize: 16, color: MEDAL_COLORS[0] }} />
        {t('Trophäen')}
      </h2>

      <div className="lb-trophy-grid">
        {trophies.map((trophy, trophyIdx) => (
          <motion.div
            key={trophy.monthKey}
            className="lb-trophy-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: Math.min(trophyIdx, 8) * 0.06 }}
          >
            <span className="lb-trophy-month" style={{ color: currentTheme.text.secondary }}>
              {formatMonthLabel(trophy.monthKey)}
            </span>

            {([trophy.first, trophy.second, trophy.third] as const).map((entry, idx) => {
              if (!entry) return null;

              return (
                <div key={entry.uid} className="lb-trophy-row">
                  <span className="lb-trophy-place" style={{ color: MEDAL_COLORS[idx] }}>
                    {idx + 1}
                  </span>

                  <UserAvatar
                    userId={entry.uid}
                    username={entry.displayName}
                    photoURL={entry.photoURL}
                    size={26}
                    navigable={false}
                    bordered={false}
                  />

                  <span className="lb-trophy-name" style={{ color: currentTheme.text.secondary }}>
                    {entry.uid === currentUserId ? t('Du') : entry.displayName}
                    <NameBadges uid={entry.uid} compact />
                  </span>

                  <span className="lb-trophy-score" style={{ color: currentTheme.text.muted }}>
                    {formatWatchtime(entry.score)}
                  </span>
                </div>
              );
            })}
          </motion.div>
        ))}
      </div>
    </section>
  );
});
