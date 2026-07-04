// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePersistedState } from './usePersistedState';

describe('usePersistedState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('uses the initial value when nothing is stored', () => {
    const { result } = renderHook(() => usePersistedState('missing', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('reads an existing string value from localStorage (raw, not JSON)', () => {
    localStorage.setItem('name', 'stored');
    const { result } = renderHook(() => usePersistedState('name', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('persists string updates back to localStorage as raw text', () => {
    const { result } = renderHook(() => usePersistedState('name', 'a'));
    act(() => result.current[1]('b'));
    expect(result.current[0]).toBe('b');
    expect(localStorage.getItem('name')).toBe('b');
  });

  it('handles boolean values via the boolean serializer', () => {
    localStorage.setItem('flag', 'true');
    const { result } = renderHook(() => usePersistedState('flag', false));
    expect(result.current[0]).toBe(true);

    act(() => result.current[1](false));
    expect(localStorage.getItem('flag')).toBe('false');
  });

  it('JSON-serializes object values', () => {
    const { result } = renderHook(() =>
      usePersistedState('obj', { count: 1 } as { count: number })
    );
    act(() => result.current[1]({ count: 2 }));
    expect(result.current[0]).toEqual({ count: 2 });
    expect(localStorage.getItem('obj')).toBe(JSON.stringify({ count: 2 }));
  });

  it('reads a stored JSON object on init', () => {
    localStorage.setItem('obj', JSON.stringify({ count: 5 }));
    const { result } = renderHook(() =>
      usePersistedState('obj', { count: 0 } as { count: number })
    );
    expect(result.current[0]).toEqual({ count: 5 });
  });

  it('falls back to the initial value when stored JSON is corrupt', () => {
    localStorage.setItem('obj', '{not valid json');
    const { result } = renderHook(() =>
      usePersistedState('obj', { count: 0 } as { count: number })
    );
    expect(result.current[0]).toEqual({ count: 0 });
  });

  it('supports functional updates', () => {
    const { result } = renderHook(() => usePersistedState('n', 1));
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(2);
  });

  it('honors a custom serializer', () => {
    const serializer = {
      parse: (raw: string) => Number(raw) * 2,
      stringify: (value: number) => String(value / 2),
    };
    localStorage.setItem('custom', '10');
    const { result } = renderHook(() => usePersistedState('custom', 0, { serializer }));
    expect(result.current[0]).toBe(20);
    act(() => result.current[1](40));
    expect(localStorage.getItem('custom')).toBe('20');
  });

  it('does not throw when setItem fails (quota / private mode)', () => {
    const { result } = renderHook(() => usePersistedState('q', 'x'));
    const setSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceeded');
    });
    expect(() => act(() => result.current[1]('y'))).not.toThrow();
    expect(result.current[0]).toBe('y');
    setSpy.mockRestore();
  });
});
