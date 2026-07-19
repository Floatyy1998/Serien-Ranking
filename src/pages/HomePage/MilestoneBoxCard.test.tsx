// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MilestoneBoxCard } from './MilestoneBoxCard';

const u = vi.hoisted(() => ({ uid: 'u1' }));
const fb = vi.hoisted(() => ({ resolve: (_path: string): unknown => null }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: u }) }));

vi.mock('../../contexts/ThemeContext', async () => {
  const { defaultDynamicTheme } = await import('../../theme/dynamicTheme');
  return { useTheme: () => ({ currentTheme: defaultDynamicTheme }) };
});

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: (path: string) => ({
        on: (_event: string, cb: (snap: { val: () => unknown }) => void) => {
          cb({ val: () => fb.resolve(path) });
          return cb;
        },
        off: vi.fn(),
      }),
    }),
  },
}));
vi.mock('firebase/compat/database', () => ({}));

vi.mock('../../hooks/useWebWorkerStatsOptimized', () => ({
  useWebWorkerStatsOptimized: () => ({ watchedEpisodes: 45 }),
}));

vi.mock('../../services/pet/mysteryBoxService', () => ({
  BOX_EVERY_N_EPISODES: 20,
  BOX_SCHEMA_VERSION: 2,
  ensureInitialized: vi.fn(() => Promise.resolve()),
  getNextBoxThreshold: (n: number) => Math.ceil((n + 1) / 20) * 20,
  getProgressToNextBox: () => 0.25,
  syncAvailableBoxCount: vi.fn(() => Promise.resolve()),
}));

vi.mock('../../lib/haptics', () => ({ hapticCelebrate: vi.fn() }));

vi.mock('../../components/ui', () => ({ CelebrationBurst: () => null }));

vi.mock('../../components/pet/MysteryBoxOverlay', () => ({
  MysteryBoxOverlay: () => <div data-testid="box-overlay" />,
}));

beforeEach(() => {
  fb.resolve = () => null;
});

afterEach(cleanup);

describe('MilestoneBoxCard', () => {
  it('renders the progress state when no box is available', () => {
    render(<MilestoneBoxCard />);
    expect(screen.getByText('Mystery Box')).toBeInTheDocument();
    expect(screen.getByText('Nächste in 15 Episoden')).toBeInTheDocument();
  });

  it('renders the available state and opens the overlay when clicked', () => {
    fb.resolve = (path: string) => {
      if (path.endsWith('mysteryBox')) return { lastOpenedBoxNumber: 0, schemaVersion: 2 };
      return null;
    };
    render(<MilestoneBoxCard />);
    expect(screen.getByText('2 Boxen verfügbar!')).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
    expect(screen.queryByTestId('box-overlay')).toBeNull();
    fireEvent.click(screen.getByText('Mystery Box'));
    expect(screen.getByTestId('box-overlay')).toBeInTheDocument();
  });
});
