// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { WatchStreakCard } from './WatchStreakCard';

const { u, streakData } = vi.hoisted(() => ({
  u: { uid: 'u1' },
  streakData: { value: { currentStreak: 5, longestStreak: 5, lastWatchDate: '2026-07-04' } },
}));

vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: u }) }));

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

vi.mock('./watchStreakHelpers', () => ({
  getStreakStatus: () => 'active',
  getShieldCooldown: () => ({ onCooldown: false, daysRemaining: 0 }),
}));

vi.mock('../../lib/haptics', () => ({ hapticCelebrate: vi.fn(), hapticSuccess: vi.fn() }));
vi.mock('../../services/petService', () => ({
  petService: { activateStreakShield: vi.fn(() => Promise.resolve({ success: true })) },
}));
vi.mock('../../components/ui', () => ({ CelebrationBurst: () => null }));

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: (path: string) => ({
        on: (_event: string, cb: (snap: { val: () => unknown }) => void) => {
          if (path.includes('/streak')) cb({ val: () => streakData.value });
          else cb({ val: () => null });
          return cb;
        },
        off: vi.fn(),
        once: () => Promise.resolve({ val: () => null }),
      }),
    }),
  },
}));
vi.mock('firebase/compat/database', () => ({}));

afterEach(cleanup);

describe('WatchStreakCard', () => {
  it('renders the streak header and count (smoke)', () => {
    render(<WatchStreakCard />);
    expect(screen.getByText('Watch Streak')).toBeInTheDocument();
    expect(screen.getByText('5 Tage in Folge')).toBeInTheDocument();
  });

  it('shows the numeric streak value', () => {
    render(<WatchStreakCard />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('toggles the info legend when the card is clicked', () => {
    render(<WatchStreakCard />);
    fireEvent.click(screen.getByText('Watch Streak'));
    expect(screen.getByText('Heute geschaut')).toBeInTheDocument();
  });
});
