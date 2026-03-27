export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Abenteuer',
  16: 'Animation',
  35: 'Comedy',
  80: 'Krimi',
  99: 'Dokumentation',
  18: 'Drama',
  10751: 'Familie',
  14: 'Fantasy',
  36: 'Historie',
  27: 'Horror',
  10402: 'Musik',
  9648: 'Mystery',
  10749: 'Romantik',
  878: 'Sci-Fi',
  10770: 'TV-Film',
  53: 'Thriller',
  10752: 'Krieg',
  37: 'Western',
  10759: 'Action und Abenteuer',
  10762: 'Kids',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
};

export function mapGenreIds(genreIds: number[], max = 2): string {
  return genreIds
    .map((id) => GENRE_MAP[id])
    .filter(Boolean)
    .slice(0, max)
    .join(', ');
}
