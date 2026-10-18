import {
  READING_DEFAULT_HIDDEN,
  READING_LAYOUT_DEFAULTS,
  type ReadingLayoutListKey,
} from '../../config/readingSections';
import { mergeSectionOrder, sanitizeHiddenIds } from './sectionOrder';

export interface ReadingLayoutList {
  order: string[];
  hidden: string[];
}

export type ReadingLayout = Record<ReadingLayoutListKey, ReadingLayoutList>;

const LIST_KEYS = Object.keys(READING_LAYOUT_DEFAULTS) as ReadingLayoutListKey[];

const defaultHidden = (key: ReadingLayoutListKey): string[] =>
  key === 'sections' ? [...READING_DEFAULT_HIDDEN] : [];

export const defaultReadingLayout = (): ReadingLayout =>
  Object.fromEntries(
    LIST_KEYS.map((key) => [
      key,
      { order: [...READING_LAYOUT_DEFAULTS[key]], hidden: defaultHidden(key) },
    ])
  ) as ReadingLayout;

/** Die Navigation (Freunde, Aktivität, Lese-Seiten) steht immer ganz oben; ausblenden geht. */
export const PINNED_READING_SECTION = 'quick-actions';

const pinNavigation = (layout: ReadingLayout): ReadingLayout => ({
  ...layout,
  sections: {
    order: [
      PINNED_READING_SECTION,
      ...layout.sections.order.filter((id) => id !== PINNED_READING_SECTION),
    ],
    hidden: layout.sections.hidden,
  },
});

/** Gespeichertes Layout auf die aktuellen Bereiche abgleichen; fehlende Listen bekommen ihre Vorgabe. */
export const sanitizeReadingLayout = (raw: unknown): ReadingLayout => {
  const source = (raw && typeof raw === 'object' ? raw : {}) as Record<
    string,
    { order?: unknown; hidden?: unknown } | undefined
  >;
  return pinNavigation(sanitizeLists(source));
};

const sanitizeLists = (
  source: Record<string, { order?: unknown; hidden?: unknown } | undefined>
): ReadingLayout =>
  Object.fromEntries(
    LIST_KEYS.map((key) => {
      const defaults = READING_LAYOUT_DEFAULTS[key];
      const saved = source[key];
      return [
        key,
        {
          order: mergeSectionOrder(saved?.order, defaults),
          hidden: saved ? sanitizeHiddenIds(saved.hidden, defaults) : defaultHidden(key),
        },
      ];
    })
  ) as ReadingLayout;

// Manga-Bereiche, die es auf der Lesen-Seite unter demselben Namen gibt.
const CARRIED_SECTIONS = ['for-you', 'recently-added'];

/**
 * Erstes Lesen-Layout aus der alten Manga-Übersicht: ausgeblendete Manga-Bereiche,
 * Schnellzugriffe und Für-dich-Karten bleiben so, wie man sie eingestellt hatte.
 */
export function readingLayoutFromManga(manga: unknown): ReadingLayout {
  const base = defaultReadingLayout();
  if (!manga || typeof manga !== 'object') return base;
  const source = manga as Record<string, { order?: unknown; hidden?: unknown } | undefined>;
  const hiddenManga = Array.isArray(source.sections?.hidden)
    ? (source.sections.hidden as unknown[]).filter((id): id is string => typeof id === 'string')
    : [];
  return sanitizeReadingLayout({
    sections: {
      order: base.sections.order,
      hidden: [
        ...base.sections.hidden,
        ...hiddenManga.filter((id) => CARRIED_SECTIONS.includes(id)),
      ],
    },
    quick: source.quick ?? base.quick,
    forYou: source.forYou ?? base.forYou,
    discover: base.discover,
  });
}
