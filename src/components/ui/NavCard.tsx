import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';

interface NavCardProps {
  onClick: () => void;
  accentColor: string;
  'aria-label'?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Compact navigation card button used on the HomePage.
 * Renders the consistent surface card with subtle accent border and tap animation.
 */
export const NavCard: React.FC<NavCardProps> = ({
  onClick,
  accentColor: _accentColor,
  'aria-label': ariaLabel,
  children,
  className,
}) => {
  const { currentTheme } = useTheme();
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
      style={{
        margin: '0 20px',
        padding: '12px 14px',
        borderRadius: '14px',
        background: currentTheme.background.surface,
        border: `1px solid ${currentTheme.border.default}`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: 'calc(100% - 40px)',
        textAlign: 'left',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
      }}
    >
      {children}
    </motion.button>
  );
};
