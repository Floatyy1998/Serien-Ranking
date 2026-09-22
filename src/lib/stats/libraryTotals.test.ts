import { describe, expect, it } from 'vitest';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import {
  computeLibraryTotals,
  computeMovieTotals,
  computeSeriesTotals,
  countsAsAired,
  episodeWatchCount,
} from './libraryTotals';

type Episode = Series['seasons'][number]['episodes'][number];

const PAST = '2020-01-01';
const FUTURE = '2999-01-01';

const ep = (overrides: Partial<Episode> = {}): Episode =>
  ({
    id: Math.floor(Math.random() * 1_000_000),
    name: 'Folge',
    air_date: PAST,
    episode_number: 1,
    watched: false,
    ...overrides,
  }) as Episode;

const series = (episodes: Episode[], episodeRuntime = 45): Series =>
  ({
    id: 1,
    episodeRuntime,
    seasons: [{ seasonNumber: 0, episodes }],
  }) as unknown as Series;

const movie = (overrides: Partial<Movie> = {}): Movie =>
  ({
    id: 1,
    runtime: 100,
    watched: false,
    rating: {},
    ...overrides,
  }) as unknown as Movie;

describe('countsAsAired', () => {
  it('zaehlt ausgestrahlte Folgen', () => {
    expect(countsAsAired(ep({ air_date: PAST }))).toBe(true);
  });

  it('zaehlt Folgen ohne Datum mit — sonst faellt der Alt-Bestand raus', () => {
    expect(countsAsAired(ep({ air_date: undefined as unknown as string }))).toBe(true);
  });

  it('zaehlt Zukunfts-Folgen nicht', () => {
    expect(countsAsAired(ep({ air_date: FUTURE }))).toBe(false);
  });
});

describe('episodeWatchCount', () => {
  it('Legacy-Zeilen ohne watchCount zaehlen als ein Watch', () => {
    expect(episodeWatchCount(ep({ watched: true }))).toBe(1);
    expect(episodeWatchCount(ep({ watched: true, watchCount: 1 }))).toBe(1);
  });

  it('Rewatches zaehlen mehrfach', () => {
    expect(episodeWatchCount(ep({ watched: true, watchCount: 3 }))).toBe(3);
  });
});

describe('computeSeriesTotals', () => {
  it('summiert nur gesehene, ausgestrahlte Folgen', () => {
    const totals = computeSeriesTotals(
      series([
        ep({ episode_number: 1, watched: true }),
        ep({ episode_number: 2, watched: false }),
        ep({ episode_number: 3, watched: true, air_date: FUTURE }),
      ])
    );

    expect(totals.episodes).toBe(1);
    expect(totals.watchtimeMinutes).toBe(45);
    expect(totals.airedEpisodes).toBe(2);
  });

  it('nimmt die Folgenlaufzeit vor der Serienlaufzeit', () => {
    const totals = computeSeriesTotals(
      series([ep({ episode_number: 1, watched: true, runtime: 22 })], 45)
    );
    expect(totals.watchtimeMinutes).toBe(22);
  });

  it('faellt ohne Laufzeit auf 45 Minuten zurueck', () => {
    const totals = computeSeriesTotals(
      series([ep({ episode_number: 1, watched: true })], 0 as unknown as number)
    );
    expect(totals.watchtimeMinutes).toBe(45);
  });

  it('zaehlt Rewatches in Zeit und Folgen mit', () => {
    const totals = computeSeriesTotals(
      series([ep({ episode_number: 1, watched: true, watchCount: 3, runtime: 20 })])
    );
    expect(totals.episodes).toBe(3);
    expect(totals.watchtimeMinutes).toBe(60);
  });

  it('erkennt „gesehen" auch an firstWatchedAt und watchCount ohne Flag', () => {
    expect(
      computeSeriesTotals(series([ep({ episode_number: 1, firstWatchedAt: '2024-05-01' })]))
        .episodes
    ).toBe(1);
    expect(
      computeSeriesTotals(series([ep({ episode_number: 1, watchCount: 2, watched: false })]))
        .episodes
    ).toBe(2);
  });

  it('gilt als komplett, wenn jede ausgestrahlte Folge gesehen ist', () => {
    const totals = computeSeriesTotals(
      series([
        ep({ episode_number: 1, watched: true }),
        ep({ episode_number: 2, watched: true }),
        ep({ episode_number: 3, air_date: FUTURE }),
      ])
    );
    expect(totals.isStarted).toBe(true);
    expect(totals.isCompleted).toBe(true);
  });

  it('ist nicht komplett, solange eine ausgestrahlte Folge fehlt', () => {
    const totals = computeSeriesTotals(
      series([ep({ episode_number: 1, watched: true }), ep({ episode_number: 2 })])
    );
    expect(totals.isCompleted).toBe(false);
  });

  it('eine ungesehene Serie ist weder gestartet noch komplett', () => {
    const totals = computeSeriesTotals(series([ep({ episode_number: 1 })]));
    expect(totals.isStarted).toBe(false);
    expect(totals.isCompleted).toBe(false);
  });
});

describe('computeMovieTotals', () => {
  it('zaehlt als gesehen markierte Filme', () => {
    expect(computeMovieTotals([movie({ watched: true, runtime: 90 })])).toEqual({
      watchtimeMinutes: 90,
      count: 1,
    });
  });

  it('zaehlt bewertete Filme als gesehen', () => {
    expect(computeMovieTotals([movie({ rating: { Action: 8 }, runtime: 100 })]).count).toBe(1);
  });

  it('faellt ohne Laufzeit auf 120 Minuten zurueck', () => {
    expect(
      computeMovieTotals([movie({ watched: true, runtime: 0 as unknown as number })])
        .watchtimeMinutes
    ).toBe(120);
  });

  it('ignoriert ungesehene Filme', () => {
    expect(computeMovieTotals([movie()])).toEqual({ watchtimeMinutes: 0, count: 0 });
  });
});

describe('computeLibraryTotals', () => {
  it('fasst Serien und Filme zu einer Gesamtzahl zusammen', () => {
    const totals = computeLibraryTotals(
      [
        series([ep({ episode_number: 1, watched: true, runtime: 50 })]),
        series([ep({ episode_number: 1, watched: true }), ep({ episode_number: 2 })]),
      ],
      [movie({ watched: true, runtime: 100 })]
    );

    expect(totals.seriesMinutes).toBe(95);
    expect(totals.movieMinutes).toBe(100);
    expect(totals.watchtimeMinutes).toBe(195);
    expect(totals.episodes).toBe(2);
    expect(totals.seriesStarted).toBe(2);
    expect(totals.seriesCompleted).toBe(1);
    expect(totals.movies).toBe(1);
  });

  it('bleibt bei leeren Listen bei null', () => {
    expect(computeLibraryTotals([], [])).toMatchObject({
      watchtimeMinutes: 0,
      episodes: 0,
      seriesStarted: 0,
      seriesCompleted: 0,
      movies: 0,
    });
  });

  it('uebersteht luecken- und formatlose Eintraege', () => {
    const totals = computeLibraryTotals(
      [null as unknown as Series, series([])],
      [null as unknown as Movie]
    );
    expect(totals.watchtimeMinutes).toBe(0);
  });
});
