// Zentrales Design Token System für Soft / Modern Dark Ästhetik

// --- TYPOGRAFIE ---
export const typography = {
  fontFamily: {
    body: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    display: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.8125rem', // 13px
    base: '0.875rem', // 14px
    md: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.75rem', // 28px
    '4xl': '2rem', // 32px
    '5xl': '2.5rem', // 40px
    '6xl': '3rem', // 48px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
    wider: '0.05em',
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.6,
  },
} as const;

// --- BORDER RADIUS ---
export const radius = {
  xs: '6px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '28px',
  full: '9999px',
} as const;

// --- SCHATTEN (Weich, mehrstufig) ---
export const shadows = {
  sm: '0 2px 8px -2px rgba(0, 0, 0, 0.3), 0 1px 3px -1px rgba(0, 0, 0, 0.2)',
  md: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
  lg: '0 8px 32px -8px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(0, 0, 0, 0.3)',
  xl: '0 16px 48px -12px rgba(0, 0, 0, 0.6), 0 8px 24px -8px rgba(0, 0, 0, 0.4)',
  glow: (color: string, intensity: number = 0.3) => {
    const hex = Math.round(intensity * 255)
      .toString(16)
      .padStart(2, '0');
    const hexHalf = Math.round(intensity * 0.5 * 255)
      .toString(16)
      .padStart(2, '0');
    return `0 4px 20px -4px ${color}${hex}, 0 0 40px -8px ${color}${hexHalf}`;
  },
  inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
} as const;

// --- GLASSMORPHISM ---
export const glass = {
  light: {
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px)',
  },
  medium: {
    background: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
  },
  heavy: {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(40px)',
  },
} as const;

// --- TRANSITIONS ---
export const transitions = {
  fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  spring: { type: 'spring' as const, stiffness: 300, damping: 25 },
  springGentle: { type: 'spring' as const, stiffness: 200, damping: 20 },
  springBouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
} as const;

// --- Z-INDEX ---
export const zIndex = {
  base: 0,
  content: 1,
  sticky: 100,
  overlay: 500,
  modal: 900,
  sheet: 999,
  dialog: 9998,
  toast: 9999,
  splash: 10000,
} as const;

// --- GLOW SCHATTEN (Theme-responsive) ---
export const glowShadows = {
  sm: (color: string) => `0 0 8px ${color}30, 0 0 4px ${color}20`,
  md: (color: string) => `0 0 20px ${color}40, 0 0 40px ${color}20`,
  lg: (color: string) => `0 0 30px ${color}50, 0 0 60px ${color}25, 0 0 100px ${color}15`,
  text: (color: string) => `0 0 12px ${color}40`,
} as const;

// --- DEFAULT FARBEN (Soft Dark) ---
export const softDarkDefaults = {
  background: '#0a0e1a',
  surface: '#141926',
  surfaceElevated: '#1a2030',
  surfaceHover: '#1e2538',
} as const;
