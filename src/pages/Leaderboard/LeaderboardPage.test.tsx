// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { LeaderboardCategory, LeaderboardEntry } from '../../types/Leaderboard';

interface LbState {
  user: { uid: string; displayName?: string } | null;
  mode: 'friends' | 'global';
  setMode: (m: 'friends' | 'global') => void;
  activeCategory: LeaderboardCategory;
  setActiveCategory: (c: LeaderboardCategory) => void;
  rankings: LeaderboardEntry[];
  trophies: never[];
  loading: boolean;
  celebration: null;
  setCelebration: () => void;
  scrollContainerRef: { current: HTMLDivElement | null };
}

const { lbState } = vi.hoisted(() => ({
  lbState: {
    user: { uid: 'me', displayName: 'Konrad' },
    mode: 'friends',
    setMode: vi.fn(),
    activeCategory: 'episodesThisMonth',
    setActiveCategory: vi.fn(),
    rankings: [] as LeaderboardEntry[],
    trophies: [],
    loading: false,
    celebration: null,
    setCelebration: vi.fn(),
    scrollContainerRef: { current: null },
  } as unknown as LbState,
}));

vi.mock('./useLeaderboardData', () => ({ useLeaderboardData: () => lbState }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'transition', 'whileTap', 'whileHover']);
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
vi.mock('@mui/icons-material', () => ({
  EmojiEvents: () => null,
  Group: () => null,
  LocalFireDepartment: () => null,
  Movie: () => null,
  PlayCircle: () => null,
  Public: () => null,
  Timer: () => null,
}));
vi.mock('../../components/ui', () => ({
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  ),
}));
vi.mock('./CelebrationModal', () => ({ CelebrationModal: () => null }));
vi.mock('./PodiumSection', () => ({ PodiumSection: () => <div data-testid="podium" /> }));
vi.mock('./RankingList', () => ({ RankingList: () => <div data-testid="rankings" /> }));
vi.mock('./TrophyHistory', () => ({ TrophyHistory: () => <div data-testid="trophies" /> }));
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

import { LeaderboardPage } from './LeaderboardPage';

beforeEach(() => {
  lbState.loading = false;
  lbState.mode = 'friends';
  lbState.activeCategory = 'episodesThisMonth';
  lbState.rankings = [
    { uid: 'me', displayName: 'Konrad', value: 5, rank: 1, isCurrentUser: true },
    { uid: 'b', displayName: 'Bob', value: 3, rank: 2, isCurrentUser: false },
  ];
  (lbState.setMode as ReturnType<typeof vi.fn>).mockReset();
  (lbState.setActiveCategory as ReturnType<typeof vi.fn>).mockReset();
});
afterEach(() => cleanup());

describe('LeaderboardPage', () => {
  it('shows the loading state while data is loading', () => {
    lbState.loading = true;
    render(<LeaderboardPage />);
    expect(screen.getByText('Rangliste wird geladen...')).toBeInTheDocument();
  });

  it('renders the category pills and podium/rankings in the main view', () => {
    render(<LeaderboardPage />);
    expect(screen.getByText('Episoden')).toBeInTheDocument();
    expect(screen.getByTestId('podium')).toBeInTheDocument();
    expect(screen.getByTestId('rankings')).toBeInTheDocument();
  });

  it('changes the active category when a pill is clicked', () => {
    render(<LeaderboardPage />);
    fireEvent.click(screen.getByText('Filme'));
    expect(lbState.setActiveCategory).toHaveBeenCalledWith('moviesThisMonth');
  });

  it('shows the empty friends state when there is only one ranking', () => {
    lbState.rankings = [
      { uid: 'me', displayName: 'Konrad', value: 5, rank: 1, isCurrentUser: true },
    ];
    render(<LeaderboardPage />);
    expect(screen.getByText('Noch keine Freunde')).toBeInTheDocument();
  });
});
