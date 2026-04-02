/**
 * MangaCarouselSection - 1:1 copy of MediaCarouselSection pattern
 * Horizontal scroll carousel with cinematic poster cards.
 * Variants: trending (with rank numbers), popular, top-rated
 */
import { LocalFireDepartment, Star, Whatshot } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HorizontalScrollContainer, SectionHeader } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContextDef';
import { useDeviceType } from '../../../hooks/useDeviceType';
import type { MangaCarouselItem } from '../../../hooks/useMangaTrending';
import { FORMAT_COLORS, getDisplayFormat } from '../mangaUtils';

interface MangaCarouselSectionProps {
  variant: 'trending' | 'popular' | 'top-rated';
  items: MangaCarouselItem[];
  title: string;
  onSeeAll?: () => void;
  iconColor?: string;
}

export const MangaCarouselSection = React.memo(function MangaCarouselSection({
  variant,
  items,
  title,
  onSeeAll,
  iconColor,
}: MangaCarouselSectionProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  const cardWidth = isMobile ? '155px' : '240px';

  if (items.length === 0) return null;

  const sectionIcon =
    variant === 'trending' ? (
      <LocalFireDepartment />
    ) : variant === 'popular' ? (
      <Whatshot />
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
          const displayFormat = getDisplayFormat(item.countryOfOrigin, item.format);
          const formatKey =
            item.countryOfOrigin === 'KR'
              ? 'MANHWA'
              : item.countryOfOrigin === 'CN'
                ? 'MANHUA'
                : 'MANGA';
          const formatColor = FORMAT_COLORS[formatKey] || '#a78bfa';

          // Trending: cinematic cards with rank number (same as series)
          if (variant === 'trending') {
            return (
              <motion.div
                key={`${variant}-${item.id}`}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(`/manga/${item.id}`)}
                style={{ cursor: 'pointer', flexShrink: 0, minWidth: cardWidth }}
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

                  {/* Corner cutout with rank number */}
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
                              id={`manga-corner-${index}`}
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
                            d={`M14,0 L${size},0 Q${size * 0.38},${size * 0.38} 0,${size} L0,14 Q0,0 14,0 Z`}
                            fill={`url(#manga-corner-${index})`}
                          />
                        </svg>
                        <span
                          style={{
                            position: 'absolute',
                            top: '25%',
                            left: '25%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1,
                            fontSize: isMobile ? '34px' : '48px',
                            fontWeight: 900,
                            fontFamily: 'var(--font-display)',
                            lineHeight: 1,
                            color: 'rgba(255,255,255,0.75)',
                            userSelect: 'none',
                            letterSpacing: '-2px',
                            textShadow:
                              '0 1px 0 rgba(255,255,255,0.3), 0 2px 0 rgba(0,80,60,0.4), 0 3px 0 rgba(0,70,50,0.3), 0 4px 0 rgba(0,60,40,0.2), 0 5px 10px rgba(0,0,0,0.35)',
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
                    {/* Top-right: format badge */}
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
                          color: formatColor,
                          border: `1px solid ${formatColor}50`,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          pointerEvents: 'auto',
                        }}
                      >
                        {displayFormat}
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
                      <MetaRow item={item} theme={currentTheme} isMobile={isMobile} />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          }

          // Popular / Top-rated: cinematic poster cards (same as series seasonal/top-rated)
          return (
            <motion.div
              key={`${variant}-${item.id}`}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(`/manga/${item.id}`)}
              style={{ flexShrink: 0, cursor: 'pointer', minWidth: cardWidth }}
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
                  {/* Top: format badge */}
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
                        color: formatColor,
                        border: `1px solid ${formatColor}50`,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        pointerEvents: 'auto',
                      }}
                    >
                      {displayFormat}
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
                    <MetaRow item={item} theme={currentTheme} isMobile={isMobile} />
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

// Shared meta row for all variants
const MetaRow = ({
  item,
  theme,
  isMobile,
}: {
  item: MangaCarouselItem;
  theme: ReturnType<typeof import('../../../contexts/ThemeContextDef').useTheme>['currentTheme'];
  isMobile: boolean;
}) => (
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
          color: theme.status?.warning || '#f59e0b',
        }}
      >
        <Star style={{ fontSize: isMobile ? '11px' : '12px' }} />
        {item.rating.toFixed(1)}
      </span>
    )}
    {item.rating != null && item.year && <span style={{ opacity: 0.4 }}>&bull;</span>}
    {item.year && <span>{item.year}</span>}
    {item.year && item.genres && <span style={{ opacity: 0.4 }}>&bull;</span>}
    {item.genres && (
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {item.genres}
      </span>
    )}
  </div>
);
