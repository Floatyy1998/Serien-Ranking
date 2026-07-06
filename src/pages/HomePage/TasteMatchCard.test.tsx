// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TasteMatchCard } from './TasteMatchCard';
import type { Friend } from '../../types/Friend';

const MOTION_ONLY = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'layout',
  'drag',
]);
const strip = (props: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(props)) if (!MOTION_ONLY.has(k)) out[k] = props[k];
  return out;
};
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: new Proxy(
    {},
    {
      get: (_t, tag: string) => (props: Record<string, unknown>) =>
        createElement(tag, strip(props)),
    }
  ),
}));

const { navigateMock, friendsRef } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  friendsRef: { value: [] as Friend[] },
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => ({ friends: friendsRef.value }),
}));

vi.mock('../../lib/firebase/userDisplayData', () => ({
  fetchPublicUserFields: vi.fn(() => Promise.resolve({})),
}));

type NavCardProps = { children: React.ReactNode; onClick?: () => void; 'aria-label'?: string };
type WrapProps = { children?: React.ReactNode };
type IconButtonProps = { onClick?: () => void; tooltip?: string };

vi.mock('../../components/ui', () => ({
  NavCard: (p: NavCardProps) => (
    <button aria-label={p['aria-label']} onClick={p.onClick}>
      {p.children}
    </button>
  ),
  IconContainer: (p: WrapProps) => <div>{p.children}</div>,
  IconButton: (p: IconButtonProps) => <button aria-label={p.tooltip} onClick={p.onClick} />,
}));

function makeFriend(over: Partial<Friend> = {}): Friend {
  return {
    uid: 'f1',
    email: 'f@x.de',
    username: 'alice',
    displayName: 'Alice',
    friendsSince: 0,
    ...over,
  };
}

afterEach(() => {
  cleanup();
  friendsRef.value = [];
});

describe('TasteMatchCard', () => {
  it('renders nothing without friends', () => {
    friendsRef.value = [];
    const { container } = render(<TasteMatchCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the card when friends exist (smoke)', () => {
    friendsRef.value = [makeFriend()];
    render(<TasteMatchCard />);
    expect(screen.getByText('Taste Match')).toBeInTheDocument();
    expect(screen.getByText('Geschmack vergleichen')).toBeInTheDocument();
  });

  it('opens the selector and navigates to taste-match on friend select', () => {
    friendsRef.value = [makeFriend({ uid: 'f42', displayName: 'Bob' })];
    render(<TasteMatchCard />);
    fireEvent.click(screen.getByRole('button', { name: /Taste Match/i }));
    expect(screen.getByText('Freund auswählen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Bob'));
    expect(navigateMock).toHaveBeenCalledWith('/taste-match/f42');
  });
});
