// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

// framer-motion passthrough: the real lib throws on unmount in jsdom
// ("removeOnChange is not a function"). Strip motion-only props, render plain tags.
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'variants',
    'layout',
    'layoutId',
    'whileTap',
    'whileHover',
    'whileInView',
    'whileFocus',
    'whileDrag',
    'viewport',
    'drag',
    'dragConstraints',
    'dragElastic',
    'dragMomentum',
    'dragSnapToOrigin',
    'onDragEnd',
  ]);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
    useReducedMotion: () => true,
    useDragControls: () => ({ start: () => {} }),
  };
});

// @mui/icons-material barrel import pulls in ~11k modules → OOM in the worker; stub used icons.
vi.mock('@mui/icons-material', () => ({
  ChatBubbleOutline: () => null,
  Favorite: () => null,
  Flag: () => null,
}));

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
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
vi.mock('../useActivityGrouping', () => ({
  useActivityGrouping: () => ({ formatTimeAgo: () => 'vor 2 Std' }),
}));
vi.mock('../../../components/ui', () => ({
  EmptyState: ({ title }: { title: string }) => <div>{title}</div>,
}));

import { DiscussionsTab } from './DiscussionsTab';

const notification = {
  id: 'n1',
  type: 'discussion_reply',
  title: 'Neue Antwort',
  message: 'Frank hat geantwortet',
  timestamp: 1000,
  read: false,
  data: { discussionPath: 'discussions/series/123' },
};

beforeEach(() => navigateMock.mockReset());
afterEach(() => cleanup());

describe('DiscussionsTab', () => {
  it('renders the empty state without notifications', () => {
    render(<DiscussionsTab notifications={[]} markAsRead={vi.fn()} />);
    expect(screen.getByText('Keine Benachrichtigungen')).toBeInTheDocument();
  });

  it('renders a notification title and message', () => {
    render(<DiscussionsTab notifications={[notification]} markAsRead={vi.fn()} />);
    expect(screen.getByText('Neue Antwort')).toBeInTheDocument();
    expect(screen.getByText('Frank hat geantwortet')).toBeInTheDocument();
  });

  it('marks read and navigates to the discussion path on click', () => {
    const markAsRead = vi.fn();
    render(<DiscussionsTab notifications={[notification]} markAsRead={markAsRead} />);
    fireEvent.click(screen.getByText('Neue Antwort'));
    expect(markAsRead).toHaveBeenCalledWith('n1');
    expect(navigateMock).toHaveBeenCalledWith('/series/123');
  });
});
