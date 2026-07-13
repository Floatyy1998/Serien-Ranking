import { motion } from 'framer-motion';
import type React from 'react';

interface SectionProps {
  children: React.ReactNode;
  bg?: string;
  delay?: number;
  className?: string;
}

export const Section = ({ children, bg, delay = 0, className }: SectionProps) => (
  <motion.div
    className={className ? `manga-detail-section ${className}` : 'manga-detail-section'}
    style={{ borderRadius: 16, padding: 16, marginBottom: 12, background: bg }}
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
  >
    {children}
  </motion.div>
);

export const SectionTitle = ({ children, color }: { children: React.ReactNode; color: string }) => (
  <div
    style={{
      fontSize: 15,
      fontWeight: 700,
      marginBottom: 12,
      fontFamily: 'var(--font-display)',
      color,
    }}
  >
    {children}
  </div>
);
