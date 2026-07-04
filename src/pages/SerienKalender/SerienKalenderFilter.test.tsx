// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('@mui/icons-material', () => ({
  Check: () => null,
  KeyboardArrowDown: () => null,
  Search: () => null,
}));

const { theme } = vi.hoisted(() => ({
  theme: {
    primary: '#3355ff',
    accent: '#22d3ee',
    background: { default: '#000000', surface: '#111111' },
    text: { secondary: '#eeeeee', muted: '#888888' },
    border: { default: '#333333' },
  },
}));
vi.mock('../../contexts/ThemeContextDef', () => ({ useTheme: () => ({ currentTheme: theme }) }));
vi.mock('../../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
vi.mock('../../lib/haptics', () => ({ hapticSelect: vi.fn() }));

import { SerienKalenderFilter } from './SerienKalenderFilter';

const renderFilter = (onChange = vi.fn(), value = '') =>
  render(
    <SerienKalenderFilter
      options={['Action', 'Drama']}
      value={value}
      onChange={onChange}
      icon={<span>icon</span>}
      allLabel="Alle Genres"
      searchPlaceholder="Genre suchen …"
    />
  );

afterEach(() => cleanup());

describe('SerienKalenderFilter', () => {
  it('renders the trigger with the fallback label', () => {
    renderFilter();
    expect(screen.getByRole('button', { name: 'Alle Genres' })).toBeInTheDocument();
  });

  it('opens the option list on click', () => {
    renderFilter();
    fireEvent.click(screen.getByRole('button', { name: 'Alle Genres' }));
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Drama' })).toBeInTheDocument();
  });

  it('calls onChange with the picked option', () => {
    const onChange = vi.fn<(o: string) => void>();
    renderFilter(onChange);
    fireEvent.click(screen.getByRole('button', { name: 'Alle Genres' }));
    fireEvent.click(screen.getByRole('option', { name: 'Action' }));
    expect(onChange).toHaveBeenCalledWith('Action');
  });
});
