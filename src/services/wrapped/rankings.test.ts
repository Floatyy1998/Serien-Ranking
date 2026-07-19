import { describe, expect, it } from 'vitest';
import {
  calculateTopSeries,
  calculateTopMovies,
  calculateTopGenres,
  calculateTopProviders,
} from './rankings';
import type { EpisodeWatchEvent, MovieWatchEvent } from '../../types/WatchActivity';

const ep = (over: Partial<EpisodeWatchEvent> = {}): EpisodeWatchEvent => ({
  type: 'episode_watch',
  timestamp: '2025-06-15T20:30:00',
  month: 6,
  dayOfWeek: 0,
  hour: 20,
  seriesId: 1,
  seriesTitle: 'Dark',
  seasonNumber: 1,
  episodeNumber: 1,
  isRewatch: false,
  ...over,
});

const mov = (over: Partial<MovieWatchEvent> = {}): MovieWatchEvent => ({
  type: 'movie_watch',
  timestamp: '2025-06-15T21:00:00',
  month: 6,
  dayOfWeek: 0,
  hour: 21,
  movieId: 100,
  movieTitle: 'Inception',
  ...over,
});

describe('calculateTopSeries', () => {
  it('aggregiert pro seriesId; Titel vom ersten Event, Default-Runtime 45', () => {
    const result = calculateTopSeries([
      ep({ seriesId: 1, seriesTitle: 'Dark' }),
      ep({ seriesId: 1, seriesTitle: 'ignoriert', episodeRuntime: 60 }),
      ep({ seriesId: 2, seriesTitle: 'Severance', episodeRuntime: 50 }),
    ]);
    expect(result).toEqual([
      { id: 1, title: 'Dark', episodesWatched: 2, minutesWatched: 105 },
      { id: 2, title: 'Severance', episodesWatched: 1, minutesWatched: 50 },
    ]);
  });

  it('sortiert absteigend nach Episoden und respektiert limit (Default 5)', () => {
    const events = [1, 2, 3, 4, 5, 6].flatMap((id) =>
      Array.from({ length: id }, () => ep({ seriesId: id, seriesTitle: `S${id}` }))
    );
    expect(calculateTopSeries(events).map((s) => s.id)).toEqual([6, 5, 4, 3, 2]);
    expect(calculateTopSeries(events, 2).map((s) => s.id)).toEqual([6, 5]);
  });

  it('leere Liste → []', () => {
    expect(calculateTopSeries([])).toEqual([]);
  });
});

describe('calculateTopMovies', () => {
  it('dedupliziert NICHT und sortiert nach Rating (fehlend = 0)', () => {
    const result = calculateTopMovies([
      mov({ movieId: 1, movieTitle: 'Ohne' }),
      mov({ movieId: 2, movieTitle: 'Gut', rating: 8, runtime: 148 }),
      mov({ movieId: 3, movieTitle: 'Null-Runtime', rating: 5, runtime: 0 }),
    ]);
    expect(result.map((m) => m.id)).toEqual([2, 3, 1]);
    expect(result[0].minutesWatched).toBe(148);
    expect(result[1].minutesWatched).toBe(120); // runtime 0 → Default
    expect(result[2].minutesWatched).toBe(120); // runtime fehlt → Default
  });

  it('respektiert limit', () => {
    const movies = Array.from({ length: 8 }, (_, i) => mov({ movieId: i, rating: i }));
    expect(calculateTopMovies(movies)).toHaveLength(5);
    expect(calculateTopMovies(movies, 3)).toHaveLength(3);
  });
});

describe('calculateTopGenres', () => {
  it('teilt Minuten gleichmäßig auf Genres; Prozent relativ zur Genre-Gesamtzeit', () => {
    const result = calculateTopGenres(
      [ep({ episodeRuntime: 60, genres: ['Drama', 'Comedy'] })],
      [mov({ runtime: 120, genres: ['Drama'] })]
    );
    expect(result).toEqual([
      { genre: 'Drama', count: 2, percentage: 83, minutesWatched: 150 },
      { genre: 'Comedy', count: 1, percentage: 17, minutesWatched: 30 },
    ]);
  });

  it('ignoriert generische Genres; Events nur mit ignorierten fallen raus', () => {
    const result = calculateTopGenres(
      [
        ep({ episodeRuntime: 45, genres: ['All', 'Drama'] }),
        ep({ episodeRuntime: 45, genres: ['alle'] }),
      ],
      []
    );
    expect(result).toEqual([{ genre: 'Drama', count: 1, percentage: 100, minutesWatched: 45 }]);
  });

  it('liefert [] ohne Genre-Daten', () => {
    expect(calculateTopGenres([ep()], [mov()])).toEqual([]);
    expect(calculateTopGenres([], [])).toEqual([]);
  });

  it('sortiert nach Minuten (nicht Count) und respektiert limit', () => {
    const episodes = [
      ep({ episodeRuntime: 10, genres: ['Comedy'] }),
      ep({ episodeRuntime: 10, genres: ['Comedy'] }),
      ep({ episodeRuntime: 100, genres: ['Drama'] }),
    ];
    expect(calculateTopGenres(episodes, []).map((g) => g.genre)).toEqual(['Drama', 'Comedy']);
    expect(calculateTopGenres(episodes, [], 1).map((g) => g.genre)).toEqual(['Drama']);
  });
});

describe('calculateTopProviders', () => {
  it('normalisiert Provider-Namen (Freevee→Prime, Max→HBO Max, Ad-Tiers)', () => {
    const result = calculateTopProviders(
      [
        ep({ providers: ['Netflix Standard with Ads'] }),
        ep({ providers: ['Freevee'] }),
        ep({ providers: ['Max'] }),
      ],
      []
    );
    expect(result.map((p) => p.name).sort()).toEqual(['Amazon Prime Video', 'HBO Max', 'Netflix']);
  });

  it('filtert Channel-Add-Ons; unbekannte Provider zaehlen mit', () => {
    expect(
      calculateTopProviders(
        [ep({ providers: ['Wow Fiction Amazon Channel'] }), ep({ providers: ['ARD Mediathek'] })],
        []
      ).map((p) => p.name)
    ).toEqual(['ARD Mediathek']);
  });

  it('dedupliziert innerhalb eines Events nach Normalisierung', () => {
    const result = calculateTopProviders(
      [ep({ episodeRuntime: 45, providers: ['Netflix', 'Netflix basic with Ads'] })],
      []
    );
    expect(result).toEqual([
      {
        name: 'Netflix',
        episodeCount: 1,
        movieCount: 0,
        totalCount: 1,
        minutesWatched: 45,
        percentage: 100,
      },
    ]);
  });

  it('gibt jedem Provider die volle Watchzeit (Prozentsumme kann > 100)', () => {
    const result = calculateTopProviders(
      [ep({ episodeRuntime: 45, providers: ['Netflix', 'WOW'] })],
      []
    );
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.percentage === 100 && p.minutesWatched === 45)).toBe(true);
  });

  it('leeres providers-Array [] unterdrückt den provider-Fallback', () => {
    expect(calculateTopProviders([ep({ providers: [], provider: 'Netflix' })], [])).toEqual([]);
  });

  it('fällt ohne providers-Array auf provider zurück (Episoden + Filme)', () => {
    const result = calculateTopProviders(
      [ep({ provider: 'Disney+' })],
      [mov({ provider: 'paramount plus', runtime: 90 })]
    );
    expect(result.map((p) => p.name)).toEqual(['Paramount Plus', 'Disney Plus']);
    expect(result.find((p) => p.name === 'Disney Plus')?.episodeCount).toBe(1);
    expect(result.find((p) => p.name === 'Paramount Plus')?.movieCount).toBe(1);
  });

  it('leere Eingabe → []', () => {
    expect(calculateTopProviders([], [])).toEqual([]);
  });
});
