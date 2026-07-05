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
  // HINWEIS: `commonStyles` sind reine Inline-Style-Objekte (React.CSSProperties).
  // Pseudo-Selektoren wie `&:hover`/`&:focus` funktionieren in Inline-Styles
  // NICHT — sie wurden hier entfernt (waren stille Tote). Für Hover/Focus eine
  // CSS-Klasse oder MUI `sx` verwenden. Die gewünschten Hover-Werte sind unten
  // in `commonHoverStyles` als Referenz hinterlegt.
  primaryButton: {
    backgroundColor: 'var(--theme-primary)',
    color: colors.background.default,
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '12px 24px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  } as React.CSSProperties,

  outlineButton: {
    backgroundColor: 'transparent',
    color: 'var(--theme-primary)',
    border: `1px solid ${colors.border.primary}`,
    borderRadius: 'var(--radius-md)',
    padding: '12px 24px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  } as React.CSSProperties,

  errorButton: {
    backgroundColor: colors.status.error,
    color: colors.text.secondary,
    border: 'none',
    borderRadius: 'var(--radius-md)',
    padding: '12px 24px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  } as React.CSSProperties,

  // Card Styles
  card: {
    backgroundColor: colors.background.card,
    borderRadius: 'var(--radius-lg)',
    border: `1px solid ${colors.border.light}`,
    padding: '20px',
    boxShadow: 'var(--shadow-md)',
  } as React.CSSProperties,

  surfaceCard: {
    backgroundColor: colors.background.surface,
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${colors.border.default}`,
    padding: '16px',
    boxShadow: 'var(--shadow-sm)',
  } as React.CSSProperties,

  glassCard: {
    background: 'var(--glass-light)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--glass-border-light)',
    backdropFilter: 'var(--blur-md)',
    padding: '20px',
    boxShadow: 'var(--shadow-md)',
  } as React.CSSProperties,

  elevatedCard: {
    backgroundColor: colors.background.surfaceElevated,
    borderRadius: 'var(--radius-lg)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    padding: '20px',
    boxShadow: 'var(--shadow-lg)',
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
    borderRadius: 'var(--radius-xl)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    // Bewusst eigener Dialog-Schatten (liegt zwischen --shadow-lg und --shadow-cinematic)
    boxShadow: '0 16px 48px -12px rgba(0, 0, 0, 0.6), 0 8px 24px -8px rgba(0, 0, 0, 0.4)',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
  } as React.CSSProperties,

  // Input Styles
  // Pseudo-Selektoren `&:focus`/`&:hover` entfernt (in Inline-Styles wirkungslos).
  // Für Focus/Hover eine CSS-Klasse oder `sx` nutzen; Ziel-Border ist
  // `colors.border.primary` (siehe `commonHoverStyles.inputFocus`).
  input: {
    backgroundColor: colors.background.input,
    border: `1px solid ${colors.border.default}`,
    borderRadius: 'var(--radius-md)',
    padding: '12px 16px',
    color: colors.text.secondary,
    fontSize: '1rem',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  } as React.CSSProperties,

  // Notification und Status
  errorBanner: {
    backgroundColor: colors.status.error,
    color: colors.text.secondary,
    padding: '12px 20px',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${colors.status.errorHover}`,
  } as React.CSSProperties,

  warningBanner: {
    backgroundColor: colors.status.warning,
    color: colors.background.default,
    padding: '12px 20px',
    borderRadius: 'var(--radius-md)',
    fontWeight: '500',
  } as React.CSSProperties,

  // Badge Styles
  badge: {
    backgroundColor: 'var(--theme-primary)',
    color: colors.background.default,
    padding: '4px 12px',
    borderRadius: 'var(--radius-lg)',
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

// Referenz-Hover/Focus-Werte für die Inline-Style-Buttons oben.
// NICHT direkt als Inline-Style spreadbar (Pseudo-Selektoren greifen dort
// nicht) — als Vorlage für CSS-Klassen / MUI `sx` gedacht.
export const commonHoverStyles = {
  primaryButtonHover: { backgroundColor: 'var(--theme-primary-hover)' },
  outlineButtonHover: { backgroundColor: colors.overlay.medium },
  errorButtonHover: { backgroundColor: colors.status.errorHover },
  inputFocus: { outline: 'none', borderColor: colors.border.primary },
  inputHover: { borderColor: colors.border.primary },
} as const;

// Helper-Funktionen für dynamische Styles
export const styleHelpers = {
  /**
   * @deprecated Erzeugt ein Objekt mit `&:hover`-Key. Das funktioniert NUR in
   * MUI `sx`/Emotion, NICHT in echten Inline-Styles (`style={...}`) — dort ist
   * der Pseudo-Selektor wirkungslos. Für Hover eine CSS-Klasse oder `sx` nutzen.
   */
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
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
    };
    return { boxShadow: shadowMap[level] };
  },
};
