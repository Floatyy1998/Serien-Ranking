// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { WrappedShareSheet } from './WrappedShareCard';
import type { WrappedStats } from '../../types/Wrapped';

// jsdom lacks matchMedia; BottomSheet -> useReducedMotion needs it.
beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
});

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111' },
    },
  }),
}));

vi.mock('../../services/share/shareCard', () => ({
  exportNodeAsImage: vi.fn<() => Promise<Blob>>(() => Promise.resolve(new Blob(['x']))),
  shareOrDownload: vi.fn<() => Promise<void>>(() => Promise.resolve()),
}));

afterEach(() => cleanup());

const makeStats = (): WrappedStats => ({
  year: 2025,
  totalEpisodesWatched: 320,
  totalMoviesWatched: 15,
  totalMinutesWatched: 5000,
  totalHoursWatched: 83.4,
  totalDaysEquivalent: 3.5,
  uniqueSeriesWatched: 40,
  topSeries: [{ id: 1, title: 'Meine Lieblingsserie', episodesWatched: 62, minutesWatched: 2000 }],
  topMovies: [],
  topGenres: [],
  topProviders: [],
  mostActiveMonth: {
    month: 12,
    monthName: 'Dezember',
    episodesWatched: 40,
    moviesWatched: 5,
    minutesWatched: 2000,
  },
  mostActiveDay: {
    date: '2025-06-15',
    dayName: 'Sonntag',
    episodesWatched: 8,
    moviesWatched: 2,
    minutesWatched: 240,
  },
  favoriteTimeOfDay: { timeOfDay: 'evening', label: 'Abends', count: 30, percentage: 55 },
  favoriteDayOfWeek: { dayOfWeek: 6, dayName: 'Samstag', count: 50, percentage: 42 },
  monthlyBreakdown: [],
  totalBingeSessions: 7,
  longestBingeSession: null,
  averageBingeLength: 4,
  longestStreak: 12,
  currentStreak: 3,
  deviceBreakdown: {
    mobile: { count: 1, percentage: 50 },
    desktop: { count: 1, percentage: 50 },
    tablet: { count: 0, percentage: 0 },
  },
  achievements: [
    {
      id: 'night_owl',
      title: 'Nachteule',
      description: 'x',
      icon: 'moon',
      unlocked: true,
    },
    {
      id: 'consistent',
      title: 'Beständig',
      description: 'y',
      icon: 'flame',
      unlocked: false,
    },
  ],
  funFacts: [],
  firstWatch: null,
  lastWatch: null,
  lateNightStats: {
    totalLateNightWatches: 42,
    midnightWatches: 8,
    latestWatch: null,
    percentage: 33,
  },
  heatmapData: [],
});

describe('WrappedShareSheet', () => {
  it('renders the sheet title and stat tiles when open', () => {
    render(<WrappedShareSheet isOpen onClose={vi.fn()} stats={makeStats()} />);
    expect(screen.getByText('Wrapped 2025 teilen')).toBeInTheDocument();
    expect(screen.getByText('Episoden')).toBeInTheDocument();
    expect(screen.getByText('Filme')).toBeInTheDocument();
    expect(screen.getByText('Stunden')).toBeInTheDocument();
    expect(screen.getByText('Serien')).toBeInTheDocument();
  });

  it('renders the top series and unlocked-achievement count', () => {
    render(<WrappedShareSheet isOpen onClose={vi.fn()} stats={makeStats()} />);
    expect(screen.getByText('Meine Lieblingsserie')).toBeInTheDocument();
    expect(screen.getByText('Meine #1 Serie')).toBeInTheDocument();
    expect(screen.getByText('Achievements freigeschaltet')).toBeInTheDocument();
  });

  it('renders nothing visible when closed', () => {
    render(<WrappedShareSheet isOpen={false} onClose={vi.fn()} stats={makeStats()} />);
    expect(screen.queryByText('Wrapped 2025 teilen')).not.toBeInTheDocument();
  });
});
