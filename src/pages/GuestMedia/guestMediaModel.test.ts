import { describe, expect, it } from 'vitest';
import {
  pickCast,
  pickSeasons,
  pickSimilar,
  pickTrailerKey,
  totalWatchMinutes,
  upcomingEpisode,
} from './guestMediaModel';

describe('guestMediaModel', () => {
  it('nimmt den offiziellen YouTube-Trailer vor Teasern', () => {
    expect(
      pickTrailerKey([
        { key: 'teaser', site: 'YouTube', type: 'Teaser', official: true },
        { key: 'fan', site: 'YouTube', type: 'Trailer', official: false },
        { key: 'vimeo', site: 'Vimeo', type: 'Trailer', official: true },
        { key: 'main', site: 'YouTube', type: 'Trailer', official: true },
      ])
    ).toBe('main');
    expect(pickTrailerKey([{ key: 'x', site: 'YouTube', type: 'Clip' }])).toBeNull();
  });

  it('liest die Rolle aus aggregate_credits und credits', () => {
    expect(
      pickCast({ aggregate_credits: { cast: [{ id: 1, name: 'A', roles: [{ character: 'X' }] }] } })
    ).toEqual([{ id: 1, name: 'A', character: 'X', profilePath: null }]);
    expect(
      pickCast({ credits: { cast: [{ id: 2, name: 'B', character: 'Y' }] } })[0].character
    ).toBe('Y');
  });

  it('füllt wenige Empfehlungen mit ähnlichen Titeln auf, ohne Doppelte und ohne Poster-lose', () => {
    const result = pickSimilar({
      recommendations: { results: [{ id: 1, poster_path: '/a' }] },
      similar: {
        results: [
          { id: 1, poster_path: '/a' },
          { id: 2, poster_path: null },
          { id: 3, poster_path: '/c' },
        ],
      },
    });
    expect(result.map((r) => r.id)).toEqual([1, 3]);
  });

  it('lässt Specials und leere Staffeln weg', () => {
    expect(
      pickSeasons({
        seasons: [
          { id: 1, name: 'Specials', season_number: 0, episode_count: 3 },
          { id: 2, name: 'S1', season_number: 1, episode_count: 10 },
          { id: 3, name: 'S2', season_number: 2, episode_count: 0 },
        ],
      }).map((s) => s.id)
    ).toEqual([2]);
  });

  it('zeigt nur kommende Folgen', () => {
    const now = new Date('2026-11-08T12:00:00');
    const next = { air_date: '2026-11-08', season_number: 1, episode_number: 4 };
    expect(upcomingEpisode({ next_episode_to_air: next }, now)).toBe(next);
    expect(
      upcomingEpisode({ next_episode_to_air: { ...next, air_date: '2026-11-01' } }, now)
    ).toBeNull();
  });

  it('rechnet die Gesamtlaufzeit aus Folgenlänge mal Folgenzahl', () => {
    expect(totalWatchMinutes({ runtime: 95 })).toBe(95);
    expect(totalWatchMinutes({ episode_run_time: [24], number_of_episodes: 12 })).toBe(288);
    expect(totalWatchMinutes({ number_of_episodes: 12 })).toBe(0);
  });
});
