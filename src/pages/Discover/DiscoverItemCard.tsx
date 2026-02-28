import { Add, Star } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { memo, useMemo } from 'react';
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

export const PLACEHOLDER_SVG = `data:image/svg+xml,${encodeURIComponent(
  '<svg width="300" height="450" xmlns="http://www.w3.org/2000/svg">' +
    '<rect width="100%" height="100%" fill="#1a1a2e"/>' +
    '<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" ' +
    'fill="#666" font-family="Arial" font-size="14">Kein Poster</text></svg>'
)}`;

export const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
  (e.target as HTMLImageElement).src = PLACEHOLDER_SVG;
};

// Premium memoized item card
export const ItemCard = memo(
  ({ item, onItemClick, onAddToList, addingItem, currentTheme, isDesktop }: ItemCardProps) => {
    const imageUrl = useMemo(() => {
      if (!item.poster_path) return '/placeholder.jpg';
      return `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    }, [item.poster_path]);

    return (
      <div className="discover-item-card" style={{ position: 'relative' }}>
        <div
          className="discover-poster-wrap"
          onClick={() => onItemClick(item)}
          style={{
            width: '100%',
            aspectRatio: '2/3',
            position: 'relative',
            borderRadius: '14px',
            overflow: 'hidden',
            marginBottom: '10px',
            cursor: 'pointer',
            boxShadow: `0 6px 20px ${currentTheme.background.default}80`,
          }}
        >
          <img
            src={imageUrl}
            alt={item.title || item.name}
            onError={handleImgError}
            loading="lazy"
            decoding="async"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Premium gradient overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
              pointerEvents: 'none',
            }}
          />

          {item.vote_average > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '5px 10px',
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(20, 20, 40, 0.9))',
                backdropFilter: 'blur(10px)',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Star
                style={{
                  fontSize: '13px',
                  color: '#ffc107',
                }}
              />
              {item.vote_average.toFixed(1)}
            </div>
          )}

          {!item.inList && (
            <Tooltip title="Zur Liste hinzufügen" arrow>
              <button
                className="discover-add-btn"
                onClick={(e) => onAddToList(item, e)}
                disabled={addingItem === `${item.type}-${item.id}`}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  width: '34px',
                  height: '34px',
                  background:
                    addingItem === `${item.type}-${item.id}`
                      ? 'rgba(255, 255, 255, 0.1)'
                      : `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: addingItem === `${item.type}-${item.id}` ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                  boxShadow: `0 4px 12px ${currentTheme.primary}50`,
                }}
              >
                <Add
                  style={{
                    fontSize: '20px',
                    color: 'white',
                    opacity: addingItem === `${item.type}-${item.id}` ? 0.5 : 1,
                  }}
                />
              </button>
            </Tooltip>
          )}
        </div>

        <h2
          style={{
            fontSize: isDesktop ? '14px' : '13px',
            fontWeight: 700,
            margin: 0,
            color: currentTheme.text.primary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.3,
          }}
        >
          {item.title || item.name}
        </h2>

        <p
          style={{
            fontSize: '12px',
            color: currentTheme.text.muted,
            margin: '4px 0 0 0',
            fontWeight: 500,
          }}
        >
          {item.release_date || item.first_air_date
            ? new Date((item.release_date || item.first_air_date)!).getFullYear()
            : 'TBA'}
        </p>
      </div>
    );
  }
);

ItemCard.displayName = 'ItemCard';
