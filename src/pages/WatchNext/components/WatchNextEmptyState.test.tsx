// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (k !== 'initial' && k !== 'animate') clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

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

import { WatchNextEmptyState } from './WatchNextEmptyState';

afterEach(() => cleanup());

describe('WatchNextEmptyState', () => {
  it('renders the empty-state headline', () => {
    render(<WatchNextEmptyState />);
    expect(screen.getByText('Keine neuen Episoden')).toBeInTheDocument();
  });

  it('renders the guidance copy', () => {
    render(<WatchNextEmptyState />);
    expect(screen.getByText(/Schaue eine Serie an/)).toBeInTheDocument();
  });
});
