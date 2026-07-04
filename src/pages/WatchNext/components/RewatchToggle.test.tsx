// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (k !== 'whileTap') clean[k] = props[k];
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

import { RewatchToggle } from './RewatchToggle';

afterEach(() => cleanup());

describe('RewatchToggle', () => {
  it('renders the singular label for a single rewatch', () => {
    render(<RewatchToggle activeRewatchCount={1} showRewatches={false} onToggle={vi.fn()} />);
    expect(screen.getByText(/1 aktive Rewatch/)).toBeInTheDocument();
  });

  it('renders the plural label for multiple rewatches', () => {
    render(<RewatchToggle activeRewatchCount={3} showRewatches={true} onToggle={vi.fn()} />);
    expect(screen.getByText(/3 aktive Rewatches/)).toBeInTheDocument();
  });

  it('invokes onToggle when clicked', () => {
    const onToggle = vi.fn();
    const { container } = render(
      <RewatchToggle activeRewatchCount={2} showRewatches={false} onToggle={onToggle} />
    );
    const toggle = container.querySelector('.watch-next-rewatch-toggle') as HTMLElement;
    fireEvent.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
