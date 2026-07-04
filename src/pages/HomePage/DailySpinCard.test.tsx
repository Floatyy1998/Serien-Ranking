// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DailySpinCard } from './DailySpinCard';

const u = vi.hoisted(() => ({ uid: 'u1' }));
const fb = vi.hoisted(() => ({ resolve: (_path: string): unknown => null }));

vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: u }) }));

vi.mock('../../contexts/ThemeContextDef', async () => {
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

vi.mock('../../services/pet/dailySpinService', () => ({ toLocalDateString: () => 'TODAY' }));

vi.mock('../../components/pet/DailySpinWheel', () => ({
  DailySpinWheel: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="wheel">
      Wheel<button onClick={onClose}>close</button>
    </div>
  ),
}));

beforeEach(() => {
  fb.resolve = () => null;
});

afterEach(cleanup);

describe('DailySpinCard', () => {
  it('renders the available state when no spin happened today', () => {
    render(<DailySpinCard />);
    expect(screen.getByText('Glücksrad')).toBeInTheDocument();
    expect(screen.getByText('Jetzt drehen!')).toBeInTheDocument();
  });

  it('opens the spin wheel when clicked', () => {
    render(<DailySpinCard />);
    expect(screen.queryByTestId('wheel')).toBeNull();
    fireEvent.click(screen.getByText('Glücksrad'));
    expect(screen.getByTestId('wheel')).toBeInTheDocument();
  });

  it('shows the unavailable state with streak and total spins when already spun today', () => {
    fb.resolve = (path: string) => {
      if (path.endsWith('lastSpinDate')) return 'TODAY';
      if (path.endsWith('streak')) return { currentStreak: 5 };
      if (path.endsWith('totalSpins')) return 7;
      return null;
    };
    render(<DailySpinCard />);
    expect(screen.getByText('Morgen wieder verfügbar')).toBeInTheDocument();
    expect(screen.getByText(/5d Bonus/)).toBeInTheDocument();
    expect(screen.getByText(/7x gedreht/)).toBeInTheDocument();
  });
});
