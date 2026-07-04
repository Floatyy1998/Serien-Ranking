// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

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

import { DiscussionEditForm } from './DiscussionEditForm';

afterEach(() => cleanup());

const baseProps = {
  editTitle: 'My title',
  setEditTitle: vi.fn(),
  editContent: 'My content',
  setEditContent: vi.fn(),
  editIsSpoiler: false,
  setEditIsSpoiler: vi.fn(),
  saving: false,
  onSave: vi.fn(),
  onCancel: vi.fn(),
};

describe('DiscussionEditForm', () => {
  it('renders the current title and content values', () => {
    render(<DiscussionEditForm {...baseProps} />);
    expect(screen.getByDisplayValue('My title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('My content')).toBeInTheDocument();
  });

  it('calls setEditTitle when the title input changes', () => {
    const setEditTitle = vi.fn();
    render(<DiscussionEditForm {...baseProps} setEditTitle={setEditTitle} />);
    fireEvent.change(screen.getByDisplayValue('My title'), { target: { value: 'New' } });
    expect(setEditTitle).toHaveBeenCalledWith('New');
  });

  it('save button triggers onSave and cancel triggers onCancel', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();
    render(<DiscussionEditForm {...baseProps} onSave={onSave} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Speichern'));
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables save when the title is empty and shows saving label', () => {
    const { rerender } = render(<DiscussionEditForm {...baseProps} editTitle="" />);
    expect(screen.getByText('Speichern')).toBeDisabled();
    rerender(<DiscussionEditForm {...baseProps} saving />);
    expect(screen.getByText('Speichern...')).toBeInTheDocument();
  });
});
