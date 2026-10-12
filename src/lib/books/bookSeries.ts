import type { BookSeriesPart } from '../../types/Book';

export interface RawSeriesPart {
  wikidataId: string;
  title?: string;
  position?: string;
  date?: string;
  olWorkId?: string;
}

const validDate = (value: string | undefined): string | undefined =>
  value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : undefined;

const looksLikeQid = (title: string | undefined) => !title || /^Q\d+$/.test(title);

/** Wikidata liefert Teile doppelt (Ausgaben, Übersetzungen); pro Bandnummer bleibt der älteste Eintrag. */
export function normalizeSeriesParts(raw: RawSeriesPart[]): BookSeriesPart[] {
  const byPosition = new Map<number, BookSeriesPart>();
  for (const part of raw) {
    const position = Number(part.position);
    if (!Number.isInteger(position) || position <= 0 || looksLikeQid(part.title)) continue;
    const candidate: BookSeriesPart = {
      wikidataId: part.wikidataId,
      title: part.title as string,
      position,
      publishedDate: validDate(part.date),
      olWorkId: part.olWorkId,
    };
    const existing = byPosition.get(position);
    if (!existing) {
      byPosition.set(position, candidate);
      continue;
    }
    const older =
      candidate.publishedDate &&
      (!existing.publishedDate || candidate.publishedDate < existing.publishedDate);
    if (older)
      byPosition.set(position, { ...candidate, olWorkId: candidate.olWorkId ?? existing.olWorkId });
    else if (!existing.olWorkId && candidate.olWorkId) existing.olWorkId = candidate.olWorkId;
  }
  return [...byPosition.values()].sort((a, b) => a.position - b.position);
}

export interface NextVolume {
  part: BookSeriesPart;
  state: 'available' | 'upcoming' | 'unknown';
  daysUntil: number | null;
}

const daysFromNow = (date: string, now: number) =>
  Math.ceil((new Date(`${date}T00:00:00`).getTime() - now) / 86_400_000);

/** Der nächste Band nach der höchsten gelesenen Position; ohne Datum gilt er als erschienen, wenn ein späterer Band es ist. */
export function findNextVolume(
  parts: BookSeriesPart[],
  readPositions: number[],
  now: number
): NextVolume | null {
  const highest = readPositions.length ? Math.max(...readPositions) : 0;
  const index = parts.findIndex((p) => p.position > highest);
  if (index < 0) return null;
  const next = parts[index];
  if (next.publishedDate) {
    const days = daysFromNow(next.publishedDate, now);
    return days > 0
      ? { part: next, state: 'upcoming', daysUntil: days }
      : { part: next, state: 'available', daysUntil: null };
  }
  const laterReleased = parts
    .slice(index + 1)
    .some((p) => p.publishedDate && daysFromNow(p.publishedDate, now) <= 0);
  return { part: next, state: laterReleased ? 'available' : 'unknown', daysUntil: null };
}
