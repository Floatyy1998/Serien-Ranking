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
                {/* Poster wrapper with overlay */}
                <div
                  style={{
                    position: 'relative',
                    marginBottom: '6px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    width: cardWidth,
                    aspectRatio: '2/3',
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
                      display: 'block',
                    }}
                  />

                  {/* Overlay layer: vignette + number + badge */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      pointerEvents: 'none',
                    }}
                  >
                    {/* Top: type badge */}
                    <div style={{ padding: '6px' }}>
                      <div
                        style={{
                          background:
                            item.type === 'movie'
                              ? 'rgba(255, 193, 7, 0.85)'
                              : `${currentTheme.primary}D9`,
                          color: 'white',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          pointerEvents: 'auto',
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

                    {/* Bottom: vignette + number */}
                    <div
                      style={{
                        background:
                          'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
                        padding: '0 6px 4px',
                        display: 'flex',
                        alignItems: 'flex-end',
                        minHeight: '55%',
                      }}
                    >
                      <span
                        style={{
                          fontSize: isMobile ? '48px' : '72px',
                          fontWeight: 900,
                          fontFamily: 'var(--font-display)',
                          lineHeight: 1,
                          background: `linear-gradient(180deg, #ffffff 20%, ${currentTheme.primary}90 100%)`,
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                          filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.8))',
                          userSelect: 'none',
                          letterSpacing: '-2px',
                        }}
                      >
                        {index + 1}
                      </span>
                    </div>
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

          // Standard poster cards (seasonal + top-rated)
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
              {/* Poster wrapper with overlay */}
              <div
                style={{
                  position: 'relative',
                  marginBottom: '6px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  width: '100%',
                  aspectRatio: '2/3',
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
                    display: 'block',
                  }}
                />

                {/* Overlay layer for badges */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '4px',
                    pointerEvents: 'none',
                  }}
                >
                  {/* Top row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: variant === 'top-rated' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    {variant === 'seasonal' && (
                      <div
                        style={{
                          background: badgeGradient,
                          color: 'white',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: isMobile ? '9px' : '11px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          pointerEvents: 'auto',
                        }}
                      >
                        <AutoAwesome
                          style={{ fontSize: isMobile ? '9px' : '11px', flexShrink: 0 }}
                        />
                        {title}
                      </div>
                    )}
                    {variant === 'top-rated' && item.rating != null && (
                      <div
                        style={{
                          background: 'rgba(10, 14, 26, 0.75)',
                          backdropFilter: 'blur(8px)',
                          borderRadius: '8px',
                          padding: '4px 6px',
                          fontSize: '14px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          color: 'white',
                          pointerEvents: 'auto',
                        }}
                      >
                        <Star style={{ fontSize: '14px', color: currentTheme.status.warning }} />
                        {item.rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  {/* Bottom row */}
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    {variant === 'seasonal' && (
                      <div
                        style={{
                          background:
                            item.type === 'movie'
                              ? 'rgba(255, 193, 7, 0.9)'
                              : `${currentTheme.primary}E6`,
                          color: 'white',
                          borderRadius: '6px',
                          padding: '2px 6px',
                          fontSize: '11px',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                          backdropFilter: 'blur(10px)',
                          pointerEvents: 'auto',
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
                </div>
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
