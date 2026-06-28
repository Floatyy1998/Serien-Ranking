/**
 * ActiveFriendsRow - Horizontal "who's active" rail. Friends are ordered by
 * their most recent activity and shown with a glowing gradient ring (story
 * style). Tapping a friend opens their profile.
 */

import PersonRounded from '@mui/icons-material/PersonRounded';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import type { FriendActivity } from '../../types/Friend';

interface ResolvedUser {
  name: string;
  photoURL?: string;
}

interface ActiveFriendsRowProps {
  activities: FriendActivity[];
  resolveUser: (userId: string) => ResolvedUser;
  theme: {
    primary: string;
    accent: string;
    text: { secondary: string; muted: string };
    background: { default: string; surface: string };
  };
  onSelect: (userId: string) => void;
}

export const ActiveFriendsRow = ({
  activities,
  resolveUser,
  theme,
  onSelect,
}: ActiveFriendsRowProps) => {
  // Unique users, most-recently-active first.
  const users = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const a of activities) {
      if (!seen.has(a.userId)) {
        seen.add(a.userId);
        ordered.push(a.userId);
      }
    }
    return ordered.slice(0, 12);
  }, [activities]);

  if (users.length === 0) return null;

  return (
    <div className="activity-pulse-row" role="list">
      {users.map((userId, i) => {
        const user = resolveUser(userId);
        return (
          <motion.button
            role="listitem"
            key={userId}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              delay: Math.min(i * 0.04, 0.3),
              type: 'spring',
              stiffness: 300,
              damping: 20,
            }}
            whileTap={{ scale: 0.92 }}
            className="activity-pulse-item"
            onClick={() => onSelect(userId)}
            aria-label={`Profil von ${user.name}`}
          >
            <span
              className="activity-pulse-ring"
              style={{
                background: `conic-gradient(from 140deg, ${theme.primary}, ${theme.accent}, ${theme.primary})`,
              }}
            >
              <span
                className="activity-pulse-avatar"
                style={{
                  border: `2px solid ${theme.background.default}`,
                  ...(user.photoURL
                    ? { backgroundImage: `url("${user.photoURL}")` }
                    : { background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }),
                }}
              >
                {!user.photoURL && (
                  <PersonRounded style={{ fontSize: 22, color: theme.text.secondary }} />
                )}
              </span>
            </span>
            <span className="activity-pulse-name" style={{ color: theme.text.muted }}>
              {user.name.split(' ')[0]}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};
