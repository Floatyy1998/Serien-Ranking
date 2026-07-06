// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@mui/icons-material', () => ({
  Business: () => null,
  Check: () => null,
  KeyboardArrowDown: () => null,
  Search: () => null,
}));
vi.mock('../../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
vi.mock('../../lib/haptics', () => ({ hapticSelect: vi.fn() }));
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
  };
});
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

import { AnimeSeasonStudioFilter } from './AnimeSeasonStudioFilter';

const studios = ['MAPPA', 'Ufotable', 'Wit Studio'];

beforeEach(() => cleanup());
afterEach(() => cleanup());

describe('AnimeSeasonStudioFilter', () => {
  it('renders the default "Alle Studios" label when no studio is selected', () => {
    render(<AnimeSeasonStudioFilter studios={studios} value="" onChange={vi.fn()} />);
    expect(screen.getByText('Alle Studios')).toBeInTheDocument();
  });

  it('renders the selected studio name as the label', () => {
    render(<AnimeSeasonStudioFilter studios={studios} value="MAPPA" onChange={vi.fn()} />);
    expect(screen.getByText('MAPPA')).toBeInTheDocument();
  });

  it('opens the dropdown and lists the studios', () => {
    render(<AnimeSeasonStudioFilter studios={studios} value="" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Studio-Filter' }));
    expect(screen.getByRole('option', { name: 'Ufotable' })).toBeInTheDocument();
  });

  it('calls onChange with the picked studio', () => {
    const onChange = vi.fn();
    render(<AnimeSeasonStudioFilter studios={studios} value="" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Studio-Filter' }));
    fireEvent.click(screen.getByRole('option', { name: 'Wit Studio' }));
    expect(onChange).toHaveBeenCalledWith('Wit Studio');
  });
});
