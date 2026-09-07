// @vitest-environment jsdom
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { HorizontalScrollContainer } from './HorizontalScrollContainer';

// Die Rueckmeldungen der Beobachter werden gesammelt, damit ein Test eine
// Groessenaenderung gezielt ausloesen kann.
const beobachter: Array<() => void> = [];

beforeAll(() => {
  globalThis.ResizeObserver = class {
    constructor(cb: () => void) {
      beobachter.push(cb);
    }
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

  it('zeigt die Pfeile, wenn der Beobachter einen Ueberlauf meldet', async () => {
    // Die Messung laeuft seit dem ResizeObserver-Fix erst im naechsten Frame.
    // Der Test prueft gezielt DIESEN Weg: der 100ms-Ersteindruck laeuft mit
    // nicht scrollbarem Behaelter durch, erst danach kommt der Ueberlauf.
    beobachter.length = 0;
    const { container } = render(
      <HorizontalScrollContainer showArrows="always">
        <div>viel Inhalt</div>
      </HorizontalScrollContainer>
    );

    // Ersteindruck abwarten: nichts zu scrollen, keine Pfeile.
    await new Promise((r) => setTimeout(r, 160));
    expect(screen.queryByRole('button', { name: 'Nach rechts scrollen' })).not.toBeInTheDocument();

    const scroller = container.querySelector('div[style*="overflow"]') as HTMLElement;
    expect(scroller).toBeTruthy();
    Object.defineProperty(scroller, 'scrollWidth', { value: 900, configurable: true });
    Object.defineProperty(scroller, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(scroller, 'scrollLeft', { value: 0, writable: true, configurable: true });

    expect(beobachter.length).toBeGreaterThan(0);
    beobachter.forEach((cb) => cb());

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Nach rechts scrollen' })).toBeInTheDocument()
    );
    expect(screen.queryByRole('button', { name: 'Nach links scrollen' })).not.toBeInTheDocument();
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
