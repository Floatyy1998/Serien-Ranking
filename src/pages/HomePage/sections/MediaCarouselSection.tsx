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
  const isMobile = window.innerWidth < 768;
  const cardWidth = isMobile ? '125px' : '215px';

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
          // Trending Top 10 style — cinematic poster with bold gradient number
          if (variant === 'trending') {
            return (
              <motion.div
                key={`${variant}-${item.type}-${item.id}`}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/${item.type}/${item.id}`)}
                style={{
                  cursor: 'pointer',
                  flexShrink: 0,
                  minWidth: cardWidth,
                }}
              >
                {/* Poster with integrated number overlay */}
                <div
                  style={{
                    position: 'relative',
                    marginBottom: '6px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    isolation: 'isolate',
                  }}
                >
                  <img
                    src={item.poster}
                    alt={item.title}
                    decoding="async"
                    style={{
                      width: cardWidth,
                      aspectRatio: '2/3',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  {/* Cinematic vignette at bottom for number contrast */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '55%',
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Gradient-filled ranking number */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '0',
                      left: '6px',
                      fontSize: isMobile ? '48px' : '72px',
                      fontWeight: 900,
                      fontFamily: 'var(--font-display)',
                      lineHeight: 1,
                      background: `linear-gradient(180deg, #ffffff 20%, ${currentTheme.primary}90 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.8))',
                      zIndex: 2,
                      userSelect: 'none',
                      pointerEvents: 'none',
                      letterSpacing: '-2px',
                    }}
                  >
                    {index + 1}
                  </span>

                  {/* Type badge — top left, glassmorphic */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      left: '6px',
                      background:
                        item.type === 'movie'
                          ? 'rgba(255, 193, 7, 0.85)'
                          : `${currentTheme.primary}D9`,
                      color: 'white',
                      borderRadius: '6px',
                      padding: '2px 6px',
                      fontSize: '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      zIndex: 3,
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
                </div>

                {/* Title */}
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: cardWidth,
                  }}
                >
                  {item.title}
                </h3>
                {/* Rating */}
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
              </motion.div>
            );
          }

          // Standard poster cards
          return (
            <motion.div
              key={`${variant}-${item.type}-${item.id}`}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/${item.type}/${item.id}`)}
              style={{
                flexShrink: 0,
                flexGrow: 0,
                cursor: 'pointer',
                width: cardWidth,
                maxWidth: cardWidth,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  marginBottom: '6px',
                  isolation: 'isolate',
                }}
              >
                <img
                  src={item.poster}
                  alt={item.title}
                  decoding="async"
                  style={{
                    width: '100%',
                    aspectRatio: '2/3',
                    objectFit: 'cover',
                    display: 'block',
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
                      fontSize: isMobile ? '9px' : '11px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                      zIndex: 1,
                      maxWidth: 'calc(100% - 8px)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <AutoAwesome style={{ fontSize: isMobile ? '9px' : '11px', flexShrink: 0 }} />
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
