// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { FriendSeriesProgress } from './useFriendsSeriesProgress';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

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

import { FriendsProgressStrip } from './FriendsProgressStrip';

const entry: FriendSeriesProgress = {
  uid: 'u1',
  displayName: 'Frank',
  watched: 5,
  percentage: 50,
  latestSeason: 1,
  latestEpisode: 3,
  hasStarted: true,
  completed: false,
};

beforeEach(() => {
  navigateMock.mockReset();
  try {
    localStorage.removeItem('friendsProgressCollapsed');
  } catch {
    /* ignore */
  }
});

afterEach(() => cleanup());

describe('FriendsProgressStrip', () => {
  it('renders nothing when there are no friend entries', () => {
    const { container } = render(
      <FriendsProgressStrip entries={[]} userPercentage={0} userWatched={0} isMobile={false} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a friend with position and progress percentage', () => {
    render(
      <FriendsProgressStrip
        entries={[entry]}
        userPercentage={40}
        userWatched={4}
        isMobile={false}
      />
    );
    expect(screen.getByText('Frank')).toBeInTheDocument();
    expect(screen.getByText('S1E3')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('navigates to the friend profile when the row is clicked', () => {
    render(
      <FriendsProgressStrip
        entries={[entry]}
        userPercentage={40}
        userWatched={4}
        isMobile={false}
      />
    );
    fireEvent.click(screen.getByText('Frank'));
    expect(navigateMock).toHaveBeenCalledWith('/friend/u1');
  });

  it('collapses the list when the header toggle is pressed', () => {
    render(
      <FriendsProgressStrip
        entries={[entry]}
        userPercentage={40}
        userWatched={4}
        isMobile={false}
      />
    );
    expect(screen.getByText('Frank')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { expanded: true }));
    expect(screen.queryByText('Frank')).not.toBeInTheDocument();
  });
});
