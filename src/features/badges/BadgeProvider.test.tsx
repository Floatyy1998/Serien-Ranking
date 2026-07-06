// @vitest-environment jsdom
import { useContext } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

const { registerBadgeCallback, removeBadgeCallback, invalidateCache } = vi.hoisted(() => ({
  registerBadgeCallback: vi.fn(),
  removeBadgeCallback: vi.fn(),
  invalidateCache: vi.fn(),
}));

vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'me' } }) }));
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../components/ui', () => ({ CelebrationBurst: () => null }));
vi.mock('../../lib/haptics', () => ({ hapticCelebrate: vi.fn() }));
vi.mock('./BadgeNotification', () => ({ default: () => <div data-testid="badge-notification" /> }));
vi.mock('./offlineBadgeSystem', () => ({
  getOfflineBadgeSystem: () => ({ invalidateCache }),
}));
vi.mock('./minimalActivityLogger', () => ({ registerBadgeCallback, removeBadgeCallback }));

import { BadgeProvider } from './BadgeProvider';
import { BadgeContext } from './BadgeContext';

const CountConsumer = () => {
  const ctx = useContext(BadgeContext);
  return <span data-testid="count">{ctx?.unreadBadgesCount ?? -1}</span>;
};

afterEach(() => {
  cleanup();
  registerBadgeCallback.mockClear();
  removeBadgeCallback.mockClear();
});

describe('BadgeProvider', () => {
  it('renders children and the badge notification', () => {
    render(
      <BadgeProvider>
        <div data-testid="child" />
      </BadgeProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('badge-notification')).toBeInTheDocument();
  });

  it('exposes a default unread badge count of 0', () => {
    render(
      <BadgeProvider>
        <CountConsumer />
      </BadgeProvider>
    );
    expect(screen.getByTestId('count')).toHaveTextContent('0');
  });

  it('registers a badge callback for the logged-in user', async () => {
    render(
      <BadgeProvider>
        <div />
      </BadgeProvider>
    );
    await waitFor(() =>
      expect(registerBadgeCallback).toHaveBeenCalledWith('me', expect.any(Function))
    );
  });
});
