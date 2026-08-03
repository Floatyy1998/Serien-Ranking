import { describe, expect, it } from 'vitest';
import { filterBulkMarkable, isEpisodeUnreleased } from './releaseState';

const future = () => new Date(Date.now() + 7 * 86_400_000).toISOString();
const ids = (eps: { id: number }[]) => eps.map((e) => e.id);

describe('isEpisodeUnreleased', () => {
  it('erkennt Folgen mit Zukunfts-Datum', () => {
    expect(isEpisodeUnreleased({ air_date: '2099-01-01' })).toBe(true);
    expect(isEpisodeUnreleased({ airstamp: future() })).toBe(true);
  });

  it('gelaufene und datumslose Folgen sind nicht unveröffentlicht', () => {
    expect(isEpisodeUnreleased({ air_date: '2020-01-01' })).toBe(false);
    expect(isEpisodeUnreleased({})).toBe(false);
  });
});

describe('filterBulkMarkable', () => {
  it('lässt Zukunfts-Folgen weg, gelaufene drin', () => {
    const eps = [
      { id: 1, air_date: '2020-01-01' },
      { id: 2, air_date: '2099-01-01' },
    ];
    expect(ids(filterBulkMarkable(eps))).toEqual([1]);
  });

  it('datumslose Platzhalter am Staffelende bleiben draußen', () => {
    const eps = [
      { id: 1, air_date: '2020-01-01' },
      { id: 2, air_date: '' },
      { id: 3, air_date: '' },
    ];
    expect(ids(filterBulkMarkable(eps))).toEqual([1]);
  });

  it('datumslose Lücke vor einer gelaufenen Folge gilt als gelaufen', () => {
    const eps = [
      { id: 1, air_date: '' },
      { id: 2, air_date: '2020-01-05' },
      { id: 3, air_date: '' },
    ];
    expect(ids(filterBulkMarkable(eps))).toEqual([1, 2]);
  });

  it('komplett datumslose Staffel bleibt abhakbar (Metadaten-Lücke)', () => {
    const eps = [{ id: 1, air_date: '' }, { id: 2 }];
    expect(ids(filterBulkMarkable(eps))).toEqual([1, 2]);
  });

  it('Staffel nur mit Zukunfts-Daten: nichts abhakbar', () => {
    const eps = [
      { id: 1, air_date: '2099-01-01' },
      { id: 2, air_date: '' },
    ];
    expect(filterBulkMarkable(eps)).toEqual([]);
  });

  it('einzeln markierte Folgen bleiben immer drin', () => {
    const eps = [
      { id: 1, air_date: '2099-01-01', watched: true },
      { id: 2, air_date: '2099-01-01', watchCount: 2 },
      { id: 3, air_date: '2099-01-01' },
    ];
    expect(ids(filterBulkMarkable(eps))).toEqual([1, 2]);
  });
});
