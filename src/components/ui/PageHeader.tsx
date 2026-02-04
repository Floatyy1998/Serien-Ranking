import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { BackButton } from './BackButton';
import { GradientText } from './GradientText';

interface PageHeaderProps {
  title: string;
  gradientFrom?: string;
  gradientTo?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  sticky?: boolean;
  style?: React.CSSProperties;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  gradientFrom,
  gradientTo,
  subtitle,
  icon,
  actions,
  sticky = true,
  style,
}) => {
  const { currentTheme } = useTheme();

  return (
    <header
      style={{
        padding: '20px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))',
        ...(sticky
          ? {
              position: 'sticky',
              top: 0,
              zIndex: 100,
              background: `${currentTheme.background.default}ee`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }
          : {}),
        ...style,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <BackButton />
        <div style={{ flex: 1 }}>
          <GradientText
            as="h1"
            from={gradientFrom}
            to={gradientTo}
            style={{
              fontSize: '26px',
              fontWeight: 800,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            {icon}
            {title}
          </GradientText>
          {subtitle && (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: '14px',
                color: currentTheme.text.secondary,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
        {actions}
      </motion.div>
    </header>
  );
};
