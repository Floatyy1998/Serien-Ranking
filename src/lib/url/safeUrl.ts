/** URL-Prüfung für nutzergelieferte Links (Ticket-Screenshots, Chat-Bilder). */

const STORAGE_PREFIX = 'https://firebasestorage.googleapis.com/v0/b/serien-ranking';

/** true nur für http(s) — hält javascript:, data: und blob: aus href/src heraus. */
export const isSafeHttpUrl = (url: unknown): url is string => {
  if (typeof url !== 'string' || !url) return false;
  try {
    const protocol = new URL(url, 'https://tv-rank.de').protocol;
    return protocol === 'https:' || protocol === 'http:';
  } catch {
    return false;
  }
};

/** Nur Uploads aus dem eigenen Storage-Bucket; alles andere fällt auf null. */
export const storageUrlOrNull = (url: unknown): string | null =>
  typeof url === 'string' && url.startsWith(STORAGE_PREFIX) ? url : null;
