import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';
import { moveIdTo } from '../../lib/layout/sectionOrder';

const DRAG_THRESHOLD = 6;
const ATTR = 'data-reorder-id';
const EDGE = 56;

const findScroller = (from: HTMLElement | null): HTMLElement | null => {
  for (let el = from; el; el = el.parentElement) {
    const { overflowY } = getComputedStyle(el);
    if ((overflowY === 'auto' || overflowY === 'scroll') && el.scrollHeight > el.clientHeight)
      return el;
  }
  return null;
};

interface DragState {
  id: string;
  startX: number;
  startY: number;
  moved: boolean;
  scope: HTMLElement | null;
}

/** Ohne framer-motion-Reorder: dessen Transforms blieben unter Anzeige-Zoom und in umbrechenden Reihen hängen. */
export function usePointerReorder(
  order: readonly string[],
  onReorder: (next: string[]) => void,
  onTap?: (id: string) => void
) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const orderRef = useRef(order);
  const dragRef = useRef<DragState | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const handlersRef = useRef({ onReorder, onTap });

  useEffect(() => {
    orderRef.current = order;
    handlersRef.current = { onReorder, onTap };
  }, [order, onReorder, onTap]);

  useEffect(() => () => cleanupRef.current?.(), []);

  const startDrag = useCallback((e: React.PointerEvent<HTMLElement>, id: string) => {
    if (e.button !== 0) return;
    cleanupRef.current?.();
    const item = e.currentTarget.closest(`[${ATTR}]`);
    dragRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
      scope: item?.parentElement ?? null,
    };

    const scroller = findScroller(item?.parentElement ?? null);
    let pointer = { x: e.clientX, y: e.clientY };
    let frame: number | null = null;

    const reorderAt = (x: number, y: number) => {
      const drag = dragRef.current;
      if (!drag) return;
      const hit = document.elementFromPoint(x, y)?.closest(`[${ATTR}]`);
      const targetId = hit && drag.scope?.contains(hit) ? hit.getAttribute(ATTR) : null;
      if (!targetId || targetId === drag.id) return;
      const next = moveIdTo(orderRef.current, drag.id, targetId);
      orderRef.current = next;
      handlersRef.current.onReorder(next);
    };

    const autoScroll = () => {
      frame = null;
      if (!dragRef.current?.moved || !scroller) return;
      const r = scroller.getBoundingClientRect();
      const top = pointer.y - r.top;
      const bottom = r.bottom - pointer.y;
      const speed =
        top < EDGE
          ? -Math.ceil((EDGE - top) / 4)
          : bottom < EDGE
            ? Math.ceil((EDGE - bottom) / 4)
            : 0;
      if (speed === 0) return;
      const before = scroller.scrollTop;
      scroller.scrollTop += speed;
      if (scroller.scrollTop === before) return;
      reorderAt(pointer.x, pointer.y);
      frame = requestAnimationFrame(autoScroll);
    };

    // window statt Pointer-Capture: React verschiebt den Knoten beim Umsortieren, das Capture ginge verloren.
    const move = (ev: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      if (!drag.moved) {
        if (Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) < DRAG_THRESHOLD) return;
        drag.moved = true;
        setDraggingId(drag.id);
      }
      ev.preventDefault();
      pointer = { x: ev.clientX, y: ev.clientY };
      reorderAt(pointer.x, pointer.y);
      if (frame === null) frame = requestAnimationFrame(autoScroll);
    };
    const end = (ev: PointerEvent) => {
      const drag = dragRef.current;
      cleanup();
      if (drag && !drag.moved && ev.type === 'pointerup') handlersRef.current.onTap?.(drag.id);
    };
    const cleanup = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      dragRef.current = null;
      cleanupRef.current = null;
      setDraggingId(null);
    };
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    cleanupRef.current = cleanup;
  }, []);

  const onHandleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>, id: string) => {
    const current = orderRef.current;
    const index = current.indexOf(id);
    const back = e.key === 'ArrowUp' || e.key === 'ArrowLeft';
    const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight';
    if (back || forward) {
      const target = current[index + (back ? -1 : 1)];
      if (!target) return;
      e.preventDefault();
      const next = moveIdTo(current, id, target);
      orderRef.current = next;
      handlersRef.current.onReorder(next);
      return;
    }
    if ((e.key === 'Enter' || e.key === ' ') && handlersRef.current.onTap) {
      e.preventDefault();
      handlersRef.current.onTap(id);
    }
  }, []);

  const itemProps = (id: string) => ({
    [ATTR]: id,
    'data-dragging': draggingId === id ? 'true' : undefined,
  });

  const handleProps = (id: string) => ({
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => startDrag(e, id),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => onHandleKeyDown(e, id),
  });

  return { itemProps, handleProps, draggingId };
}
