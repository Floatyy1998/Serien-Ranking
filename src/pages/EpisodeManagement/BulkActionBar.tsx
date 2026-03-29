import { PlaylistAddCheck } from '@mui/icons-material';
import { memo } from 'react';
import type { SeasonProgress } from './useEpisodeManagement';

interface BulkActionBarProps {
  seasonNumber: number;
  seasonProgress: SeasonProgress;
  selectedSeason: number;
  onSeasonToggle: (seasonIndex: number, mode: 'watch' | 'unwatch' | 'rewatch') => void;
  onMarkAll: (seasonIndex: number) => void;
  onCatchUp: () => void;
}

export const BulkActionBar = memo(
  ({
    seasonNumber,
    seasonProgress,
    selectedSeason,
    onSeasonToggle,
    onMarkAll,
    onCatchUp,
  }: BulkActionBarProps) => {
    const { allWatched, seasonMinWatchCount, progress } = seasonProgress;

    return (
      <div className="season-progress">
        <div className="progress-header">
          <h2>Staffel {seasonNumber}</h2>
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {allWatched ? (
          <div className="em-bulk-buttons-row">
            <button
              className="mark-all-button"
              style={{ flex: 1 }}
              onClick={() => onSeasonToggle(selectedSeason, 'rewatch')}
            >
              Alle als {seasonMinWatchCount + 1}x gesehen
            </button>
            <button
              className="mark-all-button em-bulk-button-muted"
              style={{ flex: 1 }}
              onClick={() => onSeasonToggle(selectedSeason, 'unwatch')}
            >
              Alle als ungesehen
            </button>
          </div>
        ) : (
          <div className="em-bulk-buttons-column">
            <button className="mark-all-button" onClick={() => onMarkAll(selectedSeason)}>
              Alle als gesehen markieren
            </button>
            <button className="catch-up-button" onClick={onCatchUp}>
              <PlaylistAddCheck style={{ fontSize: '16px' }} />
              Ich bin bei...
            </button>
          </div>
        )}
      </div>
    );
  }
);

BulkActionBar.displayName = 'BulkActionBar';
