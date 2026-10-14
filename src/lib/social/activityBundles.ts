import type { BookSearchResult } from '../../types/Book';
import type { FriendActivity } from '../../types/Friend';

export type ActivityMedia = 'series' | 'movie' | 'manga' | 'book';
export type ActivityAction = 'added' | 'watchlist' | 'rated' | 'finished';

export interface ActivityInfo {
  media: ActivityMedia;
  action: ActivityAction;
  id?: string | number;
}

const TYPE_INFO: Partial<Record<FriendActivity['type'], Omit<ActivityInfo, 'id'>>> = {
  series_added: { media: 'series', action: 'added' },
  movie_added: { media: 'movie', action: 'added' },
  series_added_to_watchlist: { media: 'series', action: 'watchlist' },
  movie_added_to_watchlist: { media: 'movie', action: 'watchlist' },
  rating_updated: { media: 'series', action: 'rated' },
  series_rated: { media: 'series', action: 'rated' },
  rating_updated_movie: { media: 'movie', action: 'rated' },
  movie_rated: { media: 'movie', action: 'rated' },
  manga_added: { media: 'manga', action: 'added' },
  manga_rated: { media: 'manga', action: 'rated' },
  manga_finished: { media: 'manga', action: 'finished' },
  book_added: { media: 'book', action: 'added' },
  book_rated: { media: 'book', action: 'rated' },
  book_finished: { media: 'book', action: 'finished' },
};

/** Was eine Aktivität bedeutet — null für Gesehen-, Lösch- und Entfernen-Einträge. */
export function describeActivity(activity: FriendActivity): ActivityInfo | null {
  const info = TYPE_INFO[activity.type];
  if (!info) return null;
  return { ...info, id: activity.tmdbId ?? activity.itemId };
}

export function activityPath(media: ActivityMedia, id: string | number | undefined): string | null {
  if (id === undefined || id === '') return null;
  if (media === 'book') return `/books/${encodeURIComponent(String(id))}`;
  if (media === 'manga') return `/manga/${id}`;
  return media === 'movie' ? `/movie/${id}` : `/series/${id}`;
}

/** Vorschau für ein Buch, das man selbst nicht hat — die Detailseite braucht sie als Navigations-State. */
export function bookPreviewFromActivity(activity: FriendActivity): BookSearchResult | null {
  if (activity.itemType !== 'book' || activity.itemId === undefined) return null;
  const ref = activity.bookRef ?? {};
  return {
    id: String(activity.itemId),
    title: activity.itemTitle,
    authors: activity.author ? [activity.author] : [],
    cover: activity.poster,
    googleId: ref.googleId,
    olWorkId: ref.olWorkId,
    isbn13: ref.isbn13,
    source: (ref.source ?? (ref.googleId ? 'google' : 'openlibrary')) as BookSearchResult['source'],
  };
}

const ACTION_RANK: Record<ActivityAction, number> = {
  rated: 3,
  finished: 2,
  watchlist: 1,
  added: 0,
};

export interface BundledTitle {
  key: string;
  media: ActivityMedia;
  id?: string | number;
  title: string;
  poster?: string;
  /** Wichtigste Aktion zuerst. */
  actions: ActivityAction[];
  rating?: number;
  latest: number;
  activity: FriendActivity;
}

export interface ActivityBundle {
  id: string;
  userId: string;
  userName: string;
  latest: number;
  earliest: number;
  titles: BundledTitle[];
}

export const BUNDLE_GAP_MS = 3 * 60 * 60 * 1000;

/**
 * Fasst die Aktivitäten einer Person zu Sitzungen zusammen (Lücke ≤ gapMs);
 * mehrere Aktionen zum selben Titel werden dabei ein Eintrag.
 */
export function bundleActivities(
  activities: FriendActivity[],
  gapMs: number = BUNDLE_GAP_MS
): ActivityBundle[] {
  const sorted = activities
    .map((activity) => ({ activity, info: describeActivity(activity) }))
    .filter((e): e is { activity: FriendActivity; info: ActivityInfo } => e.info !== null)
    .sort((a, b) => b.activity.timestamp - a.activity.timestamp);

  const bundles: ActivityBundle[] = [];
  const open = new Map<string, { bundle: ActivityBundle; byKey: Map<string, BundledTitle> }>();

  for (const { activity, info } of sorted) {
    let current = open.get(activity.userId);
    if (!current || current.bundle.earliest - activity.timestamp > gapMs) {
      current = {
        bundle: {
          id: `bundle_${activity.id}`,
          userId: activity.userId,
          userName: activity.userName,
          latest: activity.timestamp,
          earliest: activity.timestamp,
          titles: [],
        },
        byKey: new Map(),
      };
      bundles.push(current.bundle);
      open.set(activity.userId, current);
    }
    const { bundle, byKey } = current;
    bundle.earliest = activity.timestamp;

    const key = `${info.media}:${info.id ?? activity.itemTitle}`;
    let title = byKey.get(key);
    if (!title) {
      title = {
        key,
        media: info.media,
        id: info.id,
        title: activity.itemTitle,
        actions: [],
        latest: activity.timestamp,
        activity,
      };
      byKey.set(key, title);
      bundle.titles.push(title);
    }
    if (!title.actions.includes(info.action)) title.actions.push(info.action);
    if (info.action === 'rated' && title.rating === undefined && activity.rating) {
      title.rating = activity.rating;
    }
    title.poster ??= activity.posterPath || activity.poster || undefined;
  }

  for (const bundle of bundles) {
    for (const title of bundle.titles) {
      title.actions.sort((a, b) => ACTION_RANK[b] - ACTION_RANK[a]);
    }
  }
  return bundles;
}

/** Titel je wichtigster Aktion — Grundlage für „hat 11 Titel hinzugefügt · 2 bewertet". */
export function countByAction(bundle: ActivityBundle): [ActivityAction, number][] {
  const counts = new Map<ActivityAction, number>();
  for (const title of bundle.titles) {
    const action = title.actions[0];
    counts.set(action, (counts.get(action) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || ACTION_RANK[b[0]] - ACTION_RANK[a[0]]);
}
