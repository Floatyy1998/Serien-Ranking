import { useCallback } from 'react';
import {
  type NavigateFunction,
  type NavigateOptions,
  type To,
  useNavigate,
} from 'react-router-dom';
import { useReducedMotion } from './useReducedMotion';

type ViewTransitionLike = {
  ready?: Promise<unknown>;
  finished?: Promise<unknown>;
  updateCallbackDone?: Promise<unknown>;
};

type StartViewTransition = (cb: () => void) => unknown;

/**
 * Eine übersprungene View-Transition ist ein NORMALER Fall: sobald eine zweite
 * Navigation die erste überholt (Doppeltipp, schnelles Weiterklicken), lehnt
 * `ready` mit `AbortError: Transition was skipped` ab. Ohne Catch landet das
 * als unbehandelte Ablehnung in der Fehlererfassung.
 */
function swallowSkip(transition: unknown): void {
  const t = transition as ViewTransitionLike | undefined | null;
  if (!t) return;
  t.ready?.catch(() => {});
  t.finished?.catch(() => {});
  t.updateCallbackDone?.catch(() => {});
}

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
      swallowSkip(start(run));
    },
    [navigate, reducedMotion]
  );

  return transitionNavigate as NavigateFunction;
}
