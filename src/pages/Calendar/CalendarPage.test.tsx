// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { navigateMock, calState } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  calState: {
    weekOffset: 0,
    goToPrevWeek: vi.fn(),
    goToNextWeek: vi.fn(),
    goToCurrentWeek: vi.fn(),
    kwNumber: 27,
    monday: new Date('2026-06-29T00:00:00'),
    sunday: new Date('2026-07-05T00:00:00'),
    watchlistOnly: false,
    toggleWatchlistOnly: vi.fn(),
    totalEpisodes: 5,
    watchedCount: 2,
    groupedSchedule: new Map(),
    todayKey: '2026-07-01',
    backdrops: {},
    expandedGroups: new Set<string>(),
    toggleGroup: vi.fn(),
    handleMarkWatched: vi.fn(),
  },
}));

vi.mock('./useCalendarData', () => ({ useCalendarData: () => calState }));
vi.mock('./CalendarToolbar', () => ({ CalendarToolbar: () => <div data-testid="toolbar" /> }));
vi.mock('./CalendarGrid', () => ({ CalendarGrid: () => <div data-testid="grid" /> }));
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('@mui/icons-material', () => ({
  CalendarMonth: () => null,
  ChevronRight: () => null,
  LiveTv: () => null,
}));
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});
vi.mock('../../components/ui', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));
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

import { CalendarPage } from './CalendarPage';

beforeEach(() => {
  navigateMock.mockReset();
  calState.totalEpisodes = 5;
});
afterEach(() => cleanup());

describe('CalendarPage', () => {
  it('renders the header, toolbar and grid', () => {
    render(<CalendarPage />);
    expect(screen.getByText('TV-Kalender')).toBeInTheDocument();
    expect(screen.getByTestId('toolbar')).toBeInTheDocument();
    expect(screen.getByTestId('grid')).toBeInTheDocument();
  });

  it('navigates to the anime-season and serien-kalender pages', () => {
    render(<CalendarPage />);
    fireEvent.click(screen.getByText('Anime-Season'));
    expect(navigateMock).toHaveBeenCalledWith('/anime-season');
    fireEvent.click(screen.getByText('Serien-Kalender'));
    expect(navigateMock).toHaveBeenCalledWith('/serien-kalender');
  });

  it('shows the empty state when there are no episodes', () => {
    calState.totalEpisodes = 0;
    render(<CalendarPage />);
    expect(screen.getByText('Keine Episoden in dieser Woche')).toBeInTheDocument();
  });
});
