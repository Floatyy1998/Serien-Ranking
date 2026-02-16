import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Whatshot } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../App';

interface WatchStreak {
  currentStreak: number;
  longestStreak: number;
  lastWatchDate: string;
}

type StreakStatus = 'active' | 'at_risk' | 'lost';

function getStreakStatus(lastWatchDate: string): StreakStatus {
  if (!lastWatchDate) return 'lost';
  const today = new Date().toISOString().split('T')[0];
  if (lastWatchDate === today) return 'active';

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (lastWatchDate === yesterday.toISOString().split('T')[0]) return 'at_risk';

  return 'lost';
}

export const WatchStreakCard: React.FC = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [streak, setStreak] = useState<WatchStreak | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const year = new Date().getFullYear();
    const ref = firebase.database().ref(`${user.uid}/wrapped/${year}/streak`);

    const handler = (snapshot: firebase.database.DataSnapshot) => {
      const data = snapshot.val();
      if (data) {
        setStreak({
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          lastWatchDate: data.lastWatchDate || '',
        });
      } else {
        setStreak({ currentStreak: 0, longestStreak: 0, lastWatchDate: '' });
      }
    };

    ref.on('value', handler);
    return () => ref.off('value', handler);
  }, [user?.uid]);

  if (!streak) return null;

  const status = getStreakStatus(streak.lastWatchDate);
  const displayStreak = status === 'lost' ? 0 : streak.currentStreak;
  const isRecord = displayStreak > 0 && displayStreak >= streak.longestStreak;

  const flameColor = status === 'active' ? '#ff6b00' : status === 'at_risk' ? '#ffa726' : currentTheme.text.muted;

  return (
    <div
      style={{
        margin: '0 20px',
        padding: '12px 14px',
        borderRadius: '14px',
        background: `linear-gradient(135deg, ${flameColor}15, ${flameColor}05)`,
        border: `1px solid ${flameColor}30`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: 'calc(100% - 40px)',
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: `linear-gradient(135deg, ${flameColor}, ${flameColor}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Whatshot style={{ fontSize: 20, color: 'white' }} />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: currentTheme.text.primary,
            whiteSpace: 'nowrap',
          }}
        >
          Watch Streak
        </h2>
        <p
          style={{
            margin: '1px 0 0',
            fontSize: 12,
            color: status === 'at_risk' ? flameColor : currentTheme.text.secondary,
            whiteSpace: 'nowrap',
            fontWeight: status === 'at_risk' ? 600 : 400,
          }}
        >
          {status === 'active' && `${displayStreak} ${displayStreak === 1 ? 'Tag' : 'Tage'} in Folge`}
          {status === 'at_risk' && 'Schau heute, um deine Streak zu halten!'}
          {status === 'lost' && 'Starte eine neue Streak!'}
        </p>
      </div>

      {/* Streak Number */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
        {displayStreak > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: flameColor,
                lineHeight: 1,
              }}
            >
              {displayStreak}
            </span>
            <motion.div
              animate={{ y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <Whatshot style={{ fontSize: 18, color: flameColor }} />
            </motion.div>
          </motion.div>
        )}
        {isRecord && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: flameColor,
              background: `${flameColor}18`,
              padding: '2px 5px',
              borderRadius: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Rekord
          </span>
        )}
        {!isRecord && displayStreak > 0 && streak.longestStreak > displayStreak && (
          <span
            style={{
              fontSize: 10,
              color: currentTheme.text.muted,
              whiteSpace: 'nowrap',
            }}
          >
            Best: {streak.longestStreak}
          </span>
        )}
      </div>
    </div>
  );
};
