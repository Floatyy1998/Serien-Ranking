// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

vi.mock('@mui/icons-material', () => ({
  ChevronRight: () => null,
  Palette: () => null,
  ViewQuilt: () => null,
}));

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

import { AppearanceSection } from './AppearanceSection';

afterEach(() => cleanup());

describe('AppearanceSection', () => {
  it('renders both navigation entries', () => {
    render(<AppearanceSection onNavigateTheme={vi.fn()} onNavigateLayout={vi.fn()} />);
    expect(screen.getByText('Design & Themes')).toBeInTheDocument();
    expect(screen.getByText('Homepage Layout')).toBeInTheDocument();
  });

  it('calls onNavigateTheme when the theme button is clicked', () => {
    const onNavigateTheme = vi.fn();
    render(<AppearanceSection onNavigateTheme={onNavigateTheme} onNavigateLayout={vi.fn()} />);
    fireEvent.click(screen.getByText('Design & Themes'));
    expect(onNavigateTheme).toHaveBeenCalledTimes(1);
  });

  it('calls onNavigateLayout when the layout button is clicked', () => {
    const onNavigateLayout = vi.fn();
    render(<AppearanceSection onNavigateTheme={vi.fn()} onNavigateLayout={onNavigateLayout} />);
    fireEvent.click(screen.getByText('Homepage Layout'));
    expect(onNavigateLayout).toHaveBeenCalledTimes(1);
  });
});
