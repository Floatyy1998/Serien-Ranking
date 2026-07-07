// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { CatchUpSeries } from './useCatchUpData';
import type * as UseCatchUpDataModule from './useCatchUpData';

const { navigateMock, markNextMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  markNextMock: vi.fn(async (_uid: string, _series: unknown) => true),
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('../../contexts/ThemeContext', () => {
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
// Nur formatTimeString stubben – advanceCatchUpView (der optimistische Vorlauf)
// bleibt die echte Implementierung, damit das Binge-Verhalten real getestet wird.
vi.mock('./useCatchUpData', async () => {
  const actual = await vi.importActual<typeof UseCatchUpDataModule>('./useCatchUpData');
  return { ...actual, formatTimeString: (m: number) => `${m}min` };
});

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
    fireEvent.click(screen.getByRole('button', { name: /als gesehen markieren/ }));
    await waitFor(() => expect(markNextMock).toHaveBeenCalledWith('u1', item.series));
  });

  it('advances optimistically: a second tap marks the NEXT episode, not the same one', async () => {
    // Serie mit drei ausgestrahlten, ungesehenen Folgen (echtes advanceCatchUpView).
    const aired = (id: number) => ({
      id,
      episode_number: id,
      watched: false,
      air_date: '2020-01-01',
      runtime: 40,
    });
    const bingeItem = {
      series: {
        id: 42,
        title: 'Binge',
        poster: { poster: '/p.jpg' },
        episodeRuntime: 40,
        seasons: [{ seasonNumber: 0, episodes: [aired(1), aired(2), aired(3)] }],
      },
      totalEpisodes: 3,
      watchedEpisodes: 0,
      remainingEpisodes: 3,
      remainingMinutes: 120,
      progress: 0,
      currentSeason: 1,
      currentEpisode: 1,
    } as unknown as CatchUpSeries;

    render(<SeriesCard item={bingeItem} />);
    const btn = () => screen.getByRole('button', { name: /als gesehen markieren/ });

    expect(screen.getByText('S1 E1')).toBeInTheDocument();

    // 1. Tap: markiert die echte nächste Folge (unveränderte Serie).
    fireEvent.click(btn());
    await waitFor(() => expect(markNextMock).toHaveBeenCalledTimes(1));
    expect(markNextMock.mock.calls[0][1]).toBe(bingeItem.series);

    // Karte springt sofort optimistisch auf S1 E2 (ohne Firebase-Re-Hydrate).
    await screen.findByText('S1 E2');

    // 2. schneller Tap: bekommt eine Serie, in der die erste Folge schon als
    // gesehen gilt → markNextEpisodeWatched zielt auf E2, nicht erneut auf E1.
    fireEvent.click(btn());
    await waitFor(() => expect(markNextMock).toHaveBeenCalledTimes(2));
    const secondSeries = markNextMock.mock.calls[1][1] as (typeof bingeItem)['series'];
    expect(secondSeries).not.toBe(bingeItem.series);
    expect(secondSeries.seasons[0].episodes[0].watched).toBe(true);
    expect(secondSeries.seasons[0].episodes[1].watched).toBe(false);

    // Anzeige nun bei S1 E3.
    await screen.findByText('S1 E3');
  });

  it('converges without flicker when the real update arrives', async () => {
    const aired = (id: number, watched = false) => ({
      id,
      episode_number: id,
      watched,
      air_date: '2020-01-01',
      runtime: 40,
    });
    const base = {
      series: {
        id: 7,
        title: 'Converge',
        poster: { poster: '/p.jpg' },
        episodeRuntime: 40,
        seasons: [{ seasonNumber: 0, episodes: [aired(1), aired(2), aired(3)] }],
      },
      totalEpisodes: 3,
      watchedEpisodes: 0,
      remainingEpisodes: 3,
      remainingMinutes: 120,
      progress: 0,
      currentSeason: 1,
      currentEpisode: 1,
    } as unknown as CatchUpSeries;

    const { rerender } = render(<SeriesCard item={base} />);
    fireEvent.click(screen.getByRole('button', { name: /als gesehen markieren/ }));
    await screen.findByText('S1 E2'); // optimistisch vorgeschoben

    // Echter Firebase-Update kommt nach: erste Folge gesehen, watchedEpisodes+1.
    const updated = {
      ...base,
      watchedEpisodes: 1,
      remainingEpisodes: 2,
      progress: 33,
      currentSeason: 1,
      currentEpisode: 2,
      series: {
        ...base.series,
        seasons: [{ seasonNumber: 0, episodes: [aired(1, true), aired(2), aired(3)] }],
      },
    } as unknown as CatchUpSeries;
    rerender(<SeriesCard item={updated} />);

    // Bleibt bei S1 E2 (kein Zurückflackern auf E1), Vorlauf ist abgebaut.
    expect(screen.getByText('S1 E2')).toBeInTheDocument();
  });
});
