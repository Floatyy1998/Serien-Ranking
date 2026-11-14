import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Star from '@mui/icons-material/Star';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { NameBadges } from '../../../components/ui/display/NameBadges';
import { t } from '../../../services/i18n';
import type { FriendSeriesProgress } from '../hooks/useFriendsSeriesProgress';
import '../../../components/detail/FriendsStrip.css';

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
        <span className="friends-progress-title">{t('So weit sind deine Freunde')}</span>
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
                const tint = !entry.hasStarted
                  ? currentTheme.text.muted
                  : entry.completed
                    ? currentTheme.accent
                    : pctDiff > 0
                      ? currentTheme.status?.warning || '#ffb15c'
                      : pctDiff === 0
                        ? currentTheme.secondary
                        : currentTheme.primary;

                const position =
                  entry.latestSeason != null && entry.latestEpisode != null
                    ? t('Zuletzt S{s} E{e}', { s: entry.latestSeason, e: entry.latestEpisode })
                    : null;

                const diffLabel = entry.progressUnknown
                  ? t('In der Sammlung')
                  : !entry.hasStarted
                    ? t('Noch nicht begonnen')
                    : epDiff === 0
                      ? entry.completed
                        ? t('Beide durch')
                        : t('Gleichauf mit dir')
                      : epDiff > 0
                        ? epDiff === 1
                          ? t('1 Folge vor dir')
                          : t('{n} Folgen vor dir', { n: epDiff })
                        : Math.abs(epDiff) === 1
                          ? t('1 Folge hinter dir')
                          : t('{n} Folgen hinter dir', { n: Math.abs(epDiff) });

                return (
                  <motion.button
                    key={entry.uid}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.25 }}
                    whileTap={{ opacity: 0.7 }}
                    onClick={() => navigate(`/friend/${entry.uid}`)}
                    className="friend-progress-card"
                  >
                    {entry.photoURL ? (
                      <img
                        src={entry.photoURL}
                        alt=""
                        className="friend-progress-avatar"
                        loading="lazy"
                        decoding="async"
                      />
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
                        <NameBadges uid={entry.uid} />
                        {entry.rating > 0 && (
                          <span
                            className="friend-progress-rating"
                            aria-label={t('Bewertung: {wert}', { wert: entry.rating.toFixed(1) })}
                          >
                            <Star aria-hidden style={{ fontSize: 13 }} />
                            {entry.rating.toFixed(1)}
                          </span>
                        )}
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
                      style={{
                        color: currentTheme.text.primary,
                        visibility: entry.progressUnknown ? 'hidden' : undefined,
                      }}
                    >
                      {entry.percentage}
                      <span className="friend-progress-pct-unit">%</span>
                      <span className="friend-progress-pct-label">{t('gesehen')}</span>
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
