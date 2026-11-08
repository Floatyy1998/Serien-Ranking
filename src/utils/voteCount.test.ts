import { describe, expect, it } from 'vitest';
import { formatVoteCount } from './voteCount';

describe('formatVoteCount', () => {
  it('zeigt kleine Zahlen ungekürzt', () => {
    expect(formatVoteCount(9)).toBe('9');
    expect(formatVoteCount(999)).toBe('999');
  });

  it('kürzt Tausender auf k', () => {
    expect(formatVoteCount(19_100)).toBe('19.1k');
    expect(formatVoteCount(999_949)).toBe('999.9k');
  });

  it('kürzt Millionen auf M', () => {
    expect(formatVoteCount(999_950)).toBe('1.0M');
    expect(formatVoteCount('2,701,903')).toBe('2.7M');
  });

  it('fängt leere und kaputte Werte ab', () => {
    expect(formatVoteCount(undefined)).toBe('0');
    expect(formatVoteCount('')).toBe('0');
    expect(formatVoteCount(NaN)).toBe('0');
  });
});
