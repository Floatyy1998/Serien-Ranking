import { describe, expect, it } from 'vitest';
import { SWIPE_COMMIT_PX, dampSwipeOffset, isSwipeArmed, resolveSwipeCommit } from './swipeGesture';

describe('dampSwipeOffset', () => {
  it('folgt dem Finger 1:1 bis zum weichen Cap — in beide Richtungen', () => {
    expect(dampSwipeOffset(120, true)).toBe(120);
    expect(dampSwipeOffset(-120, true)).toBe(-120);
  });

  it('dämpft symmetrisch jenseits des Caps', () => {
    expect(dampSwipeOffset(250, true)).toBe(190);
    expect(dampSwipeOffset(-250, true)).toBe(-190);
  });

  it('lässt gesperrte Zeilen nur als Gummiband nach', () => {
    expect(dampSwipeOffset(100, false)).toBeCloseTo(10);
    expect(dampSwipeOffset(-100, false)).toBeCloseTo(-10);
  });
});

describe('isSwipeArmed', () => {
  it('armiert jenseits der Schwelle in beide Richtungen', () => {
    expect(isSwipeArmed(SWIPE_COMMIT_PX + 1, true)).toBe(true);
    expect(isSwipeArmed(-(SWIPE_COMMIT_PX + 1), true)).toBe(true);
  });

  it('bleibt unter der Schwelle und bei gesperrten Zeilen aus', () => {
    expect(isSwipeArmed(SWIPE_COMMIT_PX - 1, true)).toBe(false);
    expect(isSwipeArmed(-(SWIPE_COMMIT_PX - 1), true)).toBe(false);
    expect(isSwipeArmed(300, false)).toBe(false);
  });
});

describe('resolveSwipeCommit', () => {
  it('committet über die Schwelle nach links wie nach rechts', () => {
    expect(resolveSwipeCommit(150, 0, true)).toBe('right');
    expect(resolveSwipeCommit(-150, 0, true)).toBe('left');
  });

  it('committet einen schnellen Flick in Zugrichtung', () => {
    expect(resolveSwipeCommit(70, 900, true)).toBe('right');
    expect(resolveSwipeCommit(-70, -900, true)).toBe('left');
  });

  it('ignoriert einen Flick, der gegen die Zugrichtung läuft', () => {
    expect(resolveSwipeCommit(70, -900, true)).toBeNull();
    expect(resolveSwipeCommit(-70, 900, true)).toBeNull();
  });

  it('federt bei kurzem, langsamem Zug zurück', () => {
    expect(resolveSwipeCommit(40, 100, true)).toBeNull();
    expect(resolveSwipeCommit(-40, -100, true)).toBeNull();
  });

  it('committet nie auf gesperrten Zeilen', () => {
    expect(resolveSwipeCommit(300, 2000, false)).toBeNull();
    expect(resolveSwipeCommit(-300, -2000, false)).toBeNull();
  });
});
