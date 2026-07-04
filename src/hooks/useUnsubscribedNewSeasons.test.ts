// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUnsubscribedNewSeasons } from './useUnsubscribedNewSeasons';
import type { Series } from '../types/Series';

const authState = vi.hoisted(() => ({ uid: 'u1' as string | undefined }));

vi.mock('../AuthContext', () => ({
  useAuth: () => ({ user: authState.uid ? { uid: authState.uid } : null }),
}));

// Firebase-Mock: once('value') aus Store, root-ref().update() gesammelt.
const fb = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  const updateMock = vi.fn(async (_u: unknown) => {});
  const makeSnap = (val: unknown) => ({ val: () => val });
  const refMock = vi.fn((path?: string) => {
    if (path == null) return { update: updateMock };
    return { once: vi.fn(async () => makeSnap(store[path] ?? null)) };
  });
  const database = () => ({ ref: refMock });
  const reset = () => {
    for (const k of Object.keys(store)) delete store[k];
    updateMock.mockClear();
    refMock.mockClear();
  };
  return { store, refMock, updateMock, database, reset };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const providersPath = 'users/u1/subscriptions/providers';
const dismissPath = 'users/u1/unsubscribedNewSeasonDismissed';

function makeSeries(id: number, providerNames: string[]): Series {
  return {
    id,
    title: `Series ${id}`,
    provider: { provider: providerNames.map((name, i) => ({ id: i, logo: '', name })) },
  } as unknown as Series;
}

beforeEach(() => {
  authState.uid = 'u1';
  fb.reset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useUnsubscribedNewSeasons', () => {
  it('liefert keine Einträge, wenn der User keine Abos gepflegt hat', async () => {
    fb.store[providersPath] = {};
    fb.store[dismissPath] = null;
    const series = [makeSeries(1, ['Netflix'])];

    const { result } = renderHook(() => useUnsubscribedNewSeasons(series));
    // Nach dem Load bleibt entries leer (hasAnySubscription=false).
    await waitFor(() => expect(fb.refMock).toHaveBeenCalledWith(providersPath));
    expect(result.current.entries).toHaveLength(0);
  });

  it('meldet eine Serie, deren Provider NICHT abonniert ist', async () => {
    fb.store[providersPath] = { Netflix: { active: true } };
    fb.store[dismissPath] = null;
    const series = [makeSeries(1, ['Amazon Prime Video'])];

    const { result } = renderHook(() => useUnsubscribedNewSeasons(series));

    await waitFor(() => expect(result.current.entries).toHaveLength(1));
    expect(result.current.entries[0].series.id).toBe(1);
    expect(result.current.entries[0].providers).toContain('Amazon Prime Video');
  });

  it('filtert Serien heraus, die auf einem aktiven Abo laufen', async () => {
    fb.store[providersPath] = { Netflix: { active: true } };
    fb.store[dismissPath] = null;
    const series = [makeSeries(1, ['Netflix'])];

    const { result } = renderHook(() => useUnsubscribedNewSeasons(series));

    await waitFor(() => expect(fb.refMock).toHaveBeenCalledWith(providersPath));
    expect(result.current.entries).toHaveLength(0);
  });

  it('filtert kürzlich dismissed Serien innerhalb der TTL heraus', async () => {
    fb.store[providersPath] = { Netflix: { active: true } };
    fb.store[dismissPath] = { '1': Date.now() }; // gerade eben dismissed
    const series = [makeSeries(1, ['Amazon Prime Video'])];

    const { result } = renderHook(() => useUnsubscribedNewSeasons(series));

    await waitFor(() => expect(fb.refMock).toHaveBeenCalledWith(dismissPath));
    // kurz warten, damit der State-Update nach dem Read sicher durch ist
    await waitFor(() => expect(result.current.entries).toHaveLength(0));
  });

  it('zeigt eine Serie wieder, deren Dismiss älter als die TTL ist', async () => {
    const eightDaysMs = 8 * 24 * 60 * 60 * 1000;
    fb.store[providersPath] = { Netflix: { active: true } };
    fb.store[dismissPath] = { '1': Date.now() - eightDaysMs };
    const series = [makeSeries(1, ['Amazon Prime Video'])];

    const { result } = renderHook(() => useUnsubscribedNewSeasons(series));

    await waitFor(() => expect(result.current.entries).toHaveLength(1));
  });

  it('dismiss() schreibt einen Update mit allen aktuellen Einträgen', async () => {
    fb.store[providersPath] = { Netflix: { active: true } };
    fb.store[dismissPath] = null;
    const series = [makeSeries(1, ['Amazon Prime Video'])];

    const { result } = renderHook(() => useUnsubscribedNewSeasons(series));
    await waitFor(() => expect(result.current.entries).toHaveLength(1));

    let dismissPromise: Promise<void> = Promise.resolve();
    act(() => {
      dismissPromise = result.current.dismiss();
    });
    await dismissPromise;

    expect(fb.updateMock).toHaveBeenCalledTimes(1);
    const payload = fb.updateMock.mock.calls[0][0] as Record<string, number>;
    expect(Object.keys(payload)).toContain(`${dismissPath}/1`);
    // Nach dem Dismiss verschwindet der Eintrag lokal.
    await waitFor(() => expect(result.current.entries).toHaveLength(0));
  });

  it('registriert ohne User keinen Firebase-Read', () => {
    authState.uid = undefined;
    renderHook(() => useUnsubscribedNewSeasons([makeSeries(1, ['Netflix'])]));
    expect(fb.refMock).not.toHaveBeenCalled();
  });
});
