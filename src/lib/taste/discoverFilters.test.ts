import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VIEW_FILTERS,
  activeViewFilterCount,
  discoverGenreParams,
  genreOptionsFor,
  normalizeViewFilters,
  passesViewFilters,
  type DiscoverViewFilters,
} from './discoverFilters';

const filters = (extra: Partial<DiscoverViewFilters> = {}): DiscoverViewFilters => ({
  ...DEFAULT_VIEW_FILTERS,
  ...extra,
});

const anime = { genre_ids: [16, 10759], original_language: 'ja', vote_average: 8.4 };
const cartoon = { genre_ids: [16, 35], original_language: 'en', vote_average: 7.2 };
const drama = { genre_ids: [18], original_language: 'en', vote_average: 6.5 };

describe('passesViewFilters', () => {
  it('lets everything through by default', () => {
    expect([anime, cartoon, drama].every((item) => passesViewFilters(item, filters()))).toBe(true);
  });

  it('hides anime but keeps other animation', () => {
    const noAnime = filters({ hide: ['anime'] });
    expect(passesViewFilters(anime, noAnime)).toBe(false);
    expect(passesViewFilters(cartoon, noAnime)).toBe(true);
  });

  it('hides all animation including anime', () => {
    const noAnimation = filters({ hide: ['animation'] });
    expect(passesViewFilters(anime, noAnimation)).toBe(false);
    expect(passesViewFilters(cartoon, noAnimation)).toBe(false);
    expect(passesViewFilters(drama, noAnimation)).toBe(true);
  });

  it('hides combined TV genres through either half', () => {
    expect(passesViewFilters({ genre_ids: [10765] }, filters({ hide: ['scifi'] }))).toBe(false);
    expect(passesViewFilters({ genre_ids: [10762] }, filters({ hide: ['kids'] }))).toBe(false);
  });

  it('filters by era, rating and match', () => {
    expect(passesViewFilters({ first_air_date: '2019-01-01' }, filters({ eras: ['new'] }))).toBe(
      true
    );
    expect(passesViewFilters({ release_date: '1994-01-01' }, filters({ eras: ['new'] }))).toBe(
      false
    );
    expect(passesViewFilters({}, filters({ eras: ['old'] }))).toBe(false);
    const since2000 = filters({ eras: ['new', 'mid'] });
    expect(passesViewFilters({ release_date: '2004-06-01' }, since2000)).toBe(true);
    expect(passesViewFilters({ release_date: '2023-06-01' }, since2000)).toBe(true);
    expect(passesViewFilters({ release_date: '1999-12-31' }, since2000)).toBe(false);
    expect(passesViewFilters(drama, filters({ minRating: 7 }))).toBe(false);
    expect(passesViewFilters(cartoon, filters({ minRating: 7 }))).toBe(true);
    expect(passesViewFilters({ match: 55 }, filters({ minMatch: 60 }))).toBe(false);
    expect(passesViewFilters({ match: 82 }, filters({ minMatch: 80 }))).toBe(true);
    expect(passesViewFilters({}, filters({ minMatch: 80 }))).toBe(true);
  });
});

describe('show only', () => {
  const dramedy = { genre_ids: [35, 18], original_language: 'en' };
  const animeDramedy = { genre_ids: [16, 35, 18], original_language: 'ja' };

  it('shows whatever matches one of the chosen genres and still honours the hidden ones', () => {
    const wanted = filters({ only: ['comedy', 'drama'] });
    expect(passesViewFilters(dramedy, wanted)).toBe(true);
    expect(passesViewFilters(drama, wanted)).toBe(true);
    expect(passesViewFilters(animeDramedy, wanted)).toBe(true);
    expect(passesViewFilters({ genre_ids: [27] }, wanted)).toBe(false);

    const withoutAnime = filters({ only: ['comedy', 'drama'], hide: ['anime'] });
    expect(passesViewFilters(dramedy, withoutAnime)).toBe(true);
    expect(passesViewFilters(animeDramedy, withoutAnime)).toBe(false);
  });

  it('can ask for anime only', () => {
    expect(passesViewFilters(anime, filters({ only: ['anime'] }))).toBe(true);
    expect(passesViewFilters(cartoon, filters({ only: ['anime'] }))).toBe(false);
  });

  it('turns the choice into TMDB discover parameters', () => {
    expect(discoverGenreParams(filters({ hide: ['horror'] }), 'movie')).toBeNull();
    expect(
      discoverGenreParams(
        filters({ only: ['comedy', 'drama'], hide: ['anime', 'horror'] }),
        'movie'
      )
    ).toEqual({
      with_genres: '35|18',
      without_genres: '27',
      with_original_language: undefined,
    });
    expect(discoverGenreParams(filters({ only: ['anime'] }), 'series')).toEqual({
      with_genres: '16',
      without_genres: undefined,
      with_original_language: 'ja',
    });
    expect(discoverGenreParams(filters({ only: ['scifi'] }), 'movie')?.with_genres).toBe('878|14');
    expect(discoverGenreParams(filters({ only: ['anime', 'comedy'] }), 'series')).toEqual({
      with_genres: '16|35',
      without_genres: undefined,
      with_original_language: undefined,
    });
    expect(discoverGenreParams(filters({ only: ['scifi'] }), 'series')?.with_genres).toBe('10765');
  });

  it('offers only genres the media type knows', () => {
    const ids = (media: 'series' | 'movie') => genreOptionsFor(media).map((option) => option.id);
    expect(ids('series')).toContain('reality');
    expect(ids('movie')).not.toContain('reality');
    expect(ids('movie')).toContain('horror');
    expect(ids('series')).not.toContain('horror');
    expect(ids('movie')).toContain('anime');
  });
});

describe('view filter state', () => {
  it('counts the active filters', () => {
    expect(activeViewFilterCount(filters())).toBe(0);
    expect(
      activeViewFilterCount(
        filters({ hide: ['anime', 'horror'], eras: ['new', 'mid'], minMatch: 60 })
      )
    ).toBe(4);
    expect(activeViewFilterCount(filters({ only: ['comedy'], hide: ['anime'] }))).toBe(2);
  });

  it('drops unknown values when restoring', () => {
    expect(normalizeViewFilters(null)).toEqual(DEFAULT_VIEW_FILTERS);
    expect(
      normalizeViewFilters({
        hide: ['anime', 'nope'],
        eras: ['mid', 'later', 'new'],
        minRating: 7,
        minMatch: 33,
      })
    ).toEqual({ only: [], hide: ['anime'], eras: ['mid', 'new'], minRating: 7, minMatch: 0 });
    expect(normalizeViewFilters({ eras: ['old', 'mid', 'new'] }).eras).toEqual([]);
    expect(normalizeViewFilters({ only: ['comedy'], hide: ['comedy', 'anime'] }).hide).toEqual([
      'anime',
    ]);
  });
});
