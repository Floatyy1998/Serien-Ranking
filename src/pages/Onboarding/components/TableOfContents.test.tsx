// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

import { TableOfContents } from './TableOfContents';

afterEach(() => cleanup());

describe('TableOfContents', () => {
  it('renders all five acts with their labels', () => {
    render(<TableOfContents currentStep="welcome" />);
    ['Kuration', 'Serien', 'Filme', 'Abos', 'Premiere'].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('marks earlier acts as done relative to the current step', () => {
    const { container } = render(<TableOfContents currentStep="movies" />);
    // welcome + series precede movies → 2 done rows
    expect(container.querySelectorAll('.ob-toc__row--done').length).toBe(2);
    expect(container.querySelectorAll('.ob-toc__row--active').length).toBe(1);
  });
});
