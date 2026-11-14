export interface RatedPeer {
  id: number;
  title: string;
  poster: string;
  rating: number;
}

export interface RankingView {
  place: number;
  total: number;
  above: RatedPeer[];
  below: RatedPeer[];
  average: number;
  /** Zehn Körbe: Index 0 = Wertungen bis 1, Index 9 = über 9 bis 10. */
  buckets: number[];
}

export const bucketOf = (rating: number): number => Math.min(9, Math.max(0, Math.ceil(rating) - 1));

export function buildRanking(peers: RatedPeer[], value: number, neighbours = 3): RankingView {
  const sorted = [...peers].sort((a, b) => b.rating - a.rating);
  const higher = sorted.filter((peer) => peer.rating > value);
  const lower = sorted.filter((peer) => peer.rating <= value);
  const buckets = new Array<number>(10).fill(0);
  let sum = 0;
  for (const peer of sorted) {
    buckets[bucketOf(peer.rating)] += 1;
    sum += peer.rating;
  }
  return {
    place: higher.length + 1,
    total: sorted.length + 1,
    above: higher.slice(-neighbours),
    below: lower.slice(0, neighbours),
    average: sorted.length > 0 ? sum / sorted.length : 0,
    buckets,
  };
}
