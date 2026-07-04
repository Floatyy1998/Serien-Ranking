// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useGlobalImageRetry } from './useGlobalImageRetry';

const PLACEHOLDER = 'data:image/svg+xml,PLACEHOLDER';

vi.mock('../utils/themedPlaceholder', () => ({
  buildThemedPlaceholderDataUrl: vi.fn(() => PLACEHOLDER),
}));

function fireError(img: HTMLImageElement): void {
  img.dispatchEvent(new Event('error'));
}

function makeImg(src: string): HTMLImageElement {
  const img = document.createElement('img');
  img.src = src;
  document.body.appendChild(img);
  return img;
}

describe('useGlobalImageRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('retries a failed image with an incremented cache-busting query param', () => {
    renderHook(() => useGlobalImageRetry());
    const img = makeImg('https://image.tmdb.org/t/p/w500/x.jpg');
    fireError(img);
    expect(img.dataset.retryCount).toBe('1');

    vi.advanceTimersByTime(350);
    expect(img.src).toContain('retry=1');
  });

  it('appends the retry param with & when the url already has a query', () => {
    renderHook(() => useGlobalImageRetry());
    const img = makeImg('https://image.tmdb.org/t/p/w500/x.jpg?v=2');
    fireError(img);
    vi.advanceTimersByTime(350);
    expect(img.src).toContain('&retry=1');
  });

  it('falls back to a themed placeholder after max retries for tmdb content', () => {
    renderHook(() => useGlobalImageRetry());
    const img = makeImg('https://image.tmdb.org/t/p/w500/poster.jpg');
    img.dataset.retryCount = '2';
    fireError(img);
    expect(img.dataset.retryFallback).toBe('true');
    expect(img.src).toBe(PLACEHOLDER);
  });

  it('does not swap small provider logos for the placeholder', () => {
    renderHook(() => useGlobalImageRetry());
    const img = makeImg('https://image.tmdb.org/t/p/w92/logo.jpg');
    img.dataset.retryCount = '2';
    fireError(img);
    expect(img.dataset.retryFallback).toBeUndefined();
    expect(img.src).toContain('/w92/logo.jpg');
  });

  it('ignores images that already carry a data: URI', () => {
    renderHook(() => useGlobalImageRetry());
    const img = makeImg('data:image/png;base64,AAAA');
    fireError(img);
    expect(img.dataset.retryCount).toBeUndefined();
  });

  it('skips images that manage their own retry logic (data-poster-image)', () => {
    renderHook(() => useGlobalImageRetry());
    const img = makeImg('https://image.tmdb.org/t/p/w500/y.jpg');
    img.dataset.posterImage = 'true';
    fireError(img);
    expect(img.dataset.retryCount).toBeUndefined();
  });

  it('ignores error events that do not target an image', () => {
    renderHook(() => useGlobalImageRetry());
    const div = document.createElement('div');
    document.body.appendChild(div);
    expect(() => div.dispatchEvent(new Event('error'))).not.toThrow();
  });

  it('removes the capture listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const { unmount } = renderHook(() => useGlobalImageRetry());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('error', expect.any(Function), true);

    const img = makeImg('https://image.tmdb.org/t/p/w500/z.jpg');
    fireError(img);
    expect(img.dataset.retryCount).toBeUndefined();
  });
});
