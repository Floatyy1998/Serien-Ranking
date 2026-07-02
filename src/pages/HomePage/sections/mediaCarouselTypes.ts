// Gemeinsame Typen für die Media-Carousel-Karten auf der HomePage.

export interface MediaProvider {
  name: string;
  logo: string;
}

export interface MediaItem {
  id: number;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  rating?: number;
  voteCount?: number;
  releaseDate?: string;
  genres?: string;
  year?: string;
  providers?: MediaProvider[];
}
