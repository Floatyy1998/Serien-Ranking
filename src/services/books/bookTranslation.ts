import { backendFetch } from '../api/backendApi';

const PREFIX = 'bookDesc:';
const INDEX_KEY = 'bookDescIndex';
const MAX_ENTRIES = 60;
const MAX_CHARS = 2400;

function readCached(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

/** Kleiner LRU-Cache in localStorage — Beschreibungen sind ein paar KB, mehr als 60 braucht keiner. */
function writeCached(key: string, text: string) {
  try {
    const index: string[] = JSON.parse(localStorage.getItem(INDEX_KEY) || '[]');
    const next = [key, ...index.filter((k) => k !== key)];
    for (const old of next.slice(MAX_ENTRIES)) localStorage.removeItem(PREFIX + old);
    localStorage.setItem(INDEX_KEY, JSON.stringify(next.slice(0, MAX_ENTRIES)));
    localStorage.setItem(PREFIX + key, text);
  } catch {
    /* Cache ist optional */
  }
}

const inflight = new Map<string, Promise<string | null>>();

/** Absätze ohne Zeilenumbruch, höchstens drei pro Anfrage — Umbrüche im Text brechen die JSON-Antwort der KI. */
export function paragraphBatches(text: string): string[][] {
  const paragraphs = text
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const batches: string[][] = [];
  let current: string[] = [];
  let length = 0;
  for (const p of paragraphs) {
    if (current.length === 3 || (current.length && length + p.length > 3500)) {
      batches.push(current);
      current = [];
      length = 0;
    }
    current.push(p);
    length += p.length;
  }
  if (current.length) batches.push(current);
  return batches;
}

/** Übersetzt eine Buchbeschreibung über die Backend-KI (gleicher Endpunkt wie Kommentare). */
export function translateBookDescription(
  bookKey: string,
  text: string,
  targetLang: string
): Promise<string | null> {
  const key = `${targetLang}:${bookKey}`;
  const cached = readCached(key);
  if (cached) return Promise.resolve(cached);
  let pending = inflight.get(key);
  if (!pending) {
    pending = (async () => {
      const source =
        text.length > MAX_CHARS ? `${text.slice(0, MAX_CHARS).replace(/\s+\S*$/, '')} …` : text;
      const out: string[] = [];
      for (const batch of paragraphBatches(source)) {
        const res = await backendFetch('/ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: batch, targetLang }),
          signal: AbortSignal.timeout(25_000),
        });
        if (!res.ok) return null;
        const data = (await res.json()) as { translations?: unknown };
        if (!Array.isArray(data.translations) || data.translations.length !== batch.length) {
          return null;
        }
        out.push(...data.translations.map((p) => String(p ?? '').trim()));
      }
      const translated = out.filter(Boolean).join('\n\n');
      if (!translated) return null;
      writeCached(key, translated);
      return translated;
    })()
      .catch(() => null)
      .finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return pending;
}
