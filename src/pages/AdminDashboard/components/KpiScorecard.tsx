import { TrendingDown, TrendingFlat, TrendingUp } from '@mui/icons-material';
import { motion, useSpring, useTransform } from 'framer-motion';
import React, { useEffect } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import type { useTheme } from '../../../contexts/ThemeContext';

interface KpiScorecardProps {
  title: string;
  value: number;
  delta?: number;
  suffix?: string;
  sparklineData?: Array<{ value: number }>;
  icon: React.ReactNode;
  color: string;
  theme: ReturnType<typeof useTheme>['currentTheme'];
  delay?: number;
}

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 50, damping: 15 });
  const display = useTransform(spring, (v) => {
    if (suffix === '%') return `${Math.round(v)}%`;
    if (v >= 1000) return `${(v / 1000).toFixed(1)}k`;
    return Math.round(v).toLocaleString('de-DE');
  });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
}

export const KpiScorecard = React.memo<KpiScorecardProps>(
  ({ title, value, delta, suffix, sparklineData, icon, color, theme, delay = 0 }) => {
    const deltaColor =
      delta === undefined || delta === 0
        ? theme.text.muted
        : delta > 0
          ? theme.status.success
          : theme.status.error;
    const DeltaIcon =
      delta === undefined || delta === 0 ? TrendingFlat : delta > 0 ? TrendingUp : TrendingDown;

    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
        style={{
          background: `${theme.background.surface}cc`,
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          border: `1px solid ${theme.border.default}`,
          borderRadius: 16,
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minWidth: 160,
          flex: '1 1 0',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Sparkline background */}
        {sparklineData && sparklineData.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 50,
              opacity: 0.2,
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData}>
                <defs>
                  <linearGradient id={`spark-${title}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  strokeWidth={1.5}
                  fill={`url(#spark-${title})`}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, zIndex: 1 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color,
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
          <span style={{ fontSize: 12, color: theme.text.muted, fontWeight: 600 }}>{title}</span>
        </div>

        {/* Value */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: theme.text.primary,
            letterSpacing: '-0.03em',
            zIndex: 1,
          }}
        >
          <AnimatedNumber value={value} suffix={suffix} />
        </div>

        {/* Delta */}
        {delta !== undefined && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              color: deltaColor,
              zIndex: 1,
            }}
          >
            <DeltaIcon style={{ fontSize: 16 }} />
            <span>
              {delta > 0 ? '+' : ''}
              {Math.round(delta)}% vs gestern
            </span>
          </div>
        )}
      </motion.div>
    );
  }
);

KpiScorecard.displayName = 'KpiScorecard';
