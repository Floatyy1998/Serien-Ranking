import { describe, expect, it } from 'vitest';
import {
  buildCrossoverIndex,
  compactEntry,
  crossoverKeysForSeries,
  normalizeParts,
  partCode,
  partWatchState,
} from './crossoverIndex';
import type { CrossoverEntry, CrossoverMap } from '../../types/Crossover';

const crisis: CrossoverEntry = {
  title: 'Crisis on Infinite Earths',
  kind: 'crossover',
  year: 2019,
  parts: [
    { id: 62688, t: 'Supergirl', s: 5, e: 9 },
    { id: 89247, t: 'Batwoman', s: 1, e: 9 },
    { id: 60735, t: 'The Flash', s: 6, e: 9 },
  ],
  createdBy: 'seed',
  createdAt: 1,
};

describe('crossoverIndex', () => {
  it('liest Teile auch aus dem RTDB-Objektformat mit Zahlen-Schlüsseln', () => {
    const parts = normalizeParts({ 1: { id: 2, t: 'B', s: '3', e: 4 }, 0: { id: 1, t: 'A' } });
    expect(parts).toEqual([
      { id: 1, t: 'A' },
      { id: 2, t: 'B', s: 3, e: 4 },
    ]);
  });

  it('indiziert je Serie und je Folge', () => {
    const map: CrossoverMap = {
      crisis,
      invalid: { title: '', kind: 'crossover', parts: [], createdBy: '', createdAt: 0 },
    };
    const index = buildCrossoverIndex(map);
    expect(index.entries.map((e) => e.id)).toEqual(['crisis']);
    expect(index.bySeries.get(60735)?.[0].partIndex).toBe(2);
    expect(index.byEpisode.get('89247:s1-e9')?.[0].id).toBe('crisis');
    expect(crossoverKeysForSeries(index, 62688).get('s5-e9')?.[0].entry.title).toBe(
      'Crisis on Infinite Earths'
    );
  });

  it('sortiert nach Jahr absteigend, dann Titel', () => {
    const index = buildCrossoverIndex({
      b: { ...crisis, title: 'B', year: 2016 },
      a: { ...crisis, title: 'A', year: 2016 },
      c: { ...crisis, title: 'C', year: 2020 },
    });
    expect(index.entries.map((e) => e.id)).toEqual(['c', 'a', 'b']);
  });

  it('leitet den Sehstatus aus der eigenen Liste ab (Staffeln 0-basiert)', () => {
    const list = [
      {
        id: 62688,
        seasons: [
          { seasonNumber: 4, episodes: [{ watched: true, episode_number: 1 }] },
          { seasonNumber: 0, episodes: [{ watched: true, episode_number: 1 }] },
        ],
      },
    ];
    expect(partWatchState({ id: 62688, t: 'x', s: 5, e: 1 }, list)).toBe('watched');
    expect(partWatchState({ id: 62688, t: 'x', s: 5, e: 2 }, list)).toBe('unknown');
    expect(partWatchState({ id: 62688, t: 'x', s: 1 }, list)).toBe('watched');
    expect(partWatchState({ id: 1, t: 'x', s: 1, e: 1 }, list)).toBe('not-in-list');
  });

  it('bildet Kurzcodes und entfernt leere Felder vor dem Schreiben', () => {
    expect(partCode({ id: 1, t: 'x' })).toBeNull();
    expect(partCode({ id: 1, t: 'x', s: 2 })).toBe('S2');
    expect(partCode({ id: 1, t: 'x', s: 2, e: 3 })).toBe('S2 E3');
    const clean = compactEntry({
      ...crisis,
      title: ' Crisis ',
      note: '',
      franchise: undefined,
      parts: [{ id: 1, t: ' A ', s: undefined, n: '' }],
    });
    expect(clean.title).toBe('Crisis');
    expect('note' in clean).toBe(false);
    expect(clean.parts[0]).toEqual({ id: 1, t: 'A' });
  });
});
