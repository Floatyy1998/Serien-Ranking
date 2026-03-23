import type { useTheme } from '../../contexts/ThemeContextDef';

/** Item returned from TMDB discover/search/recommendations endpoints, enriched with local fields */
export interface DiscoverItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  overview?: string;
  vote_average: number;
  vote_count?: number;
  genre_ids?: number[];
  release_date?: string;
  first_air_date?: string;
  media_type?: string;
  popularity?: number;
  backdrop_path?: string | null;
  original_language?: string;
  original_title?: string;
  original_name?: string;
  /** Local enrichment fields */
  type: 'series' | 'movie';
  inList: boolean;
  basedOn?: string;
}

export interface ItemCardProps {
  item: DiscoverItem;
  onItemClick: (item: DiscoverItem) => void;
  onAddToList: (item: DiscoverItem, event?: React.MouseEvent) => void;
  addingItem: string | null;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  isDesktop: boolean;
}

export const PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="100%" height="100%" fill="#1a1a2e"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
    'fill="#666" font-family="Arial" font-size="14">Kein Poster</text></svg>'
)}`;

export const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  (e.target as HTMLImageElement).src = PLACEHOLDER_SVG;
};
