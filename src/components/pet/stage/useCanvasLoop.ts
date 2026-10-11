import { useEffect, useRef, type RefObject } from 'react';

export interface LoopFrame {
  ctx: CanvasRenderingContext2D;
  dt: number;
  time: number;
  width: number;
  height: number;
}

/** Hält eine Canvas-Zeichenschleife am Laufen, passt Größe und Pixeldichte an den Container an. */
export function useCanvasLoop(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  onFrame: (frame: LoopFrame) => void
): void {
  const frameRef = useRef(onFrame);
  useEffect(() => {
    frameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
    };
    resize();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);

    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (width > 0 && height > 0) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, width, height);
        frameRef.current({ ctx, dt, time: now / 1000, width, height });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
    };
  }, [canvasRef]);
}
