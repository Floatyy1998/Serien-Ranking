import { Add, Star, Visibility } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useMemo } from 'react';
import { PosterFrame } from '../../components/ui/media/PosterFrame';
import type { useTheme } from '../../contexts/ThemeContext';
import { pickDisplayRating, useCommunityRatingsMap } from '../../hooks/rating/useCommunityRatings';
import { t } from '../../services/i18n';
import { formatRatingShort } from '../../lib/rating/rating';
import { getOptimalTextColor } from '../../theme/colorUtils';
import type { SearchResult } from './useSearchPage';

export interface SearchResultCardProps {
  item: SearchResult;
  onItemClick: (item: SearchResult) => void;
  onAddToList: (item: SearchResult) => void;
  /** Öffnet die Schnellbewertung für einen Titel, der schon in der Liste ist. */
  onRate: (item: SearchResult) => void;
  /** Nur Filme: hinzufügen (falls nötig) und als gesehen markieren. */
  onMarkWatched: (item: SearchResult) => void;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  isDesktop: boolean;
  isPending?: boolean;
  isWatchedPending?: boolean;
}

const Spinner = ({ size, color }: { size: number; color: string }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
    style={{
      width: size,
      height: size,
      borderWidth: 2,
      borderStyle: 'solid',
      borderTopColor: color,
      borderRightColor: `${color}40`,
      borderBottomColor: `${color}40`,
      borderLeftColor: `${color}40`,
      borderRadius: '50%',
    }}
  />
);

export const SearchResultCard = memo(
  ({
    item,
    onItemClick,
    onAddToList,
    onRate,
    onMarkWatched,
    currentTheme,
    isDesktop,
    isPending = false,
    isWatchedPending = false,
  }: SearchResultCardProps) => {
    const year = useMemo(() => {
      const date = item.release_date || item.first_air_date;
      return date ? new Date(date).getFullYear() : 'TBA';
    }, [item.release_date, item.first_air_date]);

    const label = item.title || item.name || '';
    const typeLabel = item.type === 'series' ? t('Serie') : t('Film');
    // Community-Rating der TV-Rank-Nutzer führt (ab 5 Bewertungen), sonst TMDB.
    const communityMap = useCommunityRatingsMap();
    const displayRating = pickDisplayRating(
      communityMap,
      item.type === 'series' ? 'series' : 'movies',
      item.id,
      item.vote_average
    );
    const accentGradient = `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`;
    // WCAG-optimale Textfarbe auf der Primär-/Akzent-Gradientfläche (Type-Badge, Add-Button)
    const onAccent = useMemo(
      () => getOptimalTextColor(currentTheme.primary),
      [currentTheme.primary]
    );
    const successColor = currentTheme.status.success;
    const onSuccess = useMemo(() => getOptimalTextColor(successColor), [successColor]);

    const busy = isPending || isWatchedPending;
    const ownRating = item.userRating ?? 0;
    const showWatchedButton = item.type === 'movie' && !item.watched;
    const iconSize = isDesktop ? '20px' : '18px';
    const spinnerSize = isDesktop ? 18 : 16;
    const withDesktop = (base: string) => `${base} ${isDesktop ? `${base}--desktop` : ''}`;

    return (
      <div className="search-result-item" style={{ position: 'relative' }}>
        <div className="search-result-poster">
          <button
            type="button"
            className="search-result-poster-btn"
            onClick={() => onItemClick(item)}
            aria-label={t('{type} „{title}" öffnen', { type: typeLabel, title: label })}
          >
            {/* PosterFrame ohne onClick: der native Button bleibt das interaktive
                Element (die Aktions-Buttons sind bewusst Geschwister — nie
                interaktive Elemente verschachteln). Eigener Scrim (50%, Theme-Navy)
                statt PosterFrame-Default (60%), daher scrim={false}. */}
            <PosterFrame
              posterPath={item.poster_path}
              alt=""
              imageSize="w500"
              scrim={false}
              imgClassName="search-result-poster-img"
            >
              {/* Gradient Overlay */}
              <div className="search-result-gradient-overlay" />

              {/* Rating Badge — Community-Wert führt, Primärfarbe markiert ihn */}
              {displayRating && (
                <div
                  className={`search-rating-badge ${isDesktop ? 'search-rating-badge--desktop' : ''}`}
                >
                  <Star
                    style={{
                      fontSize: isDesktop ? '12px' : '10px',
                      color: displayRating.isCommunity ? currentTheme.primary : currentTheme.accent,
                    }}
                  />
                  {displayRating.value.toFixed(1)}
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

          {/* Gesehen-Button (nur Filme, solange nicht gesehen): fügt bei Bedarf
              hinzu, markiert als gesehen und bietet danach die Schnellbewertung an. */}
          {showWatchedButton && (
            <button
              type="button"
              className={withDesktop('search-watched-btn')}
              onClick={(e) => {
                e.stopPropagation();
                if (busy) return;
                onMarkWatched(item);
              }}
              disabled={busy}
              aria-label={
                item.inList
                  ? t('„{title}" als gesehen markieren', { title: label })
                  : t('„{title}" hinzufügen und als gesehen markieren', { title: label })
              }
              style={{
                border: `1px solid ${successColor}99`,
                boxShadow: `0 4px 12px rgba(0, 0, 0, 0.35)`,
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              {isWatchedPending ? (
                <Spinner size={spinnerSize} color={successColor} />
              ) : (
                <Visibility style={{ fontSize: iconSize, color: successColor }} />
              )}
            </button>
          )}

          {/* Rechts unten: Hinzufügen — oder, sobald in der Liste, Bewerten */}
          {!item.inList ? (
            <button
              type="button"
              className={withDesktop('search-add-btn')}
              onClick={(e) => {
                e.stopPropagation();
                if (busy) return;
                onAddToList(item);
              }}
              disabled={busy}
              aria-label={t('„{title}" zur Liste hinzufügen', { title: label })}
              style={{
                background: accentGradient,
                boxShadow: `0 4px 12px ${currentTheme.primary}50`,
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              {isPending ? (
                <Spinner size={spinnerSize} color={onAccent} />
              ) : (
                <Add style={{ fontSize: iconSize, color: onAccent }} />
              )}
            </button>
          ) : (
            <button
              type="button"
              className={withDesktop('search-rate-btn')}
              onClick={(e) => {
                e.stopPropagation();
                onRate(item);
              }}
              aria-label={
                ownRating > 0
                  ? t('„{title}" ist mit {rating} bewertet. Bewertung ändern', {
                      title: label,
                      rating: formatRatingShort(ownRating),
                    })
                  : t('„{title}" bewerten', { title: label })
              }
              style={{
                background: successColor,
                boxShadow: `0 4px 12px ${successColor}50`,
                color: onSuccess,
              }}
            >
              {ownRating > 0 ? (
                <span className="search-rate-value">{formatRatingShort(ownRating)}</span>
              ) : (
                <Star style={{ fontSize: iconSize, color: onSuccess }} />
              )}
            </button>
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
