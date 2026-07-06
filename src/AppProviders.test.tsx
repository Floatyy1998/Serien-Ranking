// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('./contexts/MangaListProvider', () => ({
  MangaListProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./contexts/MovieListProvider', () => ({
  MovieListProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./contexts/NotificationProvider', () => ({
  NotificationProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./contexts/OptimizedFriendsProvider', () => ({
  OptimizedFriendsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./contexts/OptimizedSeriesListProvider', () => ({
  SeriesListProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./contexts/RatingsStateProvider', () => ({
  RatingsStateProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./features/badges/BadgeProvider', () => ({
  BadgeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('./features/stats/StatsProvider', () => ({
  StatsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { AppProviders } from './AppProviders';

afterEach(() => cleanup());

describe('AppProviders', () => {
  it('renders its children within the nested provider tree', () => {
    render(
      <AppProviders>
        <div>CHILD_CONTENT</div>
      </AppProviders>
    );
    expect(screen.getByText('CHILD_CONTENT')).toBeInTheDocument();
  });
});
