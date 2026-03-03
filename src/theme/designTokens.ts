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

// --- SCHATTEN (Cinematisch, mehrschichtig) ---
export const shadows = {
  sm: '0 2px 8px -2px rgba(0, 0, 0, 0.35), 0 1px 3px -1px rgba(0, 0, 0, 0.25)',
  md: '0 4px 16px -4px rgba(0, 0, 0, 0.45), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
  lg: '0 8px 32px -8px rgba(0, 0, 0, 0.55), 0 4px 12px -4px rgba(0, 0, 0, 0.35)',
  xl: '0 20px 60px -15px rgba(0, 0, 0, 0.7), 0 8px 24px -8px rgba(0, 0, 0, 0.45)',
  cinematic: '0 24px 80px -20px rgba(0, 0, 0, 0.8), 0 12px 30px -10px rgba(0, 0, 0, 0.5)',
  glow: (color: string, intensity: number = 0.3) => {
    const hex = Math.round(intensity * 255)
      .toString(16)
      .padStart(2, '0');
    const hexHalf = Math.round(intensity * 0.5 * 255)
      .toString(16)
      .padStart(2, '0');
    const hexQuarter = Math.round(intensity * 0.25 * 255)
      .toString(16)
      .padStart(2, '0');
    return `0 4px 20px -4px ${color}${hex}, 0 0 40px -8px ${color}${hexHalf}, 0 0 80px -12px ${color}${hexQuarter}`;
  },
  inner: 'inset 0 1px 2px rgba(0, 0, 0, 0.2)',
  innerLight: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
} as const;

// --- GLASSMORPHISM (tiefere Kontraste, cinematischer) ---
export const glass = {
  light: {
    background:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.02) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    backdropFilter: 'blur(16px) saturate(1.3)',
  },
  medium: {
    background:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(255, 255, 255, 0.03) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.09)',
    backdropFilter: 'blur(24px) saturate(1.4)',
  },
  heavy: {
    background:
      'linear-gradient(135deg, rgba(255, 255, 255, 0.09) 0%, rgba(255, 255, 255, 0.04) 100%)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(40px) saturate(1.5)',
  },
} as const;

// --- TRANSITIONS (cinematische Curves) ---
export const transitions = {
  fast: '0.15s cubic-bezier(0.16, 1, 0.3, 1)',
  normal: '0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  slow: '0.4s cubic-bezier(0.16, 1, 0.3, 1)',
  cinematic: '0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  spring: { type: 'spring' as const, stiffness: 300, damping: 25 },
  springGentle: { type: 'spring' as const, stiffness: 200, damping: 20 },
  springBouncy: { type: 'spring' as const, stiffness: 400, damping: 15 },
  springCinematic: { type: 'spring' as const, stiffness: 150, damping: 18 },
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

// --- GLOW SCHATTEN (Theme-responsive, cinematisch) ---
export const glowShadows = {
  sm: (color: string) => `0 0 10px ${color}30, 0 0 4px ${color}20`,
  md: (color: string) => `0 0 20px ${color}40, 0 0 40px ${color}20, 0 4px 16px -4px ${color}15`,
  lg: (color: string) =>
    `0 0 30px ${color}50, 0 0 60px ${color}25, 0 0 100px ${color}15, 0 8px 32px -8px ${color}20`,
  text: (color: string) => `0 0 16px ${color}50, 0 0 40px ${color}15`,
  card: (color: string) =>
    `0 4px 20px -4px ${color}30, 0 0 40px -8px ${color}15, inset 0 1px 0 rgba(255, 255, 255, 0.04)`,
} as const;

// --- TEXT STYLES (Vordefinierte Kombinationen) ---
export const textStyles = {
  displayLarge: {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.extrabold,
    fontFamily: typography.fontFamily.display,
    letterSpacing: typography.letterSpacing.tight,
    lineHeight: typography.lineHeight.tight,
  },
  displayMedium: {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.display,
    letterSpacing: typography.letterSpacing.tight,
    lineHeight: typography.lineHeight.tight,
  },
  headingLarge: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    fontFamily: typography.fontFamily.display,
    letterSpacing: typography.letterSpacing.tight,
    lineHeight: typography.lineHeight.tight,
  },
  headingMedium: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.display,
    lineHeight: typography.lineHeight.tight,
  },
  bodyLarge: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.normal,
    fontFamily: typography.fontFamily.body,
    lineHeight: typography.lineHeight.normal,
  },
  bodySmall: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.normal,
    fontFamily: typography.fontFamily.body,
    lineHeight: typography.lineHeight.normal,
  },
  caption: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.body,
    letterSpacing: typography.letterSpacing.wide,
    lineHeight: typography.lineHeight.normal,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase' as const,
    lineHeight: typography.lineHeight.normal,
  },
  overline: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: typography.fontFamily.body,
    letterSpacing: typography.letterSpacing.wider,
    textTransform: 'uppercase' as const,
    lineHeight: typography.lineHeight.normal,
  },
} as const;

// --- DEFAULT FARBEN (Cinematic Dark) ---
export const softDarkDefaults = {
  background: '#06090f',
  surface: '#0e1420',
  surfaceElevated: '#151d2e',
  surfaceHover: '#1a2538',
} as const;
