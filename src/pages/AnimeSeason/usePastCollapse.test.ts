// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePastCollapse } from './usePastCollapse';

const group = (isPast: boolean, count = 1, isTba = false) => ({
  isPast,
  isTba,
  items: Array.from({ length: count }, (_, i) => i),
});

describe('usePastCollapse', () => {
  it('blendet vergangene Tage aus und zaehlt ihre Eintraege', () => {
    const groups = [group(true, 3), group(true, 2), group(false, 1)];
    const { result } = renderHook(() => usePastCollapse(groups));

    expect(result.current.pastCount).toBe(5);
    expect(result.current.visibleGroups).toHaveLength(1);
    expect(result.current.showPast).toBe(false);
  });

  it('zeigt nach dem Umschalten alles und wieder zurueck', () => {
    const groups = [group(true), group(false)];
    const { result } = renderHook(() => usePastCollapse(groups));

    act(() => result.current.togglePast());
    expect(result.current.visibleGroups).toHaveLength(2);
    expect(result.current.showPast).toBe(true);

    act(() => result.current.togglePast());
    expect(result.current.visibleGroups).toHaveLength(1);
  });

  it('bleibt eingeklappt, wenn ein Filter nur Vergangenes uebrig laesst', () => {
    // Der Fall aus der Praxis: Provider-/Genre-Filter nimmt alles Kommende
    // weg. Frueher klappte eine Ausnahme hier alles wieder auf.
    const groups = [group(true, 4)];
    const { result } = renderHook(() => usePastCollapse(groups));

    expect(result.current.pastCount).toBe(4);
    expect(result.current.visibleGroups).toHaveLength(0);
    expect(result.current.showPast).toBe(false);
  });

  it('meldet nichts Vergangenes, wenn es keins gibt', () => {
    const { result } = renderHook(() => usePastCollapse([group(false), group(false, 1, true)]));

    expect(result.current.pastCount).toBe(0);
    expect(result.current.visibleGroups).toHaveLength(2);
  });
});
