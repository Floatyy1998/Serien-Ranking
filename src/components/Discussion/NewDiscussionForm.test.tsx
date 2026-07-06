// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

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

import { NewDiscussionForm } from './NewDiscussionForm';

afterEach(() => cleanup());

describe('NewDiscussionForm', () => {
  it('renders the form heading and inputs', () => {
    render(<NewDiscussionForm onSubmit={vi.fn().mockResolvedValue(true)} onCancel={vi.fn()} />);
    expect(screen.getByText('Neue Diskussion starten')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Gib deiner Diskussion einen Titel...')).toBeInTheDocument();
  });

  it('cancel button invokes onCancel', () => {
    const onCancel = vi.fn();
    render(<NewDiscussionForm onSubmit={vi.fn().mockResolvedValue(true)} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('submits the trimmed title and content and resets on success', async () => {
    const onSubmit = vi.fn<() => Promise<boolean>>().mockResolvedValue(true);
    const onCancel = vi.fn();
    render(<NewDiscussionForm onSubmit={onSubmit} onCancel={onCancel} />);

    fireEvent.change(screen.getByPlaceholderText('Gib deiner Diskussion einen Titel...'), {
      target: { value: 'My topic' },
    });
    fireEvent.change(
      screen.getByPlaceholderText('Was möchtest du diskutieren? Teile deine Gedanken...'),
      { target: { value: 'Some thoughts' } }
    );

    fireEvent.click(screen.getByText('Posten'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        title: 'My topic',
        content: 'Some thoughts',
        isSpoiler: false,
      })
    );
    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it('keeps the post button disabled until a title is entered', () => {
    render(<NewDiscussionForm onSubmit={vi.fn().mockResolvedValue(true)} onCancel={vi.fn()} />);
    expect(screen.getByText('Posten')).toBeDisabled();
  });
});
