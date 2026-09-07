// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimatedCounter } from './AnimatedCounter';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

describe('AnimatedCounter', () => {
  it('startet bei 0', () => {
    const { container } = render(<AnimatedCounter value={40} />);
    expect(container.textContent).toBe('0');
  });

  it('zählt auf den Zielwert hoch', () => {
    const { container } = render(<AnimatedCounter value={20} />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(container.textContent).toBe('20');
  });
});
