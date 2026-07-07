import { describe, expect, it } from 'vitest';
import type { TvPremiereStaticEntry } from '../../services/staticCatalog';
import {
  buildMetaLine,
  dayLabel,
  isSameDay,
  parsePremiereDate,
  parseQuarterKey,
  premiereBadge,
  quarterKey,
  quarterLabel,
  quarterOf,
  quarterRangeShort,
  shiftQuarter,
} from './tvPremiereFormat';

function makeEntry(overrides: Partial<TvPremiereStaticEntry> = {}): TvPremiereStaticEntry {
  return {
    tmdbId: 1,
    type: 'new',
    premiereDate: '2026-07-03',
    title: 'Neue Serie',
    originalTitle: null,
    overviewDe: null,
    poster: null,
    backdrop: null,
    rating: null,
    genres: [],
    networks: [],
    providers: [],
    ...overrides,
  };
}

describe('re-exports aus animeFormat', () => {
  it('reicht die geteilten Datums-Helfer weiter', () => {
    expect(typeof dayLabel).toBe('function');
    expect(isSameDay(new Date(2026, 6, 4), new Date(2026, 6, 4))).toBe(true);
  });
});

describe('parsePremiereDate', () => {
  it('parst "YYYY-MM-DD" als lokales Mitternacht-Date', () => {
    const d = parsePremiereDate('2026-07-03');
    expect(d?.getFullYear()).toBe(2026);
    expect(d?.getMonth()).toBe(6);
    expect(d?.getDate()).toBe(3);
    expect(d?.getHours()).toBe(0);
  });

  it('null/leer/ungültig → null', () => {
    expect(parsePremiereDate(null)).toBeNull();
    expect(parsePremiereDate(undefined)).toBeNull();
    expect(parsePremiereDate('')).toBeNull();
    expect(parsePremiereDate('abc')).toBeNull();
  });
});

describe('Quartals-Helfer', () => {
  it('quarterOf: Monat → 0..3', () => {
    expect(quarterOf(new Date(2026, 0, 1))).toBe(0);
    expect(quarterOf(new Date(2026, 6, 1))).toBe(2);
    expect(quarterOf(new Date(2026, 11, 1))).toBe(3);
  });

  it('quarterKey / quarterLabel', () => {
    const d = new Date(2026, 6, 1);
    expect(quarterKey(d)).toBe('2026-Q3');
    expect(quarterLabel(d)).toBe('Q3 2026');
  });

  it('parseQuarterKey ist invers zu quarterKey (auf ersten Quartalstag)', () => {
    const d = parseQuarterKey('2026-Q3');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(6);
    expect(d.getDate()).toBe(1);
  });

  it('parseQuarterKey clampt out-of-range Quartale', () => {
    expect(parseQuarterKey('2026-Q9').getMonth()).toBe(9); // Q4 (Index 3)
    expect(parseQuarterKey('2026-Q0').getMonth()).toBe(0); // Q1 (Index 0)
  });

  it('shiftQuarter normalisiert auf den ersten Quartalstag', () => {
    const next = shiftQuarter(new Date(2026, 6, 15), 1);
    expect(next.getMonth()).toBe(9);
    expect(next.getDate()).toBe(1);
    const prev = shiftQuarter(new Date(2026, 6, 15), -1);
    expect(prev.getMonth()).toBe(3);
  });

  it('quarterRangeShort liefert einen Monatsbereich mit "–"', () => {
    const range = quarterRangeShort(new Date(2026, 6, 1));
    expect(range).toContain('–');
    expect(range).not.toContain('.');
    const [a, b] = range.split('–');
    expect(a.length).toBeGreaterThan(0);
    expect(b.length).toBeGreaterThan(0);
  });
});

describe('premiereBadge', () => {
  it('Staffel-Premiere mit Nummer', () => {
    expect(premiereBadge(makeEntry({ type: 'season', seasonNumber: 3 }))).toEqual({
      label: 'Staffel 3',
      isNew: false,
    });
  });

  it('neue Serie → "Neu"', () => {
    expect(premiereBadge(makeEntry({ type: 'new' }))).toEqual({ label: 'Neu', isNew: true });
  });

  it('Staffel-Typ ohne Nummer fällt auf "Neu" zurück', () => {
    expect(premiereBadge(makeEntry({ type: 'season' }))).toEqual({ label: 'Neu', isNew: true });
  });
});

describe('buildMetaLine', () => {
  it('Network · Rating', () => {
    expect(buildMetaLine(makeEntry({ networks: ['Netflix'], rating: 8.2 }))).toBe(
      'Netflix · ★ 8.2'
    );
  });

  it('nur Network, wenn Rating fehlt/0', () => {
    expect(buildMetaLine(makeEntry({ networks: ['HBO'], rating: 0 }))).toBe('HBO');
    expect(buildMetaLine(makeEntry({ networks: ['HBO'], rating: null }))).toBe('HBO');
  });

  it('nur Rating, wenn kein Network', () => {
    expect(buildMetaLine(makeEntry({ networks: [], rating: 7.5 }))).toBe('★ 7.5');
  });

  it('leer, wenn beides fehlt', () => {
    expect(buildMetaLine(makeEntry({ networks: [], rating: null }))).toBe('');
  });
});
