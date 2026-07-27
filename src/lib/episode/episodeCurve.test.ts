import { describe, expect, it } from 'vitest';
import type { Series } from '../../types/Series';
import { buildFeverCurve, MIN_COUNT_FOR_HIGHLIGHT, ratingHeatColor } from './episodeCurve';

const ep = (
  id: number,
  n: number,
  over: Partial<Series['seasons'][number]['episodes'][number]> = {}
): Series['seasons'][number]['episodes'][number] => ({
  id,
  episode_number: n,
  name: `Folge ${n}`,
  air_date: '2020-01-01',
  watched: false,
  ...over,
});

const seasons = (...eps: Series['seasons'][number]['episodes'][number][][]): Series['seasons'] =>
  eps.map((episodes, i) => ({ seasonNumber: i, episodes }));

describe('buildFeverCurve', () => {
  it('baut eine fortlaufende X-Achse über Staffelgrenzen', () => {
    const curve = buildFeverCurve(seasons([ep(1, 1), ep(2, 2)], [ep(3, 1)]), {
      '1': { a: 8, c: 5 },
      '3': { a: 9, c: 4 },
    });
    expect(curve.points.map((p) => p.x)).toEqual([0, 1, 2]);
    expect(curve.segments).toHaveLength(2);
    expect(curve.segments[1]).toMatchObject({ seasonNumber: 1, startX: 2, endX: 2 });
  });

  it('lässt Folgen ohne Community-Wert als Lücke stehen', () => {
    const curve = buildFeverCurve(seasons([ep(1, 1), ep(2, 2), ep(3, 3)]), {
      '1': { a: 7.5, c: 6 },
      '3': { a: 8.2, c: 6 },
    });
    expect(curve.points[1].avg).toBeNull();
    expect(curve.communityCount).toBe(2);
  });

  it('ignoriert noch nicht ausgestrahlte Folgen', () => {
    const future = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const curve = buildFeverCurve(seasons([ep(1, 1), ep(2, 2, { air_date: future })]), {
      '1': { a: 8, c: 5 },
      '2': { a: 9, c: 5 },
    });
    expect(curve.points).toHaveLength(1);
  });

  it('gewichtet den Staffelschnitt nach Bewertungsanzahl', () => {
    const curve = buildFeverCurve(seasons([ep(1, 1), ep(2, 2)]), {
      '1': { a: 10, c: 1 },
      '2': { a: 5, c: 9 },
    });
    expect(curve.segments[0].avg).toBe(5.5);
  });

  it('markiert beste und schlechteste Folge nur ab Mindest-Bewertungsanzahl', () => {
    const curve = buildFeverCurve(seasons([ep(1, 1), ep(2, 2), ep(3, 3)]), {
      '1': { a: 9.8, c: MIN_COUNT_FOR_HIGHLIGHT - 1 },
      '2': { a: 8, c: MIN_COUNT_FOR_HIGHLIGHT },
      '3': { a: 6, c: MIN_COUNT_FOR_HIGHLIGHT },
    });
    expect(curve.best?.episodeId).toBe(2);
    expect(curve.worst?.episodeId).toBe(3);
  });

  it('setzt worst auf null, wenn beste und schlechteste identisch sind', () => {
    const curve = buildFeverCurve(seasons([ep(1, 1)]), { '1': { a: 8, c: 5 } });
    expect(curve.best?.episodeId).toBe(1);
    expect(curve.worst).toBeNull();
  });

  it('übernimmt eigene Bewertungen und setzt hasOwn', () => {
    const curve = buildFeverCurve(seasons([ep(1, 1, { userRating: 9 }), ep(2, 2)]), {
      '1': { a: 8, c: 5 },
    });
    expect(curve.points[0].own).toBe(9);
    expect(curve.points[1].own).toBeNull();
    expect(curve.hasOwn).toBe(true);
  });

  it('kommt mit leeren Eingaben zurecht', () => {
    expect(buildFeverCurve(undefined, null).points).toHaveLength(0);
    expect(buildFeverCurve([], {}).communityCount).toBe(0);
  });
});

describe('ratingHeatColor', () => {
  it('mappt hohe Werte auf Grün und niedrige auf Rot', () => {
    expect(ratingHeatColor(9.5)).toBe('#22c55e');
    expect(ratingHeatColor(4)).toBe('#ef4444');
  });
});
