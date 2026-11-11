import { describe, expect, it } from 'vitest';
import { compareFriendMovieStatus, friendMovieStatus } from './friendMovieStatus';

describe('friendMovieStatus', () => {
  it('liefert null ohne Eintrag', () => {
    expect(friendMovieStatus(null)).toBeNull();
    expect(friendMovieStatus(undefined)).toBeNull();
  });

  it('erkennt gesehen über Haken, Datum oder Bewertung', () => {
    expect(friendMovieStatus({ watched: true })?.state).toBe('watched');
    expect(friendMovieStatus({ watchedAt: '2026-11-01T20:00:00.000Z' })?.state).toBe('watched');
    expect(friendMovieStatus({ rating: { Action: 8, Drama: 7 } })?.state).toBe('watched');
  });

  it('unterscheidet Watchlist und nur in der Liste', () => {
    expect(friendMovieStatus({ watchlist: true })?.state).toBe('watchlist');
    expect(friendMovieStatus({ rating: { Action: 0 } })?.state).toBe('listed');
  });

  it('rechnet die Genre-Bewertung zu einer Gesamtnote', () => {
    expect(friendMovieStatus({ rating: { Action: 8, Drama: 7 } })?.rating).toBe(7.5);
    expect(friendMovieStatus({ watched: true })?.rating).toBe(0);
  });

  it('liest watchedAt als Zeitstempel und ignoriert Unsinn', () => {
    expect(friendMovieStatus({ watchedAt: '2026-11-01T20:00:00.000Z' })?.watchedAt).toBe(
      Date.parse('2026-11-01T20:00:00.000Z')
    );
    expect(friendMovieStatus({ watched: true, watchedAt: 'kaputt' })?.watchedAt).toBeNull();
  });
});

describe('compareFriendMovieStatus', () => {
  it('sortiert gesehen vor Watchlist vor Liste, darin das zuletzt Gesehene zuerst', () => {
    const [listed, watchlist, old, fresh] = [
      {},
      { watchlist: true },
      { watchedAt: '2025-01-01T00:00:00.000Z' },
      { watchedAt: '2026-11-01T00:00:00.000Z' },
    ].map((ref) => {
      const status = friendMovieStatus(ref);
      if (!status) throw new Error('Status fehlt');
      return status;
    });
    const sorted = [listed, old, watchlist, fresh].sort(compareFriendMovieStatus);
    expect(sorted).toEqual([fresh, old, watchlist, listed]);
  });
});
