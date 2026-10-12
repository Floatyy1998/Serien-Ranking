/** Kleiner LRU-Cache in localStorage je Namensraum — Buchdaten ändern sich selten, Abfragen sind langsam. */

interface Entry<T> {
  at: number;
  value: T;
}

const memory = new Map<string, Entry<unknown>>();

const storageKey = (ns: string, key: string) => `bk:${ns}:${key}`;
const indexKey = (ns: string) => `bk:${ns}:#`;

export function cacheGet<T>(ns: string, key: string, maxAgeMs: number): T | undefined {
  const full = storageKey(ns, key);
  const hit = memory.get(full) as Entry<T> | undefined;
  if (hit && Date.now() - hit.at < maxAgeMs) return hit.value;
  try {
    const raw = localStorage.getItem(full);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as Entry<T>;
    if (Date.now() - entry.at >= maxAgeMs) return undefined;
    memory.set(full, entry);
    return entry.value;
  } catch {
    return undefined;
  }
}

export function cacheSet<T>(ns: string, key: string, value: T, maxEntries = 80): void {
  const full = storageKey(ns, key);
  const entry: Entry<T> = { at: Date.now(), value };
  memory.set(full, entry);
  try {
    const index: string[] = JSON.parse(localStorage.getItem(indexKey(ns)) || '[]');
    const next = [key, ...index.filter((k) => k !== key)];
    for (const old of next.slice(maxEntries)) localStorage.removeItem(storageKey(ns, old));
    localStorage.setItem(indexKey(ns), JSON.stringify(next.slice(0, maxEntries)));
    localStorage.setItem(full, JSON.stringify(entry));
  } catch {
    /* Speicher voll oder gesperrt — dann eben nur im Arbeitsspeicher */
  }
}

/** Wert aus dem Cache oder per load holen und ablegen; gleichzeitige Aufrufe teilen sich eine Anfrage. */
const inflight = new Map<string, Promise<unknown>>();

export function cached<T>(
  ns: string,
  key: string,
  maxAgeMs: number,
  load: () => Promise<T>,
  maxEntries?: number
): Promise<T> {
  const hit = cacheGet<T>(ns, key, maxAgeMs);
  if (hit !== undefined) return Promise.resolve(hit);
  const full = storageKey(ns, key);
  let pending = inflight.get(full) as Promise<T> | undefined;
  if (!pending) {
    pending = load()
      .then((value) => {
        cacheSet(ns, key, value, maxEntries);
        return value;
      })
      .finally(() => inflight.delete(full));
    inflight.set(full, pending);
  }
  return pending;
}
