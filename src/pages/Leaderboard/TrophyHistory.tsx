import { EmojiEvents } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { MonthlyTrophy } from '../../types/Leaderboard';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];
const MEDAL_GRADIENTS = [
  'linear-gradient(135deg, #FFD700, #FFC300, #FFE066)',
  'linear-gradient(135deg, #E0E0E0, #B8B8B8, #D8D8D8)',
  'linear-gradient(135deg, #CD7F32, #E09050, #D4944A)',
];

const MONTH_NAMES: Record<string, string> = {
  '01': 'Januar',
  '02': 'Februar',
  '03': 'März',
  '04': 'April',
  '05': 'Mai',
  '06': 'Juni',
  '07': 'Juli',
  '08': 'August',
  '09': 'September',
  '10': 'Oktober',
  '11': 'November',
  '12': 'Dezember',
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
    <div style={{ paddingTop: '32px' }}>
      <div className="lb-trophy-header">
        <div className="lb-trophy-icon-wrap">
          <EmojiEvents style={{ fontSize: '18px', color: currentTheme.background.default }} />
        </div>
        <h2
          style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: currentTheme.text.primary }}
        >
          Trophäen
        </h2>
      </div>

      <div className="lb-trophy-scroll">
        {trophies.map((trophy, trophyIdx) => (
          <motion.div
            key={trophy.monthKey}
            className="lb-trophy-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: trophyIdx * 0.1 }}
            style={{
              background: currentTheme.background.card,
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            <div className="lb-trophy-card-header">
              <div>
                <div
                  style={{ fontSize: '16px', fontWeight: 800, color: currentTheme.text.primary }}
                >
                  {formatMonthLabel(trophy.monthKey)}
                </div>
                <div
                  style={{ fontSize: '12px', color: currentTheme.text.secondary, marginTop: '2px' }}
                >
                  Watchtime Rangliste
                </div>
              </div>
              <EmojiEvents style={{ fontSize: '24px', color: currentTheme.text.muted }} />
            </div>

            <div className="lb-trophy-entries">
              {([trophy.first, trophy.second, trophy.third] as const).map((entry, idx) => {
                if (!entry) return null;
                const medal = MEDAL_COLORS[idx];
                const isFirst = idx === 0;
                const avatarSize = isFirst ? 34 : 28;
                const medalSize = isFirst ? 28 : 24;

                return (
                  <div
                    key={entry.uid}
                    className="lb-trophy-entry"
                    style={{
                      background: isFirst ? `${medal}15` : 'transparent',
                      marginBottom: idx < 2 ? '4px' : 0,
                      padding: isFirst ? '10px 12px' : '8px 12px',
                    }}
                  >
                    <div
                      className="lb-trophy-medal"
                      style={{
                        width: medalSize,
                        height: medalSize,
                        background: MEDAL_GRADIENTS[idx],
                        boxShadow: `0 2px 8px ${medal}40`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: isFirst ? '14px' : '12px',
                          fontWeight: 900,
                          color: currentTheme.background.default,
                        }}
                      >
                        {idx + 1}
                      </span>
                    </div>

                    <div
                      className="lb-trophy-avatar"
                      style={{
                        width: avatarSize,
                        height: avatarSize,
                        border: `2px solid ${medal}60`,
                        background: currentTheme.background.default,
                      }}
                    >
                      {entry.photoURL ? (
                        <img src={entry.photoURL} alt={entry.displayName} />
                      ) : (
                        <span
                          style={{
                            fontSize: isFirst ? 14 : 11,
                            fontWeight: 700,
                            color: currentTheme.text.secondary,
                          }}
                        >
                          {entry.displayName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        flex: 1,
                        fontSize: isFirst ? '14px' : '13px',
                        fontWeight: isFirst ? 700 : 600,
                        color: currentTheme.text.primary,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.uid === currentUserId ? 'Du' : entry.displayName}
                    </span>

                    <span
                      style={{
                        fontSize: isFirst ? '14px' : '12px',
                        fontWeight: 700,
                        color: medal,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatWatchtime(entry.score)}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
});
