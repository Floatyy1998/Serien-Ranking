import { describe, expect, it } from 'vitest';
import { READING_DEFAULT_HIDDEN, READING_SECTION_IDS } from '../../config/readingSections';
import {
  defaultReadingLayout,
  readingLayoutFromManga,
  sanitizeReadingLayout,
} from './readingLayout';

describe('readingLayout', () => {
  it('startet kompakt: selten genutzte Bereiche sind ausgeblendet', () => {
    const layout = defaultReadingLayout();
    expect(layout.sections.order).toEqual([...READING_SECTION_IDS]);
    expect(layout.sections.hidden).toEqual([...READING_DEFAULT_HIDDEN]);
    expect(layout.quick.hidden).toEqual([]);
  });

  it('übernimmt gespeicherte Reihenfolge und Ausblendungen, auch wenn alles sichtbar ist', () => {
    const layout = sanitizeReadingLayout({
      sections: { order: ['library', 'continue-reading', 'unbekannt'], hidden: [] },
    });
    const order = layout.sections.order;
    expect(order.indexOf('library')).toBeLessThan(order.indexOf('continue-reading'));
    expect(layout.sections.order).not.toContain('unbekannt');
    expect(layout.sections.order).toHaveLength(READING_SECTION_IDS.length);
    expect(layout.sections.hidden).toEqual([]);
    expect(layout.discover.hidden).toEqual([]);
  });

  it('übernimmt die alte Manga-Übersicht: Ausblendungen, Schnellzugriffe und Karten', () => {
    const layout = readingLayoutFromManga({
      sections: { order: [], hidden: ['quick-actions', 'trending', 'continue-reading'] },
      quick: { order: ['stats', 'reading-list'], hidden: ['journey'] },
      forYou: { order: ['reread'], hidden: ['hidden'] },
    });
    expect(layout.sections.hidden).toContain('quick-actions');
    expect(layout.sections.hidden).not.toContain('continue-reading');
    expect(layout.quick.order.indexOf('stats')).toBeLessThan(
      layout.quick.order.indexOf('reading-list')
    );
    expect(layout.quick.hidden).toEqual(['journey']);
    expect(layout.forYou.hidden).toEqual(['hidden']);
  });

  it('ohne altes Manga-Layout gelten die Vorgaben', () => {
    expect(readingLayoutFromManga(null)).toEqual(defaultReadingLayout());
  });
});
