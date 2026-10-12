/** ISBN-10/13 → ISBN-13 ohne Bindestriche, sonst undefined. */
export function toIsbn13(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const clean = raw.replace(/[^0-9Xx]/g, '').toUpperCase();
  if (clean.length === 13 && /^\d{13}$/.test(clean)) return clean;
  if (clean.length !== 10 || !/^\d{9}[\dX]$/.test(clean)) return undefined;
  const core = `978${clean.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(core[i]) * (i % 2 === 0 ? 1 : 3);
  return `${core}${(10 - (sum % 10)) % 10}`;
}

export function pickIsbn13(
  candidates: (string | undefined | null)[] | undefined
): string | undefined {
  if (!candidates) return undefined;
  const all = candidates.map(toIsbn13).filter((v): v is string => !!v);
  return all.find((v) => v.startsWith('9783')) ?? all[0];
}

export function looksLikeIsbn(query: string): boolean {
  const clean = query.replace(/[\s-]/g, '');
  return /^(\d{9}[\dXx]|\d{13})$/.test(clean);
}

/** Vergleichsschlüssel für „dieses Buch hast du schon" über Quellen und Ausgaben hinweg. */
export function bookMatchKey(title: string, authors: string[] | undefined): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\(.*?\)|\[.*?\]/g, '')
    .split(/[:–—]| - /)[0]
    .replace(/[^a-z0-9ß]+/g, ' ')
    .trim();
  const author = (authors?.[0] ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .pop();
  return `${base}|${author ?? ''}`;
}

/** RTDB-tauglicher Schlüssel (keine . # $ [ ] /). */
export function sanitizeBookKey(raw: string): string {
  return raw.replace(/[.#$[\]/]/g, '_').slice(0, 120);
}
