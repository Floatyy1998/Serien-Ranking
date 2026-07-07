// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CarouselNotification } from './CarouselNotification';
import type { Series } from '../../types/Series';

if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const navigate = vi.hoisted(() => vi.fn());
const firebaseMock = vi.hoisted(() => {
  const ref = {
    update: vi.fn(() => Promise.resolve()),
    set: vi.fn(() => Promise.resolve()),
    remove: vi.fn(() => Promise.resolve()),
  };
  return {
    default: {
      database: () => ({ ref: () => ref }),
    },
  };
});

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));
vi.mock('firebase/compat/app', () => firebaseMock);
vi.mock('firebase/compat/database', () => ({}));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
}));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ refetchSeries: vi.fn() }),
}));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      background: { surface: '#111', default: '#000' },
      text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
      status: { success: '#4caf50', error: '#ef4444', warning: '#f59e0b' },
      border: { default: '#333' },
    },
  }),
}));
vi.mock('../../lib/toast', () => ({ showUndoToast: vi.fn() }));
vi.mock('../../lib/settings/notificationSettings', () => ({
  snoozeNotifications: vi.fn(() => Promise.resolve()),
}));
vi.mock('../../services/detection/newSeasonDetection', () => ({
  markMultipleSeasonsAsNotified: vi.fn(() => Promise.resolve()),
}));
vi.mock('../../utils/episodeDate', () => ({ getEpisodeAirDate: () => null }));

const makeSeries = (over: Partial<Series> = {}): Series =>
  ({
    id: 42,
    title: 'Breaking Bad',
    original_name: 'Breaking Bad',
    seasonCount: 5,
    watchlist: false,
    poster: { poster: '' },
    genre: { genres: ['Drama'] },
    seasons: [],
    ...over,
  }) as unknown as Series;

afterEach(() => {
  cleanup();
  navigate.mockReset();
});

describe('CarouselNotification', () => {
  it('renders the new-season header and series title', () => {
    render(
      <CarouselNotification series={[makeSeries()]} onDismiss={vi.fn()} variant="new-season" />
    );
    expect(screen.getByText(/Neue Staffel/)).toBeInTheDocument();
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
  });

  it('renders the completed variant header', () => {
    render(
      <CarouselNotification
        series={[makeSeries({ watchlist: true })]}
        onDismiss={vi.fn()}
        variant="completed"
      />
    );
    expect(screen.getByText(/abgeschlossen/)).toBeInTheDocument();
  });

  it('navigates and dismisses when the primary action is clicked', () => {
    const onDismiss = vi.fn();
    render(
      <CarouselNotification series={[makeSeries()]} onDismiss={onDismiss} variant="new-season" />
    );
    fireEvent.click(screen.getByRole('button', { name: /Ansehen/ }));
    expect(navigate).toHaveBeenCalledWith('/series/42');
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows a collapse button when onCollapse is provided', () => {
    render(
      <CarouselNotification
        series={[makeSeries()]}
        onDismiss={vi.fn()}
        variant="new-season"
        onCollapse={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Minimieren' })).toBeInTheDocument();
  });
});
