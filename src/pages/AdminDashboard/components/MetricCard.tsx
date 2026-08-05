import { motion } from 'framer-motion';
import React from 'react';
import type { useTheme } from '../../../contexts/ThemeContext';

interface MetricCardProps {
  title: string;
  children: React.ReactNode;
  /** @deprecated Farben kommen aus adminKit.css — Prop nur noch für Altaufrufe. */
  theme?: ReturnType<typeof useTheme>['currentTheme'];
  delay?: number;
  icon?: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const MetricCard = React.memo<MetricCardProps>(
  ({ title, children, delay = 0, icon, headerRight }) => (
    <motion.div
      className="adm-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
    >
      <div className="adm-card__head">
        <h3 className="adm-card__title">
          {icon}
          {title}
        </h3>
        {headerRight}
      </div>
      {children}
    </motion.div>
  )
);

MetricCard.displayName = 'MetricCard';
