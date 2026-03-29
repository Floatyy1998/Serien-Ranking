import { ResponsiveContainer } from 'recharts';

// Suppress the harmless recharts dimension warning that fires during
// Framer Motion animations (charts self-correct on next frame)
const _origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('should be greater than 0')) return;
  _origWarn.apply(console, args);
};

/**
 * Drop-in replacement for recharts ResponsiveContainer.
 * Suppresses the "width(-1) height(-1)" warning globally.
 */
export const SafeResponsiveContainer = ResponsiveContainer;
