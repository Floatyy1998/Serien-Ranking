import type { UnifiedNotification } from '../hooks/useUnifiedNotifications';

export type NotificationBucket = 'new' | 'today' | 'yesterday' | 'week' | 'older';

/** Ein Eintrag im Sheet — Meldungen desselben Threads stehen zusammen. */
export interface NotificationEntry {
  key: string;
  /** Neueste Meldung des Threads. */
  item: UnifiedNotification;
  items: UnifiedNotification[];
  unread: boolean;
}

export interface NotificationGroup {
  bucket: NotificationBucket;
  entries: NotificationEntry[];
}

const DAY_MS = 86_400_000;
const BUCKET_ORDER: NotificationBucket[] = ['new', 'today', 'yesterday', 'week', 'older'];

/** Offene Anfragen und Empfehlungen bleiben oben, bis man sie beantwortet. */
const ALWAYS_NEW: ReadonlySet<UnifiedNotification['kind']> = new Set([
  'request',
  'recommendation',
  'chat',
]);

export function collapseThreads(items: UnifiedNotification[]): NotificationEntry[] {
  const entries: NotificationEntry[] = [];
  const byKey = new Map<string, NotificationEntry>();
  for (const item of [...items].sort((a, b) => b.timestamp - a.timestamp)) {
    const existing = item.groupKey ? byKey.get(item.groupKey) : undefined;
    if (existing) {
      existing.items.push(item);
      if (!item.read) existing.unread = true;
      continue;
    }
    const entry: NotificationEntry = {
      key: item.groupKey ?? item.id,
      item,
      items: [item],
      unread: !item.read,
    };
    if (item.groupKey) byKey.set(item.groupKey, entry);
    entries.push(entry);
  }
  return entries;
}

export function bucketOf(entry: NotificationEntry, now: number): NotificationBucket {
  if (entry.unread || ALWAYS_NEW.has(entry.item.kind)) return 'new';
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const start = today.getTime();
  const ts = entry.item.timestamp;
  if (ts >= start) return 'today';
  if (ts >= start - DAY_MS) return 'yesterday';
  if (ts >= start - 6 * DAY_MS) return 'week';
  return 'older';
}

/** „Neu" zuerst, danach Heute/Gestern/Diese Woche/Früher — Gelesenes höchstens `readLimit`. */
export function groupByTime(
  entries: NotificationEntry[],
  now: number,
  readLimit = Infinity
): NotificationGroup[] {
  const byBucket = new Map<NotificationBucket, NotificationEntry[]>();
  let read = 0;
  for (const entry of entries) {
    const bucket = bucketOf(entry, now);
    if (bucket !== 'new' && read++ >= readLimit) continue;
    const list = byBucket.get(bucket);
    if (list) list.push(entry);
    else byBucket.set(bucket, [entry]);
  }
  return BUCKET_ORDER.flatMap((bucket) => {
    const list = byBucket.get(bucket);
    return list ? [{ bucket, entries: list }] : [];
  });
}
