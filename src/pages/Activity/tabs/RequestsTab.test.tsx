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
import type { FriendRequest } from '../../../types/Friend';

const { showUndoToastMock } = vi.hoisted(() => ({ showUndoToastMock: vi.fn() }));

vi.mock('../../../contexts/ThemeContextDef', () => {
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
  useActivityGrouping: () => ({ formatTimeAgo: () => 'vor 1 Tag' }),
}));
vi.mock('../../../lib/toast', () => ({ showUndoToast: showUndoToastMock }));

import { RequestsTab } from './RequestsTab';

const incoming: FriendRequest = {
  id: 'r1',
  fromUserId: 'u1',
  toUserId: 'me',
  fromUserEmail: 'u1@x.de',
  toUserEmail: 'me@x.de',
  fromUsername: 'frank',
  status: 'pending',
  sentAt: 1000,
};

const baseProps = {
  friendRequests: [] as FriendRequest[],
  sentRequests: [] as FriendRequest[],
  requestProfiles: {},
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
  cancelFriendRequest: vi.fn(),
};

beforeEach(() => {
  showUndoToastMock.mockReset();
  baseProps.acceptFriendRequest = vi.fn();
  baseProps.declineFriendRequest = vi.fn();
});

afterEach(() => cleanup());

describe('RequestsTab', () => {
  it('renders the empty state when there are no requests', () => {
    render(<RequestsTab {...baseProps} />);
    expect(screen.getByText('Keine offenen Anfragen')).toBeInTheDocument();
  });

  it('renders an incoming request with the sender name', () => {
    render(
      <RequestsTab
        {...baseProps}
        friendRequests={[incoming]}
        requestProfiles={{ u1: { displayName: 'Frank' } }}
      />
    );
    expect(screen.getByText('Frank')).toBeInTheDocument();
    expect(screen.getByText(/Eingehend/)).toBeInTheDocument();
  });

  it('accepts a request directly on the accept button', () => {
    const acceptFriendRequest = vi.fn();
    render(
      <RequestsTab
        {...baseProps}
        friendRequests={[incoming]}
        acceptFriendRequest={acceptFriendRequest}
      />
    );
    fireEvent.click(screen.getByLabelText('Annehmen'));
    expect(acceptFriendRequest).toHaveBeenCalledWith('r1');
  });

  it('routes a decline through the undo toast', () => {
    render(<RequestsTab {...baseProps} friendRequests={[incoming]} />);
    fireEvent.click(screen.getByLabelText('Ablehnen'));
    expect(showUndoToastMock).toHaveBeenCalledWith('Anfrage abgelehnt', expect.anything());
  });
});
