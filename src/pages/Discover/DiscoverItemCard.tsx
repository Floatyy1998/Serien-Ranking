import Add from '@mui/icons-material/Add';
import ArrowForward from '@mui/icons-material/ArrowForward';
import Star from '@mui/icons-material/Star';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useMemo, useState } from 'react';

import type { ItemCardProps } from './discoverItemHelpers';
import { handleImgError } from './discoverItemHelpers';

// Premium memoized item card
export const ItemCard = memo(
  ({ item, onItemClick, onAddToList, addingItem, currentTheme, isDesktop }: ItemCardProps) => {
    const [showInfo, setShowInfo] = useState(false);

    const imageUrl = useMemo(() => {
      if (!item.poster_path) return '/placeholder.jpg';
      return `https://image.tmdb.org/t/p/w500${item.poster_path}`;
    }, [item.poster_path]);

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
        <div
          className="discover-poster-wrap"
          onClick={handlePosterClick}
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
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                zIndex: 2,
              }}
            >
              <Star
                style={{
                  fontSize: '14px',
                  color: currentTheme.accent,
                }}
              />
              {item.vote_average.toFixed(1)}
            </div>
          )}

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
                  background: 'rgba(10, 14, 26, 0.75)',
                  backdropFilter: 'blur(20px) saturate(1.4)',
                  WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
                  borderRadius: '16px 16px 0 0',
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 3,
                  borderTop: '1px solid rgba(255, 255, 255, 0.12)',
                }}
              >
                {/* Close handle */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowInfo(false);
                  }}
                  style={{
                    width: '32px',
                    height: '4px',
                    borderRadius: '2px',
                    background: 'rgba(255, 255, 255, 0.3)',
                    margin: '0 auto 10px',
                    cursor: 'pointer',
                  }}
                />

                {/* Title */}
                <h3
                  style={{
                    fontSize: '14px',
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
                    fontSize: '12px',
                    lineHeight: 1.5,
                    color: currentTheme.text.muted,
                    margin: 0,
                    flex: 1,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.overview || 'Keine Beschreibung verfügbar.'}
                </p>

                {/* CTA Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNavigate}
                  style={{
                    marginTop: '10px',
                    padding: '8px 0',
                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                    border: 'none',
                    borderRadius: '10px',
                    color: currentTheme.text.secondary,
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  Details
                  <ArrowForward style={{ fontSize: '14px' }} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {!item.inList && !showInfo && (
            <Tooltip title="Zur Liste hinzufügen" arrow>
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
                  width: '34px',
                  height: '34px',
                  background:
                    addingItem === `${item.type}-${item.id}`
                      ? 'rgba(255, 255, 255, 0.1)'
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
                    color: currentTheme.text.secondary,
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
            fontSize: '13px',
            color: currentTheme.text.muted,
            margin: '4px 0 0 0',
            fontWeight: 500,
          }}
        >
          {item.release_date || item.first_air_date
            ? new Date(item.release_date || item.first_air_date || '').getFullYear()
            : 'TBA'}
        </p>
      </div>
    );
  }
);

ItemCard.displayName = 'ItemCard';
