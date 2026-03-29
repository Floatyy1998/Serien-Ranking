// Zentrale Farbkonstanten für das gesamte Projekt
export const colors = {
  // Primäre Farben
  primary: 'var(--theme-primary, #00fed7)',
  primaryHover: 'var(--theme-primary-hover, #00e6c3)',
  primaryDark: 'var(--theme-primary-hover, #00d4b4)',

  // Hintergrundfarben (Cinematic Dark)
  background: {
    default: 'var(--theme-background, #06090f)',
    paper: 'var(--theme-background, #06090f)',
    dialog: 'var(--theme-background, #0a0f1a)',
    card: 'var(--theme-background, #06090f)',
    cardHover: 'rgba(255, 255, 255, 0.04)',
    cardFocused: 'rgba(255, 255, 255, 0.07)',
    cardGradient:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.015) 100%)',
    input: 'var(--theme-background, #050810)',
    loading: 'var(--theme-background, #06090f)',
    surface: 'var(--theme-surface, #0e1420)',
    surfaceElevated: 'var(--theme-surface-elevated, #151d2e)',
    surfaceHover: 'var(--theme-surface, #1a2538)',
    gradient: {
      dark: 'linear-gradient(135deg, #06090f 0%, #0a0f1a 100%)',
      light: 'linear-gradient(135deg, #0a0f1a 0%, #0e1420 100%)',
    },
  },

  /**
   * Semantische Textfarben:
   * - primary: Accent/highlight color (the theme's primary color)
   * - secondary: Main readable body text color
   * - muted: Dimmed/secondary text color
   * - accent: Secondary accent for special highlights
   */
  text: {
    primary: 'var(--color-text-primary, #00fed7)',
    secondary: 'var(--color-text-secondary, #ffffff)',
    muted: 'var(--color-text-muted, #cccccc)',
    accent: 'var(--color-text-accent, #ff6b6b)',
    placeholder: 'rgba(255, 255, 255, 0.5)',
  },

  // Statusfarben
  status: {
    error: '#ff4444',
    errorHover: '#cc3333',
    errorDark: '#991111',
    warning: '#ff9800',
    success: '#4caf50',
    info: {
      main: 'var(--theme-primary, #00fed7)',
      gradient:
        'linear-gradient(135deg, color-mix(in srgb, var(--theme-primary, #00fed7) 10%, transparent) 0%, color-mix(in srgb, var(--theme-primary, #00fed7) 5%, transparent) 100%)',
    },
  },

  // Border und Linien
  border: {
    default: '#2a2a3a',
    primary: 'var(--theme-primary, #00fed7)',
    light: 'color-mix(in srgb, var(--theme-primary, #00fed7) 8%, transparent)',
    lighter: 'color-mix(in srgb, var(--theme-primary, #00fed7) 5%, transparent)',
    subtle: 'rgba(255, 255, 255, 0.08)',
  },

  // Transparente Overlays
  overlay: {
    light: 'color-mix(in srgb, var(--theme-primary, #00fed7) 2%, transparent)',
    medium: 'color-mix(in srgb, var(--theme-primary, #00fed7) 8%, transparent)',
    dark: 'rgba(0, 0, 0, 0.2)',
    white: 'rgba(255, 255, 255, 0.2)',
    black: 'rgba(0, 0, 0, 0.2)',
  },

  // Schatten (cinematisch, tiefere Kontraste)
  shadow: {
    card: '0 4px 20px -4px rgba(0, 0, 0, 0.5), 0 2px 8px -2px rgba(0, 0, 0, 0.35)',
    dialog: '0 20px 60px -15px rgba(0, 0, 0, 0.7), 0 8px 24px -8px rgba(0, 0, 0, 0.5)',
    hover: '0 8px 40px -8px rgba(0, 0, 0, 0.6), 0 4px 16px -4px rgba(0, 0, 0, 0.4)',
    focus: '0 0 0 3px color-mix(in srgb, var(--theme-primary, #00fed7) 20%, transparent)',
    button: '0 2px 8px -2px rgba(0, 0, 0, 0.35), 0 1px 3px -1px rgba(0, 0, 0, 0.25)',
    buttonHover: '0 4px 20px -4px rgba(0, 0, 0, 0.5), 0 2px 8px -2px rgba(0, 0, 0, 0.35)',
    error: '0 4px 20px -4px rgba(255, 68, 68, 0.35)',
    light: '0 4px 16px -4px rgba(255, 255, 255, 0.06)',
  },

  // Button-Farben (simplified for solid colors)
  button: {
    primary: 'var(--theme-primary, #00fed7)',
    primaryHover: 'var(--theme-accent, #ff6b6b)',
    secondary: 'var(--theme-surface, #141926)',
    secondaryHover: 'var(--theme-surface, #1e2538)',
    error: '#ff4444',
    errorHover: '#cc3333',
  },
} as const;

// Typ für bessere TypeScript-Unterstützung
export type Colors = typeof colors;
