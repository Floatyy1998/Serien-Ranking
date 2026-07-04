// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useNavigationType: () => 'PUSH',
}));
vi.mock('@mui/icons-material', () => ({
  Animation: () => null,
  ArrowDownward: () => null,
  Autorenew: () => null,
  CalendarMonth: () => null,
  InfoOutlined: () => null,
  SmartDisplay: () => null,
  TaskAlt: () => null,
}));
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
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
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  ),
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PageState: ({ error }: { error?: { title: string } }) => <div>{error?.title}</div>,
  ScrollToTopButton: () => <div />,
  Skeleton: () => <div />,
  TabSwitcher: ({ tabs }: { tabs: { id: string; label: string }[] }) => (
    <div>
      {tabs.map((t) => (
        <span key={t.id}>{t.label}</span>
      ))}
    </div>
  ),
}));
vi.mock('./AnimeSeasonCard', () => ({ AnimeSeasonCard: () => <div data-testid="as-card" /> }));
vi.mock('./AnimeSeasonHero', () => ({ AnimeSeasonHero: () => <div data-testid="as-hero" /> }));
vi.mock('./AnimeSeasonStudioFilter', () => ({ AnimeSeasonStudioFilter: () => <div /> }));
vi.mock('./useAnimeListMatch', () => ({
  useAnimeListMatch: () => ({ matchAnime: () => undefined }),
}));
vi.mock('./resolveTmdbId', () => ({
  readResolveCacheSync: () => ({}),
  resolveTmdbInfo: () =>
    Promise.resolve({
      tmdbId: null,
      mediaType: 'tv',
      overviewDe: null,
      providers: [],
      premiereDate: null,
      tmdbRating: null,
      genres: [],
    }),
}));
vi.mock('../../services/anilistSeasonService', () => ({
  fetchSeasonAnime: () => Promise.resolve({ media: [], hasNextPage: false }),
  fetchContinuingAnime: () => Promise.resolve([]),
  getCurrentSeason: () => ({ season: 'WINTER', year: 2026 }),
  shiftSeason: (ref: { season: string; year: number }, delta: number) => ({
    season: ref.season,
    year: ref.year + delta,
  }),
  seasonKey: (ref: { season: string; year: number }) => `${ref.season}-${ref.year}`,
  seasonLabel: (ref: { season: string; year: number }) => `${ref.season} ${ref.year}`,
}));
vi.mock('../../lib/staticCatalog', () => ({
  fetchStaticCatalogSeasonsBulk: () => Promise.resolve({}),
  fetchStaticSeasonalAnime: () => Promise.resolve({}),
  subscribeCatalogChange: () => () => {},
}));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'me' } }) }));
vi.mock('../../firebase/analytics', () => ({
  trackMovieAdded: vi.fn(),
  trackSeriesAdded: vi.fn(),
}));
vi.mock('../../features/badges/minimalActivityLogger', () => ({
  logMovieAdded: vi.fn(),
  logSeriesAdded: vi.fn(),
}));
vi.mock('../../lib/backendApi', () => ({ backendFetch: vi.fn() }));
vi.mock('../../hooks/useProviderLogos', () => ({ tmdbLogoUrl: () => '' }));
vi.mock('../../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
vi.mock('../../hooks/useScrollRestore', () => ({ useScrollRestore: () => {} }));
vi.mock('../../lib/validation/providerChangeDetection', () => ({
  normalizeProviderName: (n: string) => n,
}));
vi.mock('../../lib/haptics', () => ({
  hapticSelect: vi.fn(),
  hapticSuccess: vi.fn(),
  hapticTap: vi.fn(),
}));
vi.mock('../../lib/toast', () => ({ showToast: vi.fn() }));
vi.mock('../../theme/colorUtils', () => ({
  getOptimalTextColor: () => '#000',
  lightenColor: () => '#fff',
}));
vi.mock('../../utils/episodeDate', () => ({ getEpisodeAirDate: () => null }));
vi.mock('../../lib/providerMerge', () => ({ getProviderLogoUrl: () => '' }));
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

import { AnimeSeasonPage } from './AnimeSeasonPage';

afterEach(() => cleanup());

describe('AnimeSeasonPage', () => {
  it('renders the page header', () => {
    render(<AnimeSeasonPage />);
    expect(screen.getByText('Anime-Season')).toBeInTheDocument();
  });

  it('shows the empty state once loading resolves with no anime', async () => {
    render(<AnimeSeasonPage />);
    expect(await screen.findByText('Keine Anime gefunden')).toBeInTheDocument();
  });
});
