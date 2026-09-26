// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('../../components/ui', () => ({
  HorizontalScrollContainer: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

import { ListFilter } from './ListFilter';

const lists = [
  { id: 'l1', name: 'Marvel' },
  { id: 'l2', name: 'Anime' },
];

afterEach(() => cleanup());

describe('ListFilter', () => {
  it('renders nothing without lists', () => {
    const { container } = render(<ListFilter lists={[]} selected={null} onSelect={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('selects, toggles off and resets a list', () => {
    const onSelect = vi.fn();
    const { rerender } = render(<ListFilter lists={lists} selected={null} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Marvel'));
    expect(onSelect).toHaveBeenLastCalledWith('l1');
    rerender(<ListFilter lists={lists} selected="l1" onSelect={onSelect} />);
    expect(screen.getByText('Marvel').closest('button')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByText('Marvel'));
    expect(onSelect).toHaveBeenLastCalledWith(null);
    fireEvent.click(screen.getByText('Alle'));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });
});
