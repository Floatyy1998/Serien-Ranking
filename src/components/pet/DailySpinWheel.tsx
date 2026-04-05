import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Bolt from '@mui/icons-material/Bolt';
import Close from '@mui/icons-material/Close';
import Whatshot from '@mui/icons-material/Whatshot';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import Diamond from '@mui/icons-material/Diamond';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import CardGiftcard from '@mui/icons-material/CardGiftcard';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import { useAuth } from '../../AuthContext';
import {
  buildSpinSegments,
  canSpinToday,
  performDailySpin,
} from '../../services/pet/dailySpinService';
import type { SpinReward } from '../../services/pet/dailySpinService';
import { RARITY_COLORS, RARITY_LABELS } from '../../types/pet.types';

interface DailySpinWheelProps {
  streakDays: number;
  onClose: () => void;
}

const SEGMENT_COUNT = 9;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

const SEGMENT_COLORS = [
  '#3a3a3a', // Niete
  '#FFD93D', // 2x XP 2 Ep
  '#4a4a4a', // Niete
  '#FF9800', // 2x XP 5 Ep
  '#2196F3', // Accessoire
  '#4CAF50', // 2x XP 10 Ep
  '#9C27B0', // Seltenes Acc
  '#E040FB', // Episches Acc
  '#FFD700', // Legendäres Acc
];

/** MUI icon per segment */
const SEGMENT_ICONS = [
  <Close style={{ fontSize: 28, color: 'rgba(255,255,255,0.4)' }} />,
  <Bolt style={{ fontSize: 28, color: '#1a1a2e' }} />,
  <Close style={{ fontSize: 28, color: 'rgba(255,255,255,0.4)' }} />,
  <Whatshot style={{ fontSize: 28, color: '#1a1a2e' }} />,
  <CardGiftcard style={{ fontSize: 28, color: 'white' }} />,
  <LocalFireDepartment style={{ fontSize: 28, color: '#1a1a2e' }} />,
  <AutoAwesome style={{ fontSize: 28, color: 'white' }} />,
  <Diamond style={{ fontSize: 28, color: 'white' }} />,
  <EmojiEvents style={{ fontSize: 28, color: '#1a1a2e' }} />,
];

/** Result icon by type */
function getResultIcon(reward: SpinReward) {
  switch (reward.type) {
    case 'nothing':
      return <Close style={{ fontSize: 64, color: '#666' }} />;
    case 'xp_boost':
      if ((reward.xpEpisodeCount || 0) >= 10)
        return <LocalFireDepartment style={{ fontSize: 64, color: '#4CAF50' }} />;
      if ((reward.xpEpisodeCount || 0) >= 5)
        return <Whatshot style={{ fontSize: 64, color: '#FF9800' }} />;
      return <Bolt style={{ fontSize: 64, color: '#FFD93D' }} />;
    case 'accessory':
      if (reward.rarity === 'legendary')
        return <EmojiEvents style={{ fontSize: 64, color: '#FFD700' }} />;
      if (reward.rarity === 'epic') return <Diamond style={{ fontSize: 64, color: '#E040FB' }} />;
      if (reward.rarity === 'rare')
        return <AutoAwesome style={{ fontSize: 64, color: '#9C27B0' }} />;
      return <CardGiftcard style={{ fontSize: 64, color: '#2196F3' }} />;
    default:
      return null;
  }
}

const WHEEL_SIZE = 280;
const CENTER = WHEEL_SIZE / 2;
const RADIUS = WHEEL_SIZE / 2 - 4;

export const DailySpinWheel: React.FC<DailySpinWheelProps> = ({ streakDays, onClose }) => {
  const { user } = useAuth() || {};
  const [phase, setPhase] = useState<'ready' | 'spinning' | 'result'>('ready');
  const [canSpin, setCanSpin] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<SpinReward | null>(null);
  const [loading, setLoading] = useState(true);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const lastTickAngleRef = useRef(-1);

  const segments = buildSpinSegments(streakDays);

  useEffect(() => {
    if (!user?.uid) return;
    canSpinToday(user.uid).then((ok) => {
      setCanSpin(ok);
      setLoading(false);
    });
  }, [user?.uid]);

  useEffect(() => {
    return () => {
      audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  /** Procedural tick sound — same style as CaseOpeningOverlay */
  const playTickSound = useCallback((volume: number) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    const t = ctx.currentTime;

    // White noise burst (~15ms)
    const bufSize = (ctx.sampleRate * 0.015) | 0;
    const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const noiseData = noiseBuf.getChannelData(0);
    for (let n = 0; n < bufSize; n++) noiseData[n] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    // Highpass for sharp metallic click
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2000;
    hp.Q.value = 5;

    // Distortion for industrial feel
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

    tickGain.gain.setValueAtTime(volume * 0.35, t);
    tickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
    noise.start(t);
    noise.stop(t + 0.02);
  }, []);

  const handleSpin = async () => {
    if (!user?.uid || phase !== 'ready' || !canSpin) return;

    setPhase('spinning');
    lastTickAngleRef.current = -1;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }

    const spinResult = await performDailySpin(user.uid, streakDays);
    if (!spinResult) {
      setCanSpin(false);
      setPhase('ready');
      return;
    }

    const segCenter = spinResult.segmentIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const targetAngle = 360 - segCenter;
    const jitter = (Math.random() - 0.5) * (SEGMENT_ANGLE * 0.6);
    const totalSpinDeg = 360 * 6 + targetAngle + jitter;
    const totalRotation = rotation + totalSpinDeg;

    // Tick sounds that slow down with the wheel
    const spinDuration = 5000;
    const startTime = Date.now();
    let tickFrame: number;

    const tickLoop = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / spinDuration);
      // Easing matches the CSS ease
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentDeg = rotation + totalSpinDeg * eased;
      const segmentIdx = Math.floor((((currentDeg % 360) + 360) % 360) / SEGMENT_ANGLE);

      if (segmentIdx !== lastTickAngleRef.current) {
        lastTickAngleRef.current = segmentIdx;
        const vol = Math.min(1, 0.3 + progress * 0.7);
        playTickSound(vol);
      }

      if (progress < 1) {
        tickFrame = requestAnimationFrame(tickLoop);
      }
    };
    tickFrame = requestAnimationFrame(tickLoop);

    setRotation(totalRotation);

    setTimeout(() => {
      cancelAnimationFrame(tickFrame);
      setResult(spinResult.reward);
      setPhase('result');
      setCanSpin(false);

      // Same reveal sound as CaseOpeningOverlay
      const revealAudio = new Audio('/sounds/reveal.mp3');
      revealAudio.volume = 0.8;
      revealAudio.playbackRate = 2.0;
      revealAudio.play().catch(() => {});
      setTimeout(() => revealAudio.pause(), 5000);
    }, 5500);
  };

  const rarityColor = result ? RARITY_COLORS[result.rarity] || '#9E9E9E' : '#9E9E9E';

  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(0,0,0,0.85)',
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
          top: 'calc(16px + env(safe-area-inset-top, 0px))',
          right: 16,
          background: 'none',
          border: 'none',
          color: 'white',
          fontSize: 28,
          cursor: 'pointer',
          zIndex: 10001,
        }}
      >
        <Close style={{ fontSize: 28 }} />
      </button>

      {/* Title */}
      <motion.h2
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          color: 'white',
          fontSize: 22,
          fontWeight: 800,
          fontFamily: 'var(--font-display)',
          marginBottom: 8,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {phase === 'result' ? (
          result?.type === 'nothing' ? (
            'Schade!'
          ) : (
            'Gewonnen!'
          )
        ) : (
          <>
            <AutoAwesome style={{ fontSize: 22, color: '#FFD93D' }} />
            Tägliches Glücksrad
          </>
        )}
      </motion.h2>

      {streakDays > 0 && phase !== 'result' && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            color: '#FFD93D',
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Whatshot style={{ fontSize: 16 }} />
          {streakDays} Tage Streak — bessere Belohnungen!
        </motion.p>
      )}

      {/* The Wheel */}
      {phase !== 'result' && (
        <div
          style={{
            position: 'relative',
            width: WHEEL_SIZE,
            height: WHEEL_SIZE,
            marginBottom: 24,
          }}
        >
          {/* Pointer */}
          <div
            style={{
              position: 'absolute',
              top: -14,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderTop: '20px solid #FFD93D',
              zIndex: 10,
              filter: 'drop-shadow(0 2px 6px rgba(255,217,61,0.5))',
            }}
          />

          {/* Rotating wheel */}
          <motion.div
            animate={{ rotate: rotation }}
            transition={{
              duration: phase === 'spinning' ? 5 : 0,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            style={{
              width: WHEEL_SIZE,
              height: WHEEL_SIZE,
              borderRadius: '50%',
              position: 'relative',
              boxShadow:
                '0 0 0 4px rgba(255,255,255,0.15), 0 0 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(0,0,0,0.3)',
            }}
          >
            {/* SVG pie segments */}
            <svg
              viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
              width={WHEEL_SIZE}
              height={WHEEL_SIZE}
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              {segments.map((_, i) => {
                const startAngle = i * SEGMENT_ANGLE - 90;
                const endAngle = startAngle + SEGMENT_ANGLE;
                const startRad = (startAngle * Math.PI) / 180;
                const endRad = (endAngle * Math.PI) / 180;

                const x1 = CENTER + RADIUS * Math.cos(startRad);
                const y1 = CENTER + RADIUS * Math.sin(startRad);
                const x2 = CENTER + RADIUS * Math.cos(endRad);
                const y2 = CENTER + RADIUS * Math.sin(endRad);

                const d = `M${CENTER},${CENTER} L${x1},${y1} A${RADIUS},${RADIUS} 0 0 1 ${x2},${y2} Z`;

                return (
                  <path
                    key={i}
                    d={d}
                    fill={SEGMENT_COLORS[i]}
                    stroke="rgba(0,0,0,0.3)"
                    strokeWidth={1.5}
                  />
                );
              })}
              {/* Center circle */}
              <circle
                cx={CENTER}
                cy={CENTER}
                r="30"
                fill="#1a1a2e"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="2"
              />
              <text
                x={CENTER}
                y={CENTER}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontWeight="800"
                style={{ fontSize: 13, letterSpacing: '1px' }}
              >
                SPIN
              </text>
            </svg>

            {/* MUI Icons positioned on each segment */}
            {segments.map((_, i) => {
              const midAngle = (i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2 - 90) * (Math.PI / 180);
              const iconR = RADIUS * 0.6;
              const ix = CENTER + iconR * Math.cos(midAngle);
              const iy = CENTER + iconR * Math.sin(midAngle);

              return (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: ix,
                    top: iy,
                    transform: 'translate(-50%, -50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  {SEGMENT_ICONS[i]}
                </div>
              );
            })}
          </motion.div>
        </div>
      )}

      {/* Result display */}
      <AnimatePresence>
        {phase === 'result' && result && (
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
            {result.type !== 'nothing' && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${rarityColor}40, ${rarityColor}10, transparent)`,
                  filter: 'blur(30px)',
                  position: 'absolute',
                }}
              />
            )}

            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 10, delay: 0.1 }}
            >
              {getResultIcon(result)}
            </motion.div>

            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                color: 'white',
                fontSize: 20,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                textAlign: 'center',
              }}
            >
              {result.label}
            </motion.span>

            {result.type !== 'nothing' && (
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
                {RARITY_LABELS[result.rarity]}
              </motion.span>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, textAlign: 'center' }}
            >
              {result.type === 'xp_boost' &&
                `Alle XP werden ${result.xpMultiplier}x multipliziert für ${result.xpEpisodeCount} Episoden!`}
              {result.type === 'accessory' && 'Neues Accessoire freigeschaltet!'}
              {result.type === 'nothing' && 'Morgen hast du mehr Glück!'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Buttons */}
      {phase === 'ready' && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSpin}
          disabled={!canSpin}
          style={{
            background: canSpin
              ? 'linear-gradient(135deg, #FFD93D, #FF9800)'
              : 'rgba(255,255,255,0.1)',
            color: canSpin ? '#1a1a2e' : 'rgba(255,255,255,0.4)',
            border: 'none',
            borderRadius: 16,
            padding: '14px 48px',
            fontSize: 18,
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            cursor: canSpin ? 'pointer' : 'default',
            boxShadow: canSpin ? '0 6px 24px rgba(255,152,0,0.4)' : 'none',
          }}
        >
          {canSpin ? 'Drehen!' : 'Morgen wieder!'}
        </motion.button>
      )}

      {phase === 'result' && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          style={{
            background:
              result?.type === 'nothing'
                ? 'rgba(255,255,255,0.15)'
                : `linear-gradient(135deg, ${rarityColor}, ${rarityColor}cc)`,
            color: '#fff',
            border: 'none',
            borderRadius: 16,
            padding: '14px 48px',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: result?.type === 'nothing' ? 'none' : `0 6px 24px ${rarityColor}50`,
          }}
        >
          {result?.type === 'nothing' ? 'Schließen' : 'Einsammeln'}
        </motion.button>
      )}
    </motion.div>
  );
};
