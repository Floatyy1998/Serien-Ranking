// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

import { GenreTile } from './GenreTile';

afterEach(() => cleanup());

describe('GenreTile', () => {
  it('renders the label and 1-based index plate', () => {
    render(<GenreTile label="Drama" index={0} posters={[]} selected={false} onToggle={() => {}} />);
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
  });

  it('invokes onToggle when clicked', () => {
    const onToggle = vi.fn<() => void>();
    render(<GenreTile label="Action" index={2} posters={[]} selected onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
