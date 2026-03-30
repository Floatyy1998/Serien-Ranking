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
