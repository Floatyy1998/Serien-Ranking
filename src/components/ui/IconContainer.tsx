import React from 'react';

interface IconContainerProps {
  color: string;
  secondaryColor?: string;
  size?: number;
  borderRadius?: number | string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable gradient icon container.
 * Used for the 40×40 (or similar) gradient icon boxes throughout the app.
 */
export const IconContainer: React.FC<IconContainerProps> = ({
  color,
  secondaryColor,
  size = 40,
  borderRadius = 12,
  children,
  className,
  style,
}) => (
  <div
    className={className}
    style={{
      width: size,
      height: size,
      borderRadius,
      background: `linear-gradient(135deg, ${color}, ${secondaryColor ?? `${color}cc`})`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      ...style,
    }}
  >
    {children}
  </div>
);
