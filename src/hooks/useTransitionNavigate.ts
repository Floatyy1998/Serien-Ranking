import { useCallback } from 'react';
import {
  type NavigateFunction,
  type NavigateOptions,
  type To,
  useNavigate,
} from 'react-router-dom';
import { useReducedMotion } from './useReducedMotion';

type StartViewTransition = (cb: () => void) => unknown;

function getStartViewTransition(): StartViewTransition | null {
  if (typeof document === 'undefined') return null;
  const fn = (document as unknown as { startViewTransition?: StartViewTransition })
    .startViewTransition;
  return typeof fn === 'function' ? fn.bind(document) : null;
}

/**
 * Drop-in replacement for `useNavigate` that wraps the navigation
 * in `document.startViewTransition()` when supported. Falls back to
 * a plain navigate when the API is missing or the user prefers
 * reduced motion.
 */
export function useTransitionNavigate(): NavigateFunction {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const transitionNavigate = useCallback(
    (to: To | number, options?: NavigateOptions) => {
      const run = () => {
        if (typeof to === 'number') {
          navigate(to);
        } else {
          navigate(to, options);
        }
      };

      const start = getStartViewTransition();
      if (reducedMotion || !start) {
        run();
        return;
      }
      start(run);
    },
    [navigate, reducedMotion]
  );

  return transitionNavigate as NavigateFunction;
}
