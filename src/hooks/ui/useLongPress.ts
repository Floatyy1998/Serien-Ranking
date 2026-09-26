import { useCallback, useEffect, useRef } from 'react';
import type React from 'react';

const DEFAULT_DELAY = 500;
const MOVE_TOLERANCE = 10;

type Resolver<T> = (e: React.SyntheticEvent) => T | null;

/**
 * Langer Druck (Touch/Maus) oder Rechtsklick löst `onLongPress` aus. Der Klick,
 * der auf einen ausgelösten langen Druck folgt, wird geschluckt. Statt eines
 * festen Ziels kann ein Resolver übergeben werden (Event-Delegation am Container).
 */
export function useLongPress<T>(onLongPress: (target: T) => void, delay = DEFAULT_DELAY) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const cancel = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    start.current = null;
  }, []);

  useEffect(() => cancel, [cancel]);

  return useCallback(
    (target: T | Resolver<T>) => ({
      onPointerDown: (e: React.PointerEvent) => {
        fired.current = false;
        if (e.button !== 0) return;
        const resolved = resolve(target, e);
        if (resolved === null) return;
        start.current = { x: e.clientX, y: e.clientY };
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          fired.current = true;
          timer.current = null;
          onLongPress(resolved);
        }, delay);
      },
      onPointerMove: (e: React.PointerEvent) => {
        const s = start.current;
        if (!s) return;
        if (Math.hypot(e.clientX - s.x, e.clientY - s.y) > MOVE_TOLERANCE) cancel();
      },
      onPointerUp: cancel,
      onPointerLeave: cancel,
      onPointerCancel: cancel,
      onContextMenu: (e: React.MouseEvent) => {
        const resolved = resolve(target, e);
        if (resolved === null) return;
        e.preventDefault();
        cancel();
        if (fired.current) return;
        fired.current = true;
        onLongPress(resolved);
      },
      onClickCapture: (e: React.MouseEvent) => {
        if (!fired.current) return;
        fired.current = false;
        e.preventDefault();
        e.stopPropagation();
      },
    }),
    [onLongPress, delay, cancel]
  );
}

function resolve<T>(target: T | Resolver<T>, e: React.SyntheticEvent): T | null {
  return typeof target === 'function' ? (target as Resolver<T>)(e) : target;
}
