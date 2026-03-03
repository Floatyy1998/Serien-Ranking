import React from 'react';

interface AuroraBackgroundProps {
  children: React.ReactNode;
  colors?: [string, string, string];
  intensity?: 'subtle' | 'medium' | 'intense';
  style?: React.CSSProperties;
  className?: string;
}

const opacityMap = {
  subtle: { layer1: '10', layer2: '08', layer3: '06' },
  medium: { layer1: '18', layer2: '12', layer3: '0c' },
  intense: { layer1: '25', layer2: '18', layer3: '12' },
};

/**
 * Aurora / Northern Lights background effect.
 * Overlays animated radial gradients that shift slowly.
 */
export const AuroraBackground: React.FC<AuroraBackgroundProps> = ({
  children,
  colors = ['#00fed7', '#8b5cf6', '#ff6b6b'],
  intensity = 'medium',
  style,
  className,
}) => {
  const op = opacityMap[intensity];

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Aurora layer 1 */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-20%',
          background: `radial-gradient(ellipse 80% 60% at 30% 20%, ${colors[0]}${op.layer1} 0%, transparent 50%)`,
          animation: 'meshShift 20s ease-in-out infinite alternate',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
      {/* Aurora layer 2 */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-20%',
          background: `radial-gradient(ellipse 70% 80% at 70% 60%, ${colors[1]}${op.layer2} 0%, transparent 50%)`,
          animation: 'meshShift 28s ease-in-out infinite alternate-reverse',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
      {/* Aurora layer 3 */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: '-20%',
          background: `radial-gradient(ellipse 60% 50% at 50% 80%, ${colors[2]}${op.layer3} 0%, transparent 50%)`,
          animation: 'meshShift 35s ease-in-out infinite alternate',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
      {/* Content above aurora */}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
};
