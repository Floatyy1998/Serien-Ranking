import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import StarRounded from '@mui/icons-material/StarRounded';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NameBadges } from '../../components/ui/display/NameBadges';
import { useTheme } from '../../contexts/ThemeContext';
import { dateLocale, t } from '../../services/i18n';
import type { FriendMovieEntry } from './useFriendsMovieStatus';
import '../../components/detail/FriendsStrip.css';

interface Props {
  entries: FriendMovieEntry[];
  isMobile: boolean;
}

const COLLAPSED_KEY = 'friendsProgressCollapsed';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function watchedLabel(watchedAt: number | null): string {
  if (watchedAt === null) return t('Gesehen');
  const date = new Date(watchedAt);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  const formatted = date.toLocaleDateString(dateLocale(), {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
  return t('Gesehen am {date}', { date: formatted });
}

export const FriendsMovieStrip = memo(function FriendsMovieStrip({ entries, isMobile }: Props) {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? '0' : '1');
      } catch {
        // ignore
      }
      return next;
    });
  };

  if (entries.length === 0) return null;

  const watchedCount = entries.filter((e) => e.state === 'watched').length;

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
        <span className="friends-progress-title">{t('Freunde')}</span>
        <span className="friends-progress-count-inline" style={{ color: currentTheme.text.muted }}>
          {watchedCount > 0
            ? t('{n} von {total} gesehen', { n: watchedCount, total: entries.length })
            : entries.length}
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
            key="friends-movie-body"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="friends-progress-list">
              {entries.map((entry, idx) => {
                const tint =
                  entry.state === 'watched'
                    ? currentTheme.status?.success || currentTheme.accent
                    : entry.state === 'watchlist'
                      ? currentTheme.primary
                      : currentTheme.text.muted;
                const label =
                  entry.state === 'watched'
                    ? watchedLabel(entry.watchedAt)
                    : entry.state === 'watchlist'
                      ? t('Auf der Watchlist')
                      : t('In der Liste');

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
                      </div>
                      <div className="friend-progress-status" style={{ color: tint }}>
                        {label}
                      </div>
                    </div>

                    {entry.rating > 0 ? (
                      <div
                        className="friend-progress-pct"
                        style={{
                          color: currentTheme.text.primary,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                        aria-label={t('Bewertung {rating}', { rating: entry.rating.toFixed(1) })}
                      >
                        <StarRounded
                          aria-hidden
                          style={{ fontSize: 16, color: currentTheme.status?.warning || '#f59e0b' }}
                        />
                        {entry.rating.toFixed(1)}
                      </div>
                    ) : (
                      <span />
                    )}
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
