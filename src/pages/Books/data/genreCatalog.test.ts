import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../services/i18n', () => ({
  appLocale: 'de',
  t: (text: string) => text,
}));

import {
  CATALOG_GENRES,
  CATALOG_GROUPS,
  CATALOG_MOODS,
  catalogGenre,
  isCatalogMood,
  moodLabel,
  warningLabel,
} from './genreCatalog';

describe('Genre-Katalog', () => {
  it('hat eindeutige Schlüssel und nur bekannte Gruppen', () => {
    const ids = CATALOG_GENRES.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    const groups = new Set(CATALOG_GROUPS.map((g) => g.id));
    expect(CATALOG_GENRES.every((g) => groups.has(g.group))).toBe(true);
    expect(ids.length).toBeGreaterThanOrEqual(60);
  });

  it('gibt jedem Genre, jeder Gruppe und jeder Stimmung einen Namen', () => {
    for (const g of CATALOG_GENRES) expect(g.label().trim(), g.id).not.toBe('');
    for (const g of CATALOG_GROUPS) expect(g.label().trim(), g.id).not.toBe('');
    for (const m of CATALOG_MOODS) expect(m.label().trim(), m.id).not.toBe('');
  });

  it('erkennt Katalog-Schlüssel und Stimmungen, sonst nichts', () => {
    expect(catalogGenre('romantasy')?.group).toBe('fantasy-scifi');
    expect(catalogGenre('gibtsnicht')).toBeUndefined();
    expect(catalogGenre(null)).toBeUndefined();
    expect(isCatalogMood('fast-paced')).toBe(true);
    expect(isCatalogMood('quatsch')).toBe(false);
  });

  it('übersetzt Stimmungen aus Hardcover, auch mit Leerzeichen und Großschreibung', () => {
    expect(moodLabel('tense')).toBe('Spannend');
    expect(moodLabel('Fast Paced')).toBe('Temporeich');
    expect(moodLabel('cozy')).toBe('Cozy');
  });

  it('übersetzt bekannte Inhaltshinweise und lässt Unbekanntes englisch', () => {
    expect(warningLabel('death of parent')).toBe('Tod eines Elternteils');
    expect(warningLabel('Violence')).toBe('Gewalt');
    expect(warningLabel('time travel paradox')).toBe('Time travel paradox');
  });
});
