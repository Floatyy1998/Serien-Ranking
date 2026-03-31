import { AnimatePresence, motion, useMotionValue, useTransform } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../AuthContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { petService } from '../../services/petService';
import type { AccessoryRarity } from '../../types/pet.types';
import { ACCESSORIES, RARITY_COLORS, RARITY_LABELS } from '../../types/pet.types';
import { seededRandom } from '../../utils/seededRandom';
import './CaseOpeningOverlay.css';

interface CaseOpeningOverlayProps {
  dropData: { dropId: string; accessoryId: string; rarity: string } | null;
  onClose: () => void;
}

const STRIP_LENGTH = 60;
const TARGET_INDEX = 48;
const CARD_WIDTH = 80;
const CARD_GAP = 8;
const CARD_TOTAL = CARD_WIDTH + CARD_GAP;

// Animation duration matches the CS:GO sound (~10s spin before reveal)
const SPIN_DURATION = 10;

const allAccessories = Object.entries(ACCESSORIES).map(([id, def]) => ({
  id,
  ...def,
}));

/** Build a strip of accessories with the target at TARGET_INDEX */
function buildStrip(targetId: string, seed: number) {
  const rand = seededRandom(seed);
  const strip: (typeof allAccessories)[number][] = [];

  for (let i = 0; i < STRIP_LENGTH; i++) {
    if (i === TARGET_INDEX) {
      const target = allAccessories.find((a) => a.id === targetId) || allAccessories[0];
      strip.push(target);
    } else {
      // Weight by rarity for realism
      const r = rand();
      let pick;
      if (r < 0.45) pick = allAccessories.filter((a) => a.rarity === 'common');
      else if (r < 0.75) pick = allAccessories.filter((a) => a.rarity === 'uncommon');
      else if (r < 0.9) pick = allAccessories.filter((a) => a.rarity === 'rare');
      else if (r < 0.98) pick = allAccessories.filter((a) => a.rarity === 'epic');
      else pick = allAccessories.filter((a) => a.rarity === 'legendary');
      strip.push(pick[Math.floor(rand() * pick.length)] || allAccessories[0]);
    }
  }
  return strip;
}

export const CaseOpeningOverlay = React.memo(function CaseOpeningOverlay({
  dropData,
  onClose,
}: CaseOpeningOverlayProps) {
  const auth = useAuth();
  const user = auth?.user;
  const { currentTheme } = useTheme();
  const [phase, setPhase] = useState<'loading' | 'spinning' | 'reveal'>('loading');
  const [alreadyClaimed, setAlreadyClaimed] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickCardRef = useRef(-1);

  const rarity = (dropData?.rarity || 'common') as AccessoryRarity;
  const rarityColor = RARITY_COLORS[rarity] || RARITY_COLORS.common;

  const seed = useMemo(
    () => (dropData ? dropData.dropId.charCodeAt(0) * 1000 + Date.now() : 0),
    [dropData]
  );
  const strip = useMemo(
    () => (dropData ? buildStrip(dropData.accessoryId, seed) : []),
    [dropData, seed]
  );

  // Use viewport width (capped at max-width 480) for centering
  const halfContainer = Math.min(window.innerWidth - 32, 480) / 2;
  const finalOffset = -(TARGET_INDEX * CARD_TOTAL) + halfContainer - CARD_WIDTH / 2;

  // Motion value for tick sounds
  const x = useMotionValue(100);
  const currentCardIndex = useTransform(x, (v) => Math.floor((-v + halfContainer) / CARD_TOTAL));

  // Play tick on each card change
  useEffect(() => {
    const unsubscribe = currentCardIndex.on('change', (idx) => {
      if (phase !== 'spinning' || !audioCtxRef.current) return;
      const cardIdx = Math.round(idx);
      if (cardIdx !== lastTickCardRef.current && cardIdx >= 0 && cardIdx < STRIP_LENGTH) {
        lastTickCardRef.current = cardIdx;
        const ctx = audioCtxRef.current;
        const progress = cardIdx / TARGET_INDEX;
        const vol = Math.min(1, 0.3 + progress * 0.7);

        // Hard mechanical tick — distorted click
        const t = ctx.currentTime;

        // Noise click through highpass — sharp, industrial
        const bufSize = (ctx.sampleRate * 0.015) | 0;
        const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let n = 0; n < bufSize; n++) noiseData[n] = Math.random() * 2 - 1;
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 2000;
        hp.Q.value = 5;
        const dist = ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let n = 0; n < 256; n++) {
          const x = n / 128 - 1;
          curve[n] = ((Math.PI + 4 * Math.abs(x)) * x) / (Math.PI + 4 * x * x);
        }
        dist.curve = curve;
        const tickGain = ctx.createGain();
        noise.connect(hp);
        hp.connect(dist);
        dist.connect(tickGain);
        tickGain.connect(ctx.destination);
        tickGain.gain.setValueAtTime(vol * 0.35, t);
        tickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
        noise.start(t);
        noise.stop(t + 0.02);
      }
    });
    return unsubscribe;
  }, [currentCardIndex, phase]);

  const handleAnimationComplete = useCallback(() => {
    // Reveal — play epic reveal sound (2x speed, 5 seconds)
    const revealAudio = new Audio('/sounds/reveal.mp3');
    revealAudio.volume = 0.8;
    revealAudio.playbackRate = 2.0;
    revealAudio.play().catch(() => {});
    setTimeout(() => {
      revealAudio.pause();
    }, 5000);
    setPhase('reveal');

    // Auto-claim immediately so the item is safe even if user closes the app
    if (user && dropData) {
      petService.claimAccessoryDrop(user.uid, dropData.dropId, dropData.accessoryId);
    }
  }, [user, dropData]);

  // Check if drop still exists, then spin or show endscreen
  useEffect(() => {
    if (!dropData) return;

    setPhase('loading');
    lastTickCardRef.current = -1;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    // Check Firebase if pending drop still exists
    import('firebase/compat/app').then(({ default: firebase }) => {
      const uid = auth?.user?.uid;
      if (!uid) return;
      firebase
        .database()
        .ref(`users/${uid}/pendingAccessoryDrops/${dropData.dropId}`)
        .once('value')
        .then((snap) => {
          if (snap.exists()) {
            setAlreadyClaimed(false);
            // Reset position BEFORE switching to spinning
            x.jump(100);
            requestAnimationFrame(() => {
              setPhase('spinning');
            });
          } else {
            setAlreadyClaimed(true);
            setPhase('reveal');
          }
        });
    });
  }, [dropData, x, auth?.user?.uid]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  // Pre-computed confetti random values
  const confettiRand = useMemo(() => seededRandom(seed + 42), [seed]);

  return (
    <AnimatePresence>
      {dropData && (
        <motion.div
          className="case-opening-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Spark / fire explosion — scales with rarity */}
          {phase === 'reveal' &&
            (() => {
              const cfg: Record<
                string,
                { count: number; dist: number; size: number; glow: number; duration: number }
              > = {
                common: { count: 20, dist: 120, size: 4, glow: 3, duration: 0.5 },
                uncommon: { count: 35, dist: 180, size: 5, glow: 5, duration: 0.6 },
                rare: { count: 60, dist: 250, size: 7, glow: 8, duration: 0.8 },
                epic: { count: 90, dist: 350, size: 9, glow: 12, duration: 1.0 },
                legendary: { count: 150, dist: 500, size: 12, glow: 20, duration: 1.4 },
              };
              const c = cfg[rarity] || cfg.common;
              const FIRE_COLORS: Record<string, string[]> = {
                common: ['#aaa', '#888', '#ccc'],
                uncommon: ['#4CAF50', '#81C784', '#FFF59D'],
                rare: ['#2196F3', '#64B5F6', '#E3F2FD', '#fff'],
                epic: ['#9C27B0', '#E040FB', '#AA00FF', '#F3E5F5', '#fff'],
                legendary: [
                  '#FF9800',
                  '#FFD54F',
                  '#FFAB00',
                  '#FF6D00',
                  '#fff',
                  '#FF3D00',
                  '#FFEA00',
                ],
              };
              const colors = FIRE_COLORS[rarity] || FIRE_COLORS.common;

              return Array.from({ length: c.count }).map((_, i) => {
                const angle = confettiRand() * Math.PI * 2;
                const dist = c.dist * 0.3 + confettiRand() * c.dist * 0.7;
                const endX = Math.cos(angle) * dist;
                const endY = Math.sin(angle) * dist - confettiRand() * c.dist * 0.2;
                const size = c.size * (0.5 + confettiRand());
                const color = colors[Math.floor(confettiRand() * colors.length)];

                return (
                  <motion.div
                    key={`spark-${i}`}
                    className="case-opening-confetti"
                    initial={{
                      left: '50vw',
                      top: '45vh',
                      x: 0,
                      y: 0,
                      opacity: 1,
                      scale: 1,
                    }}
                    animate={{
                      x: endX,
                      y: endY,
                      opacity: [1, 1, 0.5, 0],
                      scale: [1.2, 1, 0.3, 0],
                    }}
                    transition={{
                      duration: c.duration * (0.6 + confettiRand() * 0.4),
                      delay: confettiRand() * 0.08,
                      ease: [0.1, 0.6, 0.3, 1],
                    }}
                    style={{
                      width: size,
                      height: size,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 ${c.glow}px ${c.glow / 2}px ${color}`,
                    }}
                  />
                );
              });
            })()}

          {/* Flash + glow — also scales with rarity */}
          {phase === 'reveal' && (
            <>
              <motion.div
                initial={{
                  opacity: rarity === 'legendary' ? 1 : rarity === 'epic' ? 0.8 : 0.5,
                  scale: 0.1,
                }}
                animate={{
                  opacity: 0,
                  scale: rarity === 'legendary' ? 6 : rarity === 'epic' ? 4 : 2,
                }}
                transition={{ duration: rarity === 'legendary' ? 0.8 : 0.4, ease: 'easeOut' }}
                style={{
                  position: 'fixed',
                  top: '45vh',
                  left: '50vw',
                  transform: 'translate(-50%, -50%)',
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  background:
                    rarity === 'legendary'
                      ? `radial-gradient(circle, #fff, ${rarityColor}, transparent 70%)`
                      : `radial-gradient(circle, ${rarityColor}, transparent 70%)`,
                  pointerEvents: 'none',
                  zIndex: 10000,
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                  position: 'absolute',
                  top: '20%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '300px',
                  height: '300px',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${rarityColor}50, ${rarityColor}15, transparent)`,
                  filter: 'blur(40px)',
                  pointerEvents: 'none',
                }}
              />
            </>
          )}

          <div className="case-opening-content">
            {/* Title */}
            <motion.h2
              className="case-opening-title"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ color: currentTheme.text.primary }}
            >
              {phase === 'spinning' ? '🎁 Accessoire-Drop!' : ''}
            </motion.h2>

            {/* Carousel (spinning phase) */}
            {phase === 'spinning' && (
              <div className="case-opening-carousel-wrapper">
                {/* Center marker */}
                <div className="case-opening-marker" style={{ color: '#fff' }} />

                <motion.div
                  className="case-opening-strip"
                  style={{ x }}
                  animate={{ x: finalOffset }}
                  transition={{
                    duration: SPIN_DURATION,
                    ease: [0.05, 0.3, 0.08, 1],
                  }}
                  onAnimationComplete={handleAnimationComplete}
                >
                  {strip.map((acc, i) => {
                    const accRarity = acc.rarity as AccessoryRarity;
                    const color = RARITY_COLORS[accRarity] || RARITY_COLORS.common;
                    return (
                      <div
                        key={i}
                        className="case-opening-card"
                        style={{
                          borderColor: color + '60',
                          background: `${color}10`,
                        }}
                      >
                        <span className="case-opening-card-icon">{acc.icon}</span>
                        <span
                          className="case-opening-card-name"
                          style={{ color: currentTheme.text.secondary }}
                        >
                          {acc.name}
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              </div>
            )}

            {/* Reveal phase */}
            {phase === 'reveal' && (
              <motion.div
                className="case-opening-reveal"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 12, stiffness: 150 }}
              >
                <motion.span
                  className="case-opening-reveal-icon"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 200, delay: 0.1 }}
                >
                  {strip[TARGET_INDEX]?.icon}
                </motion.span>

                <motion.span
                  className="case-opening-reveal-name"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  style={{ color: currentTheme.text.primary }}
                >
                  {strip[TARGET_INDEX]?.name}
                </motion.span>

                <motion.span
                  className="case-opening-rarity-badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 }}
                  style={{
                    background: rarityColor + '25',
                    color: rarityColor,
                    boxShadow: `0 0 20px ${rarityColor}30`,
                  }}
                >
                  {RARITY_LABELS[rarity]}
                </motion.span>

                <motion.button
                  className="case-opening-claim-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: alreadyClaimed ? 0.1 : 0.65 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  style={{
                    background: `linear-gradient(135deg, ${rarityColor}, ${rarityColor}cc)`,
                    color: '#fff',
                    boxShadow: `0 6px 24px ${rarityColor}50`,
                  }}
                >
                  {alreadyClaimed ? 'Schließen' : 'Einsammeln'}
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
