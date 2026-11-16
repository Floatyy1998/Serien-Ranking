import React from 'react';
import { t } from '../../../services/i18n';
import type { TopSeriesEntry } from '../../../types/Wrapped';
import { EmptyStage, TopList, type SlideProps } from '../kit';
import { tmdbImage } from '../kitHelpers';

interface TopSeriesSlideProps extends SlideProps {
  topSeries: TopSeriesEntry[];
  maxDisplay?: number;
}

export const TopSeriesSlide: React.FC<TopSeriesSlideProps> = ({
  topSeries,
  maxDisplay = 5,
  active,
  posters,
}) => {
  const [top, ...rest] = topSeries.slice(0, maxDisplay);
  if (!top) {
    return (
      <EmptyStage
        active={active}
        posters={posters}
        title={t('Keine Serien dieses Jahr')}
        hint={t('Schau mehr Serien und Filme!')}
      />
    );
  }
  return (
    <TopList
      active={active}
      kicker={t('Deine #1 Serie')}
      hero={{
        key: top.id,
        title: top.title,
        heroImage: tmdbImage(top.poster, 'w500'),
        value: t('{n} Episoden', { n: top.episodesWatched }),
      }}
      rest={rest.map((s) => ({
        key: s.id,
        title: s.title,
        image: tmdbImage(s.poster, 'w154'),
        value: t('{n} Episoden', { n: s.episodesWatched }),
      }))}
    />
  );
};

export default TopSeriesSlide;
