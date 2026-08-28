// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DropOffEntry } from '../lib/dropOff';

const api = vi.hoisted(() => ({
  fetchStaticDropOff: vi.fn<() => Promise<Record<string, DropOffEntry> | null>>(),
}));

vi.mock('../services/staticCatalog', () => ({
  fetchStaticDropOff: api.fetchStaticDropOff,
}));

const entry = (over: Partial<DropOffEntry> = {}): DropOffEntry => ({
  n: 100,
  d: 40,
  f: 60,
  s: { 2: 30 },
  e: {},
  ...over,
});

beforeEach(async () => {
  vi.resetModules();
  api.fetchStaticDropOff.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

/** Frisches Modul je Test — der Modul-Cache des Hooks ist bewusst global. */
const loadHook = async () => (await import('./useDropOff')).useDropOff;

describe('useDropOff', () => {
  it('liefert die ausgewertete Serie', async () => {
    api.fetchStaticDropOff.mockResolvedValue({ '42': entry() });
    const useDropOff = await loadHook();

    const { result } = renderHook(() => useDropOff(42));
    await waitFor(() => expect(result.current).not.toBeNull());

    expect(result.current?.completionRate).toBeCloseTo(0.6, 5);
    expect(result.current?.worstSeason?.seasonNumber).toBe(2);
  });

  it('liefert null für eine Serie ohne Aggregat', async () => {
    api.fetchStaticDropOff.mockResolvedValue({ '42': entry() });
    const useDropOff = await loadHook();

    const { result } = renderHook(() => useDropOff(99));
    await waitFor(() => expect(api.fetchStaticDropOff).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it('liefert null, solange keine Serie gewählt ist', async () => {
    api.fetchStaticDropOff.mockResolvedValue({});
    const useDropOff = await loadHook();

    const { result } = renderHook(() => useDropOff(undefined));
    expect(result.current).toBeNull();
  });

  it('bleibt still, wenn das Backend die Datei noch nicht liefert', async () => {
    api.fetchStaticDropOff.mockResolvedValue(null);
    const useDropOff = await loadHook();

    const { result } = renderHook(() => useDropOff(42));
    await waitFor(() => expect(api.fetchStaticDropOff).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it('bleibt still, wenn der Abruf fehlschlägt', async () => {
    api.fetchStaticDropOff.mockRejectedValue(new Error('offline'));
    const useDropOff = await loadHook();

    const { result } = renderHook(() => useDropOff(42));
    await waitFor(() => expect(api.fetchStaticDropOff).toHaveBeenCalled());
    expect(result.current).toBeNull();
  });

  it('lädt die Datei nur einmal für mehrere Aufrufer', async () => {
    api.fetchStaticDropOff.mockResolvedValue({ '42': entry() });
    const useDropOff = await loadHook();

    const first = renderHook(() => useDropOff(42));
    await waitFor(() => expect(first.result.current).not.toBeNull());
    renderHook(() => useDropOff(42));

    expect(api.fetchStaticDropOff).toHaveBeenCalledTimes(1);
  });
});
