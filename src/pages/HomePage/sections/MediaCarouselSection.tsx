import {
  AutoAwesome,
  LocalFireDepartment,
  Movie as MovieIcon,
  Star,
  TrendingUp,
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
      <HorizontalScrollContainer gap={12} style={{ padding: '0 20px' }}>
        {items.map((item, index) => (
          <motion.div
            key={`${variant}-${item.type}-${item.id}`}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/${item.type}/${item.id}`)}
            style={{ minWidth: '140px', cursor: 'pointer' }}
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

              {/* Top badge */}
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

              {variant === 'trending' && (
                <div
                  style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    background: 'linear-gradient(135deg, #ff6b6b, #ff4757)',
                    color: 'white',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    zIndex: 1,
                  }}
                >
                  <TrendingUp style={{ fontSize: '13px' }} />#{index + 1}
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

              {/* Type badge (seasonal + trending) */}
              {(variant === 'seasonal' || variant === 'trending') && (
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
                fontSize: '15px',
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
                  fontSize: '15px',
                  color: currentTheme.text.muted,
                  marginTop: '2px',
                }}
              >
                <Star style={{ fontSize: '15px', color: '#ffd43b' }} />
                <span>{item.rating ? item.rating.toFixed(1) : 'N/A'}</span>
              </div>
            )}
          </motion.div>
        ))}
      </HorizontalScrollContainer>
    </section>
  );
});
