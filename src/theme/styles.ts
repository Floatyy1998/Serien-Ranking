import { colors } from './colors';

// Häufig verwendete Style-Objekte zur Wiederverwendung
export const commonStyles = {
  // Container und Layout
  flexCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  } as React.CSSProperties,

  flexCenterColumn: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column' as const,
  } as React.CSSProperties,

  flexBetween: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as React.CSSProperties,

  // Button Styles
  primaryButton: {
    backgroundColor: 'var(--theme-primary)',
    color: colors.background.default,
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: 'var(--theme-primary-hover)',
    },
  } as React.CSSProperties,

  outlineButton: {
    backgroundColor: 'transparent',
    color: 'var(--theme-primary)',
    border: `1px solid ${colors.border.primary}`,
    borderRadius: '12px',
    padding: '12px 24px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: colors.overlay.medium,
    },
  } as React.CSSProperties,

  errorButton: {
    backgroundColor: colors.status.error,
    color: colors.text.secondary,
    border: 'none',
    borderRadius: '12px',
    padding: '12px 24px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      backgroundColor: colors.status.errorHover,
    },
  } as React.CSSProperties,

  // Card Styles
  card: {
    backgroundColor: colors.background.card,
    borderRadius: '16px',
    border: `1px solid ${colors.border.light}`,
    padding: '20px',
    boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
  } as React.CSSProperties,

  surfaceCard: {
    backgroundColor: colors.background.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border.default}`,
    padding: '16px',
    boxShadow: '0 2px 8px -2px rgba(0, 0, 0, 0.3), 0 1px 3px -1px rgba(0, 0, 0, 0.2)',
  } as React.CSSProperties,

  glassCard: {
    background: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px)',
    padding: '20px',
    boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
  } as React.CSSProperties,

  elevatedCard: {
    backgroundColor: colors.background.surfaceElevated,
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '20px',
    boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(0, 0, 0, 0.3)',
  } as React.CSSProperties,

  // Text Styles
  primaryText: {
    color: colors.text.primary,
  } as React.CSSProperties,

  secondaryText: {
    color: colors.text.secondary,
  } as React.CSSProperties,

  mutedText: {
    color: colors.text.muted,
  } as React.CSSProperties,

  displayText: {
    fontFamily: 'var(--font-display)',
    fontWeight: 800,
    letterSpacing: '-0.02em',
  } as React.CSSProperties,

  // Dialog und Modal Styles
  dialogOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(8px)',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  } as React.CSSProperties,

  dialogContent: {
    backgroundColor: colors.background.dialog,
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    boxShadow: '0 16px 48px -12px rgba(0, 0, 0, 0.6), 0 8px 24px -8px rgba(0, 0, 0, 0.4)',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  } as React.CSSProperties,

  // Input Styles
  input: {
    backgroundColor: colors.background.input,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '12px',
    padding: '12px 16px',
    color: colors.text.secondary,
    fontSize: '1rem',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:focus': {
      outline: 'none',
      borderColor: colors.border.primary,
    },
    '&:hover': {
      borderColor: colors.border.primary,
    },
  } as React.CSSProperties,

  // Notification und Status
  errorBanner: {
    backgroundColor: colors.status.error,
    color: colors.text.secondary,
    padding: '12px 20px',
    borderRadius: '12px',
    border: `1px solid ${colors.status.errorHover}`,
  } as React.CSSProperties,

  warningBanner: {
    backgroundColor: colors.status.warning,
    color: colors.background.default,
    padding: '12px 20px',
    borderRadius: '12px',
    fontWeight: '500',
  } as React.CSSProperties,

  // Badge Styles
  badge: {
    backgroundColor: 'var(--theme-primary)',
    color: colors.background.default,
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '0.875rem',
    fontWeight: '600',
  } as React.CSSProperties,

  // Utilities
  fullWidth: {
    width: '100%',
  } as React.CSSProperties,

  fullHeight: {
    height: '100%',
  } as React.CSSProperties,

  noScroll: {
    overflow: 'hidden',
  } as React.CSSProperties,

  scrollable: {
    overflow: 'auto',
  } as React.CSSProperties,

  // Animationen
  fadeIn: {
    animation: 'fadeIn 0.3s ease-in-out',
  } as React.CSSProperties,

  slideUp: {
    animation: 'slideUp 0.3s ease-out',
  } as React.CSSProperties,
};

// Helper-Funktionen für dynamische Styles
export const styleHelpers = {
  withHover: (baseStyle: React.CSSProperties, hoverStyle: React.CSSProperties) => ({
    ...baseStyle,
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': hoverStyle,
  }),

  withSpacing: (spacing: number) => ({
    margin: `${spacing}px`,
  }),

  withPadding: (padding: number) => ({
    padding: `${padding}px`,
  }),

  withBorder: (color: string = colors.border.default, width: number = 1) => ({
    border: `${width}px solid ${color}`,
  }),

  withShadow: (level: 'sm' | 'md' | 'lg' = 'md') => {
    const shadowMap = {
      sm: '0 2px 8px -2px rgba(0, 0, 0, 0.3), 0 1px 3px -1px rgba(0, 0, 0, 0.2)',
      md: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
      lg: '0 8px 32px -8px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(0, 0, 0, 0.3)',
    };
    return { boxShadow: shadowMap[level] };
  },
};
