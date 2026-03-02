import { memo } from 'react';
import type { Series } from '../../types/Series';

interface StatusBadgeProps {
  series: Series;
}

export const StatusBadge = memo<StatusBadgeProps>(({ series }) => {
  const isOngoing =
    series.status === 'Returning Series' ||
    series.status === 'ongoing' ||
    (!series.status && series.production?.production === true);
  const isEnded =
    series.status === 'Ended' ||
    series.status === 'Canceled' ||
    (!series.status && series.production?.production === false);

  if (!isOngoing && !isEnded) return null;

  const color = isOngoing ? '#4CAF50' : '#9E9E9E';
  const label = isOngoing ? 'Fortlaufend' : 'Beendet';

  return (
    <span className="status-badge" style={{ borderColor: `${color}66`, color }}>
      <div className="status-badge__dot" style={{ background: color }} />
      {label}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
