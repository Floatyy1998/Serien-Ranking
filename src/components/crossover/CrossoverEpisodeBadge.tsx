import { memo } from 'react';
import { openCrossover } from '../../features/crossover/openCrossover';
import { useEpisodeCrossovers } from '../../hooks/series/useCrossovers';
import { CrossoverChip } from '../ui/display/CrossoverChip';

interface CrossoverEpisodeBadgeProps {
  seriesId: number | string;
  /** 1-basiert wie in den Routen. */
  seasonNumber: number;
  episodeNumber: number;
}

/** Crossover-Chip für Folgenzeilen in Listen — rendert nichts, wenn die Folge kein Crossover ist. */
export const CrossoverEpisodeBadge = memo(
  ({ seriesId, seasonNumber, episodeNumber }: CrossoverEpisodeBadgeProps) => {
    const refs = useEpisodeCrossovers(seriesId, seasonNumber, episodeNumber);
    if (refs.length === 0) return null;
    return (
      <span
        style={{ marginLeft: 6, verticalAlign: 'middle' }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <CrossoverChip
          variant="label"
          title={refs.map((r) => r.entry.title).join(' · ')}
          onClick={() => openCrossover(refs[0].id)}
        />
      </span>
    );
  }
);

CrossoverEpisodeBadge.displayName = 'CrossoverEpisodeBadge';
