import { describe, expect, it } from 'vitest';
import {
  genreMenuItems,
  genreMenuItemsForMovies,
  genreIdMap,
  genreIdMapForMovies,
  genreIdMapForSeries,
  providerMenuItems,
  SUPPORTED_PROVIDERS,
  isSupportedProvider,
} from './menuItems';

const menuLists = [
  ['genreMenuItems', genreMenuItems],
  ['genreMenuItemsForMovies', genreMenuItemsForMovies],
  ['providerMenuItems', providerMenuItems],
] as const;

describe('menuItems: value/label-Listen', () => {
  it.each(menuLists)('%s: jeder Eintrag hat value + label', (_name, list) => {
    for (const item of list) {
      expect(typeof item.value).toBe('string');
      expect(typeof item.label).toBe('string');
      expect(item.value.length).toBeGreaterThan(0);
    }
  });

  it.each(menuLists)('%s: values sind eindeutig und starten mit "All"', (_name, list) => {
    const values = list.map((i) => i.value);
    expect(new Set(values).size).toBe(values.length);
    expect(values[0]).toBe('All');
  });
});

describe('menuItems: genre-id-Maps', () => {
  const idMaps = [
    ['genreIdMap', genreIdMap],
    ['genreIdMapForSeries', genreIdMapForSeries],
  ] as const;

  it.each(idMaps)('%s: jeder Eintrag hat numerische id + name', (_name, map) => {
    for (const entry of map) {
      expect(typeof entry.id).toBe('number');
      expect(typeof entry.name).toBe('string');
    }
  });

  it.each(idMaps)('%s: ids sind eindeutig', (_name, map) => {
    const ids = map.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('genreIdMapForMovies ist Alias von genreIdMap', () => {
    expect(genreIdMapForMovies).toBe(genreIdMap);
  });

  it('Serien und Filme nutzen unterschiedliche Genre-Vokabulare', () => {
    // TMDB: Serien nutzen "Action & Adventure" (10759), Filme "Action" (28)
    expect(genreIdMapForSeries.some((e) => e.name === 'Action & Adventure')).toBe(true);
    expect(genreIdMap.some((e) => e.name === 'Action')).toBe(true);
  });
});

describe('SUPPORTED_PROVIDERS / isSupportedProvider', () => {
  it('enthält alle Provider außer "All"', () => {
    expect(SUPPORTED_PROVIDERS.size).toBe(providerMenuItems.length - 1);
    expect(SUPPORTED_PROVIDERS.has('All')).toBe(false);
  });

  it('spiegelt exakt die providerMenuItems (ohne All)', () => {
    const expected = providerMenuItems.filter((p) => p.value !== 'All').map((p) => p.value);
    expect([...SUPPORTED_PROVIDERS].sort()).toEqual(expected.sort());
  });

  it('isSupportedProvider erkennt bekannte Provider', () => {
    expect(isSupportedProvider('Netflix')).toBe(true);
    expect(isSupportedProvider('Crunchyroll')).toBe(true);
  });

  it('isSupportedProvider lehnt unbekannte und "All" ab', () => {
    expect(isSupportedProvider('All')).toBe(false);
    expect(isSupportedProvider('Unbekannt')).toBe(false);
    expect(isSupportedProvider('netflix')).toBe(false); // case-sensitive
  });
});
