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
    borderRadius: '8px',
    padding: '12px 24px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: 'var(--theme-primary-hover)',
    },
  } as React.CSSProperties,

  outlineButton: {
    backgroundColor: 'transparent',
    color: 'var(--theme-primary)',
    border: `1px solid ${colors.border.primary}`,
    borderRadius: '8px',
    padding: '12px 24px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: colors.overlay.medium,
    },
  } as React.CSSProperties,

  errorButton: {
    backgroundColor: colors.status.error,
    color: colors.text.secondary,
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: colors.status.errorHover,
    },
  } as React.CSSProperties,

  // Card Styles
  card: {
    backgroundColor: colors.background.card,
    borderRadius: '12px',
    border: `1px solid ${colors.border.light}`,
    padding: '20px',
  } as React.CSSProperties,

  surfaceCard: {
    backgroundColor: colors.background.surface,
    borderRadius: '8px',
    border: `1px solid ${colors.border.default}`,
    padding: '16px',
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

  // Dialog und Modal Styles
  dialogOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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
    borderRadius: '12px',
    border: `1px solid ${colors.border.lighter}`,
    boxShadow: '0 25px 50px -12px rgba(0, 254, 215, 0.15)',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  } as React.CSSProperties,

  // Input Styles
  input: {
    backgroundColor: colors.background.input,
    border: `1px solid ${colors.border.default}`,
    borderRadius: '8px',
    padding: '12px 16px',
    color: colors.text.secondary,
    fontSize: '1rem',
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
    borderRadius: '8px',
    border: `1px solid ${colors.status.errorHover}`,
  } as React.CSSProperties,

  warningBanner: {
    backgroundColor: colors.status.warning,
    color: colors.background.default,
    padding: '12px 20px',
    borderRadius: '8px',
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
    transition: 'all 0.2s ease',
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

  withShadow: (opacity: number = 0.15) => ({
    boxShadow: `0 25px 50px -12px rgba(0, 254, 215, ${opacity})`,
  }),
};
