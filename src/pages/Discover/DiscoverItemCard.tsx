import Add from '@mui/icons-material/Add';
import ArrowForward from '@mui/icons-material/ArrowForward';
import Star from '@mui/icons-material/Star';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useMemo, useState } from 'react';

import { getImageUrl } from '../../utils/imageUrl';
import type { ItemCardProps } from './discoverItemHelpers';
import { PosterFrame } from '../../components/ui/PosterFrame';
import { tapScale } from '../../lib/motion';
import { getOptimalTextColor } from '../../theme/colorUtils';

// Premium memoized item card
export const ItemCard = memo(
  ({ item, onItemClick, onAddToList, addingItem, currentTheme, isDesktop }: ItemCardProps) => {
    const [showInfo, setShowInfo] = useState(false);

    const imageUrl = useMemo(() => getImageUrl(item.poster_path, 'w500'), [item.poster_path]);

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
          scrimColor={`${currentTheme.background.default}cc`}
          boxShadow={`0 6px 20px ${currentTheme.background.default}80`}
          style={{ marginBottom: '10px' }}
        >
          {item.vote_average > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '5px 10px',
                background: `linear-gradient(135deg, ${currentTheme.background.default}d9, ${currentTheme.background.default}e6)`,
                backdropFilter: 'var(--blur-sm)',
                WebkitBackdropFilter: 'var(--blur-sm)',
                borderRadius: '10px',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                border: '1px solid var(--glass-border-light)',
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
                  background: `${currentTheme.background.default}bf`,
                  backdropFilter: 'var(--blur-lg) saturate(1.4)',
                  WebkitBackdropFilter: 'var(--blur-lg) saturate(1.4)',
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
                  aria-label="Info schließen"
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
                  {item.overview || 'Keine Beschreibung verfügbar.'}
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

        {item.basedOn && (
          <p
            title={`Weil du „${item.basedOn}" magst`}
            style={{
              fontSize: 'var(--text-xs)',
              color: currentTheme.primary,
              margin: '4px 0 0 0',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Weil du „{item.basedOn}" magst
          </p>
        )}
      </div>
    );
  }
);

ItemCard.displayName = 'ItemCard';
