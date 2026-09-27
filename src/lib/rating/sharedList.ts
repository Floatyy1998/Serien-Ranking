import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { calculateOverallRating } from './rating';
import { folderItemKey, type RatingFolder } from './ratingFolders';

export const SHARED_LIST_ORIGIN = 'https://tv-rank.de';
export const SHARED_LIST_MAX_ITEMS = 500;

export interface SharedListItem {
  /** s = Serie, m = Film */
  k: 's' | 'm';
  id: number;
  t: string;
  p?: string;
  r?: number;
  y?: string;
}

export interface SharedList {
  id: string;
  owner: string;
  ownerName: string;
  name: string;
  updatedAt: number;
  items: SharedListItem[];
}

export type SharedListPayload = Omit<SharedList, 'id'>;

export const sharedListUrl = (id: string): string => `${SHARED_LIST_ORIGIN}/list/${id}`;

export const sharedListItemPath = (item: SharedListItem): string =>
  `/${item.k === 'm' ? 'movie' : 'series'}/${item.id}`;

const posterPath = (item: Series | Movie): string | undefined => {
  const raw = typeof item.poster === 'object' ? item.poster?.poster : item.poster;
  return typeof raw === 'string' && raw.length > 0 && raw.length <= 300 ? raw : undefined;
};

const ratingOf = (item: Series | Movie): number | undefined => {
  const r = parseFloat(calculateOverallRating(item));
  return Number.isFinite(r) && r > 0 ? Math.min(10, Math.round(r * 10) / 10) : undefined;
};

const yearOf = (date: string | undefined): string | undefined => {
  const y = (date || '').slice(0, 4);
  return /^\d{4}$/.test(y) ? y : undefined;
};

export function buildSharedListPayload(
  folder: RatingFolder,
  seriesList: Series[],
  movieList: Movie[],
  owner: { uid: string; name: string }
): SharedListPayload {
  const items: SharedListItem[] = [];
  const push = (k: 's' | 'm', entry: Series | Movie, date: string | undefined) => {
    const title = (entry.title || (entry as Series).name || '').slice(0, 200);
    if (!title) return;
    const item: SharedListItem = { k, id: entry.id, t: title };
    const p = posterPath(entry);
    const r = ratingOf(entry);
    const y = yearOf(date);
    if (p) item.p = p;
    if (r !== undefined) item.r = r;
    if (y) item.y = y;
    items.push(item);
  };
  for (const s of seriesList) {
    if (folder.items.has(folderItemKey('series', s.id))) {
      push('s', s, s.first_air_date || s.release_date);
    }
  }
  for (const m of movieList) {
    if (folder.items.has(folderItemKey('movie', m.id))) push('m', m, m.release_date);
  }
  items.sort((a, b) => (b.r ?? 0) - (a.r ?? 0) || a.t.localeCompare(b.t));

  return {
    owner: owner.uid,
    ownerName: owner.name.slice(0, 100),
    name: folder.name,
    updatedAt: Date.now(),
    items: items.slice(0, SHARED_LIST_MAX_ITEMS),
  };
}

/** Vergleichsschlüssel ohne Zeitstempel — entscheidet, ob neu geschrieben werden muss. */
export const sharedListSignature = (payload: SharedListPayload): string =>
  JSON.stringify([payload.ownerName, payload.name, payload.items]);

export function expandSharedList(id: string, raw: unknown): SharedList | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Partial<SharedListPayload> & { items?: unknown };
  if (typeof value.owner !== 'string' || typeof value.name !== 'string') return null;
  const rawItems = Array.isArray(value.items)
    ? value.items
    : value.items && typeof value.items === 'object'
      ? Object.values(value.items)
      : [];
  const items = (rawItems as Partial<SharedListItem>[]).filter(
    (i): i is SharedListItem =>
      !!i &&
      typeof i === 'object' &&
      (i.k === 's' || i.k === 'm') &&
      typeof i.id === 'number' &&
      typeof i.t === 'string'
  );
  return {
    id,
    owner: value.owner,
    ownerName: typeof value.ownerName === 'string' ? value.ownerName : '',
    name: value.name,
    updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : 0,
    items,
  };
}
