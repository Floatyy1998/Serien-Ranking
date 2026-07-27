// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DynamicTheme } from '../../theme/dynamicTheme';
import type { useSeriesData } from './useSeriesData';

const ratingsMock = vi.hoisted(() => ({ current: null as Record<string, unknown> | null }));

vi.mock('../../hooks/useCommunityRatings', () => ({
  useEpisodeRatings: () => ratingsMock.current,
}));

import { FeverCurveSection } from './FeverCurveSection';

const theme = {
  primary: '#ef6f8a',
  accent: '#f2a648',
  text: { primary: '#fff', secondary: '#aaa' },
} as unknown as DynamicTheme;

type SeriesProp = NonNullable<ReturnType<typeof useSeriesData>['series']>;

const series = {
  id: 42,
  seasons: [
    {
      seasonNumber: 0,
      episodes: [1, 2, 3, 4, 5, 6].map((n) => ({
        id: n,
        episode_number: n,
        name: `Folge ${n}`,
        air_date: '2020-01-01',
        watched: false,
      })),
    },
  ],
} as unknown as SeriesProp;

const entriesFor = (ids: number[]): Record<string, unknown> =>
  Object.fromEntries(ids.map((id) => [String(id), { a: 7 + (id % 3), c: 5 }]));

afterEach(() => {
  cleanup();
  ratingsMock.current = null;
});

describe('FeverCurveSection', () => {
  it('rendert nichts ohne ausreichend Community- oder eigene Daten', () => {
    ratingsMock.current = entriesFor([1, 2]);
    const { container } = render(
      <FeverCurveSection series={series} currentTheme={theme} isMobile={false} navigate={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('fällt ohne Community-Daten auf die eigene Kurve zurück', () => {
    ratingsMock.current = null;
    const own = JSON.parse(JSON.stringify(series)) as typeof series;
    own.seasons[0].episodes.forEach((ep: { userRating?: number }, i: number) => {
      if (i < 5) ep.userRating = 7 + (i % 3);
    });
    render(
      <FeverCurveSection series={own} currentTheme={theme} isMobile={false} navigate={vi.fn()} />
    );
    expect(screen.getByText('Fieberkurve')).toBeInTheDocument();
    expect(screen.getByText('Deine Folgenbewertungen')).toBeInTheDocument();
    expect(screen.queryByText(/Beste Folge/)).not.toBeInTheDocument();
  });

  it('zeigt Kurve, Titel und beste Folge ab der Mindestanzahl', () => {
    ratingsMock.current = entriesFor([1, 2, 3, 4, 5]);
    render(
      <FeverCurveSection series={series} currentTheme={theme} isMobile={false} navigate={vi.fn()} />
    );
    expect(screen.getByText('Fieberkurve')).toBeInTheDocument();
    expect(screen.getByText(/Beste Folge/)).toBeInTheDocument();
  });

  it('wechselt per Toggle auf die Heatmap und navigiert beim Zellen-Tap', () => {
    ratingsMock.current = entriesFor([1, 2, 3, 4, 5]);
    const navigate = vi.fn();
    render(
      <FeverCurveSection
        series={series}
        currentTheme={theme}
        isMobile={false}
        navigate={navigate}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Heatmap' }));
    fireEvent.click(screen.getByRole('button', { name: 'S1E3' }));
    expect(navigate).toHaveBeenCalledWith('/episode/42/s/1/e/3');
  });
});
