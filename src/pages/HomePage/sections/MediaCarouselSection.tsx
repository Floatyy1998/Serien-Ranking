import {
  AutoAwesome,
  LocalFireDepartment,
  Movie as MovieIcon,
  Star,
  Tv,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HorizontalScrollContainer, SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';

interface MediaItem {
  id: number;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  rating?: number;
  voteCount?: number;
  releaseDate?: string;
}

interface MediaCarouselSectionProps {
  variant: 'seasonal' | 'trending' | 'top-rated';
  items: MediaItem[];
  title: string;
  onSeeAll?: () => void;
  /** Only for seasonal */
  badgeGradient?: string;
  iconColor?: string;
}

export const MediaCarouselSection = React.memo(function MediaCarouselSection({
  variant,
  items,
  title,
  onSeeAll,
  badgeGradient,
  iconColor,
}: MediaCarouselSectionProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  if (items.length === 0) return null;

  const sectionIcon =
    variant === 'seasonal' ? (
      <AutoAwesome />
    ) : variant === 'trending' ? (
      <LocalFireDepartment />
    ) : (
      <Star />
    );

  const sectionIconColor =
    variant === 'seasonal'
      ? iconColor || currentTheme.primary
      : variant === 'trending'
        ? currentTheme.status.error
        : currentTheme.status.warning;

  return (
    <section style={{ marginBottom: '32px' }}>
      <SectionHeader
        icon={sectionIcon}
        iconColor={sectionIconColor}
        title={title}
        onSeeAll={onSeeAll}
      />
      <HorizontalScrollContainer gap={14} style={{ padding: '0 20px' }}>
        {items.map((item, index) => {
          // Netflix Top 10 style for trending
          if (variant === 'trending') {
            return (
              <motion.div
                key={`${variant}-${item.type}-${item.id}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(`/${item.type}/${item.id}`)}
                style={{
                  minWidth: '150px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-end',
                }}
              >
                {/* Large ranking number */}
                <span
                  style={{
                    fontSize: '72px',
                    fontWeight: 900,
                    fontFamily: 'var(--font-display)',
                    lineHeight: 0.8,
                    color: 'transparent',
                    WebkitTextStroke: '2px rgba(255, 255, 255, 0.2)',
                    marginRight: '-18px',
                    zIndex: 0,
                    position: 'relative',
                    userSelect: 'none',
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </span>
                {/* Poster */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <img
                    src={item.poster}
                    alt={item.title}
                    decoding="async"
                    style={{
                      width: '100px',
                      aspectRatio: '2/3',
                      objectFit: 'cover',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
                    }}
                  />
                  {/* Type badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '4px',
                      background:
                        item.type === 'movie'
                          ? 'rgba(255, 193, 7, 0.9)'
                          : `${currentTheme.primary}E6`,
                      color: 'white',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {item.type === 'movie' ? (
                      <>
                        <MovieIcon style={{ fontSize: '10px' }} />
                        Film
                      </>
                    ) : (
                      <>
                        <Tv style={{ fontSize: '10px' }} />
                        Serie
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          }

          // Featured first card (wider, backdrop-style) only for seasonal
          if (index === 0 && variant === 'seasonal') {
            return (
              <motion.div
                key={`${variant}-${item.type}-${item.id}`}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/${item.type}/${item.id}`)}
                style={{ minWidth: '240px', cursor: 'pointer' }}
              >
                <div
                  style={{
                    position: 'relative',
                    marginBottom: '8px',
                    borderRadius: '14px',
                    overflow: 'hidden',
                    aspectRatio: '16/10',
                  }}
                >
                  <img
                    src={item.poster}
                    alt={item.title}
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                  {/* Gradient overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to top, rgba(6, 9, 15, 0.9) 0%, rgba(6, 9, 15, 0.1) 50%, transparent 100%)',
                    }}
                  />
                  {/* Info overlaid at bottom */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      padding: '12px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        margin: '0 0 4px',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {item.title}
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '13px',
                      }}
                    >
                      <Star style={{ fontSize: '13px', color: '#ffd43b' }} />
                      <span>{item.rating ? item.rating.toFixed(1) : 'N/A'}</span>
                    </div>
                  </div>
                  {/* Seasonal badge */}
                  {variant === 'seasonal' && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        background: badgeGradient,
                        color: 'white',
                        borderRadius: '8px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <AutoAwesome style={{ fontSize: '11px' }} />
                      {title}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          }

          // Standard poster cards for remaining items
          return (
            <motion.div
              key={`${variant}-${item.type}-${item.id}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/${item.type}/${item.id}`)}
              style={{ minWidth: '130px', cursor: 'pointer' }}
            >
              <div style={{ position: 'relative', marginBottom: '6px' }}>
                <img
                  src={item.poster}
                  alt={item.title}
                  decoding="async"
                  style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    objectFit: 'cover',
                    borderRadius: '10px',
                  }}
                />

                {variant === 'seasonal' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      left: '4px',
                      background: badgeGradient,
                      color: 'white',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      zIndex: 1,
                    }}
                  >
                    <AutoAwesome style={{ fontSize: '11px' }} />
                    {title}
                  </div>
                )}

                {variant === 'top-rated' && item.rating != null && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      background: 'rgba(10, 14, 26, 0.75)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '8px',
                      padding: '4px 6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <Star style={{ fontSize: '14px', color: currentTheme.status.warning }} />
                    {item.rating.toFixed(1)}
                  </div>
                )}

                {variant === 'seasonal' && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '4px',
                      background:
                        item.type === 'movie'
                          ? 'rgba(255, 193, 7, 0.9)'
                          : `${currentTheme.primary}E6`,
                      color: 'white',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {item.type === 'movie' ? (
                      <>
                        <MovieIcon style={{ fontSize: '11px' }} />
                        Film
                      </>
                    ) : (
                      <>
                        <Tv style={{ fontSize: '11px' }} />
                        Serie
                      </>
                    )}
                  </div>
                )}
              </div>
              <h3
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  margin: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.title}
              </h3>
              {variant !== 'top-rated' && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '13px',
                    color: currentTheme.text.muted,
                    marginTop: '2px',
                  }}
                >
                  <Star style={{ fontSize: '13px', color: '#ffd43b' }} />
                  <span>{item.rating ? item.rating.toFixed(1) : 'N/A'}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </HorizontalScrollContainer>
    </section>
  );
});
