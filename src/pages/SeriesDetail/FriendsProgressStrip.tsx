import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { FriendSeriesProgress } from './useFriendsSeriesProgress';

interface Props {
  entries: FriendSeriesProgress[];
  userPercentage: number;
  userWatched: number;
  isMobile: boolean;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const FriendsProgressStrip = memo(function FriendsProgressStrip({
  entries,
  userPercentage,
  userWatched,
  isMobile,
}: Props) {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('friendsProgressCollapsed') !== '1';
    } catch {
      return true;
    }
  });
  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('friendsProgressCollapsed', next ? '0' : '1');
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (entries.length === 0) return null;

  return (
    <section
      className="friends-progress-strip"
      style={{ margin: isMobile ? '0 12px 20px' : '0 20px 24px' }}
    >
      <button
        type="button"
        className="friends-progress-title-btn"
        onClick={toggle}
        style={{ color: currentTheme.text.primary }}
        aria-expanded={open}
      >
        <span className="friends-progress-title">Freunde</span>
        <span className="friends-progress-count-inline" style={{ color: currentTheme.text.muted }}>
          {entries.length}
        </span>
        {open ? (
          <ExpandLess style={{ fontSize: 18, opacity: 0.55 }} />
        ) : (
          <ExpandMore style={{ fontSize: 18, opacity: 0.55 }} />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="friends-progress-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="friends-progress-list">
              {entries.map((entry, idx) => {
                const pctDiff = entry.percentage - userPercentage;
                const epDiff = entry.watched - userWatched;
                const tint = entry.completed
                  ? currentTheme.accent
                  : pctDiff > 0
                    ? currentTheme.status?.warning || '#ffb15c'
                    : pctDiff === 0
                      ? currentTheme.secondary
                      : currentTheme.primary;

                const position =
                  entry.latestSeason != null && entry.latestEpisode != null
                    ? `S${entry.latestSeason}E${entry.latestEpisode}`
                    : null;

                const diffLabel =
                  epDiff === 0
                    ? entry.completed
                      ? 'Beide durch'
                      : 'Gleichauf'
                    : epDiff > 0
                      ? `${epDiff} ${epDiff === 1 ? 'Folge' : 'Folgen'} voraus`
                      : `${Math.abs(epDiff)} ${Math.abs(epDiff) === 1 ? 'Folge' : 'Folgen'} hinter`;

                return (
                  <motion.button
                    key={entry.uid}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                    whileTap={{ scale: 0.985 }}
                    onClick={() => navigate(`/friend/${entry.uid}`)}
                    className="friend-progress-card"
                  >
                    {entry.photoURL ? (
                      <img src={entry.photoURL} alt="" className="friend-progress-avatar" />
                    ) : (
                      <div
                        className="friend-progress-avatar friend-progress-avatar--initials"
                        style={{ background: currentTheme.primary }}
                      >
                        {initials(entry.displayName)}
                      </div>
                    )}

                    <div className="friend-progress-info">
                      <div
                        className="friend-progress-name"
                        style={{ color: currentTheme.text.primary }}
                      >
                        {entry.displayName}
                      </div>
                      <div
                        className="friend-progress-status"
                        style={{ color: currentTheme.text.muted }}
                      >
                        {position && (
                          <span style={{ color: currentTheme.text.primary, fontWeight: 600 }}>
                            {position}
                          </span>
                        )}
                        {position && ' · '}
                        <span style={{ color: tint }}>{diffLabel}</span>
                      </div>
                    </div>

                    <div
                      className="friend-progress-pct"
                      style={{ color: currentTheme.text.primary }}
                    >
                      {entry.percentage}
                      <span className="friend-progress-pct-unit">%</span>
                    </div>

                    <div className="friend-progress-bar-rail">
                      <div
                        className="friend-progress-bar-fill"
                        style={{ width: `${entry.percentage}%`, background: tint }}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});
