// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@mui/icons-material', () => ({
  ArrowDownward: () => null,
  ArrowUpward: () => null,
  Bolt: () => null,
  MovieFilter: () => null,
  Timer: () => null,
  TrendingUp: () => null,
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

import { SortToolbar } from './SortToolbar';

afterEach(() => cleanup());

describe('SortToolbar', () => {
  it('renders the current label heading', () => {
    render(
      <SortToolbar
        sortBy="episodes"
        sortDirection="desc"
        currentLabel="Meiste Episoden"
        onSortClick={vi.fn()}
      />
    );
    expect(screen.getByRole('heading', { name: 'Meiste Episoden' })).toBeInTheDocument();
  });

  it('renders one button per sort option', () => {
    render(
      <SortToolbar
        sortBy="episodes"
        sortDirection="desc"
        currentLabel="Meiste Episoden"
        onSortClick={vi.fn()}
      />
    );
    expect(screen.getAllByRole('button')).toHaveLength(4);
  });

  it('calls onSortClick with the option value when a button is clicked', () => {
    const onSortClick = vi.fn();
    render(
      <SortToolbar
        sortBy="episodes"
        sortDirection="desc"
        currentLabel="Meiste Episoden"
        onSortClick={onSortClick}
      />
    );
    // First button is the active "episodes" option.
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onSortClick).toHaveBeenCalledWith('episodes');
  });
});
