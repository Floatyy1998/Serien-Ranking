// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Friend } from '../../types/Friend';
import { CalendarFriendBar } from './CalendarFriendBar';

vi.mock('../../contexts/ThemeContext', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#ef6f8a',
    backgroundColor: '#2b1a2e',
    accentColor: '#f2a648',
  });
  return { useTheme: () => ({ currentTheme }) };
});

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

vi.mock('../../components/ui/media/UserAvatar', () => ({
  UserAvatar: () => <span data-testid="avatar" />,
}));

vi.mock('../../components/social/FavoriteFriendsSheet', () => ({
  FavoriteFriendsSheet: ({ isOpen }: { isOpen: boolean }) =>
    isOpen ? <div data-testid="favorite-sheet" /> : null,
}));

afterEach(cleanup);

const friend = (uid: string, displayName: string): Friend =>
  ({ uid, displayName, username: displayName.toLowerCase(), email: '' }) as Friend;

describe('CalendarFriendBar', () => {
  it('renders nothing at all without friends', () => {
    const { container } = render(
      <CalendarFriendBar
        favoriteFriends={[]}
        hasFriends={false}
        viewedFriendUid={null}
        onSelect={() => {}}
      />
    );
    // Kein Werbebanner für ein Sozialfeature bei Alleinnutzern.
    expect(container).toBeEmptyDOMElement();
  });

  it('offers to pick favorites when there are friends but no favorites', () => {
    render(
      <CalendarFriendBar
        favoriteFriends={[]}
        hasFriends
        viewedFriendUid={null}
        onSelect={() => {}}
      />
    );
    const invite = screen.getByRole('button', { name: /Favoriten wählen/ });
    expect(invite).toBeInTheDocument();
    fireEvent.click(invite);
    expect(screen.getByTestId('favorite-sheet')).toBeInTheDocument();
  });

  it('shows a chip per favorite plus the own calendar', () => {
    render(
      <CalendarFriendBar
        favoriteFriends={[friend('f1', 'Flo'), friend('f2', 'Anna')]}
        hasFriends
        viewedFriendUid={null}
        onSelect={() => {}}
      />
    );
    expect(screen.getByRole('tab', { name: 'Ich' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Flo/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Anna/ })).toBeInTheDocument();
  });

  it('selects a friend and toggles back when tapped again', () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <CalendarFriendBar
        favoriteFriends={[friend('f1', 'Flo')]}
        hasFriends
        viewedFriendUid={null}
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByRole('tab', { name: /Flo/ }));
    expect(onSelect).toHaveBeenCalledWith('f1');

    rerender(
      <CalendarFriendBar
        favoriteFriends={[friend('f1', 'Flo')]}
        hasFriends
        viewedFriendUid="f1"
        onSelect={onSelect}
      />
    );
    fireEvent.click(screen.getByRole('tab', { name: /Flo/ }));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it('keeps an edit button to adjust the favorites', () => {
    render(
      <CalendarFriendBar
        favoriteFriends={[friend('f1', 'Flo')]}
        hasFriends
        viewedFriendUid={null}
        onSelect={() => {}}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Favoriten bearbeiten' }));
    expect(screen.getByTestId('favorite-sheet')).toBeInTheDocument();
  });
});
