// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

const { navigateMock, onceMock, friendsRef, authValue } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  onceMock: vi.fn(),
  friendsRef: {
    current: [] as { uid: string; displayName?: string; email?: string; photoURL?: string }[],
  },
  // Stable reference — a fresh object each render would retrigger the load effect
  // (it depends on `user` identity) and spin an infinite update loop.
  authValue: { user: { uid: 'me' } },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

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

vi.mock('../../AuthContext', () => ({ useAuth: () => authValue }));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => ({ friends: friendsRef.current }),
}));

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: () => ({ once: onceMock }) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

import { FriendsWhoHaveThis } from './FriendsWhoHaveThis';

beforeEach(() => {
  navigateMock.mockReset();
  onceMock.mockReset();
  friendsRef.current = [];
});

afterEach(() => cleanup());

describe('FriendsWhoHaveThis', () => {
  it('renders nothing when the user has no friends', async () => {
    const { container } = render(<FriendsWhoHaveThis itemId={5} mediaType="series" />);
    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('shows a friend rating badge when a friend owns the item', async () => {
    friendsRef.current = [{ uid: 'f1', displayName: 'Frank', photoURL: 'https://p/frank.png' }];
    onceMock.mockResolvedValue({ val: () => ({ rating: { f1: 9 } }) });
    render(<FriendsWhoHaveThis itemId={5} mediaType="series" />);
    expect(await screen.findByText('9.00')).toBeInTheDocument();
  });
});
