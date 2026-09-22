import { describe, expect, it } from 'vitest';
import type { LeaderboardStats, LeaderboardTotals } from '../../types/Leaderboard';
import { totalsValue } from './useTotalsRanking';

const totals = (overrides: Partial<LeaderboardTotals> = {}): LeaderboardTotals => ({
  watchtimeMinutes: 36245,
  episodes: 1480,
  seriesStarted: 63,
  seriesCompleted: 28,
  movies: 212,
  updatedAt: 1,
  v: 1,
  ...overrides,
});

const stats = (overrides: Partial<LeaderboardStats> = {}): LeaderboardStats => ({
  episodesThisMonth: 15,
  moviesThisMonth: 2,
  watchtimeThisMonth: 700,
  streakThisMonth: 4,
  streakAllTime: 21,
  streakCurrent: 4,
  lastStreakDate: '2026-09-22',
  lastUpdated: 1,
  monthKey: '2026-09',
  ...overrides,
});

describe('totalsValue', () => {
  it('liest die Vergleichszahlen aus dem Gesamt-Schnappschuss', () => {
    expect(totalsValue('watchtimeMinutes', totals(), stats())).toBe(36245);
    expect(totalsValue('seriesStarted', totals(), stats())).toBe(63);
    expect(totalsValue('movies', totals(), stats())).toBe(212);
    expect(totalsValue('episodes', totals(), stats())).toBe(1480);
  });

  it('holt die laengste Streak aus dem Monatsknoten — sie steht nicht im Schnappschuss', () => {
    expect(totalsValue('streakAllTime', null, stats())).toBe(21);
  });

  it('gibt ohne Schnappschuss null zurueck statt einer Null-Wertung', () => {
    expect(totalsValue('watchtimeMinutes', null, stats())).toBeNull();
    expect(totalsValue('movies', null, undefined)).toBeNull();
  });

  it('gibt auch ohne Streak-Daten null zurueck', () => {
    expect(totalsValue('streakAllTime', totals(), undefined)).toBeNull();
  });

  it('behandelt ein fehlendes Feld im Schnappschuss als null Treffer, nicht als Fehler', () => {
    const partial = { watchtimeMinutes: 10 } as LeaderboardTotals;
    expect(totalsValue('movies', partial, stats())).toBe(0);
  });
});
