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
vi.mock('@mui/icons-material', () => ({ PersonRemove: () => null }));

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

vi.mock('../../components/ui', () => ({
  BottomSheet: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="sheet">{children}</div> : null,
}));

import { RemoveFriendSheet } from './RemoveFriendSheet';

afterEach(() => cleanup());

describe('RemoveFriendSheet', () => {
  it('is not rendered when there is no friend selected', () => {
    render(
      <RemoveFriendSheet
        friend={null}
        onConfirm={vi.fn<() => Promise<void>>()}
        onClose={() => {}}
        isRemoving={false}
      />
    );
    expect(screen.queryByTestId('sheet')).not.toBeInTheDocument();
  });

  it('shows the friend name and confirm/cancel actions', () => {
    render(
      <RemoveFriendSheet
        friend={{ uid: 'u1', name: 'Frank' }}
        onConfirm={vi.fn<() => Promise<void>>()}
        onClose={() => {}}
        isRemoving={false}
      />
    );
    expect(screen.getByText('Frank')).toBeInTheDocument();
    expect(screen.getByText('Entfernen')).toBeInTheDocument();
    expect(screen.getByText('Abbrechen')).toBeInTheDocument();
  });

  it('calls onConfirm with the uid when confirming', () => {
    const onConfirm = vi.fn<() => Promise<void>>().mockResolvedValue(undefined);
    render(
      <RemoveFriendSheet
        friend={{ uid: 'u1', name: 'Frank' }}
        onConfirm={onConfirm}
        onClose={() => {}}
        isRemoving={false}
      />
    );
    fireEvent.click(screen.getByText('Entfernen'));
    expect(onConfirm).toHaveBeenCalledWith('u1');
  });

  it('calls onClose when cancelling', () => {
    const onClose = vi.fn();
    render(
      <RemoveFriendSheet
        friend={{ uid: 'u1', name: 'Frank' }}
        onConfirm={vi.fn<() => Promise<void>>()}
        onClose={onClose}
        isRemoving={false}
      />
    );
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
