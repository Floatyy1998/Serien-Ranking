// @vitest-environment jsdom
import { render, act, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type * as FramerMotion from 'framer-motion';
import { CelebrationBurst } from './CelebrationBurst';

if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

// framer-motion caches its reduced-motion detection globally, so drive it
// through a mock we control per-test instead of toggling matchMedia.
const reduced = vi.hoisted(() => ({ value: false }));
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof FramerMotion>();
  return { ...actual, useReducedMotion: () => reduced.value };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  reduced.value = false;
});

describe('CelebrationBurst', () => {
  it('renders nothing while not triggered', () => {
    const { container } = render(<CelebrationBurst trigger={false} />);
    expect(container).toBeEmptyDOMElement();
    expect(document.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('renders nothing when reduced motion is preferred', () => {
    reduced.value = true;
    render(<CelebrationBurst trigger />);
    expect(document.querySelector('[aria-hidden="true"]')).toBeNull();
  });

  it('emits a burst and calls onDone after the duration elapses', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    render(<CelebrationBurst trigger duration={1000} count={8} onDone={onDone} />);
    expect(document.querySelector('[aria-hidden="true"]')).not.toBeNull();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
