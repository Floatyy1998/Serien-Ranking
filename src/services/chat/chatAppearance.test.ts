import { describe, expect, it, vi } from 'vitest';

vi.mock('../db/ref', () => ({
  dbRef: vi.fn(),
  userPath: (uid: string, ...segments: string[]) => ['users', uid, ...segments].join('/'),
}));

import { isValidBubbleStyle } from './chatAppearance';

describe('isValidBubbleStyle', () => {
  it('akzeptiert gültige Styles', () => {
    expect(isValidBubbleStyle({ c1: '#00d123', c2: '#009a1d', r: 'round' })).toBe(true);
    expect(isValidBubbleStyle({ c1: '#ABCDEF', c2: '#123456', r: 'sharp' })).toBe(true);
  });

  it('lehnt kaputte oder manipulierte Werte ab', () => {
    expect(isValidBubbleStyle(null)).toBe(false);
    expect(isValidBubbleStyle('x')).toBe(false);
    expect(isValidBubbleStyle({ c1: 'red', c2: '#009a1d', r: 'round' })).toBe(false);
    expect(isValidBubbleStyle({ c1: '#00d123', c2: '#009a1d', r: 'huge' })).toBe(false);
    expect(isValidBubbleStyle({ c1: '#00d123', r: 'round' })).toBe(false);
    expect(isValidBubbleStyle({ c1: '#00d123;url(x)', c2: '#009a1d', r: 'round' })).toBe(false);
  });
});
