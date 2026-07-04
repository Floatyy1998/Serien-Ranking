// @vitest-environment jsdom
import type { RefObject } from 'react';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

let container: HTMLDivElement;
let first: HTMLButtonElement;
let last: HTMLButtonElement;

function buildContainer(): void {
  container = document.createElement('div');
  first = document.createElement('button');
  first.textContent = 'first';
  const middle = document.createElement('button');
  middle.textContent = 'middle';
  last = document.createElement('button');
  last.textContent = 'last';
  container.append(first, middle, last);
  document.body.appendChild(container);
}

function containerRef(): RefObject<HTMLElement | null> {
  return { current: container };
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    buildContainer();
  });

  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  it('focuses the first focusable element when activated', async () => {
    const onClose = vi.fn();
    renderHook(() => useFocusTrap(containerRef(), true, onClose));
    await waitFor(() => expect(document.activeElement).toBe(first));
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    renderHook(() => useFocusTrap(containerRef(), true, onClose));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('wraps focus from last to first on Tab', () => {
    const onClose = vi.fn();
    renderHook(() => useFocusTrap(containerRef(), true, onClose));
    last.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(document.activeElement).toBe(first);
  });

  it('wraps focus from first to last on Shift+Tab', () => {
    const onClose = vi.fn();
    renderHook(() => useFocusTrap(containerRef(), true, onClose));
    first.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true }));
    expect(document.activeElement).toBe(last);
  });

  it('does nothing when inactive', () => {
    const onClose = vi.fn();
    const addSpy = vi.spyOn(document, 'addEventListener');
    renderHook(() => useFocusTrap(containerRef(), false, onClose));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(addSpy).not.toHaveBeenCalledWith('keydown', expect.any(Function));
  });

  it('restores focus to the previously focused element on unmount', () => {
    const outside = document.createElement('button');
    document.body.appendChild(outside);
    outside.focus();
    expect(document.activeElement).toBe(outside);

    const onClose = vi.fn();
    const { unmount } = renderHook(() => useFocusTrap(containerRef(), true, onClose));
    unmount();
    expect(document.activeElement).toBe(outside);
  });

  it('removes the keydown listener on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = renderHook(() => useFocusTrap(containerRef(), true, onClose));
    unmount();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
