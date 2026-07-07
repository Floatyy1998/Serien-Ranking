import type { useTheme } from '../../contexts/ThemeContext';

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

// PLACEHOLDER_SVG + handleImgError leben jetzt zentral in lib/posterPlaceholder
// (drei zuvor identische Kopien konsolidiert); hier re-exportiert für die
// bestehenden Importer dieser Datei.
export { PLACEHOLDER_SVG, handleImgError } from '../../lib/posterPlaceholder';
