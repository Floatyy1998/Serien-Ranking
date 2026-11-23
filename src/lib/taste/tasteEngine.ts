import { calculateSeriesMetrics, getSeriesLastWatchedAt } from '../episode/seriesMetrics';
import { INTERESTS, type InterestTagMap } from '../interests/interests';
import { isMovieWatched, overallRatingValue } from '../rating/rating';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';

export type TasteMedia = 'series' | 'movie';

export interface TasteItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string;
  vote_average: number;
  vote_count?: number;
  genre_ids?: number[];
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
  popularity?: number;
  original_language?: string;
  original_title?: string;
  original_name?: string;
}

export interface TasteSeed {
  id: number;
  title: string;
  weight: number;
  lastActive: number;
}

export interface TasteProfile {
  seeds: TasteSeed[];
  genres: Record<string, number>;
  pairs: Record<string, number>;
  tags: Record<string, number>;
  eras: Record<string, number>;
  languages: Record<string, number>;
}

export interface DislikedTitle {
  id: number;
  media: TasteMedia;
  genres: string[];
  language?: string;
}

export interface TasteExtras {
  tagMap?: InterestTagMap | null;
  readsManga?: boolean;
  disliked?: DislikedTitle[];
}

export interface SeedResults<T> {
  seed: TasteSeed;
  results: T[];
}

export interface SeedHit {
  seed: TasteSeed;
  value: number;
}

export type SupportIndex = Map<number, SeedHit[]>;

export interface ScoredItem<T> {
  item: T;
  score: number;
  match: number;
  seedId: number;
  reasons: string[];
  genreIds: number[];
  friend?: string;
}

export interface ScoreOptions {
  media: TasteMedia;
  profile: Pick<TasteProfile, 'genres' | 'pairs' | 'tags' | 'eras' | 'languages'>;
  interests?: string[];
  interestTags?: Record<string, string[]>;
  communityRating?: (id: number) => number | undefined;
  friendPicks?: Map<number, string>;
  available?: Set<number>;
  daySeed?: number;
}

export interface RankOptions extends ScoreOptions {
  exclude: (id: number) => boolean;
}

interface Scorable {
  id: number;
  genre_ids?: number[];
  vote_average?: number;
  vote_count?: number;
  original_language?: string;
  poster_path?: string | null;
  release_date?: string;
  first_air_date?: string;
}

const DAY_MS = 86_400_000;
const PLANNED_AFFINITY = 0.12;
const WATCHLIST_AFFINITY = 0.18;
const SEED_MIN_AFFINITY = 0.2;
const MIN_STRONG_SEEDS = 5;
const MIN_LIBRARY_FOR_GAPS = 15;
const MIN_LANGUAGE_TITLES = 10;
export const OTHER_LANGUAGES = '*';

const GENRE_ID_KEYS: Record<number, string[]> = {
  28: ['action'],
  12: ['adventure'],
  16: ['animation'],
  35: ['comedy'],
  80: ['crime'],
  99: ['documentary'],
  18: ['drama'],
  10751: ['family'],
  14: ['fantasy'],
  36: ['history'],
  27: ['horror'],
  10402: ['music'],
  9648: ['mystery'],
  10749: ['romance'],
  878: ['scifi'],
  10770: ['tvmovie'],
  53: ['thriller'],
  10752: ['war'],
  37: ['western'],
  10759: ['action', 'adventure'],
  10762: ['kids'],
  10763: ['news'],
  10764: ['reality'],
  10765: ['scifi', 'fantasy'],
  10766: ['soap'],
  10767: ['talk'],
  10768: ['war', 'politics'],
};

const TV_GENRE_IDS: Record<string, number> = {
  action: 10759,
  adventure: 10759,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  kids: 10762,
  mystery: 9648,
  news: 10763,
  reality: 10764,
  scifi: 10765,
  fantasy: 10765,
  soap: 10766,
  talk: 10767,
  war: 10768,
  politics: 10768,
  western: 37,
};

const MOVIE_GENRE_IDS: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  scifi: 878,
  tvmovie: 10770,
  thriller: 53,
  war: 10752,
  western: 37,
};

export const tmdbGenreIdOf = (key: string, media: TasteMedia): number | undefined =>
  (media === 'series' ? TV_GENRE_IDS : MOVIE_GENRE_IDS)[key];

const GENRE_ALIASES: Record<string, string> = {
  action: 'action',
  adventure: 'adventure',
  abenteuer: 'adventure',
  animation: 'animation',
  comedy: 'comedy',
  komödie: 'comedy',
  crime: 'crime',
  krimi: 'crime',
  documentary: 'documentary',
  dokumentation: 'documentary',
  dokumentarfilm: 'documentary',
  drama: 'drama',
  family: 'family',
  familie: 'family',
  fantasy: 'fantasy',
  history: 'history',
  historie: 'history',
  horror: 'horror',
  music: 'music',
  musik: 'music',
  mystery: 'mystery',
  romance: 'romance',
  romantik: 'romance',
  liebesfilm: 'romance',
  'science fiction': 'scifi',
  'science-fiction': 'scifi',
  'sci-fi': 'scifi',
  'tv movie': 'tvmovie',
  'tv-film': 'tvmovie',
  thriller: 'thriller',
  war: 'war',
  krieg: 'war',
  kriegsfilm: 'war',
  western: 'western',
  kids: 'kids',
  news: 'news',
  reality: 'reality',
  soap: 'soap',
  talk: 'talk',
  politics: 'politics',
  politik: 'politics',
};

export const INTEREST_GENRE_KEYS: Record<string, string[]> = {
  animation: ['animation'],
  action: ['action'],
  krieg: ['war'],
  historie: ['history'],
  krimi: ['crime'],
  thriller: ['thriller'],
  mystery: ['mystery'],
  horror: ['horror'],
  'sci-fi': ['scifi'],
  fantasy: ['fantasy'],
  comedy: ['comedy'],
  romance: ['romance'],
  doku: ['documentary'],
  reality: ['reality'],
  western: ['western'],
};

export const SPECIFIC_TAGS = new Set<string>([
  ...INTERESTS.filter((interest) => interest.group === 'franchise').map((interest) => interest.id),
  'anime',
  'k-drama',
  'superhelden',
  'true-crime',
  'zombies',
  'sitcom',
  'sport',
]);

const NICHE_GENRES = ['kids', 'reality', 'soap', 'talk', 'news', 'documentary'];
const ERAS = ['new', 'mid', 'old'];

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export function genreKeysOfLabel(label: string): string[] {
  if (typeof label !== 'string') return [];
  return label
    .toLowerCase()
    .split(/\s*(?:&|\sund\s|\sand\s)\s*/)
    .map((part) => GENRE_ALIASES[part.trim()])
    .filter((key): key is string => !!key);
}

export function genreKeysOfIds(ids: number[] | undefined): string[] {
  const keys = new Set<string>();
  for (const id of ids ?? []) for (const key of GENRE_ID_KEYS[id] ?? []) keys.add(key);
  return [...keys];
}

const pairKeysOf = (keys: string[]): string[] => {
  const sorted = [...keys].sort();
  const pairs: string[] = [];
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) pairs.push(`${sorted[i]}+${sorted[j]}`);
  }
  return pairs;
};

const eraOfYear = (year: number): string | null => {
  if (!Number.isFinite(year) || year < 1900) return null;
  if (year >= 2016) return 'new';
  if (year >= 2000) return 'mid';
  return 'old';
};

const yearOfDate = (value: string | undefined | null): number =>
  value ? Number(String(value).slice(0, 4)) : NaN;

function specificTagsOf(
  id: number,
  keys: string[],
  language: string | undefined,
  media: TasteMedia,
  tags: Record<string, string[]> | undefined
): string[] {
  const out = new Set<string>();
  for (const tag of tags?.[String(id)] ?? []) if (SPECIFIC_TAGS.has(tag)) out.add(tag);
  if (language === 'ja' && keys.includes('animation')) out.add('anime');
  if (media === 'series' && language === 'ko' && keys.includes('drama')) out.add('k-drama');
  return [...out];
}

const ratingAffinity = (rating: number, pivot: number): number =>
  rating >= pivot ? (rating - pivot) / (10 - pivot) : (rating - pivot) / (pivot - 1);

const toMs = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value > 0 ? value : 0;
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const labelsOf = (item: Series | Movie): string[] => {
  const wrapped = item.genre?.genres as unknown;
  const list =
    wrapped && typeof wrapped === 'object'
      ? Object.values(wrapped as Record<string, unknown>).filter(
          (label): label is string => typeof label === 'string'
        )
      : [];
  if (list.length > 0) return list;
  return (item.genres ?? []).map((genre) => genre.name);
};

const genreKeysOfTitle = (item: Series | Movie): string[] => [
  ...new Set(labelsOf(item).flatMap(genreKeysOfLabel)),
];

const yearOfSeries = (series: Series): number => {
  const direct = yearOfDate(series.first_air_date || series.release_date);
  if (Number.isFinite(direct)) return direct;
  const seasons = Array.isArray(series.seasons) ? series.seasons : [];
  for (const season of seasons) {
    const episodes = Array.isArray(season?.episodes) ? season.episodes : [];
    for (const episode of episodes) {
      const year = yearOfDate(episode?.air_date || episode?.airDate || episode?.airstamp);
      if (Number.isFinite(year)) return year;
    }
  }
  return NaN;
};

interface TitleSignal {
  affinity: number;
  lastActive: number;
  planned: boolean;
}

function episodeHabits(series: Series): { ratingMean: number; binged: boolean } {
  let ratingSum = 0;
  let ratingCount = 0;
  let watched = 0;
  const days = new Set<string>();
  const seasons = Array.isArray(series.seasons) ? series.seasons : [];
  for (const season of seasons) {
    const episodes = Array.isArray(season?.episodes) ? season.episodes : [];
    for (const episode of episodes) {
      if (!episode) continue;
      if (typeof episode.userRating === 'number' && episode.userRating > 0) {
        ratingSum += episode.userRating;
        ratingCount++;
      }
      if (episode.firstWatchedAt) {
        watched++;
        days.add(String(episode.firstWatchedAt).slice(0, 10));
      }
    }
  }
  return {
    ratingMean: ratingCount >= 2 ? ratingSum / ratingCount : 0,
    binged: watched >= 6 && days.size >= 2 && watched / days.size >= 3,
  };
}

function seriesSignal(series: Series, pivot: number, now: number): TitleSignal {
  const rating = overallRatingValue(series);
  const { totalAiredEpisodes, watchedEpisodes } = calculateSeriesMetrics(series);
  const lastActive = watchedEpisodes > 0 ? toMs(getSeriesLastWatchedAt(series)) : 0;
  const habits = episodeHabits(series);
  let affinity: number;
  let planned = false;

  if (rating > 0) {
    affinity = ratingAffinity(rating, pivot);
    if (habits.ratingMean > 0) {
      affinity = 0.75 * affinity + 0.25 * ratingAffinity(habits.ratingMean, pivot);
    }
  } else if (habits.ratingMean > 0) {
    affinity = ratingAffinity(habits.ratingMean, pivot);
  } else if (watchedEpisodes === 0) {
    affinity = series.watchlist ? WATCHLIST_AFFINITY : PLANNED_AFFINITY;
    planned = true;
  } else {
    const progress = totalAiredEpisodes > 0 ? watchedEpisodes / totalAiredEpisodes : 0;
    const idleDays = lastActive > 0 ? (now - lastActive) / DAY_MS : null;
    if (progress >= 0.95) affinity = 0.45;
    else if (progress >= 0.5) affinity = 0.35;
    else if (idleDays === null) affinity = 0.1;
    else if (idleDays <= 90) affinity = 0.25;
    else if (idleDays > 180) affinity = -0.2;
    else affinity = 0.1;
  }

  if (series.rewatch?.active || (series.rewatch?.round ?? 0) > 0) {
    affinity = Math.min(1, Math.max(affinity, 0.5) + 0.2);
  }
  if (affinity > 0 && habits.binged) affinity = Math.min(1, affinity + 0.08);
  if (series.ownedAt) affinity = Math.min(1, Math.max(affinity, 0.3) + 0.15);
  return { affinity, lastActive, planned };
}

function movieSignal(movie: Movie, pivot: number): TitleSignal {
  const rating = overallRatingValue(movie);
  const lastActive = toMs(movie.watchedAt) || toMs(movie.ratedAt) || toMs(movie.addedAt);
  let affinity: number;
  let planned = false;
  if (rating > 0) affinity = ratingAffinity(rating, pivot);
  else if (isMovieWatched(movie)) affinity = 0.3;
  else {
    affinity = movie.watchlist ? WATCHLIST_AFFINITY : PLANNED_AFFINITY;
    planned = true;
  }
  if ((movie.watchHistory?.length ?? 0) >= 2) {
    affinity = Math.min(1, Math.max(affinity, 0.5) + 0.2);
  }
  if (movie.ownedAt) affinity = Math.min(1, Math.max(affinity, 0.3) + 0.15);
  return { affinity, lastActive, planned };
}

const recencyBoost = (lastActive: number, now: number): number => {
  if (lastActive <= 0) return 1;
  const days = (now - lastActive) / DAY_MS;
  if (days <= 60) return 1.2;
  if (days <= 365) return 1.1;
  return 1;
};

const currentTasteWeight = (lastActive: number, now: number): number => {
  if (lastActive <= 0) return 1;
  const days = (now - lastActive) / DAY_MS;
  if (days <= 90) return 1.5;
  if (days <= 365) return 1.2;
  return 1;
};

class Tally {
  private sums = new Map<string, number>();
  private counts = new Map<string, number>();

  add(key: string, value: number, weight: number): void {
    this.sums.set(key, (this.sums.get(key) ?? 0) + value * weight);
    this.counts.set(key, (this.counts.get(key) ?? 0) + weight);
  }

  settle(total: number, shrink: number, fullShare: number, minCount = 0): Record<string, number> {
    const out: Record<string, number> = {};
    for (const [key, count] of this.counts) {
      if (count < minCount) continue;
      const mean = (this.sums.get(key) ?? 0) / (count + shrink);
      const share = total > 0 ? count / total : 0;
      const volume = mean > -0.1 ? 0.3 * Math.min(1, share / fullShare) : 0;
      out[key] = clamp(0.7 * mean + volume, -1, 1);
    }
    return out;
  }
}

export function buildTasteProfile(
  series: Series[],
  movies: Movie[],
  media: TasteMedia,
  now: number,
  extras: TasteExtras = {}
): TasteProfile {
  const { tagMap } = extras;
  const rated = [...series, ...movies].map(overallRatingValue).filter((rating) => rating > 0);
  const mean = rated.length > 0 ? rated.reduce((sum, r) => sum + r, 0) / rated.length : 7;
  const pivot = clamp(mean - 0.5, 5, 7.5);

  const genreTally = new Tally();
  const pairTally = new Tally();
  const tagTally = new Tally();
  const eraTally = new Tally();
  const languageTally = new Tally();
  let total = 0;
  let languageTotal = 0;
  let tagsKnown = !!tagMap;
  const strong: TasteSeed[] = [];
  const positive: TasteSeed[] = [];

  const consume = (
    item: Series | Movie,
    signal: TitleSignal,
    itemMedia: TasteMedia,
    year: number
  ) => {
    const isTarget = itemMedia === media;
    const weight =
      (isTarget ? 1 : 0.5) *
      (signal.planned ? 0.3 : 1) *
      currentTasteWeight(signal.lastActive, now);
    const perGenre = new Map<string, number>();
    if (item.rating && typeof item.rating === 'object') {
      for (const [label, value] of Object.entries(item.rating)) {
        if (typeof value !== 'number' || value <= 0) continue;
        for (const key of genreKeysOfLabel(label)) perGenre.set(key, ratingAffinity(value, pivot));
      }
    }
    const keys = genreKeysOfTitle(item);
    if (keys.length > 0) total += weight;
    for (const key of keys) genreTally.add(key, perGenre.get(key) ?? signal.affinity, weight);
    for (const pair of pairKeysOf(keys)) pairTally.add(pair, signal.affinity, weight);

    const language = (item as { original_language?: string }).original_language || undefined;
    if (language) {
      tagsKnown = true;
      languageTotal += weight;
      languageTally.add(language, signal.affinity, weight);
    }
    const tags = specificTagsOf(
      item.id,
      keys,
      language,
      itemMedia,
      itemMedia === 'series' ? tagMap?.series : tagMap?.movies
    );
    for (const tag of tags) tagTally.add(tag, signal.affinity, weight);

    const era = eraOfYear(year);
    if (era) eraTally.add(era, signal.affinity, weight);

    if (!isTarget || signal.affinity <= 0) return;
    const seed: TasteSeed = {
      id: item.id,
      title: item.title || (item as Series).name || '',
      weight: signal.affinity * recencyBoost(signal.lastActive, now),
      lastActive: signal.lastActive,
    };
    positive.push(seed);
    if (signal.affinity >= SEED_MIN_AFFINITY) strong.push(seed);
  };

  for (const item of series) {
    if (!item || item.hidden) continue;
    consume(item, seriesSignal(item, pivot, now), 'series', yearOfSeries(item));
  }
  for (const item of movies) {
    if (!item) continue;
    consume(item, movieSignal(item, pivot), 'movie', yearOfDate(item.release_date));
  }

  for (const title of extras.disliked ?? []) {
    const keys = [...new Set(title.genres.flatMap(genreKeysOfLabel))];
    const weight = title.media === media ? 0.7 : 0.35;
    if (keys.length > 0) total += weight;
    for (const key of keys) genreTally.add(key, -0.6, weight);
    for (const pair of pairKeysOf(keys)) pairTally.add(pair, -0.6, weight);
    const tags = specificTagsOf(
      title.id,
      keys,
      title.language,
      title.media,
      title.media === 'series' ? tagMap?.series : tagMap?.movies
    );
    for (const tag of tags) tagTally.add(tag, -0.6, weight);
  }

  const genres = genreTally.settle(total, 4, 0.4);
  const pairs = pairTally.settle(total, 3, 0.2, 2);
  const tags = tagTally.settle(total, 2, 0.15);
  const eras = eraTally.settle(total, 4, 0.5);
  const languages = languageTally.settle(languageTotal, 3, 0.5);
  if (languageTotal >= MIN_LANGUAGE_TITLES) languages[OTHER_LANGUAGES] = -0.2;

  if (total >= MIN_LIBRARY_FOR_GAPS) {
    for (const key of NICHE_GENRES) if (genres[key] === undefined) genres[key] = -0.3;
    if (tagsKnown && tags.anime === undefined && !extras.readsManga) tags.anime = -0.3;
    if (Object.keys(eras).length > 0) {
      for (const era of ERAS) if (eras[era] === undefined) eras[era] = -0.2;
    }
  }

  if (extras.readsManga) tags.anime = Math.min(1, Math.max(tags.anime ?? 0.1, 0) + 0.1);

  const seeds = (strong.length >= MIN_STRONG_SEEDS ? strong : positive).sort(
    (a, b) => b.weight - a.weight || a.id - b.id
  );
  return { seeds, genres, pairs, tags, eras, languages };
}

export function seedBatches(seeds: TasteSeed[], size = 24, max = 96): TasteSeed[][] {
  const head = seeds.slice(0, Math.ceil((size * 2) / 3));
  const recent = seeds
    .slice(head.length)
    .filter((seed) => seed.lastActive > 0)
    .sort((a, b) => b.lastActive - a.lastActive)
    .slice(0, size - head.length);
  const first = [...head, ...recent];
  const taken = new Set(first.map((seed) => seed.id));
  const rest = seeds
    .filter((seed) => !taken.has(seed.id))
    .slice(0, Math.max(0, max - first.length));

  const batches = first.length > 0 ? [first] : [];
  for (let i = 0; i < rest.length; i += size) batches.push(rest.slice(i, i + size));
  return batches;
}

export function topGenrePairs(
  profile: Pick<TasteProfile, 'pairs'>,
  media: TasteMedia,
  limit = 3
): [number, number][] {
  const table = media === 'series' ? TV_GENRE_IDS : MOVIE_GENRE_IDS;
  const seen = new Set<string>();
  const out: [number, number][] = [];
  const sorted = Object.entries(profile.pairs).sort(
    ([a, av], [b, bv]) => bv - av || a.localeCompare(b)
  );
  for (const [pair, value] of sorted) {
    if (out.length >= limit || value <= 0.25) break;
    const [first, second] = pair.split('+').map((key) => table[key]);
    if (!first || !second || first === second) continue;
    const ids: [number, number] = first < second ? [first, second] : [second, first];
    const key = ids.join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ids);
  }
  return out;
}

function genreScore(keys: string[], profile: ScoreOptions['profile']): number {
  if (keys.length === 0) return 0;
  const values = keys.map((key) => profile.genres[key] ?? 0);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const worst = Math.min(...values);
  const singles = worst < -0.25 ? Math.min(avg, (avg + worst) / 2) : avg;
  const known = pairKeysOf(keys)
    .map((pair) => profile.pairs[pair])
    .filter((value): value is number => value !== undefined);
  if (known.length === 0) return singles;
  const pairAvg = known.reduce((sum, value) => sum + value, 0) / known.length;
  return 0.55 * singles + 0.45 * pairAvg;
}

function tagScore(tags: string[], profile: ScoreOptions['profile']): number {
  const values = tags
    .map((tag) => profile.tags[tag])
    .filter((value): value is number => value !== undefined);
  if (values.length === 0) return 0;
  const worst = Math.min(...values);
  return worst < -0.15 ? worst : Math.max(...values);
}

function qualityScore(voteAverage: number, voteCount: number, community?: number): number {
  const bayes = (voteCount * voteAverage + 300 * 6.8) / (voteCount + 300);
  const tmdb = clamp((bayes - 6.8) / 1.5, -0.6, 1);
  if (!community || community <= 0) return tmdb;
  return 0.5 * tmdb + 0.5 * clamp((community - 6.8) / 1.5, -0.6, 1);
}

function languageScore(language: string | undefined, profile: ScoreOptions['profile']): number {
  if (!language) return 0;
  const known = profile.languages[language];
  if (known !== undefined) return known;
  return language === 'en' ? 0 : (profile.languages[OTHER_LANGUAGES] ?? 0);
}

function interestBonus(item: Scorable, keys: string[], options: ScoreOptions): number {
  const wanted = options.interests ?? [];
  if (wanted.length === 0) return 0;
  const found = new Set(options.interestTags?.[String(item.id)] ?? []);
  for (const [interest, genreKeys] of Object.entries(INTEREST_GENRE_KEYS)) {
    if (genreKeys.some((key) => keys.includes(key))) found.add(interest);
  }
  if (keys.includes('animation') && item.original_language === 'ja') found.add('anime');
  if (options.media === 'series' && item.original_language === 'ko' && keys.includes('drama')) {
    found.add('k-drama');
  }
  const matches = wanted.filter((id) => found.has(id)).length;
  if (matches === 0) return 0;
  return Math.min(0.16, 0.1 + 0.06 * (matches - 1));
}

const dayJitter = (id: number, daySeed: number | undefined): number =>
  daySeed === undefined
    ? 0
    : ((Math.imul(id ^ daySeed, 2654435761) >>> 0) / 4294967296 - 0.5) * 0.04;

export const matchPercent = (score: number): number => clamp(Math.round(50 + 60 * score), 1, 99);

function likedGenreIds(item: Scorable, profile: ScoreOptions['profile']): number[] {
  return (item.genre_ids ?? [])
    .map((id) => {
      const keys = GENRE_ID_KEYS[id] ?? [];
      const value =
        keys.length > 0
          ? keys.reduce((sum, key) => sum + (profile.genres[key] ?? 0), 0) / keys.length
          : 0;
      return { id, value };
    })
    .filter((entry) => entry.value > 0.2)
    .sort((a, b) => b.value - a.value || a.id - b.id)
    .slice(0, 2)
    .map((entry) => entry.id);
}

export function buildSupportIndex<T extends { id: number }>(lists: SeedResults<T>[]): SupportIndex {
  const index: SupportIndex = new Map();
  for (const { seed, results } of lists) {
    results.forEach((item, rank) => {
      if (!item || typeof item.id !== 'number') return;
      const hits = index.get(item.id) ?? [];
      if (hits.some((hit) => hit.seed.id === seed.id)) return;
      hits.push({ seed, value: seed.weight / (1 + rank / 12) });
      index.set(item.id, hits);
    });
  }
  for (const hits of index.values()) {
    hits.sort((a, b) => b.value - a.value || a.seed.id - b.seed.id);
  }
  return index;
}

export function scoreItem<T extends Scorable>(
  item: T,
  hits: SeedHit[],
  options: ScoreOptions
): ScoredItem<T> {
  const keys = genreKeysOfIds(item.genre_ids);
  const tags = specificTagsOf(
    item.id,
    keys,
    item.original_language,
    options.media,
    options.interestTags
  );
  const support =
    hits.length > 0 ? 1 - Math.exp(-hits.reduce((sum, hit) => sum + hit.value, 0) / 0.9) : 0;
  const tag = tagScore(tags, options.profile);
  const language = languageScore(item.original_language, options.profile);
  const era = eraOfYear(yearOfDate(item.first_air_date || item.release_date));
  const friend = options.friendPicks?.get(item.id);
  const score =
    0.42 * support +
    0.22 * genreScore(keys, options.profile) +
    (tag >= 0 ? 0.12 : 0.35) * tag +
    (language >= 0 ? 0.06 : 0.2) * language +
    0.05 * (era ? (options.profile.eras[era] ?? 0) : 0) +
    0.16 *
      qualityScore(
        item.vote_average ?? 0,
        item.vote_count ?? 0,
        options.communityRating?.(item.id)
      ) +
    interestBonus(item, keys, options) +
    (friend !== undefined ? 0.2 : 0) +
    (options.available?.has(item.id) ? 0.04 : 0) +
    dayJitter(item.id, options.daySeed);
  return {
    item,
    score,
    match: matchPercent(score),
    seedId: hits[0]?.seed.id ?? 0,
    reasons: hits
      .map((hit) => hit.seed.title)
      .filter(Boolean)
      .slice(0, 2),
    genreIds: likedGenreIds(item, options.profile),
    ...(friend ? { friend } : {}),
  };
}

function diversify<T>(ranked: ScoredItem<T>[]): ScoredItem<T>[] {
  const rest = [...ranked];
  const used = new Map<number, number>();
  const out: ScoredItem<T>[] = [];
  while (rest.length > 0) {
    let best = 0;
    let bestScore = -Infinity;
    for (let i = 0; i < rest.length; i++) {
      const penalty = Math.min(0.125, 0.025 * (used.get(rest[i].seedId) ?? 0));
      const score = rest[i].score - penalty;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    const [picked] = rest.splice(best, 1);
    used.set(picked.seedId, (used.get(picked.seedId) ?? 0) + 1);
    out.push(picked);
  }
  return out;
}

export function rankCandidates<T extends Scorable>(
  lists: SeedResults<T>[],
  options: RankOptions
): ScoredItem<T>[] {
  const index = buildSupportIndex(lists);
  const items = new Map<number, T>();
  for (const { results } of lists) {
    for (const item of results) {
      if (!item || typeof item.id !== 'number' || !item.poster_path) continue;
      if (items.has(item.id) || options.exclude(item.id)) continue;
      const voteAverage = item.vote_average ?? 0;
      if (voteAverage > 0 && voteAverage < 5 && (item.vote_count ?? 0) >= 50) continue;
      items.set(item.id, item);
    }
  }

  const ranked = [...items.values()].map((item) =>
    scoreItem(item, index.get(item.id) ?? [], options)
  );
  ranked.sort((a, b) => b.score - a.score || a.item.id - b.item.id);
  return diversify(ranked);
}

export function rankBrowse<T extends Scorable>(
  items: T[],
  index: SupportIndex,
  options: ScoreOptions
): ScoredItem<T>[] {
  return items
    .map((item, position) => ({
      position,
      scored: scoreItem(item, index.get(item.id) ?? [], options),
    }))
    .sort((a, b) => b.scored.score - a.scored.score || a.position - b.position)
    .map((entry) => entry.scored);
}
