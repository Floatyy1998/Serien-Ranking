import { Add, Check } from '@mui/icons-material';
import { memo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  overview?: string;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  type: 'series' | 'movie';
  inList?: boolean;
}

interface VirtualizedSearchResultsProps {
  results: SearchResult[];
  onItemClick: (item: SearchResult) => void;
  onAddClick?: (item: SearchResult) => void;
  height: number;
}

const SearchResultRow = memo(
  ({
    index,
    style,
    data,
  }: {
    index: number;
    style: React.CSSProperties;
    data: { results: SearchResult[]; onItemClick: (item: SearchResult) => void; onAddClick?: (item: SearchResult) => void };
  }) => {
    const item = data.results[index];

    return (
      <div style={style}>
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            transition: 'all 0.2s',
          }}
        >
          <div
            onClick={() => data.onItemClick(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flex: 1,
              cursor: 'pointer',
            }}
          >
          <img
            src={
              item.poster_path
                ? `https://image.tmdb.org/t/p/w92${item.poster_path}`
                : '/placeholder.jpg'
            }
            alt={item.title || item.name}
            style={{
              width: '50px',
              height: '75px',
              objectFit: 'cover',
              borderRadius: '8px',
              flexShrink: 0,
            }}
          />

          <div style={{ flex: 1, textAlign: 'left' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
              }}
            >
              <h4
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  margin: 0,
                  color: 'rgba(255, 255, 255, 0.95)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {item.title || item.name}
              </h4>

              <span
                style={{
                  fontSize: '10px',
                  padding: '2px 6px',
                  background:
                    item.type === 'series' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                  border:
                    item.type === 'series'
                      ? '1px solid rgba(59, 130, 246, 0.3)'
                      : '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '4px',
                  color:
                    item.type === 'series'
                      ? 'rgba(147, 197, 253, 0.9)'
                      : 'rgba(196, 181, 253, 0.9)',
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {item.type === 'series' ? 'SERIE' : 'FILM'}
              </span>
            </div>

            <p
              style={{
                fontSize: '13px',
                color: 'rgba(255, 255, 255, 0.5)',
                margin: '0 0 8px 0',
              }}
            >
              {item.release_date || item.first_air_date
                ? new Date(item.release_date || item.first_air_date || '').getFullYear()
                : 'TBA'}
              {item.vote_average && item.vote_average > 0 && ` • ★ ${item.vote_average.toFixed(1)}`}
            </p>

            {item.overview && (
              <p
                style={{
                  fontSize: '12px',
                  color: 'rgba(255, 255, 255, 0.6)',
                  margin: 0,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  lineHeight: 1.4,
                }}
              >
                {item.overview}
              </p>
            )}
          </div>
          </div>

          {/* Separate button for add/check */}
          {!item.inList && data.onAddClick ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                data.onAddClick!(item);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                flexShrink: 0,
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <Add style={{ fontSize: '24px', color: 'rgba(255, 255, 255, 0.8)' }} />
            </button>
          ) : item.inList ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                flexShrink: 0,
                background: 'rgba(76, 209, 55, 0.2)',
                borderRadius: '50%',
              }}
            >
              <Check style={{ fontSize: '24px', color: '#4cd137' }} />
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);

SearchResultRow.displayName = 'SearchResultRow';

export const VirtualizedSearchResults: React.FC<VirtualizedSearchResultsProps> = memo(
  ({ results, onItemClick, onAddClick, height }) => {
    return (
      <List
        height={height}
        itemCount={results.length}
        itemSize={120} // Approximate height of each item
        width="100%"
        itemData={{ results, onItemClick, onAddClick }}
      >
        {SearchResultRow}
      </List>
    );
  }
);

VirtualizedSearchResults.displayName = 'VirtualizedSearchResults';
