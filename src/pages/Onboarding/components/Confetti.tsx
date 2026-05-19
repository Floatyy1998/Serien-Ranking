import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';

interface ConfettiProps {
  count?: number;
}

interface Particle {
  id: number;
  startX: number;
  width: number;
  height: number;
  rotation: number;
  rotationDelta: number;
  duration: number;
  delay: number;
  color: string;
  shape: 'rect' | 'square' | 'strip' | 'circle';
  swayAmp: number;
  swayFreq: number;
  swayPhase: number;
  swayDir: number;
  blur: number;
}

/** Deterministic PRNG — same particles every render of the page. */
function rng(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

const COLORS = [
  'var(--ob-paper)',
  'var(--ob-paper-2)',
  'color-mix(in srgb, var(--ob-paper) 60%, white)',
  'rgba(255, 255, 255, 0.85)',
  'rgba(255, 220, 120, 0.85)',
];
const SHAPES = ['rect', 'square', 'strip', 'circle'] as const;

/**
 * Wide, slow, drifting paper confetti. Each particle gets its own sinusoidal
 * sway pattern (amplitude, frequency, phase), rotation speed, color and shape.
 * Falls from -10vh down to 110vh over 18-32 seconds, with depth-blur layers.
 */
export const Confetti = memo(({ count = 80 }: ConfettiProps) => {
  const particles = useMemo<Particle[]>(() => {
    return Array.from({ length: count }, (_, i) => {
      const r1 = rng(i + 1);
      const r2 = rng(i * 3 + 7);
      const r3 = rng(i * 5 + 13);
      const r4 = rng(i * 7 + 19);
      const r5 = rng(i * 11 + 23);
      const r6 = rng(i * 13 + 29);
      const shape = SHAPES[Math.floor(r2 * SHAPES.length)];

      // Three depth layers: foreground = bigger/sharp, background = smaller/blurred
      const depth = r6; // 0 = front, 1 = back
      const sizeBase = 8 + (1 - depth) * 8; // 8..16 — front pieces are bigger
      const w =
        shape === 'strip' ? sizeBase * 0.32 : shape === 'square' ? sizeBase : sizeBase * 0.65;
      const h = shape === 'strip' ? sizeBase * 1.9 : shape === 'square' ? sizeBase : sizeBase;

      return {
        id: i,
        startX: r1 * 100,
        width: w,
        height: h,
        rotation: r3 * 360,
        rotationDelta: (r4 < 0.5 ? -1 : 1) * (260 + r4 * 800), // total degrees during fall
        duration: 18 + r1 * 14, // 18..32s
        delay: r2 * 18, // 0..18s — staggers the initial fill
        color: COLORS[Math.floor(r5 * COLORS.length)],
        shape,
        swayAmp: 50 + r3 * 110, // 50..160px
        swayFreq: 1.4 + r4 * 2.2, // 1.4..3.6 cycles over the fall
        swayPhase: r5 * Math.PI * 2,
        swayDir: r6 > 0.5 ? 1 : -1,
        blur: depth * 1.5, // back pieces slightly blurred for depth
      };
    });
  }, [count]);

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {particles.map((p) => {
        // Sample the sway curve so each particle has its own trajectory.
        const steps = 16;
        const xFrames: number[] = [];
        const opacityFrames: number[] = [];
        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          xFrames.push(Math.sin(t * Math.PI * p.swayFreq + p.swayPhase) * p.swayAmp * p.swayDir);
          opacityFrames.push(t < 0.04 ? 0 : t > 0.95 ? 0 : t > 0.88 ? 0.7 : 1);
        }

        return (
          <motion.div
            key={p.id}
            initial={{
              y: '-12vh',
              x: 0,
              rotate: p.rotation,
              opacity: 0,
            }}
            animate={{
              y: '112vh',
              x: xFrames,
              rotate: p.rotation + p.rotationDelta,
              opacity: opacityFrames,
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: 'linear',
              repeat: Infinity,
              repeatType: 'loop',
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: `${p.startX}%`,
              width: p.width,
              height: p.height,
              borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'strip' ? 1 : 2,
              background: p.color,
              filter: p.blur > 0.1 ? `blur(${p.blur}px)` : undefined,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
              willChange: 'transform, opacity',
            }}
          />
        );
      })}
    </div>
  );
});
Confetti.displayName = 'Confetti';
