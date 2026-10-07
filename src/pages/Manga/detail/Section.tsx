import { motion } from 'framer-motion';
import type React from 'react';

interface SectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  id?: string;
  /** Reihenfolge im einspaltigen Mobil-Layout (Spalten-Wrapper sind dort display: contents). */
  order?: number;
}

export const Section = ({ children, delay = 0, className, id, order }: SectionProps) => (
  <motion.section
    id={id}
    style={order !== undefined ? { order } : undefined}
    className={className ? `manga-detail-section ${className}` : 'manga-detail-section'}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    {children}
  </motion.section>
);

export const SectionTitle = ({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="manga-detail-section-head">
    <h2 className="manga-detail-section-title">{children}</h2>
    {action}
  </div>
);
