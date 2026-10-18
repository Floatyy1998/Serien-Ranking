import type { Book } from '../../types/Book';

/** Leinen- und Ledertöne fürs Regal; jedes Buch bekommt über seinen Titel immer denselben. */
export const SPINE_PALETTE = [
  { bg: '#7a2e3a', fg: '#f6e3c5', band: '#d4a85a' },
  { bg: '#1f4d5c', fg: '#e9f1ee', band: '#c9a45c' },
  { bg: '#2e3b6b', fg: '#e8e6f5', band: '#b9b2e8' },
  { bg: '#5b3a24', fg: '#f3dfc0', band: '#e0b36a' },
  { bg: '#2f5a3a', fg: '#e8f0dc', band: '#d7c47a' },
  { bg: '#8a4b23', fg: '#fbe9d2', band: '#2b1a10' },
  { bg: '#3e2a4f', fg: '#efe2f7', band: '#e3a5c7' },
  { bg: '#b3893a', fg: '#2a1c0a', band: '#5a3a14' },
  { bg: '#1d1d24', fg: '#e8e2d0', band: '#c9a45c' },
  { bg: '#9b3b2f', fg: '#fbeee0', band: '#f2c76a' },
  { bg: '#3d5c75', fg: '#f0f4f7', band: '#e8d3a0' },
  { bg: '#d9cfb8', fg: '#2e2418', band: '#7a2e3a' },
] as const;

export function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface SpineStyle {
  width: number;
  height: number;
  bg: string;
  fg: string;
  band: string;
  bands: 0 | 1 | 2;
  tilt: number;
}

/** Dicke folgt der Seitenzahl, Höhe und Bänder dem Titel — so wirkt das Regal gewachsen statt gerastert. */
export function spineStyle(book: Pick<Book, 'id' | 'title' | 'pageCount'>, scale = 1): SpineStyle {
  const h = hashString(book.id || book.title);
  const color = SPINE_PALETTE[h % SPINE_PALETTE.length];
  const pages = book.pageCount && book.pageCount > 0 ? book.pageCount : 280 + (h % 160);
  const width = Math.round(Math.min(46, Math.max(20, 14 + pages / 22)) * scale);
  const height = Math.round((132 + ((h >> 4) % 34)) * scale);
  return {
    width,
    height,
    bg: color.bg,
    fg: color.fg,
    band: color.band,
    bands: ((h >> 9) % 3) as 0 | 1 | 2,
    tilt: (h >> 12) % 11 === 0 ? -4 : 0,
  };
}

const SPINE_LINE_HEIGHT = 1.05;
const MIN_SIZE = 8;
const MAX_SIZE = 11;

/** Textbreite bei 1 px Schriftgröße; ohne Messung (Tests, SSR) eine vorsichtige Schätzung. */
export type SpineMeasure = (text: string) => number;
const estimate: SpineMeasure = (text) => text.length * 0.68;

export interface SpineTitleLayout {
  text: string;
  fontSize: number;
  lines: 1 | 2 | 3;
  maxHeight: number;
}

const half = (n: number) => Math.floor(n * 2) / 2;

function fitTitle(
  text: string,
  width: number,
  maxHeight: number,
  measure: SpineMeasure
): Omit<SpineTitleLayout, 'text' | 'maxHeight'> & { fits: boolean } {
  const length = Math.max(measure(text), 0.1);
  const longestWord = Math.max(...text.split(/\s+/).map(measure), 0.1);
  const sizeFor = (lines: number) =>
    lines === 1
      ? Math.min(MAX_SIZE, maxHeight / length, (width - 4) / SPINE_LINE_HEIGHT)
      : Math.min(
          MAX_SIZE,
          ((lines * maxHeight) / length) * 0.85,
          (width - 6) / (lines * SPINE_LINE_HEIGHT),
          maxHeight / longestWord
        );
  let lines: 1 | 2 | 3 = 1;
  let size = sizeFor(1);
  for (const more of [2, 3] as const) {
    if (size >= 10.5) break;
    const candidate = sizeFor(more);
    if (candidate >= size + 1.5 || (size < MIN_SIZE && candidate >= MIN_SIZE)) {
      lines = more;
      size = candidate;
    }
  }
  if (size >= MIN_SIZE) return { fontSize: half(size), lines, fits: true };
  return { fontSize: MIN_SIZE, lines: 1, fits: false };
}

/**
 * Lange Titel werden bis 8 px kleiner gesetzt und auf breiten Rücken zwei- oder dreizeilig (nie
 * mitten im Wort), statt sofort abgeschnitten zu werden. Passt der Titel gar nicht, steht wie auf
 * echten Rücken nur der Teil vor dem Untertitel. Ohne Zierbänder hat der Titel fast die ganze Höhe.
 */
export function spineTitleLayout(
  title: string,
  spine: Pick<SpineStyle, 'width' | 'height' | 'bands'>,
  measure: SpineMeasure = estimate
): SpineTitleLayout {
  const maxHeight = spine.height - (spine.bands > 0 ? 50 : 26);
  const full = fitTitle(title, spine.width, maxHeight, measure);
  const main = title.split(/\s*[:–—]\s+|\s+-\s+/)[0].trim();
  if (!full.fits && main && main !== title) {
    const short = fitTitle(main, spine.width, maxHeight, measure);
    return { text: main, fontSize: short.fontSize, lines: short.lines, maxHeight };
  }
  return { text: title, fontSize: full.fontSize, lines: full.lines, maxHeight };
}

/** Teilt Buchrücken auf Regalbretter auf, ohne dass ein Brett überläuft. */
export function packShelves<T extends { width: number }>(items: T[], shelfWidth: number): T[][] {
  const shelves: T[][] = [];
  let current: T[] = [];
  let used = 0;
  for (const item of items) {
    if (current.length && used + item.width > shelfWidth) {
      shelves.push(current);
      current = [];
      used = 0;
    }
    current.push(item);
    used += item.width + 2;
  }
  if (current.length) shelves.push(current);
  return shelves;
}

/** Initialen-Cover, wenn kein Bild existiert. */
export function generatedCoverColors(book: Pick<Book, 'id' | 'title'>) {
  return SPINE_PALETTE[hashString(book.id || book.title) % SPINE_PALETTE.length];
}
