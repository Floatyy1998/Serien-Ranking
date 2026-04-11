import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import Close from '@mui/icons-material/Close';
import Inventory2 from '@mui/icons-material/Inventory2';
import LockOpen from '@mui/icons-material/LockOpen';
import Bolt from '@mui/icons-material/Bolt';
import CardGiftcard from '@mui/icons-material/CardGiftcard';
import Diamond from '@mui/icons-material/Diamond';
import Wallpaper from '@mui/icons-material/Wallpaper';
import { useAuth } from '../../AuthContext';
import { openMysteryBox } from '../../services/pet/mysteryBoxService';
import type { MysteryBoxReward } from '../../services/pet/mysteryBoxService';
import { RARITY_COLORS, RARITY_LABELS } from '../../types/pet.types';
import type { AccessoryRarity } from '../../types/pet.types';

function getRewardIcon(reward: MysteryBoxReward) {
  switch (reward.type) {
    case 'accessory':
      return reward.rarity === 'epic' || reward.rarity === 'legendary' ? (
        <Diamond style={{ fontSize: 72, color: '#E040FB' }} />
      ) : (
        <CardGiftcard style={{ fontSize: 72, color: '#2196F3' }} />
      );
    case 'xp_boost':
      return <Bolt style={{ fontSize: 72, color: '#FFD93D' }} />;
    case 'background':
      return <Wallpaper style={{ fontSize: 72, color: '#00D4FF' }} />;
    default:
      return <CardGiftcard style={{ fontSize: 72, color: '#9E9E9E' }} />;
  }
}

interface MysteryBoxOverlayProps {
  totalEpisodes: number;
  onClose: () => void;
}

export const MysteryBoxOverlay: React.FC<MysteryBoxOverlayProps> = ({ totalEpisodes, onClose }) => {
  const { user } = useAuth() || {};
  const [phase, setPhase] = useState<'closed' | 'shaking' | 'opening' | 'reveal'>('closed');
  const [reward, setReward] = useState<MysteryBoxReward | null>(null);

  const handleOpen = async () => {
    if (!user?.uid) return;

    setPhase('shaking');

    setTimeout(async () => {
      setPhase('opening');

      const result = await openMysteryBox(user.uid, totalEpisodes);
      if (result) {
        setReward(result);
        setTimeout(() => {
          setPhase('reveal');
          try {
            const revealAudio = new Audio('/sounds/reveal.mp3');
            revealAudio.volume = 0.6;
            revealAudio.playbackRate = 2.0;
            revealAudio.play().catch(() => {});
            setTimeout(() => revealAudio.pause(), 3000);
          } catch {
            // ignore
          }
        }, 800);
      }
    }, 1500);
  };

  const rarityColor = reward ? RARITY_COLORS[reward.rarity] || '#9E9E9E' : '#FF9800';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10000,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: 28,
            cursor: 'pointer',
            zIndex: 10001,
            lineHeight: 1,
          }}
        >
          <Close style={{ fontSize: 28 }} />
        </button>

        <motion.h2
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            color: 'white',
            fontSize: 22,
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            marginBottom: 32,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {phase === 'reveal' ? (
            'Belohnung!'
          ) : (
            <>
              <Inventory2 style={{ fontSize: 22, color: '#E040FB' }} />
              Mystery Box
            </>
          )}
        </motion.h2>

        {/* Mystery Box */}
        {phase !== 'reveal' && (
          <motion.div
            animate={
              phase === 'shaking'
                ? {
                    rotate: [0, -5, 5, -5, 5, -3, 3, -2, 2, 0],
                    scale: [1, 1.02, 1.02, 1.03, 1.03, 1.04, 1.04, 1.05, 1.05, 1.1],
                  }
                : phase === 'opening'
                  ? { scale: [1.1, 1.3, 0], rotate: [0, 10, -180], opacity: [1, 1, 0] }
                  : {}
            }
            transition={
              phase === 'shaking'
                ? { duration: 1.5, ease: 'easeInOut' }
                : phase === 'opening'
                  ? { duration: 0.8, ease: 'easeIn' }
                  : {}
            }
            style={{
              width: 160,
              height: 160,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: 24,
                background: 'linear-gradient(145deg, #2d1b69, #1a0f3c)',
                border: '3px solid #FFD93D50',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow:
                  '0 0 40px rgba(255,217,61,0.2), 0 0 80px rgba(156,39,176,0.15), inset 0 0 30px rgba(255,217,61,0.05)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Shimmer effect */}
              <motion.div
                animate={{ x: [-200, 200] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  background:
                    'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
                }}
              />
              <Inventory2
                style={{ fontSize: 56, color: phase === 'shaking' ? '#E040FB' : '#9C27B0' }}
              />
            </div>
          </motion.div>
        )}

        {/* Reveal */}
        {phase === 'reveal' && reward && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 150 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              marginBottom: 32,
            }}
          >
            {/* Glow */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                width: 250,
                height: 250,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${rarityColor}50, ${rarityColor}15, transparent)`,
                filter: 'blur(40px)',
                position: 'absolute',
              }}
            />

            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10, delay: 0.1 }}
            >
              {getRewardIcon(reward)}
            </motion.div>

            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                color: 'white',
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                textAlign: 'center',
              }}
            >
              {reward.label}
            </motion.span>

            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 }}
              style={{
                background: `${rarityColor}25`,
                color: rarityColor,
                padding: '4px 14px',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                boxShadow: `0 0 20px ${rarityColor}30`,
              }}
            >
              {RARITY_LABELS[reward.rarity as AccessoryRarity] || 'Belohnung'}
            </motion.span>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center' }}
            >
              {reward.type === 'accessory' && 'Exklusives Accessoire freigeschaltet!'}
              {reward.type === 'background' &&
                'Neuer Hintergrund freigeschaltet — statte dein Pet aus!'}
              {reward.type === 'xp_boost' &&
                `${reward.xpMultiplier}x XP Boost — aktiviere ihn auf der Pet-Seite!`}
            </motion.p>
          </motion.div>
        )}

        {/* Action buttons */}
        {phase === 'closed' && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpen}
            style={{
              background: 'linear-gradient(135deg, #9C27B0, #E040FB)',
              color: 'white',
              border: 'none',
              borderRadius: 16,
              padding: '14px 48px',
              fontSize: 18,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
              boxShadow: '0 6px 24px rgba(156,39,176,0.4)',
            }}
          >
            <LockOpen style={{ fontSize: 20, marginRight: 4 }} /> Öffnen!
          </motion.button>
        )}

        {phase === 'reveal' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              background: `linear-gradient(135deg, ${rarityColor}, ${rarityColor}cc)`,
              color: '#fff',
              border: 'none',
              borderRadius: 16,
              padding: '14px 48px',
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 6px 24px ${rarityColor}50`,
            }}
          >
            Einsammeln
          </motion.button>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
