// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  CheckCircle: () => null,
  Close: () => null,
  Person: () => null,
  PersonAdd: () => null,
  Star: () => null,
}));

const { authValue, friendsValue } = vi.hoisted(() => ({
  // Stable identity: AddFriendDialog's debounced search effect keys on `user`,
  // `friends` and `sentRequests` — fresh arrays each render would loop forever.
  authValue: { user: { uid: 'me', getIdToken: () => Promise.resolve('tok') } },
  friendsValue: {
    friends: [] as { uid: string }[],
    sentRequests: [] as { toUserId: string }[],
    sendFriendRequest: vi.fn<() => Promise<boolean>>(),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => authValue }));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => friendsValue,
}));
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

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: () => ({}) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

vi.mock('../../components/ui', () => ({
  IconButton: ({ onClick, tooltip }: { onClick: () => void; tooltip?: string }) => (
    <button aria-label={tooltip} onClick={onClick} />
  ),
  EmptyState: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <span>{title}</span>
      <span>{description}</span>
    </div>
  ),
  SearchInput: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input aria-label="search" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
  BottomSheet: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="sheet">{children}</div> : null,
  GradientText: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
  LoadingSpinner: ({ text }: { text?: string }) => <div>{text}</div>,
}));

import { AddFriendDialog } from './AddFriendDialog';

afterEach(() => cleanup());

describe('AddFriendDialog', () => {
  it('is hidden when not open', () => {
    render(<AddFriendDialog isOpen={false} onClose={() => {}} />);
    expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
  });

  it('renders the header and the empty prompt when open with no query', () => {
    render(<AddFriendDialog isOpen onClose={() => {}} />);
    expect(screen.getByText('Neue Freunde')).toBeInTheDocument();
    expect(screen.getByText('Bereit für neue Freundschaften?')).toBeInTheDocument();
  });

  it('calls onClose when the close button is pressed', () => {
    const onClose = vi.fn();
    render(<AddFriendDialog isOpen onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Schließen'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
