import { useEffect, useState } from 'react';

/**
 * Extracts the dominant vibrant color from a poster image via canvas sampling.
 * Results are cached globally so each URL is only processed once.
 */

const colorCache = new Map<string, string>();

function extractDominantColor(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const size = 32; // small sample for speed
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return '#6366f1';

  ctx.drawImage(img, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  // Bucket colors by hue (skip very dark/light/desaturated pixels)
  const hueBuckets = new Map<
    number,
    { r: number; g: number; b: number; sat: number; count: number }
  >();

  for (let i = 0; i < data.length; i += 16) {
    // sample every 4th pixel
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const lum = (max + min) / 2;
    const delta = max - min;

    // Skip too dark, too light, or too gray
    if (lum < 30 || lum > 225 || delta < 25) continue;

    const sat = delta / (255 - Math.abs(2 * lum - 255));

    let hue = 0;
    if (delta > 0) {
      if (max === r) hue = ((g - b) / delta + 6) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
      hue = Math.round(hue * 60);
    }

    // Bucket by 20-degree increments
    const bucket = Math.round(hue / 20) * 20;
    const existing = hueBuckets.get(bucket);
    if (existing) {
      // Weight by saturation — prefer more vibrant
      const weight = sat;
      existing.r += r * weight;
      existing.g += g * weight;
      existing.b += b * weight;
      existing.sat += weight;
      existing.count++;
    } else {
      hueBuckets.set(bucket, { r: r * sat, g: g * sat, b: b * sat, sat, count: 1 });
    }
  }

  if (hueBuckets.size === 0) return '#6366f1';

  // Pick the bucket with the highest weighted count (saturation × frequency)
  let best = { r: 99, g: 102, b: 241, score: 0 };
  for (const [, bucket] of hueBuckets) {
    const score = bucket.count * (bucket.sat / bucket.count);
    if (score > best.score) {
      const w = bucket.sat;
      best = {
        r: Math.round(bucket.r / w),
        g: Math.round(bucket.g / w),
        b: Math.round(bucket.b / w),
        score,
      };
    }
  }

  // Boost saturation slightly for better visual impact
  const max = Math.max(best.r, best.g, best.b);
  const min = Math.min(best.r, best.g, best.b);
  const mid = (max + min) / 2;
  const boost = 1.3;
  const r2 = Math.min(255, Math.round(mid + (best.r - mid) * boost));
  const g2 = Math.min(255, Math.round(mid + (best.g - mid) * boost));
  const b2 = Math.min(255, Math.round(mid + (best.b - mid) * boost));

  return `#${r2.toString(16).padStart(2, '0')}${g2.toString(16).padStart(2, '0')}${b2.toString(16).padStart(2, '0')}`;
}

export function usePosterColor(posterUrl: string | undefined, fallback: string): string {
  const [color, setColor] = useState<string>(() => {
    if (posterUrl && colorCache.has(posterUrl)) return colorCache.get(posterUrl)!;
    return fallback;
  });

  useEffect(() => {
    if (!posterUrl) return;

    if (colorCache.has(posterUrl)) {
      setColor(colorCache.get(posterUrl)!);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const extracted = extractDominantColor(img);
        colorCache.set(posterUrl, extracted);
        setColor(extracted);
      } catch {
        // Canvas tainted by CORS — use fallback
        colorCache.set(posterUrl, fallback);
      }
    };
    img.onerror = () => {
      colorCache.set(posterUrl, fallback);
    };
    img.src = posterUrl;
  }, [posterUrl, fallback]);

  return color;
}
