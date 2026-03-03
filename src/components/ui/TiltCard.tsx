import React, { useRef, useCallback, useState } from 'react';

interface TiltCardProps {
  children: React.ReactNode;
  /** Tilt intensity in degrees (default: 8) */
  intensity?: number;
  /** Show glare overlay following cursor (default: false) */
  glare?: boolean;
  /** Glare max opacity (default: 0.15) */
  glareOpacity?: number;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * 3D perspective tilt card with cursor tracking.
 * Desktop-only — no effect on touch devices.
 * Automatically disabled when prefers-reduced-motion is set.
 */
export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  intensity = 8,
  glare = false,
  glareOpacity = 0.15,
  className,
  style,
  onClick,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovering, setIsHovering] = useState(false);
  const rafRef = useRef<number>(0);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);

      rafRef.current = requestAnimationFrame(() => {
        const el = cardRef.current;
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        const rotateY = (x - 0.5) * intensity * 2;
        const rotateX = (0.5 - y) * intensity * 2;

        el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

        if (glare) {
          setGlarePos({ x: x * 100, y: y * 100 });
        }
      });
    },
    [intensity, glare]
  );

  const handlePointerLeave = useCallback(() => {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    setIsHovering(false);
  }, []);

  const handlePointerEnter = useCallback(() => {
    setIsHovering(true);
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerEnter={handlePointerEnter}
      style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 0.15s ease-out',
        willChange: isHovering ? 'transform' : undefined,
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}

      {/* Glare overlay */}
      {glare && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            opacity: isHovering ? 1 : 0,
            transition: 'opacity 0.3s ease',
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255, 255, 255, ${glareOpacity}), transparent 60%)`,
          }}
        />
      )}
    </div>
  );
};
