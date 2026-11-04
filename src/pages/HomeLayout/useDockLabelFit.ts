import { useLayoutEffect, useRef } from 'react';
import type React from 'react';

const MAX_SIZE = 10;
const MIN_SIZE = 8;

let measureCtx: CanvasRenderingContext2D | null | undefined;
const textWidth = (text: string, font: string): number => {
  if (measureCtx === undefined) measureCtx = document.createElement('canvas').getContext('2d');
  if (!measureCtx) return text.length * MAX_SIZE * 0.6;
  measureCtx.font = font;
  return measureCtx.measureText(text).width;
};

/** Per Canvas gemessen: ein DOM-Maß würde nach dem Ausblenden der Labels eine neue Messung auslösen. */
export function useDockLabelFit(ref: React.RefObject<HTMLElement | null>, contentKey: string) {
  const lastWidth = useRef(-1);

  useLayoutEffect(() => {
    const dock = ref.current;
    if (!dock) return;

    const fit = () => {
      const labels = [...dock.querySelectorAll<HTMLElement>('.hl-dock-item--slot .hl-dock-label')];
      if (labels.length === 0) return;
      const style = getComputedStyle(labels[0]);
      const font = `${style.fontWeight} ${MAX_SIZE}px ${style.fontFamily}`;
      const sizes = labels.map((label) => {
        const item = label.parentElement;
        if (!item) return MAX_SIZE;
        const pad = getComputedStyle(item);
        const room = item.clientWidth - parseFloat(pad.paddingLeft) - parseFloat(pad.paddingRight);
        const natural = textWidth(label.textContent ?? '', font);
        if (natural <= 0 || room <= 0) return MAX_SIZE;
        return Math.min(MAX_SIZE, Math.floor(((MAX_SIZE * room) / natural) * 4) / 4);
      });
      const fits = sizes.every((s) => s >= MIN_SIZE);
      labels.forEach((label, i) => {
        label.style.fontSize = `${Math.max(sizes[i], MIN_SIZE)}px`;
      });
      dock.dataset.labels = fits ? 'on' : 'off';
    };

    fit();
    lastWidth.current = dock.clientWidth;
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      if (dock.clientWidth === lastWidth.current) return;
      lastWidth.current = dock.clientWidth;
      fit();
    });
    observer.observe(dock);
    document.fonts?.ready.then(fit).catch(() => {});
    return () => observer.disconnect();
  }, [ref, contentKey]);
}
