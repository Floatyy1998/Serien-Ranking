import { describe, expect, it } from 'vitest';
import {
  MAX_INTERESTS,
  INTERESTS,
  interestsToRecord,
  matchInterests,
  normalizeInterestIds,
  suggestInterests,
} from './interests';

const same = (s: string) => s;

describe('normalizeInterestIds', () => {
  it('liest die RTDB-Form und verwirft Unbekanntes', () => {
    expect(
      normalizeInterestIds({ anime: true, marvel: true, quatsch: true, krieg: false })
    ).toEqual(['marvel', 'anime']);
  });

  it('akzeptiert Arrays, kappt auf das Maximum und ignoriert Müll', () => {
    expect(normalizeInterestIds(['krieg', 'dc'])).toEqual(['dc', 'krieg']);
    expect(normalizeInterestIds(INTERESTS.map((i) => i.id))).toHaveLength(MAX_INTERESTS);
    expect(normalizeInterestIds(null)).toEqual([]);
    expect(normalizeInterestIds('marvel')).toEqual([]);
  });

  it('interestsToRecord schreibt {id: true}', () => {
    expect(interestsToRecord(['anime', 'unbekannt'])).toEqual({ anime: true });
  });
});

describe('suggestInterests', () => {
  const tagMap = {
    series: {
      '1': ['anime', 'action'],
      '2': ['anime'],
      '3': ['anime', 'comedy'],
      '4': ['western'],
    },
    movies: { '10': ['marvel', 'action'], '11': ['marvel', 'action'], '12': ['action'] },
  };

  it('zählt gesehene Titel je Interesse, häufigste zuerst', () => {
    const result = suggestInterests({ series: [1, 2, 3, 4], movies: [10, 11, 12] }, tagMap);
    expect(result.map((r) => r.id)).toEqual(['action', 'anime', 'marvel']);
    expect(result[0].count).toBe(4);
  });

  it('Franchises reichen ab zwei Titeln, Genres brauchen mehr', () => {
    const result = suggestInterests({ series: [4], movies: [10, 11] }, tagMap);
    expect(result.map((r) => r.id)).toEqual(['marvel']);
  });

  it('kleine Anteile fallen raus', () => {
    const series = Array.from({ length: 100 }, (_, i) => 100 + i);
    const map = { series: { '100': ['krieg'], '101': ['krieg'], '102': ['krieg'] }, movies: {} };
    expect(suggestInterests({ series, movies: [] }, map)).toEqual([]);
  });

  it('leere Bibliothek ergibt nichts', () => {
    expect(suggestInterests({ series: [], movies: [] }, tagMap)).toEqual([]);
  });
});

describe('matchInterests', () => {
  it('findet über Namen, Wortanfang und Aliase', () => {
    expect(matchInterests('Marvel', same).map((i) => i.id)).toEqual(['marvel']);
    expect(matchInterests('mittelerde', same).map((i) => i.id)).toEqual(['middle-earth']);
    expect(matchInterests('ringe', same).map((i) => i.id)).toEqual(['middle-earth']);
    expect(matchInterests('true', same).map((i) => i.id)).toEqual(['true-crime']);
  });

  it('nutzt den übersetzten Namen', () => {
    const en = (label: string) => (label === 'Superhelden' ? 'Superheroes' : label);
    expect(matchInterests('superhero', en).map((i) => i.id)).toEqual(['superhelden']);
  });

  it('ignoriert zu kurze Anfragen', () => {
    expect(matchInterests('m', same)).toEqual([]);
  });
});
