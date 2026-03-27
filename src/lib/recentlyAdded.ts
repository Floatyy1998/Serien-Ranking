const STORAGE_KEY = 'recentlyAddedItems';
const MAX_ITEMS = 10;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface RecentlyAddedItem {
  id: number;
  title: string;
  poster?: string;
  type: 'series' | 'movie';
  addedAt: string;
}

export function trackRecentlyAdded(item: Omit<RecentlyAddedItem, 'addedAt'>): void {
  const items = getRecentlyAdded();
  const filtered = items.filter((i) => !(i.id === item.id && i.type === item.type));
  filtered.unshift({ ...item, addedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
}

export function getRecentlyAdded(): RecentlyAddedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const items: RecentlyAddedItem[] = JSON.parse(raw);
    const cutoff = Date.now() - MAX_AGE_MS;
    return items.filter((i) => new Date(i.addedAt).getTime() > cutoff);
  } catch {
    return [];
  }
}
