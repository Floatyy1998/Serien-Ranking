/**
 * SearchResultCard - Memoized card component for search results
 * Displays poster, rating, type badge, add/check button, title, and year.
 */

import { Add, Check, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import type { useTheme } from '../../contexts/ThemeContextDef';
import type { SearchResult } from './useSearchPage';

export interface SearchResultCardProps {
  item: SearchResult;
  onItemClick: (item: SearchResult) => void;
  onAddToList: (item: SearchResult) => void;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  isDesktop: boolean;
  isPending?: boolean;
}

export const SearchResultCard = memo(
  ({
    item,
    onItemClick,
    onAddToList,
    currentTheme,
    isDesktop,
    isPending = false,
  }: SearchResultCardProps) => {
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
        ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
        : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`;

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
                  color: currentTheme.accent,
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
                if (isPending) return;
                onAddToList(item);
              }}
              disabled={isPending}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                boxShadow: `0 4px 12px ${currentTheme.primary}50`,
                cursor: isPending ? 'wait' : 'pointer',
              }}
            >
              {isPending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                  style={{
                    width: isDesktop ? 18 : 16,
                    height: isDesktop ? 18 : 16,
                    border: `2px solid ${currentTheme.text.secondary}40`,
                    borderTopColor: currentTheme.text.secondary,
                    borderRadius: '50%',
                  }}
                />
              ) : (
                <Add
                  style={{
                    fontSize: isDesktop ? '20px' : '18px',
                    color: currentTheme.text.secondary,
                  }}
                />
              )}
            </button>
          ) : (
            <div
              className={`search-check-badge ${isDesktop ? 'search-check-badge--desktop' : ''}`}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.status.success}, ${currentTheme.status?.success || '#22c55e'})`,
                boxShadow: `0 4px 12px ${currentTheme.status.success}50`,
              }}
            >
              <Check
                style={{
                  fontSize: isDesktop ? '20px' : '18px',
                  color: currentTheme.text.secondary,
                }}
              />
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
