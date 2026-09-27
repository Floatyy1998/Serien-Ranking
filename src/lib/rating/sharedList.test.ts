import { describe, expect, it } from 'vitest';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import type { RatingFolder } from './ratingFolders';
import {
  buildSharedListPayload,
  expandSharedList,
  sharedListItemPath,
  sharedListSignature,
  sharedListUrl,
} from './sharedList';

const series = (id: number, title: string, rating: Record<string, number>, date = '2021-06-09') =>
  ({
    id,
    title,
    rating,
    poster: { poster: `/s${id}.jpg` },
    first_air_date: date,
  }) as unknown as Series;
const movie = (id: number, title: string, rating: Record<string, number>) =>
  ({ id, title, rating, poster: { poster: '' }, release_date: '2008-05-02' }) as unknown as Movie;

const folder: RatingFolder = {
  id: 'abc',
  name: 'Marvel',
  createdAt: 1,
  items: new Set(['s_1', 'm_2', 's_9']),
};

describe('buildSharedListPayload', () => {
  it('nimmt nur Titel der Liste und sortiert nach Bewertung', () => {
    const payload = buildSharedListPayload(
      folder,
      [series(1, 'Loki', { Drama: 7 }), series(3, 'Andere', { Drama: 9 })],
      [movie(2, 'Iron Man', { Action: 8.46 })],
      { uid: 'u1', name: 'Konrad' }
    );
    expect(payload.owner).toBe('u1');
    expect(payload.ownerName).toBe('Konrad');
    expect(payload.items).toEqual([
      { k: 'm', id: 2, t: 'Iron Man', r: 8.5, y: '2008' },
      { k: 's', id: 1, t: 'Loki', p: '/s1.jpg', r: 7, y: '2021' },
    ]);
  });

  it('lässt unbewertete Titel ohne r-Feld und hinten', () => {
    const payload = buildSharedListPayload(
      { ...folder, items: new Set(['s_1', 's_4']) },
      [series(1, 'Zeta', {}), series(4, 'Alpha', { Drama: 5 })],
      [],
      { uid: 'u1', name: '' }
    );
    expect(payload.items.map((i) => i.t)).toEqual(['Alpha', 'Zeta']);
    expect(payload.items[1]).not.toHaveProperty('r');
  });
});

describe('sharedListSignature', () => {
  it('ignoriert den Zeitstempel', () => {
    const base = buildSharedListPayload(folder, [], [], { uid: 'u', name: 'n' });
    expect(sharedListSignature({ ...base, updatedAt: 1 })).toBe(
      sharedListSignature({ ...base, updatedAt: 2 })
    );
  });
});

describe('expandSharedList', () => {
  it('verwirft kaputte Einträge und fehlende Pflichtfelder', () => {
    expect(expandSharedList('x', null)).toBeNull();
    expect(expandSharedList('x', { name: 'A' })).toBeNull();
    const list = expandSharedList('x', {
      owner: 'u',
      name: 'A',
      items: [{ k: 's', id: 1, t: 'Loki' }, { k: 'x', id: 2, t: 'B' }, null],
    });
    expect(list?.items).toEqual([{ k: 's', id: 1, t: 'Loki' }]);
    expect(list?.ownerName).toBe('');
  });
});

describe('Links', () => {
  it('baut Listen- und Titel-Pfade', () => {
    expect(sharedListUrl('abc')).toBe('https://tv-rank.de/list/abc');
    expect(sharedListItemPath({ k: 'm', id: 5, t: 'X' })).toBe('/movie/5');
    expect(sharedListItemPath({ k: 's', id: 5, t: 'X' })).toBe('/series/5');
  });
});
