import { NewReleases } from '@mui/icons-material';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HorizontalScrollContainer, SectionHeader } from '../../../components/ui';
import { useAuth } from '../../../contexts/AuthContext';
import { useMovieList } from '../../../contexts/MovieListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { useActiveSubscriptions } from '../../../hooks/useActiveSubscriptions';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { getProviderLogoUrl } from '../../../lib/providerMerge';
import {
  detectMovieAvailability,
  type AvailableMovie,
} from '../../../services/detection/movieAvailabilityDetection';
import { getImageUrl } from '../../../utils/imageUrl';
import { CinematicPosterCard } from './CinematicPosterCard';
import type { MediaItem } from './mediaCarouselTypes';
import { t } from '../../../services/i18n';

const MAX_ITEMS = 12;

/**
 * „Neu auf deinen Abos": ungesehene Filme aus der eigenen Liste, die auf einem
 * aktiv abonnierten Provider laufen — frisch verfügbar gewordene zuerst.
 * Rendert die generalisierten CinematicPosterCards (gleiche Optik wie
 * Seasonal/Top-Rated).
 */
export const NewOnSubscriptionsSection = React.memo(function NewOnSubscriptionsSection() {
  const { user } = useAuth() || {};
  const { movieList, loading: moviesLoading } = useMovieList();
  const { activeProviders, loading: subsLoading } = useActiveSubscriptions();
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();

  const [available, setAvailable] = useState<AvailableMovie[]>([]);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    if (!user?.uid || moviesLoading || subsLoading) return;
    if (movieList.length === 0 || activeProviders.size === 0) return;
    ranRef.current = true;

    let cancelled = false;
    detectMovieAvailability(user.uid, movieList, activeProviders)
      .then(({ availableNow }) => {
        if (!cancelled) setAvailable(availableNow.slice(0, MAX_ITEMS));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.uid, movieList, moviesLoading, activeProviders, subsLoading]);

  const items: MediaItem[] = useMemo(
    () =>
      available.map(({ movie, providers }) => ({
        id: Number(movie.id),
        title: movie.title,
        poster: getImageUrl(movie.poster),
        type: 'movie' as const,
        year: movie.release_date ? String(movie.release_date).slice(0, 4) : undefined,
        providers: providers
          .map((name) => ({ name, logo: getProviderLogoUrl(name) ?? '' }))
          .filter((p) => !!p.logo),
      })),
    [available]
  );

  if (items.length === 0) return null;

  const cardWidth = isMobile ? '155px' : '280px';

  return (
    <section style={{ marginBottom: '32px' }}>
      <SectionHeader
        icon={<NewReleases />}
        iconColor={currentTheme.accent}
        title={t('Neu auf deinen Abos')}
      />
      <HorizontalScrollContainer gap={14} style={{ padding: '0 20px' }}>
        {items.map((item) => (
          <CinematicPosterCard key={item.id} item={item} cardWidth={cardWidth} />
        ))}
      </HorizontalScrollContainer>
    </section>
  );
});
