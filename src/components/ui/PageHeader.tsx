import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useReducedMotion } from '../../hooks/useReducedMotion';
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
  const shouldReduceMotion = useReducedMotion();

  return (
    <header
      style={{
        position: 'relative',
        padding: '20px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))',
        ...(sticky
          ? {
              position: 'sticky',
              top: 0,
              zIndex: 100,
              background: `${currentTheme.background.default}e8`,
              backdropFilter: 'blur(28px) saturate(1.4)',
              WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
              borderBottom: 'none',
            }
          : {}),
        ...style,
      }}
    >
      {/* Subtle bottom edge light */}
      {sticky && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            bottom: 0,
            left: '5%',
            right: '5%',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${currentTheme.primary}18, rgba(255, 255, 255, 0.06), ${currentTheme.primary}18, transparent)`,
            pointerEvents: 'none',
          }}
        />
      )}

      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: -16 }}
        animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 250, damping: 22 }}
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
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
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
                margin: '5px 0 0',
                fontSize: '14px',
                color: currentTheme.text.secondary,
                opacity: 0.7,
                letterSpacing: '0.01em',
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
