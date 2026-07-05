// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

import { MovieActionButtons } from './MovieActionButtons';

const baseProps = {
  isMobile: false,
  isReadOnlyTmdbMovie: false,
  isAdding: false,
  onAddMovie: vi.fn(),
};

beforeEach(() => {
  baseProps.onAddMovie = vi.fn();
});
afterEach(() => cleanup());

describe('MovieActionButtons', () => {
  it('renders the add button for a read-only tmdb movie and invokes onAddMovie', () => {
    render(<MovieActionButtons {...baseProps} isReadOnlyTmdbMovie={true} />);
    const addBtn = screen.getByText('Film hinzufugen');
    fireEvent.click(addBtn);
    expect(baseProps.onAddMovie).toHaveBeenCalled();
  });

  it('renders nothing for an owned movie (actions live in the hero header)', () => {
    const { container } = render(<MovieActionButtons {...baseProps} />);
    expect(container).toBeEmptyDOMElement();
  });
});
