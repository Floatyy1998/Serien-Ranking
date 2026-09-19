/**
 * Bilder aus der Zwischenablage.
 *
 * Kopierte GIFs landen als Standbild in `clipboardData.files` — die echte
 * GIF-URL steckt im mitkopierten HTML. Deshalb erst das Original holen und
 * nur bei CORS-Fehlern auf das Standbild zurückfallen.
 */

import { MAX_IMAGE_BYTES } from '../../lib/image/imageCompress';

export interface ClipboardImage {
  file: File | null;
  gifUrl: string | null;
}

export function extractClipboardImage(data: DataTransfer | null): ClipboardImage {
  const html = data?.getData('text/html') || '';
  const gifUrl = /<img[^>]+src="([^"]+\.gif[^"]*)"/i.exec(html)?.[1] || null;
  const files = data?.files;
  const file =
    files && files.length > 0
      ? Array.from(files).find((f) => f.type.startsWith('image/')) || null
      : null;
  return { file, gifUrl };
}

export async function resolveClipboardImage(
  file: File | null,
  gifUrl: string | null
): Promise<File | null> {
  if (gifUrl) {
    try {
      const res = await fetch(gifUrl.replace(/&amp;/g, '&'));
      const blob = await res.blob();
      if (blob.type === 'image/gif' && blob.size <= MAX_IMAGE_BYTES) {
        return new File([blob], 'clipboard.gif', { type: 'image/gif' });
      }
    } catch {
      /* CORS o. ä. — dann eben das Standbild */
    }
  }
  return file;
}
