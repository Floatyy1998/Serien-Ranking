import { AutoAwesome, LocalFireDepartment, Replay, Star } from '@mui/icons-material';
import React from 'react';
import {
  HorizontalScrollContainer,
  SectionHeader,
  SkeletonPosterRow,
} from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { useDeviceType } from '../../../hooks/platform/useDeviceType';
import { CinematicPosterCard } from './CinematicPosterCard';
import { TrendingRankCard } from './TrendingRankCard';
import type { MediaItem } from './mediaCarouselTypes';

type CarouselVariant = 'seasonal' | 'trending' | 'top-rated' | 'rewatch-list';

const iconFor = (variant: CarouselVariant) => {
  switch (variant) {
    case 'seasonal':
      return <AutoAwesome />;
    case 'trending':
      return <LocalFireDepartment />;
    case 'rewatch-list':
      return <Replay />;
    default:
      return <Star />;
  }
};

interface MediaCarouselSectionProps {
  variant: CarouselVariant;
  items: MediaItem[];
  title: string;
  onSeeAll?: () => void;
  iconColor?: string;
  /** Show skeleton placeholder while TMDB request is in flight. */
  loading?: boolean;
}

export const MediaCarouselSection = React.memo(function MediaCarouselSection({
  variant,
  items,
  title,
  onSeeAll,
  iconColor,
  loading,
}: MediaCarouselSectionProps) {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  const cardWidth = isMobile ? '155px' : '280px';

  const sectionIcon = iconFor(variant);

  if (loading && items.length === 0) {
    return (
      <section style={{ marginBottom: 'var(--home-section-gap)' }}>
        <SectionHeader
          icon={sectionIcon}
          iconColor={iconColor || currentTheme.accent}
          title={title}
        />
        <SkeletonPosterRow posterWidth={isMobile ? 155 : 280} count={6} />
      </section>
    );
  }

  if (items.length === 0) return null;

  const sectionIconColor = iconColor || currentTheme.accent;

  return (
    <section style={{ marginBottom: 'var(--home-section-gap)' }}>
      <SectionHeader
        icon={sectionIcon}
        iconColor={sectionIconColor}
        title={title}
        onSeeAll={onSeeAll}
      />
      <HorizontalScrollContainer gap={14} style={{ padding: '0 20px' }}>
        {items.map((item, index) =>
          // Trending — Disney+ inspired cinematic cards; sonst Cinematic poster cards (seasonal + top-rated)
          variant === 'trending' ? (
            <TrendingRankCard
              key={`${variant}-${item.type}-${item.id}`}
              item={item}
              index={index}
              cardWidth={cardWidth}
            />
          ) : (
            <CinematicPosterCard
              key={`${variant}-${item.type}-${item.id}`}
              item={item}
              cardWidth={cardWidth}
            />
          )
        )}
      </HorizontalScrollContainer>
    </section>
  );
});
