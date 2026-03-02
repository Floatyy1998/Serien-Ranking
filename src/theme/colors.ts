// Zentrale Farbkonstanten für das gesamte Projekt
export const colors = {
  // Primäre Farben
  primary: 'var(--theme-primary, #00fed7)',
  primaryHover: 'var(--theme-primary-hover, #00e6c3)',
  primaryDark: 'var(--theme-primary-hover, #00d4b4)',

  // Hintergrundfarben (Soft Dark)
  background: {
    default: 'var(--theme-background, #0a0e1a)',
    paper: 'var(--theme-background, #0a0e1a)',
    dialog: 'var(--theme-background, #0e1220)',
    card: 'var(--theme-background, #0a0e1a)',
    cardHover: 'rgba(255, 255, 255, 0.05)',
    cardFocused: 'rgba(255, 255, 255, 0.08)',
    cardGradient:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.02) 100%)',
    input: 'var(--theme-background, #080c16)',
    loading: 'var(--theme-background, #0a0e1a)',
    surface: 'var(--theme-surface, #141926)',
    surfaceElevated: 'var(--theme-surface-elevated, #1a2030)',
    surfaceHover: 'var(--theme-surface, #1e2538)',
    gradient: {
      dark: 'linear-gradient(135deg, #0a0e1a 0%, #0e1220 100%)',
      light: 'linear-gradient(135deg, #0e1220 0%, #141926 100%)',
    },
  },

  // Textfarben
  text: {
    primary: 'var(--theme-text-primary, #00fed7)',
    secondary: 'var(--theme-text-secondary, #ffffff)',
    muted: '#cccccc',
    accent: 'var(--theme-accent, #ff6b6b)',
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
    default: '#404040',
    primary: 'var(--theme-primary, #00fed7)',
    light: 'color-mix(in srgb, var(--theme-primary, #00fed7) 8%, transparent)',
    lighter: 'color-mix(in srgb, var(--theme-primary, #00fed7) 5%, transparent)',
    subtle: 'rgba(255, 255, 255, 0.1)',
  },

  // Transparente Overlays
  overlay: {
    light: 'color-mix(in srgb, var(--theme-primary, #00fed7) 2%, transparent)',
    medium: 'color-mix(in srgb, var(--theme-primary, #00fed7) 8%, transparent)',
    dark: 'rgba(0, 0, 0, 0.2)',
    white: 'rgba(255, 255, 255, 0.2)',
    black: 'rgba(0, 0, 0, 0.2)',
  },

  // Schatten (weich, mehrstufig)
  shadow: {
    card: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
    dialog: '0 16px 48px -12px rgba(0, 0, 0, 0.6), 0 8px 24px -8px rgba(0, 0, 0, 0.4)',
    hover: '0 8px 32px -8px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(0, 0, 0, 0.3)',
    focus: '0 0 0 3px color-mix(in srgb, var(--theme-primary, #00fed7) 20%, transparent)',
    button: '0 2px 8px -2px rgba(0, 0, 0, 0.3), 0 1px 3px -1px rgba(0, 0, 0, 0.2)',
    buttonHover: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
    error: '0 4px 16px -4px rgba(255, 68, 68, 0.3)',
    light: '0 4px 16px -4px rgba(255, 255, 255, 0.08)',
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
