import { describe, expect, it } from 'vitest';
import { autoWatchlistUpdates, shouldAutoEnableWatchlist } from './autoWatchlist';

// Der Param-Typ ist Pick<Series,'id'|'watchlist'|'seasons'>; wir casten Fixtures.
const series = (o: Record<string, unknown>) => o as never;

describe('shouldAutoEnableWatchlist', () => {
  it('false für null/undefined', () => {
    expect(shouldAutoEnableWatchlist(null)).toBe(false);
    expect(shouldAutoEnableWatchlist(undefined)).toBe(false);
  });

  it('false wenn watchlist bereits aktiv ist', () => {
    expect(shouldAutoEnableWatchlist(series({ id: 1, watchlist: true, seasons: [] }))).toBe(false);
  });

  it('false wenn irgendeine Episode bereits gesehen wurde', () => {
    const s = series({
      id: 1,
      watchlist: false,
      seasons: [{ episodes: [{ watched: false }, { watched: true }] }],
    });
    expect(shouldAutoEnableWatchlist(s)).toBe(false);
  });

  it('true wenn keine Episode gesehen wurde', () => {
    const s = series({
      id: 1,
      watchlist: false,
      seasons: [{ episodes: [{ watched: false }, { watched: false }] }],
    });
    expect(shouldAutoEnableWatchlist(s)).toBe(true);
  });

  it('true bei fehlenden seasons (optional chaining → undefined → !undefined)', () => {
    expect(shouldAutoEnableWatchlist(series({ id: 1, watchlist: false }))).toBe(true);
  });

  it('true bei leeren seasons', () => {
    expect(shouldAutoEnableWatchlist(series({ id: 1, watchlist: false, seasons: [] }))).toBe(true);
  });

  it('verträgt Season ohne episodes', () => {
    const s = series({ id: 1, watchlist: false, seasons: [{}] });
    expect(shouldAutoEnableWatchlist(s)).toBe(true);
  });
});

describe('autoWatchlistUpdates', () => {
  it('gibt leeres Objekt zurück, wenn nicht auto-aktiviert werden soll', () => {
    expect(autoWatchlistUpdates('uid1', null)).toEqual({});
    expect(autoWatchlistUpdates('uid1', series({ id: 5, watchlist: true, seasons: [] }))).toEqual(
      {}
    );
  });

  it('gibt die Firebase-Pfad-Map zurück, wenn aktiviert werden soll', () => {
    const s = series({ id: 42, watchlist: false, seasons: [] });
    expect(autoWatchlistUpdates('uidX', s)).toEqual({
      'users/uidX/series/42/watchlist': true,
    });
  });
});
