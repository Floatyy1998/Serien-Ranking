import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './ZoomableImage.css';
import {
  IDENTITY,
  ZOOM_STEP_TO,
  clampTransform,
  distance,
  fitSize,
  midpoint,
  wheelZoomFactor,
  zoomAtPoint,
  type Size,
  type ZoomTransform,
} from '../../lib/imageZoom';

/**
 * Bild, das sich vergrößern lässt: Pinch, Mausrad, Doppeltipp, Ziehen.
 * Die Rechnung steckt in `lib/imageZoom.ts`, hier bleiben nur die Gesten.
 *
 * `onEmptyClick` feuert nur bei einem Tipp **neben** dem Bild und nur, wenn
 * dabei nicht geschoben wurde — sonst würde jedes Verschieben das Overlay
 * schließen.
 */
interface ZoomableImageProps {
  src: string;
  alt?: string;
  onEmptyClick?: () => void;
  /** Meldet, ob gerade vergrößert ist (z. B. um einen Hinweis auszublenden). */
  onZoomChange?: (zoomed: boolean) => void;
}

const TAP_SLOP_PX = 6;
const DOUBLE_TAP_MS = 320;
const DOUBLE_TAP_SLOP_PX = 40;

export const ZoomableImage = ({
  src,
  alt = '',
  onEmptyClick,
  onZoomChange,
}: ZoomableImageProps) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [natural, setNatural] = useState<Size>({ width: 0, height: 0 });
  const [viewport, setViewport] = useState<Size>({ width: 0, height: 0 });
  const [transform, setTransform] = useState<ZoomTransform>(IDENTITY);

  const fit = useMemo(() => fitSize(natural, viewport), [natural, viewport]);
  const zoomed = transform.zoom > 1.01;

  useEffect(() => {
    onZoomChange?.(zoomed);
  }, [zoomed, onZoomChange]);

  const readNatural = useCallback(() => {
    const img = imageRef.current;
    // `complete` schützt davor, beim Bildwechsel noch die Maße des alten zu lesen.
    if (img?.complete && img.naturalWidth) {
      setNatural({ width: img.naturalWidth, height: img.naturalHeight });
    }
  }, []);

  // Neues Bild: wieder bei „passt ins Fenster" anfangen. Der Nachschlag über
  // `readNatural` ist Pflicht — liegt das Bild schon im Cache, ist es fertig,
  // bevor React den load-Handler hängt, und `onLoad` feuert nie. Ohne Maße wäre
  // der Schiebe-Spielraum 0 und jedes Zoomen zöge zurück in die Mitte.
  useEffect(() => {
    setTransform(IDENTITY);
    setNatural({ width: 0, height: 0 });
    readNatural();
  }, [src, readNatural]);

  /**
   * Verhältnis zwischen Zeigerkoordinaten und Layout-Pixeln. Die Anzeigegröße
   * der App arbeitet mit CSS `zoom`: dann liefert `getBoundingClientRect` andere
   * Werte als `clientWidth`, und ein Wischen würde zu weit oder zu kurz
   * schieben. Ohne Skalierung ist der Wert 1.
   */
  const visualScale = useRef(1);

  // Fenstergröße mitführen (Drehen, Fenster ziehen) und den Versatz nachziehen,
  // damit nach dem Verkleinern kein leerer Rand stehen bleibt.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const ratio = el.clientWidth > 0 ? rect.width / el.clientWidth : 1;
      visualScale.current = ratio > 0 ? ratio : 1;
      setViewport({ width: el.clientWidth, height: el.clientHeight });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setTransform((prev) => clampTransform(prev, fit, viewport));
  }, [fit, viewport]);

  /** Bildschirmpunkt in Layout-Pixel ab der Fenstermitte. */
  const toLocal = useCallback((clientX: number, clientY: number) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const scale = visualScale.current;
    return {
      x: (clientX - rect.left - rect.width / 2) / scale,
      y: (clientY - rect.top - rect.height / 2) / scale,
    };
  }, []);

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ dist: number; mid: { x: number; y: number } } | null>(null);
  const moved = useRef(false);
  const downAt = useRef({ x: 0, y: 0 });
  const downOnImage = useRef(false);
  const lastTap = useRef({ time: 0, x: 0, y: 0 });

  const toggleZoom = useCallback(
    (point: { x: number; y: number }) => {
      setTransform((prev) =>
        prev.zoom > 1.01 ? IDENTITY : zoomAtPoint(prev, ZOOM_STEP_TO, point, fit, viewport)
      );
    },
    [fit, viewport]
  );

  // Mausrad muss aktiv abgefangen werden — als passiver React-Handler ließe
  // sich das Scrollen der Seite dahinter nicht unterbinden.
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const point = toLocal(e.clientX, e.clientY);
      setTransform((prev) =>
        zoomAtPoint(prev, prev.zoom * wheelZoomFactor(e.deltaY), point, fit, viewport)
      );
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [fit, viewport, toLocal]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (pointers.current.size === 0) {
      moved.current = false;
      downAt.current = { x: e.clientX, y: e.clientY };
      downOnImage.current = e.target === imageRef.current;
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture?.(e.pointerId);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: distance(a, b), mid: midpoint(a, b) };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const previous = pointers.current.get(e.pointerId);
    if (!previous) return;
    const current = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, current);

    if (pointers.current.size >= 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()];
      const dist = distance(a, b);
      const mid = midpoint(a, b);
      const start = pinch.current;
      if (start.dist > 0) {
        setTransform((prev) => {
          const scaled = zoomAtPoint(
            prev,
            prev.zoom * (dist / start.dist),
            toLocal(mid.x, mid.y),
            fit,
            viewport
          );
          // Zwei Finger dürfen gleichzeitig schieben.
          const s = visualScale.current;
          return clampTransform(
            {
              ...scaled,
              x: scaled.x + (mid.x - start.mid.x) / s,
              y: scaled.y + (mid.y - start.mid.y) / s,
            },
            fit,
            viewport
          );
        });
      }
      pinch.current = { dist, mid };
      moved.current = true;
      return;
    }

    const dx = (current.x - previous.x) / visualScale.current;
    const dy = (current.y - previous.y) / visualScale.current;
    // Gegen den Startpunkt messen, nicht gegen den letzten Schritt: ein langsames
    // Ziehen bleibt sonst pro Schritt unter der Schwelle und gilt als Tipp.
    if (distance(current, downAt.current) > TAP_SLOP_PX) moved.current = true;
    setTransform((prev) =>
      prev.zoom > 1.01
        ? clampTransform({ ...prev, x: prev.x + dx, y: prev.y + dy }, fit, viewport)
        : prev
    );
  };

  const endPointer = (e: React.PointerEvent) => {
    const wasTracked = pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (!wasTracked || pointers.current.size > 0) return;

    if (moved.current) return;
    const point = toLocal(e.clientX, e.clientY);

    if (!downOnImage.current) {
      onEmptyClick?.();
      return;
    }

    const now = Date.now();
    const isDouble =
      now - lastTap.current.time < DOUBLE_TAP_MS &&
      distance({ x: e.clientX, y: e.clientY }, lastTap.current) < DOUBLE_TAP_SLOP_PX;
    if (isDouble) {
      lastTap.current = { time: 0, x: 0, y: 0 };
      toggleZoom(point);
    } else {
      lastTap.current = { time: now, x: e.clientX, y: e.clientY };
    }
  };

  return (
    <div
      ref={viewportRef}
      className="zoomable-viewport"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      style={{ cursor: zoomed ? 'grab' : 'zoom-in' }}
    >
      <img
        ref={imageRef}
        className="zoomable-image"
        src={src}
        alt={alt}
        draggable={false}
        decoding="async"
        onLoad={readNatural}
        style={{
          // Feste Anzeigegröße statt max-width/max-height: nur so ist die
          // gerenderte Größe identisch mit der, aus der die Schiebegrenzen
          // gerechnet werden — sonst darf man ins Leere ziehen.
          width: fit.width > 0 ? `${fit.width}px` : undefined,
          height: fit.height > 0 ? `${fit.height}px` : undefined,
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.zoom})`,
        }}
      />
    </div>
  );
};
