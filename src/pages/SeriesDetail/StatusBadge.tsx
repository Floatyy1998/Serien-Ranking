import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { Series } from '../../types/Series';

interface StatusBadgeProps {
  series: Series;
}

export const StatusBadge = memo<StatusBadgeProps>(({ series }) => {
  const { currentTheme } = useTheme();
  const isOngoing =
    series.status === 'Returning Series' ||
    series.status === 'ongoing' ||
    (!series.status && series.production?.production === true);
  const isEnded =
    series.status === 'Ended' ||
    series.status === 'Canceled' ||
    (!series.status && series.production?.production === false);

  if (!isOngoing && !isEnded) return null;

  const color = isOngoing ? currentTheme.status?.success || '#22c55e' : currentTheme.text.muted;
  const label = isOngoing ? 'Fortlaufend' : 'Beendet';

  return (
    <span className="status-badge" style={{ borderColor: `${color}66`, color }}>
      <div className="status-badge__dot" style={{ background: color }} />
      {label}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';
