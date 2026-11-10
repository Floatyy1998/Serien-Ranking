import { animate, type MotionValue } from 'framer-motion';
import { useEffect, useRef } from 'react';

/** Bis hierhin zählt ein Finger noch als Tippen. */
const SLOP = 6;
/** Ab dieser Geschwindigkeit (px/ms) schließt schon ein kurzer Wisch. */
const FLICK = 0.5;
/** Elemente, in denen ein senkrechter Zug etwas anderes bedeutet. */
const OWN_GESTURE =
  'input, textarea, select, [contenteditable="true"], [data-no-sheet-drag], [role="slider"]';

/**
 * Darf ein Zug nach unten an dieser Stelle das Sheet mitnehmen? Nein in Eingabefeldern und Reglern
 * und sobald ein scrollbarer Bereich zwischen Finger und Sheet nicht ganz oben steht — dann scrollt
 * der Zug wie gewohnt den Inhalt zurück.
 */
export function canPullSheet(target: EventTarget | null, sheet: HTMLElement): boolean {
  for (let node = target as HTMLElement | null; node && node !== sheet; node = node.parentElement) {
    if (node.matches?.(OWN_GESTURE)) return false;
    if (node.scrollTop > 0 && node.scrollHeight > node.clientHeight) {
      const overflow = getComputedStyle(node).overflowY;
      if (overflow === 'auto' || overflow === 'scroll') return false;
    }
  }
  return sheet.scrollTop <= 0;
}

interface PullOptions {
  enabled: boolean;
  y: MotionValue<number>;
  threshold: number;
  onPullEnd: () => void;
  onActiveChange?: (active: boolean) => void;
}

/**
 * Wie in nativen Apps: Ein Wisch nach unten irgendwo im Sheet zieht es mit, nicht nur am Griff.
 * Nur Touch — mit der Maus bleibt Ziehen Textauswahl. Waagerechte Wische (Karussells) und Züge nach
 * oben gehen an den Inhalt.
 */
export function useSheetPullToClose(
  sheetRef: React.RefObject<HTMLElement | null>,
  { enabled, y, threshold, onPullEnd, onActiveChange }: PullOptions
): void {
  const latest = useRef({ threshold, onPullEnd, onActiveChange });
  useEffect(() => {
    latest.current = { threshold, onPullEnd, onActiveChange };
  });

  useEffect(() => {
    const sheet = sheetRef.current;
    if (!enabled || !sheet) return;
    let start: { x: number; y: number } | null = null;
    let eligible = false;
    let active = false;
    let last = { y: 0, t: 0 };
    let velocity = 0;
    let swallowClick = false;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) {
        start = null;
        return;
      }
      swallowClick = false;
      const touch = e.touches[0];
      start = { x: touch.clientX, y: touch.clientY };
      eligible = canPullSheet(e.target, sheet);
      active = false;
      velocity = 0;
      last = { y: touch.clientY, t: e.timeStamp };
    };

    const onMove = (e: TouchEvent) => {
      if (!start || !eligible) return;
      const touch = e.touches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      if (!active) {
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
          if (Math.abs(dx) > SLOP || dy < -SLOP) eligible = false;
          return;
        }
        // Schon vor der Schwelle abfangen, sonst übernimmt der Browser den Zug (Overscroll).
        if (e.cancelable) e.preventDefault();
        if (dy < SLOP) return;
        active = true;
        latest.current.onActiveChange?.(true);
      }
      if (e.cancelable) e.preventDefault();
      const dt = e.timeStamp - last.t;
      if (dt > 0) velocity = (touch.clientY - last.y) / dt;
      last = { y: touch.clientY, t: e.timeStamp };
      y.set(Math.max(0, dy - SLOP));
    };

    const onEnd = () => {
      if (active) {
        swallowClick = true;
        latest.current.onActiveChange?.(false);
        const offset = y.get();
        if (offset > latest.current.threshold || (offset > 0 && velocity > FLICK)) {
          latest.current.onPullEnd();
        } else {
          animate(y, 0, { type: 'spring', damping: 30, stiffness: 400 });
        }
      }
      start = null;
      active = false;
    };

    // Der Klick nach einem Zug gehört nicht dem Element unter dem Finger.
    const onClick = (e: MouseEvent) => {
      if (!swallowClick) return;
      swallowClick = false;
      e.preventDefault();
      e.stopPropagation();
    };

    sheet.addEventListener('touchstart', onStart, { passive: true });
    sheet.addEventListener('touchmove', onMove, { passive: false });
    sheet.addEventListener('touchend', onEnd);
    sheet.addEventListener('touchcancel', onEnd);
    sheet.addEventListener('click', onClick, true);
    return () => {
      sheet.removeEventListener('touchstart', onStart);
      sheet.removeEventListener('touchmove', onMove);
      sheet.removeEventListener('touchend', onEnd);
      sheet.removeEventListener('touchcancel', onEnd);
      sheet.removeEventListener('click', onClick, true);
    };
  }, [enabled, sheetRef, y]);
}
