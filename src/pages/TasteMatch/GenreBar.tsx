import { LocalFireDepartment } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { GenreComparison } from '../../services/tasteMatchService';
import { USER_COLOR, USER_GRADIENT, FRIEND_COLOR, FRIEND_GRADIENT } from './constants';

// Genre Bar - Premium Version
export const GenreBar: React.FC<{
  genre: GenreComparison;
  index: number;
  userName: string;
  friendName: string;
  bgColor: string;
}> = ({ genre, index, userName, friendName, bgColor }) => {
  const maxPct = Math.max(genre.userPercentage, genre.friendPercentage, 15);
  const similarity = 100 - Math.abs(genre.userPercentage - genre.friendPercentage);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      whileHover={{ scale: 1.01 }}
      style={{
        marginBottom: '12px',
        padding: '16px',
        background: bgColor,
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700, color: 'white' }}>{genre.genre}</div>
        {similarity >= 80 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.05 * index + 0.3, type: 'spring' }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '8px',
              background: 'rgba(0, 206, 201, 0.2)',
              border: '1px solid rgba(0, 206, 201, 0.3)',
            }}
          >
            <LocalFireDepartment style={{ fontSize: 12, color: '#00cec9' }} />
            <span style={{ fontSize: 10, color: '#00cec9', fontWeight: 600 }}>Match!</span>
          </motion.div>
        )}
      </div>

      {/* User Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div
          style={{
            width: 28,
            fontSize: 10,
            color: USER_COLOR,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {userName.slice(0, 3)}
        </div>
        <div
          style={{
            flex: 1,
            height: 10,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 5,
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(genre.userPercentage / maxPct) * 100}%` }}
            transition={{ delay: 0.05 * index + 0.1, duration: 0.6, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: USER_GRADIENT,
              borderRadius: 5,
              boxShadow: `0 0 10px ${USER_COLOR}50`,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: USER_COLOR,
            minWidth: 40,
            textAlign: 'right',
          }}
        >
          {genre.userPercentage}%
        </span>
      </div>

      {/* Friend Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: 28,
            fontSize: 10,
            color: FRIEND_COLOR,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {friendName.slice(0, 3)}
        </div>
        <div
          style={{
            flex: 1,
            height: 10,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 5,
            overflow: 'hidden',
          }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(genre.friendPercentage / maxPct) * 100}%` }}
            transition={{ delay: 0.05 * index + 0.15, duration: 0.6, ease: 'easeOut' }}
            style={{
              height: '100%',
              background: FRIEND_GRADIENT,
              borderRadius: 5,
              boxShadow: `0 0 10px ${FRIEND_COLOR}50`,
            }}
          />
        </div>
        <span
          style={{
            fontSize: 14,
            fontWeight: 800,
            color: FRIEND_COLOR,
            minWidth: 40,
            textAlign: 'right',
          }}
        >
          {genre.friendPercentage}%
        </span>
      </div>
    </motion.div>
  );
};
