/**
 * Hint the browser to start fetching an image before the React route that
 * actually renders it has loaded. Called from listing-card onClick / hover
 * handlers so that by the time the Detail page mounts a few hundred ms later,
 * the larger poster is already in the HTTP cache.
 *
 * No-op for empty/placeholder URLs. Idempotent — calling for the same URL
 * twice just dedupes via the browser's image cache and the `seen` set.
 */
const seen = new Set<string>();

export const preloadImage = (url: string | undefined | null): void => {
  if (!url) return;
  if (url.startsWith('data:')) return; // already inline
  if (seen.has(url)) return;
  seen.add(url);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.fetchPriority = 'low';
    img.src = url;
  } catch {
    // ignore — preload is best-effort
  }
};
