import { TrendingDown, TrendingFlat, TrendingUp } from '@mui/icons-material';
import { motion, useSpring, useTransform } from 'framer-motion';
import React, { useEffect } from 'react';
import { Area, AreaChart } from 'recharts';
import { SafeResponsiveContainer } from '../../../components/ui/SafeResponsiveContainer';
import type { useTheme } from '../../../contexts/ThemeContext';

interface KpiScorecardProps {
  title: string;
  value: number;
  delta?: number;
  suffix?: string;
  sparklineData?: Array<{ value: number }>;
  icon: React.ReactNode;
  color: string;
  /** @deprecated Farben kommen aus adminKit.css — Prop nur noch für Altaufrufe. */
  theme?: ReturnType<typeof useTheme>['currentTheme'];
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
  ({ title, value, delta, suffix, sparklineData, icon, color, delay = 0 }) => {
    const trend = delta === undefined || delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down';
    const DeltaIcon = trend === 'flat' ? TrendingFlat : trend === 'up' ? TrendingUp : TrendingDown;

    return (
      <motion.div
        className="adm-kpi"
        style={{ '--adm-tone': color } as React.CSSProperties}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: delay * 0.1, type: 'spring', stiffness: 200, damping: 20 }}
      >
        {sparklineData && sparklineData.length > 1 && (
          <div className="adm-kpi__spark">
            <SafeResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
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
            </SafeResponsiveContainer>
          </div>
        )}

        <div className="adm-kpi__head">
          <div className="adm-kpi__icon">{icon}</div>
          <span className="adm-kpi__title">{title}</span>
        </div>

        <div className="adm-kpi__value">
          <AnimatedNumber value={value} suffix={suffix} />
        </div>

        {delta !== undefined && (
          <div className={`adm-kpi__delta adm-kpi__delta--${trend}`}>
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
