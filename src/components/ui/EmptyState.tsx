import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  iconColor?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 200, damping: 20 },
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  iconColor,
  action,
}) => {
  const { currentTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();
  const color = iconColor || currentTheme.primary;

  const Wrapper = shouldReduceMotion ? 'div' : motion.div;
  const Item = shouldReduceMotion ? 'div' : motion.div;

  const wrapperProps = shouldReduceMotion
    ? {}
    : { variants: containerVariants, initial: 'hidden', animate: 'visible' };
  const itemProps = shouldReduceMotion ? {} : { variants: itemVariants };

  return (
    <Wrapper style={{ textAlign: 'center', padding: '56px 24px' }} {...wrapperProps}>
      {/* Floating icon with cinematic glow */}
      <Item {...itemProps}>
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [0, -8, 0],
                }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : {
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }
          }
          style={{
            fontSize: '52px',
            color: color,
            marginBottom: '24px',
            opacity: 0.7,
            display: 'flex',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Multi-layer glow behind icon */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color}18 0%, ${color}08 40%, transparent 70%)`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              animation: 'auraBreath 4s ease-in-out infinite',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              animation: 'pulseGlow 3s ease-in-out infinite',
            }}
          />
          {icon}
        </motion.div>
      </Item>

      <Item {...itemProps}>
        <h2
          style={{
            fontSize: '19px',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            color: currentTheme.text.primary,
            marginBottom: '10px',
            letterSpacing: '-0.02em',
          }}
        >
          {title}
        </h2>
      </Item>

      {description && (
        <Item {...itemProps}>
          <p
            style={{
              color: currentTheme.text.muted,
              fontSize: '14px',
              margin: 0,
              maxWidth: '300px',
              marginLeft: 'auto',
              marginRight: 'auto',
              lineHeight: 1.6,
              opacity: 0.8,
            }}
          >
            {description}
          </p>
        </Item>
      )}

      {action && (
        <Item {...itemProps}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.onClick}
            style={{
              marginTop: '24px',
              padding: '13px 32px',
              background: `linear-gradient(135deg, ${currentTheme.primary}, color-mix(in srgb, ${currentTheme.primary} 55%, var(--theme-secondary-gradient, #8b5cf6)))`,
              border: 'none',
              borderRadius: '14px',
              color: 'white',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 4px 24px ${currentTheme.primary}35, 0 0 40px ${currentTheme.primary}12, inset 0 1px 0 rgba(255, 255, 255, 0.12)`,
              letterSpacing: '-0.01em',
            }}
          >
            {action.label}
          </motion.button>
        </Item>
      )}
    </Wrapper>
  );
};
