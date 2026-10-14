export interface ScanRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CameraProblem = 'denied' | 'missing' | 'busy' | 'failed';

/** Ein Buch-Strichcode ist ein EAN-13 mit Präfix 978/979 — die Ziffern sind die ISBN-13. */
export function isbnFromBarcode(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (!/^97[89]\d{10}$/.test(digits)) return null;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3);
  return (10 - (sum % 10)) % 10 === Number(digits[12]) ? digits : null;
}

export function formatIsbn13(isbn: string): string {
  return `${isbn.slice(0, 3)} ${isbn.slice(3, 12)} ${isbn.slice(12)}`;
}

export function expandRect(rect: ScanRect, factor: number): ScanRect {
  const dx = rect.width * factor;
  const dy = rect.height * factor;
  return {
    x: rect.x - dx,
    y: rect.y - dy,
    width: rect.width + dx * 2,
    height: rect.height + dy * 2,
  };
}

/** Der Teil des Videobilds, der bei object-fit: cover unter `target` (in Box-Koordinaten) liegt. */
export function coverSourceRect(
  video: { width: number; height: number },
  box: { width: number; height: number },
  target: ScanRect
): ScanRect {
  const scale = Math.max(box.width / video.width, box.height / video.height);
  const offsetX = (box.width - video.width * scale) / 2;
  const offsetY = (box.height - video.height * scale) / 2;
  const x = Math.max(0, (target.x - offsetX) / scale);
  const y = Math.max(0, (target.y - offsetY) / scale);
  const right = Math.min(video.width, (target.x + target.width - offsetX) / scale);
  const bottom = Math.min(video.height, (target.y + target.height - offsetY) / scale);
  return { x, y, width: Math.max(0, right - x), height: Math.max(0, bottom - y) };
}

/** Erst wenn derselbe Code mehrmals kurz hintereinander gelesen wurde, zählt er. */
export function createReadConfirmer(needed = 2, windowMs = 1500) {
  let last = '';
  let count = 0;
  let at = 0;
  return (value: string, now: number): boolean => {
    count = value === last && now - at <= windowMs ? count + 1 : 1;
    last = value;
    at = now;
    return count >= needed;
  };
}

export function cameraProblemOf(error: unknown): CameraProblem {
  const name = (error as { name?: string } | null)?.name;
  if (name === 'NotAllowedError' || name === 'SecurityError' || name === 'PermissionDeniedError') {
    return 'denied';
  }
  if (
    name === 'NotFoundError' ||
    name === 'OverconstrainedError' ||
    name === 'DevicesNotFoundError'
  ) {
    return 'missing';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError' || name === 'AbortError') {
    return 'busy';
  }
  return 'failed';
}
