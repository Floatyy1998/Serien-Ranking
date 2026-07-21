/**
 * Kommentar-Übersetzung: Backend-KI (/ai/translate) mit geteiltem RTDB-Cache —
 * jeder Kommentar wird pro Zielsprache genau einmal übersetzt, danach lesen
 * alle Clients den Cache unter `<nodePath>/translations/<lang>` mit.
 * Firebase/Backend werden dynamisch importiert (testfreundlich, lazy).
 */

export interface TranslatedComment {
  text: string;
  title?: string;
  sourceLang: string | null;
}

interface TranslateOptions {
  /** Voller RTDB-Pfad des Kommentar-Knotens (Discussion oder Reply). */
  nodePath: string;
  /** Anzeigetext (ohne Bild-URLs). */
  content: string;
  title?: string;
  targetLang: string;
  /** true, wenn am Kommentar bereits ein `lang`-Feld hängt (kein Backfill nötig). */
  hasLangField: boolean;
}

const inflight = new Map<string, Promise<TranslatedComment | null>>();

export function translateComment(options: TranslateOptions): Promise<TranslatedComment | null> {
  const key = `${options.nodePath}|${options.targetLang}`;
  const running = inflight.get(key);
  if (running) return running;
  const promise = doTranslate(options).finally(() => inflight.delete(key));
  inflight.set(key, promise);
  return promise;
}

async function doTranslate({
  nodePath,
  content,
  title,
  targetLang,
  hasLangField,
}: TranslateOptions): Promise<TranslatedComment | null> {
  const texts = title ? [title, content] : [content];
  try {
    const { backendFetch } = await import('../backendApi');
    const response = await backendFetch('/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts, targetLang }),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as {
      sourceLang?: string | null;
      translations?: unknown;
    };
    const translations = data?.translations;
    if (!Array.isArray(translations) || translations.length !== texts.length) return null;

    const sourceLang = typeof data.sourceLang === 'string' ? data.sourceLang.slice(0, 2) : null;
    const result: TranslatedComment = title
      ? { title: String(translations[0]), text: String(translations[1]), sourceLang }
      : { text: String(translations[0]), sourceLang };

    void cacheTranslation({ nodePath, targetLang, hasLangField, sourceLang, result });
    return result;
  } catch {
    return null;
  }
}

// Geteilter Cache + lang-Backfill, beides best-effort (Rules: nur Erst-Schreiber)
async function cacheTranslation({
  nodePath,
  targetLang,
  hasLangField,
  sourceLang,
  result,
}: {
  nodePath: string;
  targetLang: string;
  hasLangField: boolean;
  sourceLang: string | null;
  result: TranslatedComment;
}): Promise<void> {
  try {
    const { dbRef } = await import('../db/ref');
    if (sourceLang && sourceLang !== targetLang) {
      const entry: Record<string, string> = { text: result.text };
      if (result.title) entry.title = result.title;
      await dbRef(`${nodePath}/translations/${targetLang}`)
        .set(entry)
        .catch(() => {});
    }
    if (sourceLang && !hasLangField) {
      await dbRef(`${nodePath}/lang`)
        .set(sourceLang)
        .catch(() => {});
    }
  } catch {
    // best-effort
  }
}

const AUTO_TRANSLATE_KEY = 'autoTranslateComments';

export const isAutoTranslateEnabled = (): boolean => {
  try {
    return localStorage.getItem(AUTO_TRANSLATE_KEY) === '1';
  } catch {
    return false;
  }
};

export const setAutoTranslateEnabled = (enabled: boolean): void => {
  try {
    if (enabled) localStorage.setItem(AUTO_TRANSLATE_KEY, '1');
    else localStorage.removeItem(AUTO_TRANSLATE_KEY);
  } catch {
    // quota-fragil — dann bleibt es aus
  }
};
