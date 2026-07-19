import { motion } from 'framer-motion';
import { memo } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { t } from '../../services/i18n';

interface NowPlayingIndicatorProps {
  color?: string;
  size?: 'sm' | 'md';
  /** Position over an absolutely-positioned parent (poster). Defaults to top-left. */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Optional aria-label override. */
  label?: string;
}

// Single source of truth for the pulse speed – tune here if it ever needs
// to feel calmer/punchier.
const CYCLE_SECONDS = 1.6;
const STAGGER_SECONDS = 0.22;

/**
 * Animated 3-bar equalizer used to mark the currently-watching item.
 * JS-driven via Framer Motion – no CSS keyframes, no shorthand caching
 * quirks. The cycle/stagger constants above are the only knobs.
 */
export const NowPlayingIndicator = memo<NowPlayingIndicatorProps>(
  ({ color, size = 'sm', position = 'top-left', label }) => {
    const resolvedLabel = label ?? t('Aktuell am Schauen');
    const prefersReducedMotion = useReducedMotion();
    const tint = color ?? 'var(--theme-primary, #00d123)';
    const dim = size === 'sm' ? 22 : 28;
    const barWidth = size === 'sm' ? 3 : 4;
    const gap = size === 'sm' ? 2 : 3;

    const offsets: Record<
      NonNullable<NowPlayingIndicatorProps['position']>,
      React.CSSProperties
    > = {
      'top-left': { top: -4, left: -4 },
      'top-right': { top: -4, right: -4 },
      'bottom-left': { bottom: -4, left: -4 },
      'bottom-right': { bottom: -4, right: -4 },
    };

    return (
      <div
        role="status"
        aria-label={resolvedLabel}
        style={{
          position: 'absolute',
          ...offsets[position],
          width: dim,
          height: dim,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          gap,
          padding: 4,
          borderRadius: 6,
          background: `linear-gradient(135deg, color-mix(in srgb, ${tint} 22%, rgba(10,14,22,0.85)), color-mix(in srgb, ${tint} 8%, rgba(10,14,22,0.85)))`,
          boxShadow: `0 2px 8px rgba(0,0,0,0.45), 0 0 12px color-mix(in srgb, ${tint} 40%, transparent)`,
          backdropFilter: 'var(--blur-sm)',
          WebkitBackdropFilter: 'var(--blur-sm)',
          border: `1px solid color-mix(in srgb, ${tint} 35%, transparent)`,
          pointerEvents: 'none',
          zIndex: 4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            style={{
              width: barWidth,
              height: '100%',
              background: tint,
              borderRadius: 1.5,
              transformOrigin: 'bottom center',
              boxShadow: `0 0 4px ${tint}`,
              display: 'block',
            }}
            initial={{ scaleY: prefersReducedMotion ? 0.75 : 0.4 }}
            animate={prefersReducedMotion ? { scaleY: 0.75 } : { scaleY: [0.4, 1, 0.4] }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : {
                    duration: CYCLE_SECONDS,
                    delay: i * STAGGER_SECONDS,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
          />
        ))}
      </div>
    );
  }
);
NowPlayingIndicator.displayName = 'NowPlayingIndicator';
