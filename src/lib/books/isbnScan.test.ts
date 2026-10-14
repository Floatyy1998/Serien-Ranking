import { describe, expect, it } from 'vitest';
import {
  cameraProblemOf,
  coverSourceRect,
  createReadConfirmer,
  expandRect,
  formatIsbn13,
  isbnFromBarcode,
} from './isbnScan';

describe('isbnFromBarcode', () => {
  it('nimmt gültige ISBN-13 mit 978/979 an', () => {
    expect(isbnFromBarcode('9783551551672')).toBe('9783551551672');
    expect(isbnFromBarcode('9791032705735')).toBe('9791032705735');
  });

  it('verwirft falsche Prüfziffern', () => {
    expect(isbnFromBarcode('9783551551673')).toBeNull();
  });

  it('verwirft EAN-13 ohne Buch-Präfix', () => {
    expect(isbnFromBarcode('4006381333931')).toBeNull();
  });

  it('verwirft Zusatzcodes und kurze Codes', () => {
    expect(isbnFromBarcode('51299')).toBeNull();
    expect(isbnFromBarcode('96385074')).toBeNull();
  });
});

describe('formatIsbn13', () => {
  it('gruppiert Präfix, Kern und Prüfziffer', () => {
    expect(formatIsbn13('9783551551672')).toBe('978 355155167 2');
  });
});

describe('coverSourceRect', () => {
  it('rechnet den sichtbaren Rahmen auf das beschnittene Videobild zurück', () => {
    const rect = coverSourceRect(
      { width: 1080, height: 1920 },
      { width: 390, height: 844 },
      { x: 35, y: 300, width: 320, height: 160 }
    );
    const scale = 844 / 1920;
    const offsetX = (390 - 1080 * scale) / 2;
    expect(rect.x).toBeCloseTo((35 - offsetX) / scale);
    expect(rect.y).toBeCloseTo(300 / scale);
    expect(rect.width).toBeCloseTo(320 / scale);
    expect(rect.height).toBeCloseTo(160 / scale);
  });

  it('kappt den Ausschnitt am Bildrand', () => {
    const rect = coverSourceRect(
      { width: 1280, height: 720 },
      { width: 1280, height: 720 },
      { x: -50, y: 600, width: 400, height: 300 }
    );
    expect(rect).toEqual({ x: 0, y: 600, width: 350, height: 120 });
  });
});

describe('expandRect', () => {
  it('wächst gleichmäßig in alle Richtungen', () => {
    expect(expandRect({ x: 100, y: 100, width: 200, height: 100 }, 0.1)).toEqual({
      x: 80,
      y: 90,
      width: 240,
      height: 120,
    });
  });
});

describe('createReadConfirmer', () => {
  it('bestätigt erst die zweite gleiche Lesung', () => {
    const confirm = createReadConfirmer();
    expect(confirm('9783551551672', 0)).toBe(false);
    expect(confirm('9783551551672', 200)).toBe(true);
  });

  it('fängt bei einem anderen Code oder nach Ablauf neu an', () => {
    const confirm = createReadConfirmer(2, 1000);
    confirm('9783551551672', 0);
    expect(confirm('9791032705735', 100)).toBe(false);
    expect(confirm('9791032705735', 1500)).toBe(false);
    expect(confirm('9791032705735', 1600)).toBe(true);
  });
});

describe('cameraProblemOf', () => {
  it('ordnet die Fehler von getUserMedia ein', () => {
    expect(cameraProblemOf({ name: 'NotAllowedError' })).toBe('denied');
    expect(cameraProblemOf({ name: 'NotFoundError' })).toBe('missing');
    expect(cameraProblemOf({ name: 'NotReadableError' })).toBe('busy');
    expect(cameraProblemOf(new Error('x'))).toBe('failed');
    expect(cameraProblemOf(null)).toBe('failed');
  });
});
