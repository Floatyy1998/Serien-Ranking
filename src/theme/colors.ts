// Zentrale Farbkonstanten für das gesamte Projekt
export const colors = {
  // Primäre Farben
  primary: 'var(--theme-primary, #00d123)',
  primaryHover: 'var(--theme-primary-hover, #008a6e)',
  primaryDark: 'var(--theme-primary-hover, #009a1a)',

  // Hintergrundfarben (Cinematic Dark)
  background: {
    default: 'var(--theme-background, #000000)',
    paper: 'var(--theme-background, #000000)',
    dialog: 'var(--theme-background, #0a0a0a)',
    card: 'var(--theme-background, #000000)',
    cardHover: 'rgba(255, 255, 255, 0.04)',
    cardFocused: 'rgba(255, 255, 255, 0.07)',
    cardGradient:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.015) 100%)',
    input: 'var(--theme-background, #050505)',
    loading: 'var(--theme-background, #000000)',
    surface: 'var(--theme-surface, #0f0f0f)',
    surfaceElevated: 'var(--theme-surface-elevated, #1a1a1a)',
    surfaceHover: 'var(--theme-surface, #1a1a1a)',
    gradient: {
      dark: 'linear-gradient(135deg, #000000 0%, #0a0a0a 100%)',
      light: 'linear-gradient(135deg, #0a0a0a 0%, #0f0f0f 100%)',
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
    primary: 'var(--color-text-primary, #00d123)',
    secondary: 'var(--color-text-secondary, #ffffff)',
    muted: 'var(--color-text-muted, #cccccc)',
    accent: 'var(--color-text-accent, #008a6e)',
    placeholder: 'rgba(255, 255, 255, 0.5)',
  },

  // Statusfarben — Werte müssen mit theme/dynamicTheme.ts (status) übereinstimmen
  status: {
    error: '#ff4444',
    errorHover: '#cc3333',
    errorDark: '#991111',
    warning: '#FFC107',
    success: '#4caf50',
    info: {
      main: 'var(--theme-primary, #00d123)',
      gradient:
        'linear-gradient(135deg, color-mix(in srgb, var(--theme-primary, #00d123) 10%, transparent) 0%, color-mix(in srgb, var(--theme-primary, #00d123) 5%, transparent) 100%)',
    },
  },

  // Border und Linien
  border: {
    default: '#2a2a3a',
    primary: 'var(--theme-primary, #00d123)',
    light: 'color-mix(in srgb, var(--theme-primary, #00d123) 8%, transparent)',
    lighter: 'color-mix(in srgb, var(--theme-primary, #00d123) 5%, transparent)',
    subtle: 'rgba(255, 255, 255, 0.08)',
  },

  // Transparente Overlays
  overlay: {
    light: 'color-mix(in srgb, var(--theme-primary, #00d123) 2%, transparent)',
    medium: 'color-mix(in srgb, var(--theme-primary, #00d123) 8%, transparent)',
    dark: 'rgba(0, 0, 0, 0.2)',
    white: 'rgba(255, 255, 255, 0.2)',
    black: 'rgba(0, 0, 0, 0.2)',
  },

  // Schatten (cinematisch, tiefere Kontraste)
  shadow: {
    card: '0 4px 20px -4px rgba(0, 0, 0, 0.5), 0 2px 8px -2px rgba(0, 0, 0, 0.35)',
    dialog: '0 20px 60px -15px rgba(0, 0, 0, 0.7), 0 8px 24px -8px rgba(0, 0, 0, 0.5)',
    hover: '0 8px 40px -8px rgba(0, 0, 0, 0.6), 0 4px 16px -4px rgba(0, 0, 0, 0.4)',
    focus: '0 0 0 3px color-mix(in srgb, var(--theme-primary, #00d123) 20%, transparent)',
    button: '0 2px 8px -2px rgba(0, 0, 0, 0.35), 0 1px 3px -1px rgba(0, 0, 0, 0.25)',
    buttonHover: '0 4px 20px -4px rgba(0, 0, 0, 0.5), 0 2px 8px -2px rgba(0, 0, 0, 0.35)',
    error: '0 4px 20px -4px rgba(255, 68, 68, 0.35)',
    light: '0 4px 16px -4px rgba(255, 255, 255, 0.06)',
  },

  // Button-Farben (simplified for solid colors)
  button: {
    primary: 'var(--theme-primary, #00d123)',
    primaryHover: 'var(--theme-accent, #008a6e)',
    secondary: 'var(--theme-surface, #0f0f0f)',
    secondaryHover: 'var(--theme-surface, #1a1a1a)',
    error: '#ff4444',
    errorHover: '#cc3333',
  },
} as const;

// Typ für bessere TypeScript-Unterstützung
export type Colors = typeof colors;
