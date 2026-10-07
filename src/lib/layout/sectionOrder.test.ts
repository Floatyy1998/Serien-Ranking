import { describe, expect, it } from 'vitest';
import { mergeSectionOrder, sanitizeHiddenIds } from './sectionOrder';

const DEFAULTS = ['a', 'b', 'c', 'd'];

describe('mergeSectionOrder', () => {
  it('liefert die Defaults ohne gespeicherte Reihenfolge', () => {
    expect(mergeSectionOrder(undefined, DEFAULTS)).toEqual(DEFAULTS);
    expect(mergeSectionOrder('kaputt', DEFAULTS)).toEqual(DEFAULTS);
  });

  it('behält die Nutzer-Reihenfolge und wirft Unbekanntes und Doppeltes raus', () => {
    expect(mergeSectionOrder(['d', 'x', 'b', 'd', 'a', 'c'], DEFAULTS)).toEqual([
      'd',
      'b',
      'a',
      'c',
    ]);
  });

  it('setzt neue Sektionen vor ihren Nachfolger aus den Defaults', () => {
    expect(mergeSectionOrder(['d', 'a', 'c'], DEFAULTS)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('hängt eine neue letzte Sektion ans Ende', () => {
    expect(mergeSectionOrder(['c', 'b', 'a'], DEFAULTS)).toEqual(['c', 'b', 'a', 'd']);
  });
});

describe('sanitizeHiddenIds', () => {
  it('lässt nur bekannte, eindeutige IDs durch', () => {
    expect(sanitizeHiddenIds(['b', 'x', 'b', 3, 'd'], DEFAULTS)).toEqual(['b', 'd']);
    expect(sanitizeHiddenIds(null, DEFAULTS)).toEqual([]);
  });
});
