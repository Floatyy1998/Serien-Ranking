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

import { ReplyItem } from './ReplyItem';
import type { DiscussionReply } from '../../types/Discussion';

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
});

const reply: DiscussionReply = {
  id: 'r1',
  userId: 'u1',
  username: 'Alice',
  content: 'Hello world',
  createdAt: Date.now(),
  likes: [],
};

const baseProps = {
  reply,
  onDelete: vi.fn(),
  onEdit: vi.fn<() => Promise<boolean>>().mockResolvedValue(true),
  onToggleLike: vi.fn(),
  isOwner: false,
  currentUserId: 'viewer',
};

describe('ReplyItem', () => {
  it('renders the reply author and content', () => {
    render(<ReplyItem {...baseProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('invokes onToggleLike when the like button is clicked', () => {
    const onToggleLike = vi.fn();
    render(<ReplyItem {...baseProps} onToggleLike={onToggleLike} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gefällt mir' }));
    expect(onToggleLike).toHaveBeenCalledTimes(1);
  });

  it('calls onReplyTo with the username when the reply button is clicked', () => {
    const onReplyTo = vi.fn();
    render(<ReplyItem {...baseProps} onReplyTo={onReplyTo} />);
    fireEvent.click(screen.getByRole('button', { name: '@Alice antworten' }));
    expect(onReplyTo).toHaveBeenCalledWith('Alice');
  });

  it('renders owner edit/delete controls', () => {
    render(<ReplyItem {...baseProps} isOwner currentUserId="u1" />);
    expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides spoiler content behind a reveal button', () => {
    render(<ReplyItem {...baseProps} reply={{ ...reply, isSpoiler: true }} />);
    expect(screen.queryByText('Hello world')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Spoiler anzeigen'));
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });
});
