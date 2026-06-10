import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface CelebrationBurstProps {
  /** When true → mount the burst once and auto-unmount after `duration`. */
  trigger: boolean;
  /** Burst lifetime in ms (default 2200). */
  duration?: number;
  /** Particle count (default 32). */
  count?: number;
  /** Optional theme tint — picks from this palette in addition to defaults. */
  colors?: string[];
  /** Called after the burst is done, in case the caller wants to reset trigger. */
  onDone?: () => void;
}

interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  rotation: number;
  rotationEnd: number;
  color: string;
  shape: 'rect' | 'circle';
  durationMs: number;
}

const DEFAULT_COLORS = ['#facc15', '#22c55e', '#3b82f6', '#ec4899', '#f97316', '#a855f7'];

/**
 * One-shot confetti burst — emits particles radially from the viewport center
 * (or top-third on mobile to avoid the on-screen keyboard area). Use for
 * milestone unlocks, streak shields, badge earns. Honors prefers-reduced-motion
 * by rendering nothing.
 *
 * Pattern: pair with a state flag; flip it true on the celebration moment,
 * the component will auto-unmount itself after `duration` and invoke `onDone`.
 */
export function CelebrationBurst({
  trigger,
  duration = 2200,
  count = 32,
  colors,
  onDone,
}: CelebrationBurstProps) {
  const reduceMotion = useReducedMotion();
  // Particles live in state because they need fresh Math.random() each burst.
  // Generating them in useMemo would violate react-hooks/purity in React 19,
  // and a ref would force imperative re-renders. Effect-driven works cleanly.
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const palette = colors ? [...DEFAULT_COLORS, ...colors] : DEFAULT_COLORS;
    const next: Particle[] = Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const distance = 140 + Math.random() * 220;
      const size = 6 + Math.random() * 8;
      return {
        id: i,
        angle,
        distance,
        size,
        rotation: Math.random() * 180,
        rotationEnd: 360 + Math.random() * 720,
        color: palette[Math.floor(Math.random() * palette.length)],
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        durationMs: duration * (0.7 + Math.random() * 0.3),
      };
    });
    setParticles(next);
    const timer = setTimeout(() => {
      setParticles([]);
      onDone?.();
    }, duration);
    return () => clearTimeout(timer);
  }, [trigger, count, colors, duration, onDone]);

  if (reduceMotion || particles.length === 0) return null;

  const node = (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {particles.map((p) => {
        const targetX = Math.cos(p.angle) * p.distance;
        const targetY = Math.sin(p.angle) * p.distance + 120; // gravity bias
        return (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, rotate: p.rotation, scale: 0.5 }}
            animate={{
              x: targetX,
              y: targetY,
              opacity: [1, 1, 0],
              rotate: p.rotation + p.rotationEnd,
              scale: [0.5, 1.1, 1],
            }}
            transition={{
              duration: p.durationMs / 1000,
              ease: [0.16, 1, 0.3, 1],
              opacity: { times: [0, 0.7, 1] },
              scale: { times: [0, 0.2, 1] },
            }}
            style={{
              position: 'absolute',
              top: '40%',
              left: '50%',
              width: p.size,
              height: p.shape === 'rect' ? p.size * 1.8 : p.size,
              background: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : 2,
              boxShadow: `0 2px 8px ${p.color}55`,
              willChange: 'transform, opacity',
            }}
          />
        );
      })}
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(node, document.body);
}
