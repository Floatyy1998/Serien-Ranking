import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { GradientText } from '../../components/ui';

interface GradientRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

export const GradientRing = memo<GradientRingProps>(({ progress, size = 56, strokeWidth = 4 }) => {
  const { currentTheme } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="cu-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="cu-ring-svg">
        <defs>
          <linearGradient id={`ring-gradient-${progress}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={currentTheme.primary} />
            <stop offset="100%" stopColor={currentTheme.secondary} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`${currentTheme.text.muted}20`}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#ring-gradient-${progress})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="cu-ring-center">
        <GradientText
          as="span"
          to={currentTheme.secondary}
          style={{ fontSize: size * 0.24, fontWeight: 700 }}
        >
          {Math.min(99, Math.round(progress))}%
        </GradientText>
      </div>
    </div>
  );
});

GradientRing.displayName = 'GradientRing';
