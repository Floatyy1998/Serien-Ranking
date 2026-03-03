import { useEffect, useRef } from 'react';
import { useSpring, useTransform, useMotionValue, type MotionValue } from 'framer-motion';

interface UseAnimatedNumberOptions {
  /** Spring stiffness (default: 80) */
  stiffness?: number;
  /** Spring damping (default: 20) */
  damping?: number;
  /** Format function for display (default: Math.round + toLocaleString) */
  format?: (value: number) => string;
  /** Decimal places for default format (default: 0) */
  decimals?: number;
  /** Duration before starting animation in ms (default: 0) */
  delay?: number;
}

const defaultFormat = (value: number, decimals: number): string => {
  return Number(value.toFixed(decimals)).toLocaleString('de-DE');
};

/**
 * Animates a number from its previous value to the target using spring physics.
 * Returns a ref callback to attach to the DOM element that should display the number.
 */
export function useAnimatedNumber(
  target: number,
  options: UseAnimatedNumberOptions = {}
): {
  /** Attach this ref to the element that should display the animated number */
  ref: React.RefCallback<HTMLElement>;
  /** The underlying motion value if you need it for custom transforms */
  motionValue: MotionValue<number>;
} {
  const { stiffness = 80, damping = 20, format, decimals = 0, delay = 0 } = options;

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, { stiffness, damping });
  const display = useTransform(springValue, (v) =>
    format ? format(v) : defaultFormat(v, decimals)
  );

  const elementRef = useRef<HTMLElement | null>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      motionValue.set(target);
      hasAnimated.current = true;
    }, delay);
    return () => clearTimeout(timer);
  }, [target, motionValue, delay]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      if (elementRef.current) {
        elementRef.current.textContent = v;
      }
    });
    return unsubscribe;
  }, [display]);

  const ref: React.RefCallback<HTMLElement> = (node) => {
    elementRef.current = node;
    if (node) {
      node.textContent = format ? format(0) : defaultFormat(0, decimals);
    }
  };

  return { ref, motionValue };
}
