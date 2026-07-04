// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@mui/icons-material/Delete', () => ({ default: () => null }));
vi.mock('@mui/icons-material/Star', () => ({ default: () => null }));
vi.mock('@mui/material', () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock('../../components/recommendations/RecommendButton', () => ({
  RecommendButton: () => <button>recommend</button>,
}));
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['whileTap', 'whileHover']);
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

import { MovieActionButtons } from './MovieActionButtons';

const baseProps = {
  isMobile: false,
  isWatched: false,
  isReadOnlyTmdbMovie: false,
  isAdding: false,
  loading: false,
  movieId: 5,
  movieTitle: 'Dune',
  onNavigateRate: vi.fn(),
  onAddMovie: vi.fn(),
  onDeleteClick: vi.fn(),
};

beforeEach(() => {
  baseProps.onNavigateRate = vi.fn();
  baseProps.onAddMovie = vi.fn();
  baseProps.onDeleteClick = vi.fn();
});
afterEach(() => cleanup());

describe('MovieActionButtons', () => {
  it('renders the add button for a read-only tmdb movie and invokes onAddMovie', () => {
    render(<MovieActionButtons {...baseProps} isReadOnlyTmdbMovie={true} />);
    const addBtn = screen.getByText('Film hinzufugen');
    fireEvent.click(addBtn);
    expect(baseProps.onAddMovie).toHaveBeenCalled();
  });

  it('renders the rate/delete actions for an owned movie', () => {
    render(<MovieActionButtons {...baseProps} />);
    fireEvent.click(screen.getByText('Bewerten'));
    expect(baseProps.onNavigateRate).toHaveBeenCalled();
  });

  it('invokes onDeleteClick from the delete button', () => {
    const { container } = render(<MovieActionButtons {...baseProps} />);
    const actionBtns = container.querySelectorAll('.action-btn');
    const deleteBtn = actionBtns[actionBtns.length - 1] as HTMLElement;
    fireEvent.click(deleteBtn);
    expect(baseProps.onDeleteClick).toHaveBeenCalled();
  });
});
