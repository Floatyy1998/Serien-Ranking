import { AutoStories, Favorite, MenuBook, Movie, Star, Tv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { SharedItem } from '../../../services/social/tasteMatchService';
import { USER_COLOR, FRIEND_COLOR, ACCENT_COLORS } from '../constants';
import { t } from '../../../services/i18n';
import { mediaTargetProps } from '../../../lib/interaction/mediaTarget';
import { BookCover } from '../../Books/components/BookCover';
import { bookPath } from '../../Books/helpers';

export type SharedItemType = 'series' | 'movie' | 'manga' | 'book';

const hrefOf = (type: SharedItemType, id: number | string): string => {
  if (type === 'book') return bookPath(String(id));
  return `/${type}/${id}`;
};

const ARIA_LABELS: Record<SharedItemType, (title: string) => string> = {
  series: (title) => t('{title} – Serie Details anzeigen', { title }),
  movie: (title) => t('{title} – Film Details anzeigen', { title }),
  manga: (title) => t('{title} – Manga Details anzeigen', { title }),
  book: (title) => t('{title} – Buch Details anzeigen', { title }),
};

const FALLBACK_ICONS: Record<SharedItemType, { Icon: typeof Tv; color: string }> = {
  series: { Icon: Tv, color: ACCENT_COLORS.series },
  movie: { Icon: Movie, color: ACCENT_COLORS.movies },
  manga: { Icon: AutoStories, color: ACCENT_COLORS.reading },
  book: { Icon: MenuBook, color: ACCENT_COLORS.reading },
};

const posterSrc = (type: SharedItemType, poster: string): string =>
  type === 'series' || type === 'movie' ? `https://image.tmdb.org/t/p/w92${poster}` : poster;

export const SharedItemCard: React.FC<{
  item: SharedItem;
  index: number;
  type: SharedItemType;
  bgColor: string;
}> = ({ item, index, type, bgColor }) => {
  const navigate = useNavigate();
  const hasMatchingRatings = item.ratingDiff !== undefined && item.ratingDiff < 1;
  const fallback = FALLBACK_ICONS[type];
  const isWatchMedia = type === 'series' || type === 'movie';

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileTap={{ opacity: 0.7 }}
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={() => {
        navigate(hrefOf(type, item.id));
      }}
      {...(isWatchMedia
        ? mediaTargetProps({ type, id: item.id, title: item.title, poster: item.poster })
        : {})}
      aria-label={ARIA_LABELS[type](item.title)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        padding: '14px',
        background: bgColor,
        borderRadius: '16px',
        cursor: 'pointer',
        border: hasMatchingRatings
          ? `1px solid ${ACCENT_COLORS.match}40`
          : '1px solid rgba(255,255,255,0.06)',
        marginBottom: '10px',
        boxShadow: hasMatchingRatings
          ? `0 4px 20px ${ACCENT_COLORS.match}20`
          : '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        width: '100%',
        textAlign: 'left',
      }}
    >
      {/* Perfect match glow */}
      {hasMatchingRatings && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${USER_COLOR}, ${FRIEND_COLOR})`,
          }}
        />
      )}

      {type === 'book' ? (
        <BookCover
          book={{
            id: String(item.id),
            title: item.title,
            authors: item.authors,
            cover: item.poster,
          }}
          width={52}
          style={{ borderRadius: 12, flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
        />
      ) : item.poster ? (
        <motion.img
          src={posterSrc(type, item.poster)}
          alt={item.title}
          style={{
            width: 52,
            height: 78,
            borderRadius: 12,
            objectFit: 'cover',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        />
      ) : (
        <div
          style={{
            width: 52,
            height: 78,
            borderRadius: 12,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <fallback.Icon style={{ fontSize: 26, color: `${fallback.color}40` }} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: '6px',
          }}
        >
          {item.title}
        </div>
        {item.userRating !== undefined && item.friendRating !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                background: 'var(--theme-primary-12)',
                borderRadius: '6px',
              }}
            >
              <Star style={{ fontSize: 12, color: USER_COLOR }} />
              <span style={{ fontSize: 13, color: USER_COLOR, fontWeight: 700 }}>
                {item.userRating.toFixed(1)}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                background: `${FRIEND_COLOR}20`,
                borderRadius: '6px',
              }}
            >
              <Star style={{ fontSize: 12, color: FRIEND_COLOR }} />
              <span style={{ fontSize: 13, color: FRIEND_COLOR, fontWeight: 700 }}>
                {item.friendRating.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>
      {hasMatchingRatings && (
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: `${ACCENT_COLORS.match}20`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Favorite style={{ fontSize: 18, color: ACCENT_COLORS.match }} />
        </motion.div>
      )}
    </motion.button>
  );
};
