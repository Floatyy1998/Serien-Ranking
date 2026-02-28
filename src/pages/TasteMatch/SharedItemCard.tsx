import { Favorite, Movie, Star, Tv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SharedItem } from '../../services/tasteMatchService';
import { USER_COLOR, USER_GRADIENT, FRIEND_COLOR, ACCENT_COLORS } from './constants';

// Shared Item Card - Premium Version
export const SharedItemCard: React.FC<{
  item: SharedItem;
  index: number;
  type: 'series' | 'movie';
  bgColor: string;
}> = ({ item, index, type, bgColor }) => {
  const navigate = useNavigate();
  const hasMatchingRatings = item.ratingDiff !== undefined && item.ratingDiff < 1;

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={() => navigate(`/${type === 'series' ? 'series' : 'movie'}/${item.id}`)}
      aria-label={`${item.title} – ${type === 'series' ? 'Serie' : 'Film'} Details anzeigen`}
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
          : '0 4px 15px rgba(0,0,0,0.1)',
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
            background: `linear-gradient(90deg, ${USER_GRADIENT.split('(')[1].split(',')[1]}, ${FRIEND_COLOR})`,
          }}
        />
      )}

      {item.poster ? (
        <motion.img
          src={`https://image.tmdb.org/t/p/w92${item.poster}`}
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
          {type === 'series' ? (
            <Tv style={{ fontSize: 26, color: 'rgba(255,255,255,0.25)' }} />
          ) : (
            <Movie style={{ fontSize: 26, color: 'rgba(255,255,255,0.25)' }} />
          )}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'white',
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
                background: `${USER_COLOR}20`,
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
