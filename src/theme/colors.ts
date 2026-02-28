// Zentrale Farbkonstanten für das gesamte Projekt
export const colors = {
  // Primäre Farben
  primary: 'var(--theme-primary, #00fed7)',
  primaryHover: 'var(--theme-primary-hover, #00e6c3)',
  primaryDark: 'var(--theme-primary-hover, #00d4b4)',

  // Hintergrundfarben
  background: {
    default: 'var(--theme-background, #000000)',
    paper: 'var(--theme-background, #000000)',
    dialog: 'var(--theme-background, #0C0C0C)',
    card: 'var(--theme-background, #000000)',
    cardHover: 'rgba(255, 255, 255, 0.05)',
    cardFocused: 'rgba(255, 255, 255, 0.08)',
    cardGradient:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.04) 100%)',
    input: 'var(--theme-background, #090909)',
    loading: 'var(--theme-background, #0a0a0a)',
    surface: 'var(--theme-surface, #2d2d30)',
    surfaceHover: 'var(--theme-surface, #333333)',
    gradient: {
      dark: 'linear-gradient(135deg, #000000 0%, #0C0C0C 100%)',
      light: 'linear-gradient(135deg, #0C0C0C 0%, #1a1a1a 100%)',
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

  // Schatten
  shadow: {
    card: '0 25px 50px -12px color-mix(in srgb, var(--theme-primary, #00fed7) 15%, transparent)',
    dialog: '0 25px 50px -12px color-mix(in srgb, var(--theme-primary, #00fed7) 15%, transparent)',
    hover: '0 20px 40px -8px color-mix(in srgb, var(--theme-primary, #00fed7) 20%, transparent)',
    focus: '0 0 0 3px color-mix(in srgb, var(--theme-primary, #00fed7) 20%, transparent)',
    button: '0 4px 8px rgba(0, 0, 0, 0.2)',
    buttonHover:
      '0 10px 20px -5px color-mix(in srgb, var(--theme-primary, #00fed7) 30%, transparent)',
    error: '0 10px 20px -5px rgba(255, 68, 68, 0.3)',
    light: '0 10px 20px -5px rgba(255, 255, 255, 0.1)',
  },

  // Button-Farben (simplified for solid colors)
  button: {
    primary: 'var(--theme-primary, #00fed7)',
    primaryHover: 'var(--theme-accent, #ff6b6b)',
    secondary: 'var(--theme-surface, #2d2d30)',
    secondaryHover: 'var(--theme-surface, #333333)',
    error: '#ff4444',
    errorHover: '#cc3333',
  },
} as const;

// Typ für bessere TypeScript-Unterstützung
export type Colors = typeof colors;
