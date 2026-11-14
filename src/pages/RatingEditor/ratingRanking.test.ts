import { describe, expect, it } from 'vitest';
import { bucketOf, buildRanking, type RatedPeer } from './ratingRanking';

const peer = (id: number, rating: number): RatedPeer => ({
  id,
  title: `Titel ${id}`,
  poster: '',
  rating,
});

describe('buildRanking', () => {
  const peers = [peer(1, 9.5), peer(2, 9), peer(3, 8), peer(4, 7.2), peer(5, 4)];

  it('zählt nur besser bewertete Titel vor den eigenen Platz', () => {
    const view = buildRanking(peers, 8);
    expect(view.place).toBe(3);
    expect(view.total).toBe(6);
  });

  it('liefert die direkten Nachbarn in Ranglisten-Reihenfolge', () => {
    const view = buildRanking(peers, 8.5, 1);
    expect(view.above.map((p) => p.id)).toEqual([2]);
    expect(view.below.map((p) => p.id)).toEqual([3]);
  });

  it('verteilt die Wertungen auf zehn Körbe und bildet den Schnitt', () => {
    const view = buildRanking(peers, 0);
    expect(view.buckets).toEqual([0, 0, 0, 1, 0, 0, 0, 2, 1, 1]);
    expect(view.average).toBeCloseTo(7.54, 2);
  });

  it('kommt mit einer leeren Sammlung zurecht', () => {
    const view = buildRanking([], 7);
    expect(view.place).toBe(1);
    expect(view.total).toBe(1);
    expect(view.average).toBe(0);
  });
});

describe('bucketOf', () => {
  it('ordnet Grenzwerte dem unteren Korb zu', () => {
    expect(bucketOf(8)).toBe(7);
    expect(bucketOf(8.1)).toBe(8);
    expect(bucketOf(0.4)).toBe(0);
    expect(bucketOf(10)).toBe(9);
  });
});
