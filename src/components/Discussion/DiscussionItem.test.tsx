// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

vi.mock('../../contexts/ThemeContextDef', () => {
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

// framer-motion's motion-value lifecycle throws in the jsdom test env
// (`removeOnChange is not a function`); a prop-stripping passthrough is enough here.
vi.mock('framer-motion', async () => {
  const { createElement, forwardRef, Fragment } = await import('react');
  const SKIP = new Set([
    'initial',
    'animate',
    'exit',
    'whileTap',
    'whileHover',
    'whileInView',
    'whileFocus',
    'whileDrag',
    'viewport',
    'transition',
    'layout',
    'layoutId',
    'drag',
    'dragConstraints',
    'onViewportEnter',
    'onViewportLeave',
    'variants',
    'custom',
    'onAnimationStart',
    'onAnimationComplete',
  ]);
  const make = (tag: string) =>
    forwardRef((props: Record<string, unknown>, ref: React.Ref<unknown>) => {
      const clean: Record<string, unknown> = {};
      for (const k in props) if (!SKIP.has(k)) clean[k] = props[k];
      return createElement(tag, { ...clean, ref });
    });
  const cache: Record<string, unknown> = {};
  const motion = new Proxy(
    {},
    { get: (_t: object, tag: string | symbol) => (cache[String(tag)] ??= make(String(tag))) }
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children?: React.ReactNode }) =>
      createElement(Fragment, null, children),
    useMotionValue: (v: unknown) => ({ get: () => v, set: () => {} }),
    useSpring: (v: unknown) => v,
    useTransform: () => ({ get: () => 0, set: () => {} }),
    useMotionTemplate: () => '',
  };
});

vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));

vi.mock('firebase/compat/app', () => ({ default: { storage: () => ({}) } }));
vi.mock('firebase/compat/storage', () => ({}));

// RepliesSection is exercised in its own test; stub it here to keep this focused.
vi.mock('./RepliesSection', () => ({
  RepliesSection: () => <div data-testid="replies-section" />,
}));

import { DiscussionItem } from './DiscussionItem';
import type { Discussion } from '../../types/Discussion';

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
});

const discussion: Discussion = {
  id: 'd1',
  itemId: 1,
  itemType: 'series',
  userId: 'u1',
  username: 'Bob',
  title: 'Great show',
  content: 'I loved it',
  createdAt: Date.now(),
  likes: [],
  replyCount: 0,
};

const baseProps = {
  discussion,
  discussionPath: 'discussions/series/1',
  onDelete: vi.fn(),
  onEdit: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
  onToggleLike: vi.fn(),
  isOwner: false,
  currentUserId: 'u1',
};

describe('DiscussionItem', () => {
  it('renders the discussion title, author and content', () => {
    render(<DiscussionItem {...baseProps} />);
    expect(screen.getByText('Great show')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('I loved it')).toBeInTheDocument();
  });

  it('invokes onToggleLike when the like button is clicked', () => {
    const onToggleLike = vi.fn();
    render(<DiscussionItem {...baseProps} onToggleLike={onToggleLike} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gefällt mir' }));
    expect(onToggleLike).toHaveBeenCalledTimes(1);
  });

  it('owner can open the edit form', () => {
    render(<DiscussionItem {...baseProps} isOwner />);
    fireEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    expect(screen.getByDisplayValue('Great show')).toBeInTheDocument();
  });

  it('hides spoiler content behind a reveal', () => {
    render(<DiscussionItem {...baseProps} discussion={{ ...discussion, isSpoiler: true }} />);
    expect(screen.queryByText('I loved it')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Spoiler anzeigen'));
    expect(screen.getByText('I loved it')).toBeInTheDocument();
  });
});
