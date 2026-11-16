import { describe, expect, it } from 'vitest';
import { normalizeInviteCode } from './inviteCode';

describe('normalizeInviteCode', () => {
  it('nimmt Kleinschreibung, Leerzeichen und Bindestriche hin', () => {
    expect(normalizeInviteCode(' abc-def ')).toBe('ABCDEF');
    expect(normalizeInviteCode('K7m 2xp')).toBe('K7M2XP');
  });

  it('lehnt falsche Länge und nie vergebene Zeichen ab', () => {
    expect(normalizeInviteCode('ABCDE')).toBeNull();
    expect(normalizeInviteCode('ABCDEFG')).toBeNull();
    expect(normalizeInviteCode('ABCDE0')).toBeNull();
    expect(normalizeInviteCode('ABCDEI')).toBeNull();
    expect(normalizeInviteCode('ABC/EF')).toBeNull();
  });

  it('lehnt alles ab, was kein Text ist', () => {
    expect(normalizeInviteCode(null)).toBeNull();
    expect(normalizeInviteCode(undefined)).toBeNull();
    expect(normalizeInviteCode(123456)).toBeNull();
  });
});
