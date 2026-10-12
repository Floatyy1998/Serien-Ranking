import type { Book, BookStatus } from '../../types/Book';
import { pickIsbn13, sanitizeBookKey } from './bookIdentity';
import { openLibraryCoverByIsbn, stripUndefined } from './bookSearchMapping';

/** RFC-4180: Anführungszeichen, verdoppelte Quotes und Zeilenumbrüche im Feld. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  return rows;
}

export type ImportSource = 'goodreads' | 'storygraph';

export interface ImportPreview {
  source: ImportSource;
  books: Book[];
  counts: Record<BookStatus, number>;
  skipped: number;
}

const unwrapExcel = (value: string | undefined) =>
  (value ?? '').replace(/^="?/, '').replace(/"$/, '').trim();

/** Goodreads/StoryGraph-Datum „2023/05/14" → ISO (Mittag, damit keine Zeitzone den Tag verschiebt). */
export function parseImportDate(value: string | undefined): string | undefined {
  const match = value?.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!match) return undefined;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), 12);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

/** „Mockingjay (The Hunger Games, #3)" → Titel + Reihe. */
export function splitSeriesFromTitle(raw: string): { title: string; series?: Book['series'] } {
  const match = raw.match(/^(.*?)\s*\(([^()#]+?),?\s*#(\d+(?:\.\d+)?)\)\s*$/);
  if (!match) return { title: raw.trim() };
  return {
    title: match[1].trim(),
    series: { name: match[2].trim(), position: Number(match[3]) },
  };
}

function mapShelf(shelf: string): BookStatus {
  const s = shelf.toLowerCase().trim();
  if (s === 'read') return 'completed';
  if (s === 'currently-reading') return 'reading';
  if (s === 'to-read') return 'planned';
  if (/dnf|did-not-finish|abgebrochen|abandon/.test(s)) return 'dropped';
  if (/pause|on-hold/.test(s)) return 'paused';
  return 'planned';
}

const emptyCounts = (): Record<BookStatus, number> => ({
  reading: 0,
  planned: 0,
  completed: 0,
  paused: 0,
  dropped: 0,
});

function hashKey(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

export function detectImportSource(header: string[]): ImportSource | null {
  const cols = new Set(header.map((h) => h.trim()));
  if (cols.has('Exclusive Shelf') && cols.has('Book Id')) return 'goodreads';
  if (cols.has('Read Status') && cols.has('Authors')) return 'storygraph';
  return null;
}

export function buildImportPreview(csvText: string, nowIso: string): ImportPreview | null {
  const rows = parseCsv(csvText);
  if (rows.length < 2) return null;
  const header = rows[0].map((h) => h.trim());
  const source = detectImportSource(header);
  if (!source) return null;
  const col = (name: string) => header.indexOf(name);
  const get = (row: string[], name: string) => {
    const i = col(name);
    return i >= 0 ? (row[i] ?? '').trim() : '';
  };

  const counts = emptyCounts();
  const books: Book[] = [];
  const seen = new Set<string>();
  let skipped = 0;

  for (const row of rows.slice(1)) {
    const rawTitle = get(row, 'Title');
    if (!rawTitle) {
      skipped += 1;
      continue;
    }
    const { title, series } = splitSeriesFromTitle(rawTitle);
    const isGoodreads = source === 'goodreads';
    const authors = (isGoodreads ? get(row, 'Author') : get(row, 'Authors'))
      .split(/\s*,\s*/)
      .filter(Boolean)
      .slice(0, 3);
    const isbn13 = isGoodreads
      ? pickIsbn13([unwrapExcel(get(row, 'ISBN13')), unwrapExcel(get(row, 'ISBN'))])
      : pickIsbn13([get(row, 'ISBN/UID')]);
    const status = mapShelf(isGoodreads ? get(row, 'Exclusive Shelf') : get(row, 'Read Status'));
    const pageCount = Number(get(row, 'Number of Pages')) || undefined;
    const stars = Number(isGoodreads ? get(row, 'My Rating') : get(row, 'Star Rating')) || 0;
    const completedAt =
      status === 'completed'
        ? (parseImportDate(isGoodreads ? get(row, 'Date Read') : get(row, 'Last Date Read')) ??
          parseImportDate(get(row, 'Date Added')))
        : undefined;
    const addedAt = parseImportDate(get(row, 'Date Added')) ?? nowIso;
    const year =
      Number(get(row, 'Original Publication Year')) ||
      Number(get(row, 'Year Published')) ||
      undefined;
    const readCount = Number(get(row, 'Read Count')) || 0;

    const id = sanitizeBookKey(
      isGoodreads && get(row, 'Book Id')
        ? `gr-${get(row, 'Book Id')}`
        : `sg-${isbn13 ?? hashKey(`${title}|${authors[0] ?? ''}`)}`
    );
    if (seen.has(id)) continue;
    seen.add(id);

    const book: Book = stripUndefined({
      id,
      title,
      authors,
      series,
      isbn13,
      cover: isbn13 ? openLibraryCoverByIsbn(isbn13) : undefined,
      pageCount,
      publishedYear: year,
      publisher: isGoodreads ? get(row, 'Publisher') || undefined : undefined,
      source: 'goodreads' as const,
      status,
      currentPage: status === 'completed' ? (pageCount ?? 0) : 0,
      rating: stars > 0 ? Math.min(10, Math.round(stars * 2 * 2) / 2) : undefined,
      addedAt,
      completedAt,
      startedAt:
        status === 'completed' || status === 'reading' ? (completedAt ?? addedAt) : undefined,
      rereadCount: readCount > 1 ? readCount - 1 : undefined,
      format: /audio/i.test(get(row, 'Binding') || get(row, 'Format'))
        ? ('audio' as const)
        : undefined,
    });
    counts[status] += 1;
    books.push(book);
  }

  return { source, books, counts, skipped };
}
