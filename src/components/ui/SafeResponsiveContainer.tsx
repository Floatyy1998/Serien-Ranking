import { ResponsiveContainer, type ResponsiveContainerProps } from 'recharts';

/**
 * Drop-in replacement for recharts ResponsiveContainer.
 *
 * The "width(-1) height(-1) should be greater than 0" warning fires
 * harmlessly during Framer Motion mount animations — charts self-correct
 * on the next frame. We used to monkey-patch console.warn at module import,
 * but that side-effect blocked tree-shaking for this file and ran even in
 * production. The patch now applies lazily, only when this component is
 * actually mounted somewhere.
 */
let warnPatched = false;
const patchWarnOnce = (): void => {
  if (warnPatched) return;
  warnPatched = true;
  const origWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('should be greater than 0')) return;
    origWarn.apply(console, args);
  };
};

export const SafeResponsiveContainer = (props: ResponsiveContainerProps) => {
  patchWarnOnce();
  return <ResponsiveContainer {...props} />;
};
