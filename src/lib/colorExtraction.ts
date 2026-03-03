const cache = new Map<string, { primary: string; secondary: string; isDark: boolean }>();

/**
 * Extracts dominant colors from a poster image using a canvas.
 * Returns cached results for repeated calls with the same URL.
 *
 * Uses a small sample size (1x1 pixel resize + edge sampling) for performance.
 */
export async function extractDominantColor(
  imageUrl: string
): Promise<{ primary: string; secondary: string; isDark: boolean }> {
  const cached = cache.get(imageUrl);
  if (cached) return cached;

  return new Promise((resolve) => {
    const fallback = { primary: '#00fed7', secondary: '#8b5cf6', isDark: true };

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timeout = setTimeout(() => resolve(fallback), 3000);

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(fallback);
          return;
        }

        // Sample at small size for performance
        const sampleSize = 8;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

        // Find the most vibrant pixel (highest saturation)
        let bestR = 0,
          bestG = 0,
          bestB = 0,
          bestSaturation = 0;
        let secondR = 0,
          secondG = 0,
          secondB = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const brightness = max / 255;

          // Skip very dark or very light pixels
          if (brightness < 0.1 || brightness > 0.95) continue;

          if (saturation > bestSaturation) {
            // Push previous best to secondary
            secondR = bestR;
            secondG = bestG;
            secondB = bestB;

            bestR = r;
            bestG = g;
            bestB = b;
            bestSaturation = saturation;
          }
        }

        // Average pixel for dark/light detection
        let totalR = 0,
          totalG = 0,
          totalB = 0;
        const pixelCount = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          totalR += data[i];
          totalG += data[i + 1];
          totalB += data[i + 2];
        }
        const avgLuminance =
          (0.299 * (totalR / pixelCount) +
            0.587 * (totalG / pixelCount) +
            0.114 * (totalB / pixelCount)) /
          255;

        const result = {
          primary: `#${((1 << 24) | (bestR << 16) | (bestG << 8) | bestB).toString(16).slice(1)}`,
          secondary: `#${((1 << 24) | (secondR << 16) | (secondG << 8) | secondB).toString(16).slice(1)}`,
          isDark: avgLuminance < 0.5,
        };

        cache.set(imageUrl, result);
        resolve(result);
      } catch {
        resolve(fallback);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      resolve(fallback);
    };

    img.src = imageUrl;
  });
}

/** Clear the color extraction cache */
export function clearColorCache(): void {
  cache.clear();
}
