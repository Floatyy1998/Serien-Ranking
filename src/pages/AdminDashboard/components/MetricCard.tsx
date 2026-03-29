import { motion } from 'framer-motion';
import React from 'react';
import type { useTheme } from '../../../contexts/ThemeContextDef';

interface MetricCardProps {
  title: string;
  children: React.ReactNode;
  theme: ReturnType<typeof useTheme>['currentTheme'];
  delay?: number;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const MetricCard = React.memo<MetricCardProps>(
  ({ title, children, theme, delay = 0, icon, headerRight }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      style={{
        background: `${theme.background.surface}cc`,
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: `1px solid ${theme.border.default}`,
        borderRadius: 16,
        padding: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: theme.text.primary }}>
            {title}
          </h3>
        </div>
        {headerRight}
      </div>
      {children}
    </motion.div>
  )
);

MetricCard.displayName = 'MetricCard';
