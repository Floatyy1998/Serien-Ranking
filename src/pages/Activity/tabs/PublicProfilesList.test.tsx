// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { PublicDirectoryEntry } from '../../../types/PublicDirectory';

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

const navigateMock = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

const social = vi.hoisted(() => ({
  friends: [] as Array<{ uid: string }>,
  sentRequests: [] as Array<{ toUserId: string; status: string }>,
  friendRequests: [] as Array<{ fromUserId: string; status: string }>,
  sendFriendRequest: vi.fn(async () => true),
}));
vi.mock('../../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => social,
}));
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'me' } }) }));
vi.mock('../../../contexts/ThemeContext', () => {
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
vi.mock('../../../components/ui', () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));
vi.mock('../../../components/ui/display/NameBadges', () => ({ NameBadges: () => null }));

const directory = vi.hoisted(() => ({ fetchPublicDirectory: vi.fn() }));
vi.mock('../../../services/social/publicDirectoryService', () => directory);

import { PublicProfilesList } from './PublicProfilesList';

const entry = (uid: string, name: string, extra: Partial<PublicDirectoryEntry> = {}) => ({
  uid,
  publicId: `p-${uid}`,
  displayName: name,
  username: name.toLowerCase(),
  photoURL: null,
  series: 3,
  movies: 1,
  watchtimeMinutes: 100,
  ...extra,
});

beforeEach(() => {
  navigateMock.mockReset();
  social.friends = [];
  social.sentRequests = [];
  social.friendRequests = [];
  social.sendFriendRequest.mockClear();
  directory.fetchPublicDirectory.mockReset();
});

afterEach(cleanup);

describe('PublicProfilesList', () => {
  it('zeigt fremde Profile mit Zahlen, sich selbst nicht', async () => {
    directory.fetchPublicDirectory.mockResolvedValue([
      entry('me', 'Ich'),
      entry('a', 'Anna', { series: 1, movies: 0 }),
    ]);
    render(<PublicProfilesList saveScrollPosition={vi.fn()} />);

    expect(await screen.findByText('Anna')).toBeInTheDocument();
    expect(screen.getByText('1 Serie')).toBeInTheDocument();
    expect(screen.queryByText('Ich')).not.toBeInTheDocument();
  });

  it('öffnet per Klick das Profil in der App, auch ohne Freundschaft', async () => {
    directory.fetchPublicDirectory.mockResolvedValue([entry('a', 'Anna')]);
    render(<PublicProfilesList saveScrollPosition={vi.fn()} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Profil von Anna öffnen' }));
    expect(navigateMock).toHaveBeenCalledWith('/friend/a');
  });

  it('sendet eine Freundschaftsanfrage und zeigt danach „Angefragt“', async () => {
    directory.fetchPublicDirectory.mockResolvedValue([entry('a', 'Anna')]);
    render(<PublicProfilesList saveScrollPosition={vi.fn()} />);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Anna eine Freundschaftsanfrage senden' })
    );

    await waitFor(() => expect(social.sendFriendRequest).toHaveBeenCalledWith('anna', 'a'));
    expect(await screen.findByText('Angefragt')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('kennzeichnet Freunde und offene Anfragen', async () => {
    social.friends = [{ uid: 'a' }];
    social.friendRequests = [{ fromUserId: 'b', status: 'pending' }];
    directory.fetchPublicDirectory.mockResolvedValue([entry('a', 'Anna'), entry('b', 'Ben')]);
    render(<PublicProfilesList saveScrollPosition={vi.fn()} />);

    expect(await screen.findByText('Freund')).toBeInTheDocument();
    expect(screen.getByText('Hat dich angefragt')).toBeInTheDocument();
  });

  it('filtert per Suche', async () => {
    directory.fetchPublicDirectory.mockResolvedValue([entry('a', 'Anna'), entry('b', 'Ben')]);
    render(<PublicProfilesList saveScrollPosition={vi.fn()} />);
    await screen.findByText('Anna');

    fireEvent.change(screen.getByLabelText('Öffentliche Profile durchsuchen'), {
      target: { value: 'be' },
    });

    expect(screen.queryByText('Anna')).not.toBeInTheDocument();
    expect(screen.getByText('Ben')).toBeInTheDocument();
  });

  it('zeigt einen Leerzustand ohne Profile', async () => {
    directory.fetchPublicDirectory.mockResolvedValue([]);
    render(<PublicProfilesList saveScrollPosition={vi.fn()} />);
    expect(await screen.findByText('Noch keine öffentlichen Profile')).toBeInTheDocument();
  });
});
