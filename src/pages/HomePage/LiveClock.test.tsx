// @vitest-environment jsdom
import { render, cleanup, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LiveClock } from './LiveClock';

beforeEach(() => {
  vi.useRealTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('LiveClock', () => {
  it('renders the current date/time text ending with "Uhr"', () => {
    const { container } = render(<LiveClock />);
    expect(container.textContent).toContain('Uhr');
    expect(container.textContent).toContain('•');
  });

  it('keeps ticking on the 1s interval without throwing', () => {
    vi.useFakeTimers();
    const { container } = render(<LiveClock />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.textContent).toContain('Uhr');
  });
});
