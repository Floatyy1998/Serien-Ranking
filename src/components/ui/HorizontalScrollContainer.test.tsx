// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { HorizontalScrollContainer } from './HorizontalScrollContainer';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

afterEach(() => cleanup());

describe('HorizontalScrollContainer', () => {
  it('renders its children', () => {
    render(
      <HorizontalScrollContainer>
        <div data-testid="item">Karte</div>
      </HorizontalScrollContainer>
    );
    expect(screen.getByTestId('item')).toHaveTextContent('Karte');
  });

  it('applies a custom className to the wrapper', () => {
    const { container } = render(
      <HorizontalScrollContainer className="my-scroll">
        <div>x</div>
      </HorizontalScrollContainer>
    );
    expect(container.querySelector('.my-scroll')).toBeInTheDocument();
  });

  it('does not show scroll arrows when there is nothing to scroll', () => {
    render(
      <HorizontalScrollContainer showArrows="always">
        <div>x</div>
      </HorizontalScrollContainer>
    );
    expect(screen.queryByRole('button', { name: 'Nach links scrollen' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Nach rechts scrollen' })).not.toBeInTheDocument();
  });
});
