import Add from '@mui/icons-material/Add';
import ArrowForward from '@mui/icons-material/ArrowForward';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import Star from '@mui/icons-material/Star';
import Visibility from '@mui/icons-material/Visibility';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useMemo, useState } from 'react';

import { getImageUrl } from '../../utils/imageUrl';
import { useItemProviders } from '../../hooks/provider/useItemProviders';
import { MiniProviderBadges } from '../HomePage/sections/MiniProviderBadges';
import { pickDisplayRating, useCommunityRatingsMap } from '../../hooks/rating/useCommunityRatings';
import type { ItemCardProps } from './discoverItemHelpers';
import { PosterFrame } from '../../components/ui/media/PosterFrame';
import { tapScale } from '../../lib/motion';
import { formatRatingShort } from '../../lib/rating/rating';
import { mediaTargetProps } from '../../lib/interaction/mediaTarget';
import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { mapGenreIds } from '../../utils/genreMap';

export const ItemCard = memo(
  ({
    item,
    onItemClick,
    onAddToList,
    quickStatus,
    onMarkWatched,
    onRate,
    addingItem,
    currentTheme,
    isDesktop,
  }: ItemCardProps) => {
    const [showInfo, setShowInfo] = useState(false);

    const imageUrl = useMemo(() => getImageUrl(item.poster_path, 'w500'), [item.poster_path]);

    // Provider-Logos direkt aufs Poster — Katalog zuerst, sonst TMDB.
    const providers = useItemProviders(item.type, item.id);

    // Community-Rating der TV-Rank-Nutzer führt (ab 5 Bewertungen), sonst TMDB.
    const communityMap = useCommunityRatingsMap();
    const displayRating = pickDisplayRating(
      communityMap,
      item.media_type === 'movie' ? 'movies' : 'series',
      item.id,
      item.vote_average
    );

    const itemTitle = item.title || item.name || '';
    const inList = item.inList || !!quickStatus?.added;
    const ownRating = quickStatus?.ownRating ?? 0;
    const busy = (quickStatus?.busyAction ?? null) !== null;
    const showWatched =
      !!onMarkWatched && item.type === 'movie' && !!quickStatus && !quickStatus.watched;
    const showRate = inList && !!onRate;

    const fitGenreText =
      (item.match ?? 0) >= 60 && item.fitGenres?.length ? mapGenreIds(item.fitGenres) : '';
    const basedOnText = item.friendPick
      ? t('Von {name} empfohlen', { name: item.friendPick })
      : item.basedOn
        ? item.basedOnMore
          ? t('Weil du „{title}" und „{other}" magst', {
              title: item.basedOn,
              other: item.basedOnMore,
            })
          : t('Weil du „{title}" magst', { title: item.basedOn })
        : fitGenreText
          ? t('Trifft deinen Geschmack: {genres}', { genres: fitGenreText })
          : '';
    const matchTier =
      item.match === undefined
        ? null
        : item.match >= 80
          ? 'high'
          : item.match >= 60
            ? 'mid'
            : 'low';

    const handlePosterClick = useCallback(() => {
      if (showInfo) {
        // Already showing info → navigate to detail
        onItemClick(item);
      } else {
        setShowInfo(true);
      }
    }, [showInfo, item, onItemClick]);

    const handleNavigate = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onItemClick(item);
      },
      [item, onItemClick]
    );

    return (
      <div className="discover-item-card" style={{ position: 'relative' }}>
        <PosterFrame
          className="discover-poster-wrap"
          posterUrl={imageUrl}
          alt={item.title || item.name || ''}
          ariaLabel={item.title || item.name}
          onClick={handlePosterClick}
          dataAttrs={mediaTargetProps({
            type: item.type,
            id: item.id,
            title: item.title || item.name,
            poster: item.poster_path,
          })}
          scrimColor={`${currentTheme.background.default}cc`}
          boxShadow={`0 6px 20px ${currentTheme.background.default}80`}
          style={{ marginBottom: '10px' }}
        >
          <div className="discover-badges">
            {matchTier && !showInfo && (
              <div
                className={`discover-match discover-match--${matchTier}`}
                aria-label={t('{n} % Übereinstimmung mit deinem Geschmack', {
                  n: item.match ?? 0,
                })}
                title={t('{n} % Übereinstimmung mit deinem Geschmack', { n: item.match ?? 0 })}
                style={{
                  background: `${currentTheme.background.default}d9`,
                  color:
                    matchTier === 'high'
                      ? currentTheme.status.success
                      : matchTier === 'mid'
                        ? currentTheme.text.primary
                        : currentTheme.text.muted,
                  borderColor:
                    matchTier === 'high'
                      ? `${currentTheme.status.success}80`
                      : 'var(--glass-border-light)',
                }}
              >
                <AutoAwesome style={{ fontSize: '13px' }} />
                {t('{n} %', { n: item.match ?? 0 })}
              </div>
            )}
            {displayRating && (
              <div
                className="discover-rating"
                style={{
                  background: `linear-gradient(135deg, ${currentTheme.background.default}d9, ${currentTheme.background.default}e6)`,
                }}
              >
                <Star
                  style={{
                    fontSize: '14px',
                    color: displayRating.isCommunity ? currentTheme.primary : currentTheme.accent,
                  }}
                />
                {displayRating.value.toFixed(1)}
              </div>
            )}
          </div>

          {/* Glassmorphic Info Overlay */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '65%',
                  background: `${currentTheme.background.default}bf`,
                  backdropFilter: 'var(--glass-filter-lg)',
                  WebkitBackdropFilter: 'var(--glass-filter-lg)',
                  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 3,
                  borderTop: '1px solid var(--glass-border-medium)',
                }}
              >
                {/* Close handle */}
                <button
                  type="button"
                  aria-label={t('Info schließen')}
                  className="discover-info-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfo(false);
                  }}
                  style={{
                    width: '44px',
                    height: '20px',
                    padding: 0,
                    border: 'none',
                    background: 'transparent',
                    margin: '0 auto 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span
                    style={{
                      display: 'block',
                      width: '32px',
                      height: '4px',
                      borderRadius: 'var(--radius-full)',
                      background: 'var(--glass-border-medium)',
                    }}
                  />
                </button>

                {/* Title */}
                <h3
                  style={{
                    fontSize: 'var(--text-base)',
                    fontWeight: 700,
                    margin: '0 0 6px',
                    color: currentTheme.text.secondary,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title || item.name}
                </h3>

                {/* Overview */}
                <p
                  style={{
                    fontSize: 'var(--text-sm)',
                    lineHeight: 1.5,
                    color: currentTheme.text.secondary,
                    margin: 0,
                    flex: 1,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.overview || t('Keine Beschreibung verfügbar.')}
                </p>

                {/* CTA Button */}
                <motion.button
                  whileTap={tapScale}
                  onClick={handleNavigate}
                  style={{
                    marginTop: '10px',
                    padding: '8px 0',
                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                    border: 'none',
                    borderRadius: '10px',
                    color: getOptimalTextColor(currentTheme.primary),
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  {t('Details')}
                  <ArrowForward style={{ fontSize: '14px' }} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {providers.length > 0 && !showInfo && (
            <div
              className="discover-provider-badges"
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'absolute',
                left: '10px',
                bottom: '10px',
                zIndex: 2,
                maxWidth: 'calc(100% - 68px)',
                overflow: 'hidden',
              }}
            >
              <MiniProviderBadges
                providers={providers}
                isMobile={!isDesktop}
                textColor={currentTheme.text.primary}
                searchTitle={item.title || item.name || ''}
              />
            </div>
          )}

          {showWatched && !showInfo && (
            <button
              type="button"
              className="discover-watched-btn"
              aria-label={
                inList
                  ? t('„{title}" als gesehen markieren', { title: itemTitle })
                  : t('„{title}" hinzufügen und als gesehen markieren', { title: itemTitle })
              }
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation();
                onMarkWatched?.(item, inList, e);
              }}
              style={{
                border: `1px solid ${currentTheme.status.success}99`,
                color: currentTheme.status.success,
                cursor: busy ? 'wait' : 'pointer',
                opacity: quickStatus?.busyAction === 'watched' ? 0.7 : 1,
              }}
            >
              <Visibility style={{ fontSize: '20px' }} />
            </button>
          )}

          {showRate && !showInfo && (
            <button
              type="button"
              className="discover-rate-btn"
              aria-label={
                ownRating > 0
                  ? t('„{title}" ist mit {rating} bewertet. Bewertung ändern', {
                      title: itemTitle,
                      rating: formatRatingShort(ownRating),
                    })
                  : t('„{title}" bewerten', { title: itemTitle })
              }
              onClick={(e) => {
                e.stopPropagation();
                onRate?.(item, ownRating, e);
              }}
              style={{
                background: currentTheme.status.success,
                color: getOptimalTextColor(currentTheme.status.success),
              }}
            >
              {ownRating > 0 ? (
                <span className="discover-rate-value">{formatRatingShort(ownRating)}</span>
              ) : (
                <Star style={{ fontSize: '22px' }} />
              )}
            </button>
          )}

          {!inList && !showInfo && (
            <Tooltip title={t('Zur Liste hinzufügen')} arrow>
              <button
                className="discover-add-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToList(item, e);
                }}
                disabled={addingItem === `${item.type}-${item.id}`}
                style={{
                  position: 'absolute',
                  bottom: '10px',
                  right: '10px',
                  width: '44px',
                  height: '44px',
                  background:
                    addingItem === `${item.type}-${item.id}`
                      ? 'var(--glass-heavy)'
                      : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: 'none',
                  cursor: addingItem === `${item.type}-${item.id}` ? 'wait' : 'pointer',
                  transition: 'all 0.2s ease',
                  padding: 0,
                  boxShadow: `0 4px 12px ${currentTheme.primary}50`,
                  zIndex: 2,
                }}
              >
                <Add
                  style={{
                    fontSize: '20px',
                    color:
                      addingItem === `${item.type}-${item.id}`
                        ? currentTheme.text.secondary
                        : getOptimalTextColor(currentTheme.primary),
                    opacity: addingItem === `${item.type}-${item.id}` ? 0.5 : 1,
                  }}
                />
              </button>
            </Tooltip>
          )}
        </PosterFrame>

        <h3
          style={{
            fontSize: isDesktop ? 'var(--text-base)' : 'var(--text-sm)',
            fontWeight: 700,
            margin: 0,
            color: currentTheme.text.secondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.3,
          }}
        >
          {item.title || item.name}
        </h3>

        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: currentTheme.text.muted,
            margin: '4px 0 0 0',
            fontWeight: 500,
          }}
        >
          {item.release_date || item.first_air_date
            ? new Date(item.release_date || item.first_air_date || '').getFullYear()
            : 'TBA'}
        </p>

        {basedOnText && (
          <p
            title={basedOnText}
            style={{
              fontSize: 'var(--text-xs)',
              color: currentTheme.primary,
              margin: '4px 0 0 0',
              fontWeight: 600,
              lineHeight: 1.3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {basedOnText}
          </p>
        )}
      </div>
    );
  }
);

ItemCard.displayName = 'ItemCard';
