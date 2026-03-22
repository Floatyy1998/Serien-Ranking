/**
 * ScoreHeader - Premium Score Display mit Avataren, Verbindungslinie, Namen und Score
 */

import { Favorite, LocalFireDepartment } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { GradientText } from '../../components/ui';
import { TasteMatchResult } from '../../services/tasteMatchService';
import {
  USER_COLOR,
  USER_GRADIENT,
  FRIEND_COLOR,
  FRIEND_GRADIENT,
  ACCENT_COLORS,
  getCompatibilityColors,
} from './constants';
import { AnimatedCounter } from './AnimatedCounter';
import { getScoreColor, getScoreMessage } from './useTasteMatchData';

interface ScoreHeaderProps {
  result: TasteMatchResult;
  userName: string;
  userPhoto: string | null;
  friendName: string;
  friendPhoto: string | null;
}

export const ScoreHeader: React.FC<ScoreHeaderProps> = React.memo(
  ({ result, userName, userPhoto, friendName, friendPhoto }) => {
    const scoreColor = getScoreColor(result.overallMatch);
    const compatColors = getCompatibilityColors(result.overallMatch);

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="tm-score-section">
        {/* Multi-layered glow */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="tm-score-glow tm-score-glow--primary"
          style={{ background: scoreColor }}
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
          className="tm-score-glow tm-score-glow--secondary"
          style={{
            background: `linear-gradient(135deg, ${USER_COLOR}, ${FRIEND_COLOR})`,
          }}
        />

        {/* Premium Avatars with connecting line */}
        <div className="tm-avatars">
          {/* Connecting gradient line */}
          <div
            className="tm-avatars__line"
            style={{
              background: `linear-gradient(90deg, ${USER_COLOR}, transparent, ${FRIEND_COLOR})`,
            }}
          />

          <motion.div
            initial={{ x: -40, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="tm-avatar"
            style={{
              background: USER_GRADIENT,
              boxShadow: `0 8px 30px ${USER_COLOR}50`,
            }}
          >
            {userPhoto ? (
              <img src={userPhoto} alt="" className="tm-avatar__img" />
            ) : (
              userName.charAt(0).toUpperCase()
            )}
          </motion.div>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="tm-heart-icon"
            style={{
              background: `linear-gradient(135deg, ${ACCENT_COLORS.match}30, ${ACCENT_COLORS.match}10)`,
              border: `2px solid ${ACCENT_COLORS.match}40`,
              boxShadow: `0 0 20px ${ACCENT_COLORS.match}40`,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Favorite style={{ fontSize: 22, color: ACCENT_COLORS.match }} />
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ x: 40, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="tm-avatar"
            style={{
              background: FRIEND_GRADIENT,
              boxShadow: `0 8px 30px ${FRIEND_COLOR}50`,
            }}
          >
            {friendPhoto ? (
              <img src={friendPhoto} alt="" className="tm-avatar__img" />
            ) : (
              friendName.charAt(0).toUpperCase()
            )}
          </motion.div>
        </div>

        {/* Names with gradient pills */}
        <div className="tm-names">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="tm-name-pill"
            style={{
              background: `${USER_COLOR}20`,
              color: USER_COLOR,
              border: `1px solid ${USER_COLOR}30`,
            }}
          >
            {userName}
          </motion.span>
          <span className="tm-names__separator">&times;</span>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="tm-name-pill"
            style={{
              background: `${FRIEND_COLOR}20`,
              color: FRIEND_COLOR,
              border: `1px solid ${FRIEND_COLOR}30`,
            }}
          >
            {friendName}
          </motion.span>
        </div>

        {/* Premium Score Display */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
          className="tm-score-display"
        >
          <GradientText
            as="span"
            from={compatColors.from}
            to={compatColors.to}
            style={{
              fontSize: 80,
              fontWeight: 900,
              lineHeight: 1,
              textShadow: `0 0 40px ${scoreColor}60`,
              filter: `drop-shadow(0 4px 20px ${scoreColor}50)`,
            }}
          >
            <AnimatedCounter value={result.overallMatch} />
          </GradientText>
          <span className="tm-score-percent">%</span>
        </motion.div>

        {/* Score message with badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="tm-score-message"
          style={{
            background: `${scoreColor}15`,
            border: `1px solid ${scoreColor}30`,
          }}
        >
          {result.overallMatch >= 60 && (
            <LocalFireDepartment style={{ fontSize: 18, color: scoreColor }} />
          )}
          <span style={{ fontSize: 15, fontWeight: 600 }}>
            {getScoreMessage(result.overallMatch)}
          </span>
        </motion.div>
      </motion.div>
    );
  }
);

ScoreHeader.displayName = 'ScoreHeader';
