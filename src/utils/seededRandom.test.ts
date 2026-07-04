import { describe, expect, it } from 'vitest';
import { seededRandom } from './seededRandom';

describe('seededRandom', () => {
  it('liefert für denselben Seed dieselbe Sequenz (deterministisch)', () => {
    const a = seededRandom(12345);
    const b = seededRandom(12345);
    const seqA = [a(), a(), a(), a()];
    const seqB = [b(), b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it('unterschiedliche Seeds liefern (in der Regel) unterschiedliche Sequenzen', () => {
    const a = seededRandom(1);
    const b = seededRandom(2);
    expect(a()).not.toBe(b());
  });

  it('alle Werte liegen im Bereich [0, 1]', () => {
    const rng = seededRandom(999);
    for (let i = 0; i < 500; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('gibt eine Funktion zurück, die bei jedem Aufruf fortschreitet', () => {
    const rng = seededRandom(7);
    const first = rng();
    const second = rng();
    expect(first).not.toBe(second);
  });

  it('funktioniert auch mit Seed 0', () => {
    const rng = seededRandom(0);
    const v = rng();
    expect(typeof v).toBe('number');
    expect(Number.isFinite(v)).toBe(true);
  });

  it('verträgt negative Seeds ohne NaN', () => {
    const rng = seededRandom(-42);
    const v = rng();
    expect(Number.isNaN(v)).toBe(false);
    expect(v).toBeGreaterThanOrEqual(0);
    expect(v).toBeLessThanOrEqual(1);
  });
});
