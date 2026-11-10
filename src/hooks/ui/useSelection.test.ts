// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSelection } from './useSelection';

vi.mock('./useAndroidBack', () => ({ useAndroidBack: () => {} }));

describe('useSelection', () => {
  it('startet mit dem gedrückten Titel und schaltet einzelne Titel um', () => {
    const { result } = renderHook(() => useSelection(['a', 'b', 'c']));
    act(() => result.current.start('b'));
    expect(result.current.active).toBe(true);
    expect(result.current.keys).toEqual(['b']);
    act(() => result.current.toggle('a'));
    act(() => result.current.toggle('b'));
    expect(result.current.keys).toEqual(['a']);
  });

  it('wählt alles Sichtbare aus und wieder ab', () => {
    const { result } = renderHook(() => useSelection(['a', 'b']));
    act(() => result.current.start());
    act(() => result.current.toggleAll());
    expect(result.current.allSelected).toBe(true);
    expect(result.current.keys).toEqual(['a', 'b']);
    act(() => result.current.toggleAll());
    expect(result.current.keys).toEqual([]);
  });

  it('zählt nur, was der Filter gerade zeigt', () => {
    const { result, rerender } = renderHook(({ keys }) => useSelection(keys), {
      initialProps: { keys: ['a', 'b', 'c'] },
    });
    act(() => result.current.start());
    act(() => result.current.toggleAll());
    rerender({ keys: ['b'] });
    expect(result.current.keys).toEqual(['b']);
    expect(result.current.has('a')).toBe(false);
    expect(result.current.allSelected).toBe(true);
  });

  it('beendet die Auswahl und vergisst sie', () => {
    const { result } = renderHook(() => useSelection(['a']));
    act(() => result.current.start('a'));
    act(() => result.current.exit());
    expect(result.current.active).toBe(false);
    expect(result.current.keys).toEqual([]);
  });
});
