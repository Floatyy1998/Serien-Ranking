// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboardNavigation } from './useKeyboardNavigation';

interface KeyEventLike {
  key: string;
  preventDefault: ReturnType<typeof vi.fn>;
}

function makeEvent(key: string): KeyEventLike {
  return { key, preventDefault: vi.fn() };
}

describe('useKeyboardNavigation', () => {
  it('moves to the next index on ArrowRight (horizontal)', () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 3, currentIndex: 0, onIndexChange })
    );
    const e = makeEvent('ArrowRight');
    result.current.onKeyDown(e as unknown as React.KeyboardEvent);
    expect(e.preventDefault).toHaveBeenCalled();
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('moves to the previous index on ArrowLeft (horizontal)', () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 3, currentIndex: 2, onIndexChange })
    );
    result.current.onKeyDown(makeEvent('ArrowLeft') as unknown as React.KeyboardEvent);
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('loops from last to first on next when loop is enabled (default)', () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 3, currentIndex: 2, onIndexChange })
    );
    result.current.onKeyDown(makeEvent('ArrowRight') as unknown as React.KeyboardEvent);
    expect(onIndexChange).toHaveBeenCalledWith(0);
  });

  it('loops from first to last on previous when loop is enabled', () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 3, currentIndex: 0, onIndexChange })
    );
    result.current.onKeyDown(makeEvent('ArrowLeft') as unknown as React.KeyboardEvent);
    expect(onIndexChange).toHaveBeenCalledWith(2);
  });

  it('does not loop when loop is disabled', () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 3, currentIndex: 2, onIndexChange, loop: false })
    );
    result.current.onKeyDown(makeEvent('ArrowRight') as unknown as React.KeyboardEvent);
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it('jumps to first/last with Home and End', () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 5, currentIndex: 2, onIndexChange })
    );
    result.current.onKeyDown(makeEvent('Home') as unknown as React.KeyboardEvent);
    expect(onIndexChange).toHaveBeenCalledWith(0);
    result.current.onKeyDown(makeEvent('End') as unknown as React.KeyboardEvent);
    expect(onIndexChange).toHaveBeenCalledWith(4);
  });

  it('uses ArrowUp/ArrowDown for vertical orientation', () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({
        itemCount: 3,
        currentIndex: 0,
        onIndexChange,
        orientation: 'vertical',
      })
    );
    result.current.onKeyDown(makeEvent('ArrowDown') as unknown as React.KeyboardEvent);
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('also accepts the cross-axis arrows in horizontal mode', () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 3, currentIndex: 0, onIndexChange })
    );
    result.current.onKeyDown(makeEvent('ArrowDown') as unknown as React.KeyboardEvent);
    expect(onIndexChange).toHaveBeenCalledWith(1);
  });

  it('ignores unrelated keys', () => {
    const onIndexChange = vi.fn();
    const { result } = renderHook(() =>
      useKeyboardNavigation({ itemCount: 3, currentIndex: 0, onIndexChange })
    );
    const e = makeEvent('Enter');
    result.current.onKeyDown(e as unknown as React.KeyboardEvent);
    expect(e.preventDefault).not.toHaveBeenCalled();
    expect(onIndexChange).not.toHaveBeenCalled();
  });
});
