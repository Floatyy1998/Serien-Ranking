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
    quickRatingOpen: false,
    quickRatingSeries: null,
    quickRatingValue: 0,
    handleRateSeries: vi.fn(),
    closeQuickRating: vi.fn(),
    saveQuickRating: vi.fn(),
  },
}));

vi.mock('./useCalendarData', () => ({ useCalendarData: () => calState }));
vi.mock('./CalendarToolbar', () => ({ CalendarToolbar: () => <div data-testid="toolbar" /> }));
vi.mock('./CalendarGrid', () => ({ CalendarGrid: () => <div data-testid="grid" /> }));
vi.mock('../../hooks/platform/useDeviceType', () => ({
  useDeviceType: () => ({ isDesktop: false, isMobile: true }),
}));
vi.mock('./WatchPlanView', () => ({ WatchPlanView: () => <div data-testid="watch-plan" /> }));
// Das Nav-Sheet zieht das ganze BottomSheet samt framer-Drag herein — hier
// nur die Auswahl abbilden, die dieser Test braucht.
vi.mock('../../components/ui/overlay/PosterNavSheet', () => ({
  PosterNavSheet: ({ posterNav }: { posterNav: { open: boolean; title: string } }) =>
    posterNav.open ? <div data-testid="poster-nav">{posterNav.title}</div> : null,
}));
vi.mock('../../components/ui/overlay/QuickRatingSheet', () => ({
  QuickRatingSheet: () => <div data-testid="quick-rating" />,
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
  useLocation: () => ({ search: '' }),
}));
vi.mock('@mui/icons-material', () => ({
  CalendarMonth: () => null,
  ChevronRight: () => null,
  EditCalendar: () => null,
  LiveTv: () => null,
  LocalMovies: () => null,
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
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  SkeletonListRow: () => <div data-testid="skeleton" />,
  TabSwitcher: ({
    tabs,
    onTabChange,
  }: {
    tabs: { id: string; label: string }[];
    onTabChange: (id: string) => void;
  }) => (
    <div>
      {tabs.map((tab) => (
        <button key={tab.id} onClick={() => onTabChange(tab.id)}>
          {tab.label}
        </button>
      ))}
    </div>
  ),
}));
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

import { CalendarPage } from './CalendarPage';

beforeEach(() => {
  navigateMock.mockReset();
  localStorage.clear();
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

  it('switches to the own watch plan and remembers the choice', () => {
    render(<CalendarPage />);
    fireEvent.click(screen.getByText('Mein Plan'));
    expect(screen.getByTestId('watch-plan')).toBeInTheDocument();
    expect(screen.queryByTestId('toolbar')).not.toBeInTheDocument();
    expect(localStorage.getItem('calendarMode')).toBe('plan');
    cleanup();
    render(<CalendarPage />);
    expect(screen.getByTestId('watch-plan')).toBeInTheDocument();
  });
});
