// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SeasonProgress } from './useEpisodeManagement';

vi.mock(
  '@mui/icons-material',
  () =>
    new Proxy(
      { __esModule: true },
      {
        get: (_t, p) =>
          p === '__esModule'
            ? true
            : typeof p === 'symbol' || p === 'then'
              ? undefined
              : () => null,
        has: () => true,
      }
    )
);

const progress = (over: Partial<SeasonProgress> = {}): SeasonProgress => ({
  watchedCount: 1,
  totalCount: 4,
  allWatched: false,
  seasonMinWatchCount: 0,
  progress: 25,
  ...over,
});

import { BulkActionBar } from './BulkActionBar';

afterEach(() => cleanup());

describe('BulkActionBar', () => {
  it('renders the season heading and rounded progress', () => {
    render(
      <BulkActionBar
        seasonNumber={2}
        seasonProgress={progress({ progress: 25.6 })}
        selectedSeason={1}
        onSeasonToggle={vi.fn()}
        onMarkAll={vi.fn()}
        onCatchUp={vi.fn()}
      />
    );
    expect(screen.getByText('Staffel 2')).toBeInTheDocument();
    expect(screen.getByText('26%')).toBeInTheDocument();
  });

  it('shows mark-all and catch-up when not all watched', () => {
    const onMarkAll = vi.fn();
    const onCatchUp = vi.fn();
    render(
      <BulkActionBar
        seasonNumber={1}
        seasonProgress={progress()}
        selectedSeason={0}
        onSeasonToggle={vi.fn()}
        onMarkAll={onMarkAll}
        onCatchUp={onCatchUp}
      />
    );
    fireEvent.click(screen.getByText('Alle als gesehen markieren'));
    expect(onMarkAll).toHaveBeenCalledWith(0);
    fireEvent.click(screen.getByText('Ich bin bei...'));
    expect(onCatchUp).toHaveBeenCalledTimes(1);
  });

  it('shows rewatch and unwatch actions when all watched', () => {
    const onSeasonToggle = vi.fn();
    render(
      <BulkActionBar
        seasonNumber={1}
        seasonProgress={progress({ allWatched: true, seasonMinWatchCount: 1, progress: 100 })}
        selectedSeason={0}
        onSeasonToggle={onSeasonToggle}
        onMarkAll={vi.fn()}
        onCatchUp={vi.fn()}
      />
    );
    expect(screen.getByText('Alle als 2x gesehen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Alle als ungesehen'));
    expect(onSeasonToggle).toHaveBeenCalledWith(0, 'unwatch');
  });
});
