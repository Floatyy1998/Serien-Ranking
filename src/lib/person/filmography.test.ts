import { describe, expect, it } from 'vitest';
import {
  ageInYears,
  buildFilmography,
  pickHeroBackdrop,
  roleLine,
  sortFilmography,
  type TmdbPersonCredit,
} from './filmography';

const movie = (id: number, extra: Partial<TmdbPersonCredit> = {}): TmdbPersonCredit => ({
  id,
  media_type: 'movie',
  title: `Film ${id}`,
  release_date: '2020-01-01',
  vote_count: 1000,
  ...extra,
});
const show = (id: number, extra: Partial<TmdbPersonCredit> = {}): TmdbPersonCredit => ({
  id,
  media_type: 'tv',
  name: `Serie ${id}`,
  first_air_date: '2019-05-01',
  vote_count: 1000,
  ...extra,
});

describe('buildFilmography', () => {
  it('filtert Auftritte als man selbst, Talkshows, Videos und Dankes-Credits', () => {
    const list = buildFilmography(
      [
        movie(1, { character: 'Joel' }),
        movie(2, { character: 'Self' }),
        movie(3, { character: 'Himself (archive footage)' }),
        show(4, { character: 'Guest', genre_ids: [10767] }),
        movie(5, { video: true, character: 'Table read' }),
      ],
      [movie(6, { job: 'Thanks' })]
    );
    expect(list.map((e) => e.id)).toEqual([1]);
  });

  it('führt Rolle und Job desselben Titels zusammen', () => {
    const [entry] = buildFilmography(
      [show(7, { character: 'Din Djarin', episode_count: 24 })],
      [show(7, { job: 'Executive Producer' })]
    );
    expect(entry).toMatchObject({
      key: 'series-7',
      type: 'series',
      title: 'Serie 7',
      year: '2019',
      characters: ['Din Djarin'],
      jobs: ['Executive Producer'],
      episodeCount: 24,
      acting: true,
    });
    expect(roleLine(entry)).toBe('als Din Djarin');
  });

  it('übersetzt Jobs, wenn es keine Rolle gibt', () => {
    const [entry] = buildFilmography(
      [],
      [movie(8, { job: 'Director' }), movie(8, { job: 'Writer' })]
    );
    expect(roleLine(entry)).toBe('Regie, Drehbuch');
  });
});

describe('sortFilmography', () => {
  it('„Bekannteste" gewichtet Hauptrollen und Folgenzahl, nicht nur die Titel-Bekanntheit', () => {
    const list = buildFilmography([
      show(1, { character: 'Gast', episode_count: 1, vote_count: 20000 }),
      show(2, { character: 'Hauptrolle', episode_count: 30, vote_count: 9000 }),
      movie(3, { character: 'Lead', order: 0, vote_count: 8000 }),
      movie(4, { character: 'Statist', order: 40, vote_count: 15000 }),
    ]);
    expect(sortFilmography(list, 'known').map((e) => e.id)).toEqual([2, 3, 1, 4]);
  });

  it('„Neueste" sortiert nach Datum, Titel ohne Datum ans Ende', () => {
    const list = buildFilmography([
      movie(1, { release_date: '2010-01-01' }),
      movie(2, { release_date: '' }),
      movie(3, { release_date: '2024-06-01' }),
    ]);
    expect(sortFilmography(list, 'newest').map((e) => e.id)).toEqual([3, 1, 2]);
  });
});

describe('pickHeroBackdrop', () => {
  it('nimmt den Hintergrund des bekanntesten Titels mit Bild', () => {
    const list = buildFilmography([
      movie(1, { vote_count: 50000 }),
      movie(2, { vote_count: 9000, backdrop_path: '/b2.jpg' }),
      movie(3, { vote_count: 100, backdrop_path: '/b3.jpg' }),
    ]);
    expect(pickHeroBackdrop(list)).toBe('/b2.jpg');
  });
});

describe('ageInYears', () => {
  it('rechnet bis zum Todestag und berücksichtigt den Geburtstag im Jahr', () => {
    expect(ageInYears('1975-04-02', '2025-04-01')).toBe(49);
    expect(ageInYears('1975-04-02', '2025-04-02')).toBe(50);
    expect(ageInYears(undefined)).toBeNull();
  });
});
