import { describe, expect, it } from 'vitest';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { INTERESTS } from '../interests/interests';
import {
  INTEREST_GENRE_KEYS,
  SPECIFIC_TAGS,
  buildSupportIndex,
  buildTasteProfile,
  genreKeysOfIds,
  genreKeysOfLabel,
  matchPercent,
  rankBrowse,
  rankCandidates,
  seedBatches,
  topGenrePairs,
  type RankOptions,
  type TasteProfile,
  type TasteSeed,
} from './tasteEngine';

const NOW = Date.parse('2026-11-23T12:00:00Z');

const episodes = (total: number, watched: number, lastWatchedAt?: string, airDate = '2020-01-01') =>
  Array.from({ length: total }, (_, i) => ({
    id: i + 1,
    name: `E${i + 1}`,
    air_date: airDate,
    episode_number: i + 1,
    watched: i < watched,
    ...(i < watched && lastWatchedAt ? { lastWatchedAt } : {}),
  }));

const series = (
  id: number,
  title: string,
  extra: Partial<Series> & { eps?: ReturnType<typeof episodes> } = {}
): Series => {
  const { eps, ...rest } = extra;
  return {
    id,
    title,
    genre: { genres: ['Drama'] },
    rating: {},
    seasons: [{ seasonNumber: 0, episodes: eps ?? [] }],
    ...rest,
  } as unknown as Series;
};

const movie = (id: number, title: string, extra: Partial<Movie> = {}): Movie =>
  ({ id, title, genre: { genres: ['Drama'] }, rating: {}, ...extra }) as unknown as Movie;

const seed = (id: number, weight: number, lastActive = 0): TasteSeed => ({
  id,
  title: `S${id}`,
  weight,
  lastActive,
});

const candidate = (id: number, extra: Record<string, unknown> = {}) => ({
  id,
  poster_path: '/p.jpg',
  vote_average: 7.5,
  vote_count: 500,
  genre_ids: [18],
  ...extra,
});

const profileOf = (extra: Partial<TasteProfile> = {}): RankOptions['profile'] => ({
  genres: {},
  pairs: {},
  tags: {},
  eras: {},
  languages: {},
  ...extra,
});

const options = (extra: Partial<RankOptions> = {}): RankOptions => ({
  media: 'series',
  profile: profileOf(),
  exclude: () => false,
  daySeed: 0,
  ...extra,
});

describe('genre keys', () => {
  it('splits combined TMDB labels and understands German names', () => {
    expect(genreKeysOfLabel('Action & Adventure')).toEqual(['action', 'adventure']);
    expect(genreKeysOfLabel('Sci-Fi & Fantasy')).toEqual(['scifi', 'fantasy']);
    expect(genreKeysOfLabel('Action und Abenteuer')).toEqual(['action', 'adventure']);
    expect(genreKeysOfLabel('Komödie')).toEqual(['comedy']);
    expect(genreKeysOfLabel('General')).toEqual([]);
  });

  it('maps TMDB genre ids onto the same keys', () => {
    expect(genreKeysOfIds([10765, 878])).toEqual(['scifi', 'fantasy']);
    expect(genreKeysOfIds(undefined)).toEqual([]);
  });

  it('only derives interests and tags that exist', () => {
    const ids = new Set(INTERESTS.map((interest) => interest.id));
    expect(Object.keys(INTEREST_GENRE_KEYS).filter((id) => !ids.has(id))).toEqual([]);
    expect([...SPECIFIC_TAGS].filter((id) => !ids.has(id))).toEqual([]);
  });
});

describe('buildTasteProfile', () => {
  it('reads genre-keyed ratings: favourites become seeds, flops do not', () => {
    const profile = buildTasteProfile(
      [
        series(1, 'Top', { rating: { Drama: 10 } }),
        series(2, 'Gut', { rating: { Drama: 9 } }),
        series(3, 'Flop', { genre: { genres: ['Comedy'] }, rating: { Comedy: 3 } }),
      ],
      [],
      'series',
      NOW
    );
    expect(profile.seeds.map((s) => s.title)).toEqual(['Top', 'Gut']);
    expect(profile.genres.drama).toBeGreaterThan(0);
    expect(profile.genres.comedy).toBeLessThan(0);
  });

  it('uses the per-genre rating of a title for its genres', () => {
    const profile = buildTasteProfile(
      [
        series(1, 'Mix', {
          genre: { genres: ['Action & Adventure', 'Drama'] },
          rating: { 'Action & Adventure': 10, Drama: 4 },
        }),
      ],
      [],
      'series',
      NOW
    );
    expect(profile.genres.action).toBeGreaterThan(profile.genres.drama);
    expect(profile.genres.adventure).toBe(profile.genres.action);
  });

  it('derives taste from watch behaviour when nothing is rated', () => {
    const profile = buildTasteProfile(
      [
        series(1, 'Durch', { eps: episodes(10, 10, '2026-11-01T20:00:00Z') }),
        series(2, 'Abgebrochen', { eps: episodes(20, 2, '2024-01-01T20:00:00Z') }),
        series(3, 'Versteckt', { hidden: true, eps: episodes(10, 10, '2026-11-01T20:00:00Z') }),
        series(4, 'Rewatch', {
          eps: episodes(10, 10, '2026-11-01T20:00:00Z'),
          rewatch: { active: true, round: 1 },
        }),
        series(5, 'Geplant'),
      ],
      [],
      'series',
      NOW
    );
    const titles = profile.seeds.map((s) => s.title);
    expect(titles).toEqual(['Rewatch', 'Durch', 'Geplant']);
    expect(profile.seeds[0].weight).toBeGreaterThan(profile.seeds[1].weight);
  });

  it('drops planned titles from the seeds once enough real signals exist', () => {
    const watched = Array.from({ length: 5 }, (_, i) =>
      series(i + 1, `W${i + 1}`, { eps: episodes(10, 10) })
    );
    const profile = buildTasteProfile([...watched, series(9, 'Geplant')], [], 'series', NOW);
    expect(profile.seeds.map((s) => s.id)).toEqual([1, 2, 3, 4, 5]);
  });

  it('seeds movies from movies but lets series shape the genres', () => {
    const profile = buildTasteProfile(
      [series(1, 'Serie', { genre: { genres: ['Mystery'] }, rating: { Mystery: 10 } })],
      [movie(7, 'Film', { rating: { Drama: 9 } }), movie(8, 'Offen')],
      'movie',
      NOW
    );
    expect(profile.seeds.map((s) => s.id)).toEqual([7, 8]);
    expect(profile.genres.mystery).toBeGreaterThan(0);
  });

  it('learns genre combinations, franchises and eras from the library', () => {
    const profile = buildTasteProfile(
      [
        series(1, 'A', {
          genre: { genres: ['Crime', 'Drama'] },
          rating: { Crime: 10, Drama: 10 },
          eps: episodes(5, 5, undefined, '2019-03-01'),
        }),
        series(2, 'B', {
          genre: { genres: ['Crime', 'Drama'] },
          rating: { Crime: 9, Drama: 9 },
          eps: episodes(5, 5, undefined, '2021-03-01'),
        }),
        series(3, 'C', { genre: { genres: ['Comedy'] }, rating: { Comedy: 4 } }),
      ],
      [movie(20, 'Held', { genre: { genres: ['Action'] }, rating: { Action: 10 } })],
      'series',
      NOW,
      { tagMap: { series: { '1': ['krimi'], '2': ['true-crime'] }, movies: { '20': ['marvel'] } } }
    );
    expect(profile.pairs['crime+drama']).toBeGreaterThan(0.3);
    expect(profile.tags.marvel).toBeGreaterThan(0);
    expect(profile.tags['true-crime']).toBeGreaterThan(0);
    expect(profile.tags.krimi).toBeUndefined();
    expect(profile.eras.new).toBeGreaterThan(0);
  });

  it('marks never-watched niches as unlikely once the library is big enough', () => {
    const many = Array.from({ length: 16 }, (_, i) =>
      series(i + 1, `D${i + 1}`, { rating: { Drama: 8 }, eps: episodes(3, 3) })
    );
    const tagMap = { series: {}, movies: {} };
    const profile = buildTasteProfile(many, [], 'series', NOW, { tagMap });
    expect(profile.tags.anime).toBe(-0.3);
    expect(profile.genres.reality).toBe(-0.3);
    expect(profile.eras.old).toBe(-0.2);

    const small = buildTasteProfile(many.slice(0, 5), [], 'series', NOW, { tagMap });
    expect(small.tags.anime).toBeUndefined();
    expect(small.genres.reality).toBeUndefined();
  });
});

describe('buildTasteProfile extra signals', () => {
  it('reads episode ratings when the series itself is unrated', () => {
    const rated = (id: number, value: number) => {
      const eps = episodes(4, 4).map((episode) => ({ ...episode, userRating: value }));
      return series(id, `E${id}`, { eps });
    };
    const profile = buildTasteProfile(
      [series(1, 'Anker', { rating: { Drama: 7 } }), rated(2, 10), rated(3, 3)],
      [],
      'series',
      NOW
    );
    expect(profile.seeds.map((s) => s.id)).toContain(2);
    expect(profile.seeds.map((s) => s.id)).not.toContain(3);
  });

  it('counts shelf copies, binges and the explicit watchlist as stronger signals', () => {
    const binged = episodes(12, 12).map((episode, i) => ({
      ...episode,
      firstWatchedAt: `2025-0${1 + Math.floor(i / 6)}-10T20:00:00Z`,
    }));
    const profile = buildTasteProfile(
      [
        series(1, 'Normal', { eps: episodes(12, 12) }),
        series(2, 'Binge', { eps: binged }),
        series(3, 'Regal', { eps: episodes(12, 12), ownedAt: '2025-01-01' }),
        series(4, 'Merkliste', { watchlist: true }),
        series(5, 'Nur da'),
      ],
      [],
      'series',
      NOW
    );
    const weight = (id: number) => profile.seeds.find((s) => s.id === id)?.weight ?? 0;
    expect(weight(2)).toBeGreaterThan(weight(1));
    expect(weight(3)).toBeGreaterThan(weight(2));
    expect(weight(4)).toBeGreaterThan(weight(5));
  });

  it('learns languages and treats unfamiliar ones as less likely', () => {
    const many = Array.from({ length: 12 }, (_, i) =>
      series(i + 1, `K${i + 1}`, { original_language: 'ko', rating: { Drama: 9 } })
    );
    const profile = buildTasteProfile(many, [], 'series', NOW);
    expect(profile.languages.ko).toBeGreaterThan(0);
    expect(profile.languages['*']).toBe(-0.2);
    const ranked = rankCandidates(
      [
        { seed: seed(1, 1), results: [candidate(10, { original_language: 'tr' })] },
        { seed: seed(2, 1), results: [candidate(11, { original_language: 'ko' })] },
        { seed: seed(3, 1), results: [candidate(12, { original_language: 'en' })] },
      ],
      options({ profile })
    );
    expect(ranked.map((r) => r.item.id)).toEqual([11, 12, 10]);
  });

  it('lets blocked titles and manga reading shape the profile', () => {
    const many = Array.from({ length: 16 }, (_, i) =>
      series(i + 1, `D${i + 1}`, { rating: { Drama: 8 } })
    );
    const tagMap = { series: {}, movies: {} };
    const plain = buildTasteProfile(many, [], 'series', NOW, { tagMap });
    const reader = buildTasteProfile(many, [], 'series', NOW, { tagMap, readsManga: true });
    expect(plain.tags.anime).toBeLessThan(0);
    expect(reader.tags.anime).toBeGreaterThan(0);

    const blocked = buildTasteProfile(many, [], 'series', NOW, {
      tagMap,
      disliked: [
        { id: 90, media: 'series', genres: ['Horror'] },
        { id: 91, media: 'series', genres: ['Horror'] },
      ],
    });
    expect(blocked.genres.horror).toBeLessThan(0);
  });
});

describe('scoring extras', () => {
  it('lifts friend picks, own subscriptions and community favourites', () => {
    const lists = [
      { seed: seed(1, 1), results: [candidate(10)] },
      { seed: seed(2, 1), results: [candidate(11)] },
    ];
    const friend = rankCandidates(lists, options({ friendPicks: new Map([[11, 'Mia']]) }));
    expect(friend[0].item.id).toBe(11);
    expect(friend[0].friend).toBe('Mia');

    const community = rankCandidates(
      lists,
      options({ communityRating: (id) => (id === 11 ? 9.6 : undefined) })
    );
    expect(community[0].item.id).toBe(11);

    const plain = rankBrowse([candidate(10), candidate(11)], new Map(), {
      media: 'series',
      profile: profileOf(),
      available: new Set([11]),
    });
    expect(plain.map((r) => r.item.id)).toEqual([11, 10]);
  });
});

describe('seedBatches', () => {
  it('fills the first batch with the strongest and the most recent seeds', () => {
    const seeds = Array.from({ length: 30 }, (_, i) => seed(i + 1, 1 - i * 0.01, i === 29 ? 5 : 0));
    const batches = seedBatches(seeds);
    expect(batches.map((batch) => batch.length)).toEqual([17, 13]);
    expect(batches[0].slice(0, 16).map((s) => s.id)).toEqual(
      Array.from({ length: 16 }, (_, i) => i + 1)
    );
    expect(batches[0][16].id).toBe(30);
  });

  it('returns nothing without seeds', () => {
    expect(seedBatches([])).toEqual([]);
  });
});

describe('topGenrePairs', () => {
  it('turns the favourite combinations into TMDB genre ids per media type', () => {
    const profile = { pairs: { 'crime+drama': 0.6, 'action+adventure': 0.5, 'comedy+drama': 0.1 } };
    expect(topGenrePairs(profile, 'series')).toEqual([[18, 80]]);
    expect(topGenrePairs(profile, 'movie')).toEqual([
      [18, 80],
      [12, 28],
    ]);
  });
});

describe('rankCandidates', () => {
  it('ranks a title backed by several favourites first and names them', () => {
    const ranked = rankCandidates(
      [
        { seed: seed(1, 1), results: [candidate(10), candidate(11)] },
        { seed: seed(2, 0.8), results: [candidate(11), candidate(12)] },
      ],
      options()
    );
    expect(ranked[0].item.id).toBe(11);
    expect(ranked[0].reasons).toEqual(['S1', 'S2']);
    expect(ranked.map((r) => r.item.id).sort()).toEqual([10, 11, 12]);
  });

  it('drops excluded, poster-less and badly rated titles', () => {
    const ranked = rankCandidates(
      [
        {
          seed: seed(1, 1),
          results: [
            candidate(10),
            candidate(11, { poster_path: null }),
            candidate(12, { vote_average: 4.2, vote_count: 900 }),
            candidate(13),
          ],
        },
      ],
      options({ exclude: (id) => id === 10 })
    );
    expect(ranked.map((r) => r.item.id)).toEqual([13]);
  });

  it('pushes disliked genres down', () => {
    const ranked = rankCandidates(
      [
        { seed: seed(1, 1), results: [candidate(10, { genre_ids: [27] })] },
        { seed: seed(2, 1), results: [candidate(11, { genre_ids: [18] })] },
      ],
      options({ profile: profileOf({ genres: { horror: -0.8, drama: 0.5 } }) })
    );
    expect(ranked.map((r) => r.item.id)).toEqual([11, 10]);
  });

  it('prefers the favourite genre combination over the single genres', () => {
    const ranked = rankCandidates(
      [
        { seed: seed(1, 1), results: [candidate(10, { genre_ids: [80, 35] })] },
        { seed: seed(2, 1), results: [candidate(11, { genre_ids: [80, 18] })] },
      ],
      options({
        profile: profileOf({
          genres: { crime: 0.4, comedy: 0.4, drama: 0.4 },
          pairs: { 'crime+drama': 0.8, 'comedy+crime': -0.4 },
        }),
      })
    );
    expect(ranked.map((r) => r.item.id)).toEqual([11, 10]);
  });

  it('keeps anime away from people who never watch it and up for fans', () => {
    const lists = [
      { seed: seed(1, 1), results: [candidate(10, { genre_ids: [16], original_language: 'ja' })] },
      { seed: seed(2, 1), results: [candidate(11, { genre_ids: [16] })] },
    ];
    const never = rankCandidates(lists, options({ profile: profileOf({ tags: { anime: -0.3 } }) }));
    expect(never.map((r) => r.item.id)).toEqual([11, 10]);
    const fan = rankCandidates(lists, options({ profile: profileOf({ tags: { anime: 0.7 } }) }));
    expect(fan.map((r) => r.item.id)).toEqual([10, 11]);
  });

  it('lifts a franchise the library loves', () => {
    const ranked = rankCandidates(
      [
        { seed: seed(1, 1), results: [candidate(10)] },
        { seed: seed(2, 1), results: [candidate(11)] },
      ],
      options({
        profile: profileOf({ tags: { marvel: 0.8 } }),
        interestTags: { '11': ['marvel'] },
      })
    );
    expect(ranked[0].item.id).toBe(11);
  });

  it('lifts titles that match the declared interests', () => {
    const tagged = rankCandidates(
      [
        { seed: seed(1, 1), results: [candidate(10)] },
        { seed: seed(2, 1), results: [candidate(11)] },
      ],
      options({ interests: ['marvel'], interestTags: { '11': ['marvel'] } })
    );
    expect(tagged[0].item.id).toBe(11);
  });

  it('spreads results across seeds instead of clustering one favourite', () => {
    const ranked = rankCandidates(
      [
        { seed: seed(1, 1), results: [candidate(10), candidate(11), candidate(12)] },
        { seed: seed(2, 0.97), results: [candidate(20)] },
      ],
      options()
    );
    expect(ranked.findIndex((r) => r.item.id === 20)).toBeLessThan(2);
  });

  it('is stable for the same day', () => {
    const lists = [
      { seed: seed(1, 1), results: [candidate(10), candidate(11), candidate(12)] },
      { seed: seed(2, 0.9), results: [candidate(13), candidate(11)] },
    ];
    const order = (daySeed: number) =>
      rankCandidates(lists, options({ daySeed })).map((r) => r.item.id);
    expect(order(20781)).toEqual(order(20781));
  });
});

describe('rankBrowse', () => {
  const browseOptions = (profile: RankOptions['profile']) => ({
    media: 'series' as const,
    profile,
  });

  it('keeps the given order when nothing tells the titles apart', () => {
    const items = [candidate(3), candidate(1), candidate(2)];
    const ranked = rankBrowse(items, new Map(), browseOptions(profileOf()));
    expect(ranked.map((r) => r.item.id)).toEqual([3, 1, 2]);
  });

  it('sorts a page by fit, names the favourites behind it and the genres that match', () => {
    const index = buildSupportIndex([{ seed: seed(1, 1), results: [candidate(12)] }]);
    const ranked = rankBrowse(
      [
        candidate(10, { genre_ids: [27] }),
        candidate(11, { genre_ids: [80, 18] }),
        candidate(12, { genre_ids: [18] }),
      ],
      index,
      browseOptions(profileOf({ genres: { horror: -0.6, crime: 0.6, drama: 0.5 } }))
    );
    expect(ranked.map((r) => r.item.id)).toEqual([12, 11, 10]);
    expect(ranked[0].reasons).toEqual(['S1']);
    expect(ranked[1].reasons).toEqual([]);
    expect(ranked[1].genreIds).toEqual([80, 18]);
    expect(ranked[2].genreIds).toEqual([]);
    expect(ranked[0].match).toBeGreaterThan(ranked[1].match);
    expect(ranked[1].match).toBeGreaterThan(ranked[2].match);
  });
});

describe('matchPercent', () => {
  it('maps the score onto 1–99 %', () => {
    expect(matchPercent(0)).toBe(50);
    expect(matchPercent(0.5)).toBe(80);
    expect(matchPercent(2)).toBe(99);
    expect(matchPercent(-2)).toBe(1);
  });
});
