import { describe, expect, it } from 'vitest';
import type { Movie } from '../types/Movie';
import type { Series } from '../types/Series';
import {
  buildTonightCandidates,
  discoverToCandidate,
  matchesMood,
  pickTonight,
  type TonightCandidate,
} from './tonightPicker';

const mkSeries = (id: number, over: Record<string, unknown> = {}): Series =>
  ({
    id,
    title: `Serie ${id}`,
    poster: { poster: 'p.jpg' },
    genre: { genres: ['Drama'] },
    seasons: [
      {
        seasonNumber: 0,
        episodes: [
          {
            id: id * 100 + 1,
            episode_number: 1,
            name: 'Pilot',
            air_date: '2020-01-01',
            watched: true,
            runtime: 40,
          },
          {
            id: id * 100 + 2,
            episode_number: 2,
            name: 'Zwei',
            air_date: '2020-01-08',
            watched: false,
            runtime: 40,
          },
        ],
      },
    ],
    ...over,
  }) as unknown as Series;

const mkMovie = (id: number, over: Record<string, unknown> = {}): Movie =>
  ({
    id,
    title: `Film ${id}`,
    poster: { poster: 'p.jpg' },
    genre: { genres: ['Thriller'] },
    rating: {},
    runtime: 100,
    ...over,
  }) as unknown as Movie;

describe('buildTonightCandidates', () => {
  it('liefert die nächste ungesehene Folge einer Serie mit Fortschritt', () => {
    const c = buildTonightCandidates([mkSeries(1)], [], new Set());
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({
      kind: 'series-next',
      seasonNumber: 1,
      episodeNumber: 2,
      watchedEpisodes: 1,
    });
  });

  it('überspringt versteckte, geblockte und durchgeschaute Titel', () => {
    const done = mkSeries(2);
    done.seasons[0].episodes.forEach((e) => (e.watched = true));
    const c = buildTonightCandidates(
      [mkSeries(1, { hidden: true }), done, mkSeries(3)],
      [mkMovie(4, { watched: true }), mkMovie(5)],
      new Set([3, 5])
    );
    expect(c).toHaveLength(0);
  });

  it('erkennt gesehene Filme auch über das genre-keyed Rating', () => {
    const rated = mkMovie(6, { rating: { Thriller: 8 } });
    const c = buildTonightCandidates([], [rated, mkMovie(7)], new Set());
    expect(c.map((x) => x.id)).toEqual([7]);
  });
});

describe('matchesMood', () => {
  it('matcht tolerant über deutsche und englische Genre-Labels', () => {
    expect(matchesMood(['Komödie'], 'leicht')).toBe(true);
    expect(matchesMood(['Comedy'], 'leicht')).toBe(true);
    expect(matchesMood(['Sci-Fi & Fantasy'], 'duester')).toBe(true);
    expect(matchesMood(['Drama'], 'spannend')).toBe(false);
    expect(matchesMood([], 'egal')).toBe(true);
  });
});

describe('pickTonight', () => {
  const base = () =>
    buildTonightCandidates(
      [mkSeries(1), mkSeries(2, { genre: { genres: ['Krimi'] } })],
      [mkMovie(3), mkMovie(4, { runtime: 200 })],
      new Set()
    );

  it('filtert das Zeitbudget hart', () => {
    const picks = pickTonight(base(), {
      time: 30,
      mood: 'egal',
      type: 'egal',
      source: 'egal',
      seed: 1,
    });
    expect(picks.every((p) => p.candidate.runtime <= 35)).toBe(true);
    expect(picks.some((p) => p.candidate.id === 3)).toBe(false);
  });

  it('bevorzugt angefangene Serien vor Filmen', () => {
    const picks = pickTonight(base(), {
      time: 0,
      mood: 'egal',
      type: 'egal',
      source: 'egal',
      seed: 1,
    });
    expect(picks[0].candidate.kind).toBe('series-next');
    expect(picks[0].reasons[0]).toMatchObject({ kind: 'continue' });
  });

  it('wendet die Stimmung weich an und fällt bei leerem Pool zurück', () => {
    const spannend = pickTonight(base(), {
      time: 0,
      mood: 'spannend',
      type: 'egal',
      source: 'egal',
      seed: 1,
    });
    expect(spannend.every((p) => matchesMood(p.candidate.genres, 'spannend'))).toBe(true);

    const emotionalOnly = pickTonight(
      buildTonightCandidates([], [mkMovie(9, { genre: { genres: ['Horror'] } })], new Set()),
      { time: 0, mood: 'emotional', type: 'egal', source: 'egal', seed: 1 }
    );
    expect(emotionalOnly).toHaveLength(1);
    expect(emotionalOnly[0].reasons.some((r) => r.kind === 'mood')).toBe(false);
  });

  it('berechnet wie viele Folgen ins Zeitfenster passen', () => {
    const picks = pickTonight(buildTonightCandidates([mkSeries(1)], [], new Set()), {
      time: 120,
      mood: 'egal',
      type: 'egal',
      source: 'egal',
      seed: 1,
    });
    expect(picks[0].episodesInBudget).toBe(3);
  });

  it('rotiert deterministisch über den Seed', () => {
    const a = pickTonight(base(), { time: 0, mood: 'egal', type: 'egal', source: 'egal', seed: 7 });
    const b = pickTonight(base(), { time: 0, mood: 'egal', type: 'egal', source: 'egal', seed: 7 });
    expect(a.map((p) => p.candidate.id)).toEqual(b.map((p) => p.candidate.id));
  });

  it('filtert nach Typ (nur Filme)', () => {
    const picks = pickTonight(base(), {
      time: 0,
      mood: 'egal',
      type: 'movie',
      source: 'egal',
      seed: 1,
    });
    expect(picks.length).toBeGreaterThan(0);
    expect(picks.every((p) => p.candidate.kind === 'movie')).toBe(true);
  });

  it('filtert nach Quelle (nur Entdeckungen) und begründet mit discover', () => {
    const discover = discoverToCandidate(
      { id: 99, name: 'Neue Serie', poster_path: '/n.jpg', vote_average: 8.1 },
      'series'
    );
    const picks = pickTonight([...base(), discover as TonightCandidate], {
      time: 0,
      mood: 'egal',
      type: 'egal',
      source: 'discover',
      seed: 1,
    });
    expect(picks).toHaveLength(1);
    expect(picks[0].candidate.id).toBe(99);
    expect(picks[0].reasons[0]).toMatchObject({ kind: 'discover', rating: 8.1 });
  });

  it('Entdeckungen gelten bei gesetzter Stimmung als Treffer (per TMDB-Genre vorgefiltert)', () => {
    const discover = discoverToCandidate({ id: 99, name: 'Neu' }, 'movie') as TonightCandidate;
    const picks = pickTonight([discover], {
      time: 0,
      mood: 'gruselig',
      type: 'egal',
      source: 'egal',
      seed: 1,
    });
    expect(picks).toHaveLength(1);
  });
});

describe('discoverToCandidate', () => {
  it('mappt TV- und Film-Items mit Default-Laufzeiten', () => {
    const tv = discoverToCandidate({ id: 1, name: 'S' }, 'series');
    const movie = discoverToCandidate({ id: 2, title: 'F' }, 'movie');
    expect(tv).toMatchObject({ kind: 'new-series', title: 'S' });
    expect(movie).toMatchObject({ kind: 'new-movie', title: 'F' });
    expect(discoverToCandidate({}, 'series')).toBeNull();
  });
});
