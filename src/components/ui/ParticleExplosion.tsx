import React, { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ParticleExplosionProps {
  /** When true, particles fire from the origin */
  trigger: boolean;
  /** Origin point relative to viewport */
  origin?: { x: number; y: number };
  /** Colors for particles (picked randomly) */
  colors?: string[];
  /** Number of particles (default: 24, max 40 on mobile) */
  count?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

/**
 * Lightweight particle explosion effect for celebrations.
 * Uses Framer Motion springs for natural physics.
 * Auto-cleans up after animation completes.
 */
export const ParticleExplosion: React.FC<ParticleExplosionProps> = ({
  trigger,
  origin = { x: window.innerWidth / 2, y: window.innerHeight / 2 },
  colors = ['#00fed7', '#8b5cf6', '#ff6b6b', '#fbbf24', '#ffffff'],
  count = 24,
}) => {
  const particles = useMemo<Particle[]>(() => {
    if (!trigger) return [];

    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const velocity = 80 + Math.random() * 180;
      return {
        id: i,
        x: Math.cos(angle) * velocity,
        y: Math.sin(angle) * velocity - Math.random() * 60,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        rotation: Math.random() * 720 - 360,
        delay: Math.random() * 0.08,
      };
    });
  }, [trigger, count, colors]);

  return (
    <AnimatePresence>
      {trigger && (
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
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{
                x: origin.x,
                y: origin.y,
                scale: 1,
                opacity: 1,
                rotate: 0,
              }}
              animate={{
                x: origin.x + p.x,
                y: origin.y + p.y + 100,
                scale: 0,
                opacity: 0,
                rotate: p.rotation,
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8 + Math.random() * 0.4,
                delay: p.delay,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                background: p.color,
                boxShadow: `0 0 6px ${p.color}60`,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
};
