import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import { useIsNavRoot } from '../../../hooks/ui/useIsNavRoot';
import { useReducedMotion } from '../../../hooks/ui/useReducedMotion';
import { BackButton } from './BackButton';
import { GradientText } from '../display/GradientText';

interface PageHeaderProps {
  title: string;
  gradientFrom?: string;
  gradientTo?: string;
  subtitle?: string;
  /** Wird nicht mehr gezeigt — Seitentitel stehen ohne Symbol. Bleibt für bestehende Aufrufer. */
  icon?: React.ReactNode;
  /** Kleines Element direkt hinter dem Titel (z. B. NameBadges) */
  titleBadge?: React.ReactNode;
  actions?: React.ReactNode;
  sticky?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  eyebrow?: string;
  style?: React.CSSProperties;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  gradientFrom,
  gradientTo,
  subtitle,
  titleBadge,
  actions,
  sticky = true,
  showBack = true,
  onBack,
  eyebrow,
  style,
}) => {
  const { currentTheme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  // Seiten, die als Dock-Ziel konfiguriert sind, sind Top-Level — kein Zurück.
  const isNavRoot = useIsNavRoot();

  return (
    <header
      className="page-header"
      style={{
        position: 'relative',
        padding: 'var(--space-5) var(--page-x)',
        paddingTop: 'var(--nav-top)',
        ...(sticky
          ? {
              position: 'sticky',
              top: 0,
              zIndex: 'var(--z-sticky)' as string,
              background: `${currentTheme.background.default}f2`,
              backdropFilter: 'var(--glass-filter-lg)',
              WebkitBackdropFilter: 'var(--glass-filter-lg)',
              borderBottom: 'none',
            }
          : {}),
        ...style,
      }}
    >
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: -16 }}
        animate={shouldReduceMotion ? false : { opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 250, damping: 22 }}
        className={`page-header__row${subtitle && actions ? ' page-header__row--stacked' : ''}`}
      >
        {showBack && (!isNavRoot || onBack) && <BackButton onBack={onBack} />}
        <div className="page-header__main">
          {eyebrow && (
            <span
              style={{
                display: 'block',
                marginBottom: 2,
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: currentTheme.text.muted,
              }}
            >
              {eyebrow}
            </span>
          )}
          <GradientText
            as="h1"
            from={gradientFrom}
            to={gradientTo}
            style={{
              // Eine Größe für alle Seitentitel (--page-title-size); lange Titel brechen um.
              fontSize: 'var(--page-title-size)',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              letterSpacing: '-0.035em',
              lineHeight: 1.1,
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: 0,
            }}
          >
            <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{title}</span>
            {titleBadge}
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
        {actions && <div className="page-header__actions">{actions}</div>}
      </motion.div>
    </header>
  );
};
