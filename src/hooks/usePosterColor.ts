/**
 * Generates a vibrant, unique accent color from a poster URL.
 *
 * Real pixel extraction is impossible because:
 * - TMDB CDN images are cross-origin
 * - The Service Worker caches them as opaque responses
 * - Both canvas getImageData() and fetch().blob() fail
 *
 * Instead we derive a deterministic color from the poster filename hash.
 * Same poster → same color, different posters → visually distinct colors.
 */

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const val = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * val)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function usePosterColor(posterUrl: string | undefined, fallback: string): string {
  if (!posterUrl) return fallback;

  const filename = posterUrl.split('/').pop() || posterUrl;
  const hash = hashString(filename);

  const hue = hash % 360;
  const saturation = 65 + (hash % 16);
  const lightness = 55 + ((hash >> 4) % 11);

  return hslToHex(hue, saturation, lightness);
}
