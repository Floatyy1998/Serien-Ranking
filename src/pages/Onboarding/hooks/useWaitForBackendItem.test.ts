// @vitest-environment jsdom
import { cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Handler = (snap: { exists: () => boolean }) => void;

const fb = vi.hoisted(() => {
  const state = {
    handlers: [] as Array<{ path: string; handler: Handler }>,
    offCalls: [] as string[],
  };
  const ref = vi.fn((path: string) => ({
    on: (_event: string, handler: Handler) => {
      state.handlers.push({ path, handler });
      return handler;
    },
    off: (_event: string) => {
      state.offCalls.push(path);
    },
  }));
  const database = Object.assign(() => ({ ref }), {});
  return { state, ref, database };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

import { useWaitForBackendItem } from './useWaitForBackendItem';

beforeEach(() => {
  fb.state.handlers = [];
  fb.state.offCalls = [];
  fb.ref.mockClear();
  authState.user = { uid: 'u1' };
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
  vi.restoreAllMocks();
});

describe('useWaitForBackendItem', () => {
  it('löst sofort false ohne eingeloggten User', async () => {
    authState.user = null;
    const { result } = renderHook(() => useWaitForBackendItem());
    await expect(result.current('series', 10)).resolves.toBe(false);
    expect(fb.ref).not.toHaveBeenCalled();
  });

  it('löst true sobald der Eintrag existiert und räumt auf', async () => {
    const { result } = renderHook(() => useWaitForBackendItem());
    const promise = result.current('series', 55, 60_000);
    expect(fb.ref).toHaveBeenCalledWith('users/u1/series/55');
    const entry = fb.state.handlers[0];
    entry?.handler({ exists: () => true });
    await expect(promise).resolves.toBe(true);
    expect(fb.state.offCalls).toContain('users/u1/series/55');
  });

  it('ignoriert nicht-existierende Snapshots und löst per Timeout false', async () => {
    const { result } = renderHook(() => useWaitForBackendItem());
    const promise = result.current('movie', 7, 5000);
    expect(fb.ref).toHaveBeenCalledWith('users/u1/movies/7');
    fb.state.handlers[0]?.handler({ exists: () => false });
    await vi.advanceTimersByTimeAsync(5000);
    await expect(promise).resolves.toBe(false);
    expect(fb.state.offCalls).toContain('users/u1/movies/7');
  });
});
