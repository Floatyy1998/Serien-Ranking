// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScrollRestore } from './useScrollRestore';

const nav = vi.hoisted(() => ({ type: 'PUSH' as string }));

vi.mock('react-router-dom', () => ({
  useNavigationType: () => nav.type,
}));

const SELECTOR = '#scroll-container';
let container: HTMLDivElement;

function buildContainer(): void {
  container = document.createElement('div');
  container.id = 'scroll-container';
  // jsdom does not implement layout: give scrollTop a real, writable slot.
  Object.defineProperty(container, 'scrollTop', {
    value: 0,
    writable: true,
    configurable: true,
  });
  document.body.appendChild(container);
}

describe('useScrollRestore', () => {
  beforeEach(() => {
    nav.type = 'PUSH';
    sessionStorage.clear();
    buildContainer();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    sessionStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('restores the saved scroll position onto the container', async () => {
    sessionStorage.setItem('key-a', '320');
    renderHook(() => useScrollRestore('key-a', SELECTOR));
    await waitFor(() => expect(container.scrollTop).toBe(320));
  });

  it('does nothing when there is no saved position', async () => {
    renderHook(() => useScrollRestore('key-b', SELECTOR));
    // Give the double rAF a chance to run.
    await new Promise((r) => setTimeout(r, 20));
    expect(container.scrollTop).toBe(0);
  });

  it('clears the saved key and skips restore when restoreOnPop and nav is not POP', () => {
    sessionStorage.setItem('key-c', '100');
    nav.type = 'PUSH';
    renderHook(() => useScrollRestore('key-c', SELECTOR, { restoreOnPop: true }));
    expect(sessionStorage.getItem('key-c')).toBeNull();
    expect(container.scrollTop).toBe(0);
  });

  it('restores on POP when restoreOnPop is set', async () => {
    sessionStorage.setItem('key-d', '55');
    nav.type = 'POP';
    renderHook(() => useScrollRestore('key-d', SELECTOR, { restoreOnPop: true }));
    await waitFor(() => expect(container.scrollTop).toBe(55));
  });

  it('saves the scroll position (debounced) on scroll events', () => {
    vi.useFakeTimers();
    renderHook(() => useScrollRestore('key-e', SELECTOR, { debounceMs: 100 }));
    container.scrollTop = 210;
    act(() => {
      container.dispatchEvent(new Event('scroll'));
    });
    // Not yet written before the debounce elapses.
    expect(sessionStorage.getItem('key-e')).toBeNull();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(sessionStorage.getItem('key-e')).toBe('210');
  });

  it('saveNow writes the current position immediately when scrolled', () => {
    const { result } = renderHook(() => useScrollRestore('key-f', SELECTOR));
    container.scrollTop = 480;
    act(() => result.current.saveNow());
    expect(sessionStorage.getItem('key-f')).toBe('480');
  });

  it('saveNow does not write when the container is at the top', () => {
    const { result } = renderHook(() => useScrollRestore('key-g', SELECTOR));
    container.scrollTop = 0;
    act(() => result.current.saveNow());
    expect(sessionStorage.getItem('key-g')).toBeNull();
  });

  it('restores onto the visible container when a hidden one with the same selector comes first', async () => {
    container.remove();
    const hidden = document.createElement('div');
    hidden.className = 'scroller';
    Object.defineProperty(hidden, 'scrollTop', { value: 0, writable: true, configurable: true });
    const visible = document.createElement('div');
    visible.className = 'scroller';
    Object.defineProperty(visible, 'scrollTop', { value: 0, writable: true, configurable: true });
    vi.spyOn(visible, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
    document.body.append(hidden, visible);
    sessionStorage.setItem('key-i', '640');
    renderHook(() => useScrollRestore('key-i', '.scroller'));
    await waitFor(() => expect(visible.scrollTop).toBe(640));
    expect(hidden.scrollTop).toBe(0);
  });

  it('removes the scroll listener on unmount', () => {
    const removeSpy = vi.spyOn(container, 'removeEventListener');
    const { unmount } = renderHook(() => useScrollRestore('key-h', SELECTOR));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
