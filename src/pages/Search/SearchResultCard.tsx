/**
 * SearchResultCard - Memoized card component for search results
 * Displays poster, rating, type badge, add/check button, title, and year.
 */

import { Add, Check, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import { PosterFrame } from '../../components/ui/PosterFrame';
import type { useTheme } from '../../contexts/ThemeContext';
import { getOptimalTextColor } from '../../theme/colorUtils';
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
    const year = useMemo(() => {
      const date = item.release_date || item.first_air_date;
      return date ? new Date(date).getFullYear() : 'TBA';
    }, [item.release_date, item.first_air_date]);

    const label = item.title || item.name || '';
    const typeLabel = item.type === 'series' ? 'Serie' : 'Film';
    const accentGradient = `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`;
    // WCAG-optimale Textfarbe auf der Primär-/Akzent-Gradientfläche (Type-Badge, Add-/Check-Button)
    const onAccent = useMemo(
      () => getOptimalTextColor(currentTheme.primary),
      [currentTheme.primary]
    );

    return (
      <div className="search-result-item" style={{ position: 'relative' }}>
        <div className="search-result-poster">
          <button
            type="button"
            className="search-result-poster-btn"
            onClick={() => onItemClick(item)}
            aria-label={`${typeLabel} „${label}" öffnen`}
          >
            {/* PosterFrame ohne onClick: der native Button bleibt das interaktive
                Element (Add/Check ist bewusst ein Geschwister — nie interaktive
                Elemente verschachteln). Eigener Scrim (50%, Theme-Navy) statt
                PosterFrame-Default (60%), daher scrim={false}. */}
            <PosterFrame
              posterPath={item.poster_path}
              alt=""
              imageSize="w500"
              scrim={false}
              imgClassName="search-result-poster-img"
            >
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
                style={{ background: accentGradient, color: onAccent }}
              >
                {typeLabel}
              </div>
            </PosterFrame>
          </button>

          {/* Add/Check Button */}
          {!item.inList ? (
            <button
              type="button"
              className={`search-add-btn ${isDesktop ? 'search-add-btn--desktop' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (isPending) return;
                onAddToList(item);
              }}
              disabled={isPending}
              aria-label={`„${label}" zur Liste hinzufügen`}
              style={{
                background: accentGradient,
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
                    border: `2px solid ${onAccent}40`,
                    borderTopColor: onAccent,
                    borderRadius: '50%',
                  }}
                />
              ) : (
                <Add
                  style={{
                    fontSize: isDesktop ? '20px' : '18px',
                    color: onAccent,
                  }}
                />
              )}
            </button>
          ) : (
            <div
              className={`search-check-badge ${isDesktop ? 'search-check-badge--desktop' : ''}`}
              role="img"
              aria-label={`„${label}" ist in deiner Liste`}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.status.success}, ${currentTheme.status.success})`,
                boxShadow: `0 4px 12px ${currentTheme.status.success}50`,
              }}
            >
              <Check
                style={{
                  fontSize: isDesktop ? '20px' : '18px',
                  color: getOptimalTextColor(currentTheme.status.success),
                }}
              />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="search-result-title" style={{ color: currentTheme.text.primary }}>
          {label}
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
