// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Friend } from '../../types/Friend';

if (typeof window !== 'undefined' && !window.matchMedia) {
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

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigate }));

const social = vi.hoisted(() => ({
  friends: [] as Friend[],
  favoriteIds: new Set<string>(),
  toggleFavoriteFriend: vi.fn(async () => {}),
}));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => social,
}));

vi.mock('../../contexts/ThemeContext', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#ef6f8a',
    backgroundColor: '#2b1a2e',
    accentColor: '#f2a648',
  });
  return { useTheme: () => ({ currentTheme }) };
});

import { FavoriteFriendsSheet } from './FavoriteFriendsSheet';

const friend = (uid: string, displayName: string): Friend =>
  ({ uid, displayName, username: displayName.toLowerCase(), email: '' }) as Friend;

beforeEach(() => {
  social.friends = [friend('f1', 'Flo'), friend('f2', 'Anna')];
  social.favoriteIds = new Set(['f1']);
  social.toggleFavoriteFriend.mockClear();
  navigate.mockClear();
});
afterEach(cleanup);

describe('FavoriteFriendsSheet', () => {
  it('marks the current favorites as selected', () => {
    render(<FavoriteFriendsSheet isOpen onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /Flo/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /Anna/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('toggles a favorite immediately, without a save button', () => {
    render(<FavoriteFriendsSheet isOpen onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Anna/ }));
    expect(social.toggleFavoriteFriend).toHaveBeenCalledWith('f2');
    expect(screen.queryByRole('button', { name: /Speichern/ })).not.toBeInTheDocument();
  });

  it('routes to the friends page when there is nobody to pick', () => {
    social.friends = [];
    const onClose = vi.fn();
    render(<FavoriteFriendsSheet isOpen onClose={onClose} />);

    expect(screen.getByText('Noch keine Freunde')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Freunde finden' }));
    expect(onClose).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/activity');
  });
});
