import { describe, expect, it } from 'vitest';
import {
  IDENTITY,
  ZOOM_MAX,
  ZOOM_MIN,
  clampTransform,
  clampZoom,
  fitSize,
  panLimits,
  wheelZoomFactor,
  zoomAtPoint,
} from './imageZoom';

const VIEW = { width: 400, height: 800 };

describe('fitSize', () => {
  it('passt ein Querformat an der Breite ein', () => {
    expect(fitSize({ width: 800, height: 400 }, VIEW)).toEqual({ width: 400, height: 200 });
  });

  it('passt ein Hochformat an der Höhe ein', () => {
    expect(fitSize({ width: 400, height: 1600 }, VIEW)).toEqual({ width: 200, height: 800 });
  });

  it('rechnet kleine Bilder hoch, statt sie zu belassen', () => {
    // „contain" heißt formatfüllend — sonst hinge ein Handy-Bild als Briefmarke
    // in der Mitte, obwohl man es gerade groß sehen will.
    expect(fitSize({ width: 100, height: 200 }, VIEW)).toEqual({ width: 400, height: 800 });
  });

  it('bleibt bei unsinnigen Maßen bei 0', () => {
    expect(fitSize({ width: 0, height: 10 }, VIEW)).toEqual({ width: 0, height: 0 });
    expect(fitSize({ width: 10, height: 10 }, { width: 0, height: 0 })).toEqual({
      width: 0,
      height: 0,
    });
  });
});

describe('clampZoom', () => {
  it('hält die Grenzen ein', () => {
    expect(clampZoom(0.2)).toBe(ZOOM_MIN);
    expect(clampZoom(99)).toBe(ZOOM_MAX);
    expect(clampZoom(Number.NaN)).toBe(ZOOM_MIN);
  });
});

describe('panLimits', () => {
  const fit = { width: 400, height: 200 };

  it('erlaubt bei Zoom 1 kein Schieben', () => {
    expect(panLimits(fit, VIEW, 1)).toEqual({ x: 0, y: 0 });
  });

  it('gibt bei Zoom 2 genau die Überstände frei', () => {
    // 400*2 = 800 breit im 400er Fenster → 200 nach jeder Seite.
    // 200*2 = 400 hoch im 800er Fenster → passt weiterhin, also 0.
    expect(panLimits(fit, VIEW, 2)).toEqual({ x: 200, y: 0 });
  });
});

describe('clampTransform', () => {
  const fit = { width: 400, height: 200 };

  it('zieht ein nicht gezoomtes Bild in die Mitte zurück', () => {
    expect(clampTransform({ zoom: 1, x: 120, y: -80 }, fit, VIEW)).toEqual(IDENTITY);
  });

  it('lässt den Versatz innerhalb der Grenzen stehen', () => {
    expect(clampTransform({ zoom: 2, x: 150, y: 0 }, fit, VIEW)).toEqual({ zoom: 2, x: 150, y: 0 });
    expect(clampTransform({ zoom: 2, x: 900, y: 0 }, fit, VIEW)).toEqual({ zoom: 2, x: 200, y: 0 });
  });

  it('erzeugt kein negatives Null in den Styles', () => {
    expect(Object.is(clampTransform({ zoom: 1, x: -5, y: 0 }, fit, VIEW).x, 0)).toBe(true);
  });
});

describe('zoomAtPoint', () => {
  // Quadratisches Bild im quadratischen Fenster: hier kann in beide Richtungen
  // geschoben werden, sonst kappt die Begrenzung den Ankerpunkt sofort weg.
  const square = { width: 400, height: 400 };
  const view = { width: 400, height: 400 };

  it('hält den angetippten Punkt an seiner Stelle', () => {
    const next = zoomAtPoint(IDENTITY, 2, { x: 100, y: 50 }, square, view);
    // Bildpunkt unter dem Finger: (100-0)/1 = 100 → nach dem Zoom bei 200.
    // Der Versatz muss ihn um 100 zurückholen.
    expect(next).toEqual({ zoom: 2, x: -100, y: -50 });
  });

  it('bleibt beim Herauszoomen auf 1 zentriert', () => {
    const inn = zoomAtPoint(IDENTITY, 3, { x: 120, y: 0 }, square, view);
    expect(zoomAtPoint(inn, 1, { x: 120, y: 0 }, square, view)).toEqual(IDENTITY);
  });

  it('achtet auf die Zoomgrenzen', () => {
    expect(zoomAtPoint(IDENTITY, 50, { x: 0, y: 0 }, square, view).zoom).toBe(ZOOM_MAX);
    expect(zoomAtPoint({ zoom: 2, x: 0, y: 0 }, 0.1, { x: 0, y: 0 }, square, view).zoom).toBe(
      ZOOM_MIN
    );
  });
});

describe('wheelZoomFactor', () => {
  it('vergrößert beim Hochscrollen und verkleinert beim Runterscrollen', () => {
    expect(wheelZoomFactor(-100)).toBeGreaterThan(1);
    expect(wheelZoomFactor(100)).toBeLessThan(1);
    expect(wheelZoomFactor(0)).toBe(1);
  });

  it('deckelt einen Riesen-Delta, damit ein Ruck nicht durchschlägt', () => {
    expect(wheelZoomFactor(-100000)).toBe(wheelZoomFactor(-120));
  });
});
