// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ScrollToTopButton } from './ScrollToTopButton';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

vi.mock('../../contexts/ThemeContextDef', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

afterEach(cleanup);

function mountWithContainer(threshold = 400) {
  const el = document.createElement('div');
  document.body.appendChild(el);
  const ref = createRef<HTMLElement>();
  (ref as { current: HTMLElement | null }).current = el;
  render(<ScrollToTopButton scrollContainerRef={ref} threshold={threshold} />);
  return el;
}

describe('ScrollToTopButton', () => {
  it('is hidden until the scroll threshold is crossed (smoke)', () => {
    mountWithContainer();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('appears after scrolling past the threshold', () => {
    const el = mountWithContainer(400);
    act(() => {
      el.scrollTop = 500;
      el.dispatchEvent(new Event('scroll'));
    });
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('scrolls the container to the top when pressed', () => {
    const el = mountWithContainer(400);
    const scrollTo = vi.fn();
    el.scrollTo = scrollTo as unknown as typeof el.scrollTo;
    act(() => {
      el.scrollTop = 500;
      el.dispatchEvent(new Event('scroll'));
    });
    fireEvent.click(screen.getByRole('button'));
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
