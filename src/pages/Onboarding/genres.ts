/**
 * Kuratierte Top-Genres fuer das Onboarding. Statt der vollen TMDB-Liste (~30
 * Genres) zeigen wir hier 8 klar erkennbare Buckets mit jeweils einem TV- und
 * einem Movie-Genre-Mapping, damit Suggestions sowohl Serien als auch Filme
 * abdecken.
 */
export interface CuratedGenre {
  slug: string;
  label: string;
  emoji: string;
  tvId: number;
  movieId: number;
}

export const CURATED_GENRES: CuratedGenre[] = [
  { slug: 'drama', label: 'Drama', emoji: '🎭', tvId: 18, movieId: 18 },
  { slug: 'comedy', label: 'Komödie', emoji: '😂', tvId: 35, movieId: 35 },
  { slug: 'action', label: 'Action', emoji: '💥', tvId: 10759, movieId: 28 },
  { slug: 'crime', label: 'Krimi', emoji: '🔍', tvId: 80, movieId: 80 },
  { slug: 'scifi', label: 'Sci-Fi', emoji: '🚀', tvId: 10765, movieId: 878 },
  { slug: 'animation', label: 'Animation', emoji: '🎨', tvId: 16, movieId: 16 },
  { slug: 'horror', label: 'Mystery', emoji: '👻', tvId: 9648, movieId: 27 },
  { slug: 'romance', label: 'Romanze', emoji: '💕', tvId: 18, movieId: 10749 },
];
