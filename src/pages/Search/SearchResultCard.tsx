/**
 * SearchResultCard - Memoized card component for search results
 * Displays poster, rating, type badge, add/check button, title, and year.
 */

import { Add, Check, Star } from '@mui/icons-material';
import { memo, useMemo } from 'react';
import type { useTheme } from '../../contexts/ThemeContext';
import type { SearchResult } from './useSearchPage';

export interface SearchResultCardProps {
  item: SearchResult;
  onItemClick: (item: SearchResult) => void;
  onAddToList: (item: SearchResult) => void;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  isDesktop: boolean;
}

export const SearchResultCard = memo(
  ({ item, onItemClick, onAddToList, currentTheme, isDesktop }: SearchResultCardProps) => {
    const imageUrl = useMemo(() => {
      if (!item.poster_path) return '/placeholder.jpg';
      return `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    }, [item.poster_path]);

    const year = useMemo(() => {
      const date = item.release_date || item.first_air_date;
      return date ? new Date(date).getFullYear() : 'TBA';
    }, [item.release_date, item.first_air_date]);

    const typeBadgeGradient =
      item.type === 'series'
        ? `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #667eea))`
        : `linear-gradient(135deg, ${currentTheme.status.error}, #ff9a00)`;

    return (
      <div className="search-result-item" style={{ position: 'relative' }}>
        <div className="search-result-poster" onClick={() => onItemClick(item)}>
          <img
            src={imageUrl}
            alt={item.title || item.name}
            loading="lazy"
            decoding="async"
            className="search-result-poster-img"
          />

          {/* Gradient Overlay */}
          <div className="search-result-gradient-overlay" />

          {/* Rating Badge */}
          {item.vote_average && item.vote_average > 0 && (
            <div
              className={`search-rating-badge ${isDesktop ? 'search-rating-badge--desktop' : ''}`}
            >
              <Star
                style={{
                  fontSize: isDesktop ? '12px' : '10px',
                  color: currentTheme.status.warning,
                }}
              />
              {item.vote_average.toFixed(1)}
            </div>
          )}

          {/* Type Badge */}
          <div
            className={`search-type-badge ${isDesktop ? 'search-type-badge--desktop' : ''}`}
            style={{ background: typeBadgeGradient }}
          >
            {item.type === 'series' ? 'Serie' : 'Film'}
          </div>

          {/* Add/Check Button */}
          {!item.inList ? (
            <button
              className={`search-add-btn ${isDesktop ? 'search-add-btn--desktop' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                onAddToList(item);
              }}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`,
                boxShadow: `0 4px 12px ${currentTheme.primary}50`,
              }}
            >
              <Add style={{ fontSize: isDesktop ? '20px' : '18px', color: 'white' }} />
            </button>
          ) : (
            <div
              className={`search-check-badge ${isDesktop ? 'search-check-badge--desktop' : ''}`}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.status.success}, #22c55e)`,
                boxShadow: `0 4px 12px ${currentTheme.status.success}50`,
              }}
            >
              <Check style={{ fontSize: isDesktop ? '20px' : '18px', color: 'white' }} />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="search-result-title" style={{ color: currentTheme.text.primary }}>
          {item.title || item.name}
        </h3>

        {/* Year */}
        <p className="search-result-year" style={{ color: currentTheme.text.muted }}>
          {year}
        </p>
      </div>
    );
  }
);

SearchResultCard.displayName = 'SearchResultCard';
