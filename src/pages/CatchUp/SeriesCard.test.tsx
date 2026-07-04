// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CatchUpSeries } from './useCatchUpData';

const { navigateMock, markNextMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  markNextMock: vi.fn(async () => true),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

vi.mock('../../utils/imageUrl', () => ({ getImageUrl: () => 'https://img/x.jpg' }));
vi.mock('../../theme/colorUtils', () => ({ getOptimalTextColor: () => '#000000' }));
vi.mock('../../hooks/markNextEpisode', () => ({ markNextEpisodeWatched: markNextMock }));
vi.mock('./GradientRing', () => ({ GradientRing: () => <div data-testid="ring" /> }));
vi.mock('./useCatchUpData', () => ({ formatTimeString: (m: number) => `${m}min` }));

import { SeriesCard } from './SeriesCard';

const item = {
  series: { id: 99, title: 'Breaking Test', poster: { poster: '/p.jpg' }, seasons: [] },
  totalEpisodes: 20,
  watchedEpisodes: 8,
  remainingEpisodes: 12,
  remainingMinutes: 480,
  progress: 40,
  currentSeason: 2,
  currentEpisode: 3,
} as unknown as CatchUpSeries;

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
  markNextMock.mockClear();
});

describe('CatchUp SeriesCard', () => {
  it('renders the series title and current position', () => {
    render(<SeriesCard item={item} />);
    expect(screen.getByText('Breaking Test')).toBeInTheDocument();
    expect(screen.getByText('S2 E3')).toBeInTheDocument();
    expect(screen.getByText('8 von 20')).toBeInTheDocument();
  });

  it('navigates to the series detail page when the card is clicked', () => {
    const { container } = render(<SeriesCard item={item} />);
    fireEvent.click(container.querySelector('.cu-card') as HTMLElement);
    expect(navigateMock).toHaveBeenCalledWith('/series/99');
  });

  it('marks the next episode watched via the mark button', async () => {
    render(<SeriesCard item={item} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(markNextMock).toHaveBeenCalledWith('u1', item.series));
  });
});
