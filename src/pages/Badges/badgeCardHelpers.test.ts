import { describe, expect, it } from 'vitest';
import { getRarityColor } from './badgeCardHelpers';

type ThemeArg = Parameters<typeof getRarityColor>[1];

const theme = {
  primary: '#00d123',
  accent: '#ff00aa',
  text: { muted: '#888888' },
  status: { warning: '#ffbb00' },
} as unknown as ThemeArg;

describe('getRarityColor', () => {
  it('common → text.muted', () => {
    expect(getRarityColor('common', theme)).toBe('#888888');
  });

  it('rare → primary', () => {
    expect(getRarityColor('rare', theme)).toBe('#00d123');
  });

  it('epic → accent (mit Fallback auf primary)', () => {
    expect(getRarityColor('epic', theme)).toBe('#ff00aa');
    const noAccent = { ...theme, accent: undefined } as unknown as ThemeArg;
    expect(getRarityColor('epic', noAccent)).toBe('#00d123');
  });

  it('legendary → status.warning', () => {
    expect(getRarityColor('legendary', theme)).toBe('#ffbb00');
  });

  it('unbekannte Rarity → text.muted', () => {
    expect(getRarityColor('mythic', theme)).toBe('#888888');
  });
});
