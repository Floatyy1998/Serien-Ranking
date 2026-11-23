import type { InterestTagMap } from '../../lib/interests/interests';
import { normalizeProviderName } from '../../lib/provider/providerName';
import type {
  DislikedTitle,
  SeedResults,
  TasteItem,
  TasteMedia,
  TasteSeed,
} from '../../lib/taste/tasteEngine';
import { tmdbFetch } from '../api/tmdbClient';
import { idbGetAny, idbSetVersioned } from '../catalog/catalogIDB';
import {
  fetchStaticCatalogMovies,
  fetchStaticCatalogSeries,
  fetchStaticCommunityRatings,
  fetchStaticInterestTags,
} from '../catalog/staticCatalog';
import { tmdbLanguage } from '../i18n';
import { fetchInterests } from '../profile/interestsService';
import { fetchRecFeedback } from '../rating/recFeedbackService';
import { fetchFriendPicks, type FriendPicks } from './friendPicks';

export interface TasteSignals {
  blocked: Set<number>;
  interests: string[];
  tagMap: InterestTagMap | null;
  friendPicks: Map<number, string>;
  community: Record<string, { a: number }>;
  available: Set<number>;
  disliked: DislikedTitle[];
}

type SeedCache = Record<string, { ts: number; results: TasteItem[] }>;

const CACHE_VERSION = 1;
const CACHE_TTL_MS = 3 * 86_400_000;
const CACHE_MAX_SEEDS = 200;
const CONCURRENCY = 8;
const CACHE_ENABLED = import.meta.env.MODE !== 'test';

const cacheKey = (media: TasteMedia): string => `taste-recs:${media}:${tmdbLanguage()}`;

const slim = (item: TasteItem): TasteItem => ({
  id: item.id,
  title: item.title,
  name: item.name,
  poster_path: item.poster_path ?? null,
  backdrop_path: item.backdrop_path,
  overview: item.overview,
  vote_average: item.vote_average ?? 0,
  vote_count: item.vote_count,
  genre_ids: item.genre_ids,
  release_date: item.release_date,
  first_air_date: item.first_air_date,
  media_type: item.media_type,
  popularity: item.popularity,
  original_language: item.original_language,
  original_title: item.original_title,
  original_name: item.original_name,
});

export async function loadTasteSignals(
  uid: string | undefined,
  media: TasteMedia,
  ownProviders: Set<string> = new Set()
): Promise<TasteSignals> {
  const quiet = <T>(promise: Promise<T>, fallback: T): Promise<T> => promise.catch(() => fallback);
  const [feedback, interests, tagMap, friends, community, seriesCatalog, movieCatalog] =
    await Promise.all([
      uid ? quiet(fetchRecFeedback(uid), []) : [],
      uid ? quiet(fetchInterests(uid), []) : [],
      quiet(fetchStaticInterestTags(), null),
      quiet<FriendPicks>(fetchFriendPicks(uid, media), { picks: new Map(), declined: new Set() }),
      quiet(fetchStaticCommunityRatings(), null),
      quiet(fetchStaticCatalogSeries(), null),
      quiet(fetchStaticCatalogMovies(), null),
    ]);

  const blocked = new Set<number>(friends.declined);
  const disliked: DislikedTitle[] = [];
  for (const entry of feedback) {
    if (entry.type === media) blocked.add(entry.id);
    const hit =
      entry.type === 'series'
        ? seriesCatalog?.[String(entry.id)]
        : movieCatalog?.[String(entry.id)];
    if (!hit) continue;
    disliked.push({
      id: entry.id,
      media: entry.type,
      genres: Array.isArray(hit.genres) ? hit.genres : [],
      language: (hit as { originalLanguage?: string }).originalLanguage,
    });
  }

  const available = new Set<number>();
  const catalog = media === 'series' ? seriesCatalog : movieCatalog;
  if (catalog && ownProviders.size > 0) {
    for (const [id, entry] of Object.entries(catalog)) {
      const providers = Array.isArray(entry?.providers) ? entry.providers : [];
      if (
        providers.some((p: { name?: string }) =>
          ownProviders.has(normalizeProviderName(p?.name ?? '') ?? '')
        )
      ) {
        available.add(Number(id));
      }
    }
  }

  return {
    blocked,
    interests,
    tagMap,
    friendPicks: friends.picks,
    community: (media === 'series' ? community?.series : community?.movies) ?? {},
    available,
    disliked,
  };
}

export const interestTagsFor = (
  signals: TasteSignals,
  media: TasteMedia
): Record<string, string[]> =>
  (media === 'series' ? signals.tagMap?.series : signals.tagMap?.movies) ?? {};

export async function fetchSeedResults(
  media: TasteMedia,
  seeds: TasteSeed[]
): Promise<SeedResults<TasteItem>[]> {
  const now = Date.now();
  const stored = CACHE_ENABLED ? await idbGetAny<SeedCache>(cacheKey(media)) : null;
  const cache: SeedCache = stored?.v === CACHE_VERSION && stored.data ? { ...stored.data } : {};
  const tmdbType = media === 'series' ? 'tv' : 'movie';
  const out: SeedResults<TasteItem>[] = [];
  let changed = false;

  for (let i = 0; i < seeds.length; i += CONCURRENCY) {
    const chunk = await Promise.all(
      seeds.slice(i, i + CONCURRENCY).map(async (seed) => {
        const hit = cache[String(seed.id)];
        if (hit && now - hit.ts < CACHE_TTL_MS) return { seed, results: hit.results };
        try {
          const data = await tmdbFetch<{ results?: TasteItem[] }>(
            `${tmdbType}/${seed.id}/recommendations`
          );
          const results = (data.results ?? []).map(slim);
          cache[String(seed.id)] = { ts: now, results };
          changed = true;
          return { seed, results };
        } catch {
          return { seed, results: hit?.results ?? [] };
        }
      })
    );
    out.push(...chunk);
  }

  if (CACHE_ENABLED && changed) {
    const fresh = Object.entries(cache)
      .filter(([, entry]) => now - entry.ts < CACHE_TTL_MS)
      .sort(([, a], [, b]) => b.ts - a.ts)
      .slice(0, CACHE_MAX_SEEDS);
    void idbSetVersioned(cacheKey(media), CACHE_VERSION, Object.fromEntries(fresh));
  }
  return out;
}

export async function fetchGenrePicks(
  media: TasteMedia,
  pairs: [number, number][]
): Promise<SeedResults<TasteItem>[]> {
  const tmdbType = media === 'series' ? 'tv' : 'movie';
  return Promise.all(
    pairs.map(async ([first, second], position) => {
      const seed: TasteSeed = {
        id: -(first * 100_000 + second),
        title: '',
        weight: 0.55 - position * 0.05,
        lastActive: 0,
      };
      try {
        const data = await tmdbFetch<{ results?: TasteItem[] }>(`discover/${tmdbType}`, {
          with_genres: `${first},${second}`,
          sort_by: 'vote_average.desc',
          'vote_count.gte': media === 'series' ? 300 : 800,
        });
        return { seed, results: (data.results ?? []).map(slim) };
      } catch {
        return { seed, results: [] };
      }
    })
  );
}
