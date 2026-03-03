import React, { useRef, useCallback, useState } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  /** Spotlight color (default: theme primary at 12% opacity) */
  spotlightColor?: string;
  /** Spotlight radius in px (default: 350) */
  spotlightRadius?: number;
  /** Show a glowing border that follows the cursor (default: false) */
  borderGlow?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Card with a radial spotlight that tracks the cursor.
 * Creates a premium glow effect on glassmorphic surfaces.
 * Desktop-only — touch devices get no spotlight.
 */
export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  spotlightColor = 'rgba(0, 254, 215, 0.08)',
  spotlightRadius = 350,
  borderGlow = false,
  className,
  style,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const rafRef = useRef<number>(0);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const el = cardRef.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      el.style.setProperty('--spotlight-x', `${x}px`);
      el.style.setProperty('--spotlight-y', `${y}px`);
    });
  }, []);

  const handlePointerEnter = useCallback(() => setIsHovering(true), []);
  const handlePointerLeave = useCallback(() => setIsHovering(false), []);

  return (
    <div
      ref={cardRef}
      className={className}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Spotlight overlay — multi-layer for depth */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          opacity: isHovering ? 1 : 0,
          transition: 'opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          background: `
            radial-gradient(${spotlightRadius * 0.5}px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${spotlightColor}, transparent 50%),
            radial-gradient(${spotlightRadius}px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${spotlightColor.replace(/[\d.]+\)$/, '0.03)')}, transparent 65%)
          `,
        }}
      />

      {/* Border glow overlay */}
      {borderGlow && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            opacity: isHovering ? 1 : 0,
            transition: 'opacity 0.3s ease',
            border: `1px solid transparent`,
            background: `radial-gradient(${spotlightRadius * 0.6}px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), ${spotlightColor.replace(/[\d.]+\)$/, '0.3)')}, transparent 50%) border-box`,
            WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }}
        />
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
};
