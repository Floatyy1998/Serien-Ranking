import { describe, expect, it } from 'vitest';
import { shouldRefetchOnReconnect } from './reconnect';

describe('shouldRefetchOnReconnect', () => {
  it('refetcht wenn die Daten stale sind', () => {
    expect(shouldRefetchOnReconnect(true, { a: 1 })).toBe(true);
  });

  it('refetcht wenn noch keine Daten vorhanden sind', () => {
    expect(shouldRefetchOnReconnect(false, null)).toBe(true);
  });

  it('refetcht NICHT wenn frische Daten vorhanden sind', () => {
    expect(shouldRefetchOnReconnect(false, { a: 1 })).toBe(false);
  });
});
