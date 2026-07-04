// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

type Snapshot = { val: () => unknown };
type ValueCb = (snap: Snapshot) => void | Promise<void>;

const fb = vi.hoisted(() => {
  const state: { cb: ValueCb | null } = { cb: null };
  const set = vi.fn(() => Promise.resolve());
  const off = vi.fn();
  const on = vi.fn((_event: string, cb: ValueCb) => {
    state.cb = cb;
    return cb;
  });
  const ref = vi.fn(() => ({ on, off, set }));
  return { state, set, off, on, ref };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));

vi.mock('../config/features', () => ({
  FEATURES: { WRAPPED_ENABLED: false, WRAPPED_YEAR: 2026 },
}));

import { useWrappedConfig } from './useWrappedConfig';

const snap = (data: unknown): Snapshot => ({ val: () => data });

beforeEach(() => {
  fb.state.cb = null;
  fb.set.mockClear();
  fb.off.mockClear();
  fb.on.mockClear();
  fb.ref.mockClear();
});

describe('useWrappedConfig', () => {
  it('registriert einen value-Listener auf config/wrapped und startet mit loading=true', () => {
    const { result } = renderHook(() => useWrappedConfig());
    expect(fb.ref).toHaveBeenCalledWith('config/wrapped');
    expect(fb.on).toHaveBeenCalledWith('value', expect.any(Function));
    expect(result.current.loading).toBe(true);
    expect(result.current.enabled).toBe(false);
    expect(result.current.year).toBe(2026);
  });

  it('übernimmt vorhandene Firebase-Config und beendet loading', async () => {
    const { result } = renderHook(() => useWrappedConfig());
    await act(async () => {
      await fb.state.cb?.(snap({ enabled: true, year: 2025 }));
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.enabled).toBe(true);
    expect(result.current.year).toBe(2025);
    expect(fb.set).not.toHaveBeenCalled();
  });

  it('erstellt die Config mit Defaults wenn sie fehlt', async () => {
    const { result } = renderHook(() => useWrappedConfig());
    await act(async () => {
      await fb.state.cb?.(snap(null));
    });
    expect(fb.set).toHaveBeenCalledWith({ enabled: false, year: 2026 });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.enabled).toBe(false);
    expect(result.current.year).toBe(2026);
  });

  it('fällt auf lokale Defaults zurück wenn set() fehlschlägt', async () => {
    fb.set.mockRejectedValueOnce(new Error('denied'));
    const { result } = renderHook(() => useWrappedConfig());
    await act(async () => {
      await fb.state.cb?.(snap(null));
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.year).toBe(2026);
  });

  it('nutzt partielle Config-Felder mit Default-Fallback', async () => {
    const { result } = renderHook(() => useWrappedConfig());
    await act(async () => {
      await fb.state.cb?.(snap({ enabled: true }));
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.enabled).toBe(true);
    expect(result.current.year).toBe(2026);
  });

  it('meldet den Listener beim Unmount ab', () => {
    const { unmount } = renderHook(() => useWrappedConfig());
    const listener = fb.on.mock.results[0].value;
    unmount();
    expect(fb.off).toHaveBeenCalledWith('value', listener);
  });
});
