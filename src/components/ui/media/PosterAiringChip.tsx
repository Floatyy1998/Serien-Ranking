import { memo } from 'react';
import { useSeriesAiring } from '../../../hooks/series/useSeriesAiring';
import { t } from '../../../services/i18n';
import './PosterAiringChip.css';

interface PosterAiringChipProps {
  type: 'series' | 'movie';
  id: number;
}

export const PosterAiringChip = memo(({ type, id }: PosterAiringChipProps) => {
  const airing = useSeriesAiring(type, id);
  if (!airing) return null;
  return (
    <span className={`poster-airing poster-airing--${airing}`}>
      <span className="poster-airing__dot" aria-hidden />
      {airing === 'ongoing' ? t('Läuft') : t('Beendet')}
    </span>
  );
});

PosterAiringChip.displayName = 'PosterAiringChip';
