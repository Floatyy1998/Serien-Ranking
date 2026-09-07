import { describe, expect, it } from 'vitest';
import {
  MAX_ZOOM,
  MIN_ZOOM,
  clampTransform,
  clampZoom,
  coverScale,
  cropSourceRect,
  maxOffset,
} from './imageCrop';

const V = 300;

describe('coverScale', () => {
  it('skaliert ein Querformat an der Höhe', () => {
    expect(coverScale(600, 300, V)).toBe(1);
    expect(coverScale(1200, 600, V)).toBe(0.5);
  });

  it('skaliert ein Hochformat an der Breite', () => {
    expect(coverScale(300, 600, V)).toBe(1);
  });

  it('bleibt bei unsinnigen Maßen bei 1', () => {
    expect(coverScale(0, 100, V)).toBe(1);
    expect(coverScale(100, 100, 0)).toBe(1);
  });
});

describe('clampZoom', () => {
  it('hält die Grenzen ein', () => {
    expect(clampZoom(0.2)).toBe(MIN_ZOOM);
    expect(clampZoom(99)).toBe(MAX_ZOOM);
    expect(clampZoom(2)).toBe(2);
  });

  it('fängt kaputte Werte ab', () => {
    expect(clampZoom(NaN)).toBe(MIN_ZOOM);
  });
});

describe('maxOffset', () => {
  it('lässt ein quadratisches Bild bei Zoom 1 nicht verschieben', () => {
    expect(maxOffset(500, 500, V, 1)).toEqual({ x: 0, y: 0 });
  });

  it('erlaubt beim Querformat nur seitliches Schieben', () => {
    const limit = maxOffset(600, 300, V, 1);
    expect(limit.x).toBe(150);
    expect(limit.y).toBe(0);
  });

  it('waechst mit dem Zoom', () => {
    expect(maxOffset(500, 500, V, 2).x).toBe(150);
  });
});

describe('clampTransform', () => {
  it('zieht einen zu weiten Versatz zurück', () => {
    const t = clampTransform({ zoom: 1, offsetX: 9999, offsetY: -9999 }, 600, 300, V);
    expect(t.offsetX).toBe(150);
    expect(t.offsetY).toBe(0);
  });

  it('lässt einen gültigen Versatz stehen', () => {
    const t = clampTransform({ zoom: 1, offsetX: 40, offsetY: 0 }, 600, 300, V);
    expect(t.offsetX).toBe(40);
  });

  it('fängt NaN ab', () => {
    const t = clampTransform({ zoom: 1, offsetX: NaN, offsetY: NaN }, 600, 300, V);
    expect(t).toEqual({ zoom: 1, offsetX: 0, offsetY: 0 });
  });
});

describe('cropSourceRect', () => {
  it('nimmt bei einem Quadrat ohne Zoom das ganze Bild', () => {
    expect(cropSourceRect({ zoom: 1, offsetX: 0, offsetY: 0 }, 500, 500, V)).toEqual({
      sx: 0,
      sy: 0,
      sw: 500,
      sh: 500,
    });
  });

  it('schneidet aus einem Querformat mittig ein Quadrat', () => {
    const r = cropSourceRect({ zoom: 1, offsetX: 0, offsetY: 0 }, 600, 300, V);
    expect(r).toEqual({ sx: 150, sy: 0, sw: 300, sh: 300 });
  });

  it('verschiebt den Ausschnitt gegen die Zugrichtung', () => {
    // Bild nach rechts ziehen zeigt den linken Bildteil.
    const r = cropSourceRect({ zoom: 1, offsetX: 150, offsetY: 0 }, 600, 300, V);
    expect(r.sx).toBe(0);
  });

  it('bleibt bei vollem Zug am rechten Bildrand', () => {
    const r = cropSourceRect({ zoom: 1, offsetX: -150, offsetY: 0 }, 600, 300, V);
    expect(r.sx).toBe(300);
    expect(r.sx + r.sw).toBe(600);
  });

  it('verkleinert den Ausschnitt beim Hineinzoomen', () => {
    const r = cropSourceRect({ zoom: 2, offsetX: 0, offsetY: 0 }, 500, 500, V);
    expect(r.sw).toBe(250);
    expect(r.sx).toBe(125);
  });

  it('läuft nie über den Bildrand hinaus', () => {
    for (const zoom of [1, 1.5, 2, 4]) {
      for (const offset of [-9999, -100, 0, 100, 9999]) {
        const r = cropSourceRect({ zoom, offsetX: offset, offsetY: offset }, 800, 450, V);
        expect(r.sx).toBeGreaterThanOrEqual(0);
        expect(r.sy).toBeGreaterThanOrEqual(0);
        expect(r.sx + r.sw).toBeLessThanOrEqual(800.0001);
        expect(r.sy + r.sh).toBeLessThanOrEqual(450.0001);
      }
    }
  });
});
