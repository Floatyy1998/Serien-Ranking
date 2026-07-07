// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { TvPremiereStaticEntry } from '../../services/staticCatalog';

vi.mock('@mui/icons-material', () => ({
  CalendarMonth: () => null,
  Category: () => null,
  InfoOutlined: () => null,
  LiveTv: () => null,
}));

const { fetchRef } = vi.hoisted(() => ({
  fetchRef: { current: (): Promise<TvPremiereStaticEntry[] | null> => Promise.resolve([]) },
}));

const theme = {
  primary: '#3355ff',
  accent: '#22d3ee',
  background: { default: '#000000', surface: '#111111', surfaceElevated: '#1a1a1a' },
  text: { primary: '#ffffff', secondary: '#eeeeee', muted: '#888888' },
};

vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ currentTheme: theme }) }));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'me' } }) }));
vi.mock('../../contexts/SeriesListContext', () => ({ useSeriesList: () => ({ seriesList: [] }) }));
vi.mock('../../services/firebase/analytics', () => ({ trackSeriesAdded: vi.fn() }));
vi.mock('../../features/badges/minimalActivityLogger', () => ({ logSeriesAdded: vi.fn() }));
vi.mock('../../services/backendApi', () => ({ backendFetch: vi.fn() }));
vi.mock('../../lib/haptics', () => ({ hapticSelect: vi.fn(), hapticSuccess: vi.fn() }));
vi.mock('../../lib/toast', () => ({ showToast: vi.fn() }));
vi.mock('../../services/staticCatalog', () => ({
  fetchStaticTvPremieres: () => fetchRef.current(),
  subscribeCatalogChange: () => () => {},
}));
vi.mock('./SerienKalenderCard', () => ({ SerienKalenderCard: () => <div data-testid="card" /> }));
vi.mock('./SerienKalenderHero', () => ({ SerienKalenderHero: () => <div data-testid="hero" /> }));
vi.mock('./SerienKalenderFilter', () => ({
  SerienKalenderFilter: () => <div data-testid="filter" />,
}));
vi.mock('../../components/ui', () => ({
  EmptyState: ({ title }: { title: string }) => <div data-testid="empty">{title}</div>,
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  ),
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageState: ({ error }: { error: { title: string } }) => (
    <div data-testid="error">{error.title}</div>
  ),
  ScrollToTopButton: () => null,
  Skeleton: () => <div data-testid="skeleton" />,
  TabSwitcher: () => <div data-testid="tabs" />,
}));

import { useNavigate } from 'react-router-dom';

vi.mock('react-router-dom', () => ({ useNavigate: vi.fn(() => vi.fn()) }));

import { SerienKalenderPage } from './SerienKalenderPage';

const useNavigateMock = vi.mocked(useNavigate);

const today = new Date().toISOString().slice(0, 10);

beforeEach(() => {
  useNavigateMock.mockReturnValue(vi.fn());
  fetchRef.current = () => Promise.resolve([]);
  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }
});

afterEach(() => cleanup());

describe('SerienKalenderPage', () => {
  it('renders the page header', async () => {
    render(<SerienKalenderPage />);
    expect(await screen.findByText('Serien-Kalender')).toBeInTheDocument();
  });

  it('shows the empty state when there are no premieres', async () => {
    fetchRef.current = () => Promise.resolve([]);
    render(<SerienKalenderPage />);
    expect(await screen.findByTestId('empty')).toBeInTheDocument();
  });

  it('renders the hero and cards for premieres in the current quarter', async () => {
    const entry: TvPremiereStaticEntry = {
      tmdbId: 1,
      type: 'new',
      premiereDate: today,
      title: 'Heute',
      originalTitle: null,
      overviewDe: null,
      poster: null,
      backdrop: null,
      rating: null,
      genres: [],
      networks: [],
      providers: [],
    };
    fetchRef.current = () => Promise.resolve([entry]);
    render(<SerienKalenderPage />);
    expect(await screen.findByTestId('hero')).toBeInTheDocument();
  });

  it('shows the error state when the fetch fails', async () => {
    fetchRef.current = () => Promise.resolve(null);
    render(<SerienKalenderPage />);
    expect(await screen.findByTestId('error')).toBeInTheDocument();
  });
});
