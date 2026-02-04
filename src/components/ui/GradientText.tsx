import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface GradientTextProps {
  children: React.ReactNode;
  from?: string;
  to?: string;
  angle?: number;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  style?: React.CSSProperties;
}

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  from,
  to,
  angle = 135,
  as: Tag = 'span',
  style,
}) => {
  const { currentTheme } = useTheme();
  const fromColor = from || currentTheme.primary;
  const toColor = to || currentTheme.text.primary;

  return (
    <Tag
      style={{
        background: `linear-gradient(${angle}deg, ${fromColor}, ${toColor})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
};
