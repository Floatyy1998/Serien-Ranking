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
import { useTheme } from '../../../contexts/ThemeContextDef';

interface MediaItem {
  id: number;
  title: string;
  poster: string;
  type: 'movie' | 'series';
  rating?: number;
  voteCount?: number;
  releaseDate?: string;
  genres?: string;
  year?: string;
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
  const cardWidth = isMobile ? '155px' : '240px';

  if (items.length === 0) return null;

  const sectionIcon =
    variant === 'seasonal' ? (
      <AutoAwesome />
    ) : variant === 'trending' ? (
      <LocalFireDepartment />
    ) : (
      <Star />
    );

  const sectionIconColor = iconColor || currentTheme.accent;

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
          // Trending — Disney+ inspired cinematic cards
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
                <div
                  style={{
                    position: 'relative',
                    borderRadius: '14px',
                    width: cardWidth,
                    aspectRatio: '2/3',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  }}
                >
                  <img
                    src={item.poster}
                    alt={item.title}
                    decoding="async"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                      borderRadius: '14px',
                    }}
                  />

                  {/* Corner cutout with rank number — curved edge */}
                  {(() => {
                    const isDouble = index + 1 >= 10;
                    const size = isMobile ? (isDouble ? 96 : 76) : isDouble ? 135 : 110;
                    return (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: size,
                          height: size,
                          zIndex: 2,
                        }}
                      >
                        <svg
                          width={size}
                          height={size}
                          viewBox={`0 0 ${size} ${size}`}
                          style={{ position: 'absolute', top: 0, left: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id={`corner-grad-${index}`}
                              x1="0%"
                              y1="0%"
                              x2="100%"
                              y2="100%"
                            >
                              <stop offset="0%" stopColor={currentTheme.primary} />
                              <stop
                                offset="100%"
                                stopColor={currentTheme.primaryDark || currentTheme.primary}
                              />
                            </linearGradient>
                          </defs>
                          <path
                            d={`M0,0 L${size},0 Q${size * 0.38},${size * 0.38} 0,${size} Z`}
                            fill={`url(#corner-grad-${index})`}
                          />
                        </svg>
                        <span
                          style={{
                            position: 'absolute',
                            top: '28%',
                            left: '28%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1,
                            fontSize: isMobile ? '34px' : '48px',
                            fontWeight: 900,
                            fontFamily: 'var(--font-display)',
                            lineHeight: 1,
                            color: '#fff',
                            userSelect: 'none',
                            letterSpacing: '-2px',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                          }}
                        >
                          {index + 1}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Full overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      pointerEvents: 'none',
                      borderRadius: '14px',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Top-right: type badge */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        padding: isMobile ? '6px 8px' : '8px 10px',
                      }}
                    >
                      <div
                        style={{
                          background: 'rgba(0,0,0,0.55)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          borderRadius: '8px',
                          padding: isMobile ? '3px 7px' : '4px 10px',
                          fontSize: isMobile ? '10px' : '12px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          color:
                            item.type === 'movie' ? 'rgba(255, 193, 7, 1)' : currentTheme.primary,
                          border: `1px solid ${
                            item.type === 'movie'
                              ? 'rgba(255, 193, 7, 0.3)'
                              : `${currentTheme.primary}50`
                          }`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          pointerEvents: 'auto',
                        }}
                      >
                        {item.type === 'movie' ? (
                          <>
                            <MovieIcon style={{ fontSize: isMobile ? '10px' : '12px' }} />
                            Film
                          </>
                        ) : (
                          <>
                            <Tv style={{ fontSize: isMobile ? '10px' : '12px' }} />
                            Serie
                          </>
                        )}
                      </div>
                    </div>

                    {/* Bottom: gradient + title + meta */}
                    <div
                      style={{
                        background:
                          'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 45%, transparent 100%)',
                        padding: isMobile ? '32px 10px 10px' : '48px 14px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        minHeight: '40%',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: isMobile ? '15px' : '18px',
                          fontWeight: 700,
                          margin: 0,
                          color: '#fff',
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        }}
                      >
                        {item.title}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: isMobile ? '11px' : '12px',
                          color: 'rgba(255,255,255,0.6)',
                          fontWeight: 500,
                        }}
                      >
                        {item.rating != null && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px',
                              color: currentTheme.status.warning,
                            }}
                          >
                            <Star style={{ fontSize: isMobile ? '11px' : '12px' }} />
                            {item.rating.toFixed(1)}
                          </span>
                        )}
                        {item.rating != null && item.year && (
                          <span style={{ opacity: 0.4 }}>&bull;</span>
                        )}
                        {item.year && <span>{item.year}</span>}
                        {item.year && item.genres && <span style={{ opacity: 0.4 }}>&bull;</span>}
                        {item.genres && (
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.genres}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          }

          // Cinematic poster cards (seasonal + top-rated)
          return (
            <motion.div
              key={`${variant}-${item.type}-${item.id}`}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/${item.type}/${item.id}`)}
              style={{
                flexShrink: 0,
                cursor: 'pointer',
                minWidth: cardWidth,
              }}
            >
              <div
                style={{
                  position: 'relative',
                  borderRadius: '14px',
                  width: cardWidth,
                  aspectRatio: '2/3',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
              >
                <img
                  src={item.poster}
                  alt={item.title}
                  decoding="async"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    borderRadius: '14px',
                  }}
                />

                {/* Full overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    pointerEvents: 'none',
                    borderRadius: '14px',
                    overflow: 'hidden',
                  }}
                >
                  {/* Top row: left badge + right type badge */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: isMobile ? '6px 8px' : '8px 10px',
                      gap: '4px',
                    }}
                  >
                    {/* Left: seasonal badge or rating badge */}
                    <div style={{ minWidth: 0, flex: '1 1 auto' }}>
                      {variant === 'seasonal' && (
                        <div
                          style={{
                            background: badgeGradient,
                            color: currentTheme.text.secondary,
                            borderRadius: '8px',
                            padding: isMobile ? '3px 7px' : '4px 10px',
                            fontSize: isMobile ? '10px' : '12px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            maxWidth: '100%',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            pointerEvents: 'auto',
                          }}
                        >
                          <AutoAwesome
                            style={{
                              fontSize: isMobile ? '10px' : '12px',
                              flexShrink: 0,
                            }}
                          />
                          {title}
                        </div>
                      )}
                    </div>

                    {/* Right: type badge */}
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.55)',
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                        borderRadius: '8px',
                        padding: isMobile ? '3px 7px' : '4px 10px',
                        fontSize: isMobile ? '10px' : '12px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        flexShrink: 0,
                        color:
                          item.type === 'movie' ? 'rgba(255, 193, 7, 1)' : currentTheme.primary,
                        border: `1px solid ${
                          item.type === 'movie'
                            ? 'rgba(255, 193, 7, 0.3)'
                            : `${currentTheme.primary}50`
                        }`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        pointerEvents: 'auto',
                      }}
                    >
                      {item.type === 'movie' ? (
                        <>
                          <MovieIcon
                            style={{
                              fontSize: isMobile ? '10px' : '12px',
                            }}
                          />
                          Film
                        </>
                      ) : (
                        <>
                          <Tv
                            style={{
                              fontSize: isMobile ? '10px' : '12px',
                            }}
                          />
                          Serie
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom: gradient + title + rating */}
                  <div
                    style={{
                      background:
                        'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 45%, transparent 100%)',
                      padding: isMobile ? '32px 10px 10px' : '48px 14px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      minHeight: '40%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: isMobile ? '15px' : '18px',
                        fontWeight: 700,
                        margin: 0,
                        color: '#fff',
                        lineHeight: 1.2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                      }}
                    >
                      {item.title}
                    </h3>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: isMobile ? '11px' : '12px',
                        color: 'rgba(255,255,255,0.6)',
                        fontWeight: 500,
                      }}
                    >
                      {item.rating != null && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                            color: currentTheme.status.warning,
                          }}
                        >
                          <Star
                            style={{
                              fontSize: isMobile ? '11px' : '12px',
                            }}
                          />
                          {item.rating.toFixed(1)}
                        </span>
                      )}
                      {item.rating != null && (item.year || item.releaseDate) && (
                        <span style={{ opacity: 0.4 }}>&bull;</span>
                      )}
                      {(item.year || item.releaseDate) && (
                        <span>{item.year || item.releaseDate?.slice(0, 4)}</span>
                      )}
                      {(item.year || item.releaseDate) && item.genres && (
                        <span style={{ opacity: 0.4 }}>&bull;</span>
                      )}
                      {item.genres && (
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.genres}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </HorizontalScrollContainer>
    </section>
  );
});
