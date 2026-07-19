// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invalidateActiveSubscriptions, useActiveSubscriptions } from './useActiveSubscriptions';
import type { Series } from '../types/Series';

const authState = vi.hoisted(() => ({ uid: 'u1' as string | undefined }));

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.uid ? { uid: authState.uid } : null }),
}));

// Firebase-Mock: nur once('value') aus einem Store pro Pfad.
const fb = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  const makeSnap = (val: unknown) => ({ val: () => val });
  const refMock = vi.fn((path: string) => ({
    once: vi.fn(async () => makeSnap(store[path] ?? null)),
  }));
  const database = () => ({ ref: refMock });
  const reset = () => {
    for (const k of Object.keys(store)) delete store[k];
    refMock.mockClear();
  };
  return { store, refMock, database, reset };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const subsPath = 'users/u1/subscriptions';
const providersPath = 'users/u1/subscriptions/providers';

function makeSeries(id: number, providers: string[]): Series {
  return {
    id,
    provider: { provider: providers.map((name, i) => ({ id: i, logo: '', name })) },
  } as unknown as Series;
}

beforeEach(() => {
  authState.uid = 'u1';
  fb.reset();
  invalidateActiveSubscriptions(); // Modul-Cache leeren zwischen Tests
});

afterEach(() => {
  // Erst unmounten, dann invalidieren — invalidate() benachrichtigt gemountete
  // Hooks (Neu-Laden), was sonst den Modul-Cache des naechsten Tests vergiftet.
  cleanup();
  invalidateActiveSubscriptions();
});

describe('useActiveSubscriptions', () => {
  it('startet mit leerem active-Set und loading=true (kein Cache)', () => {
    fb.store[subsPath] = { providers: { Netflix: { active: true } } };
    fb.store[providersPath] = { Netflix: { active: true } };
    const { result } = renderHook(() => useActiveSubscriptions());
    expect(result.current.loading).toBe(true);
    expect(result.current.activeProviders.size).toBe(0);
  });

  it('lädt aktive Provider und Overrides aus Firebase', async () => {
    fb.store[subsPath] = {
      providers: { Netflix: { active: true }, 'Disney Plus': { active: false } },
      seriesOverrides: { '5': 'HBO Max' },
    };
    fb.store[providersPath] = { Netflix: { active: true }, 'Disney Plus': { active: false } };

    const { result } = renderHook(() => useActiveSubscriptions());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(Array.from(result.current.activeProviders)).toEqual(['Netflix']);
    expect(result.current.seriesOverrides).toEqual({ '5': 'HBO Max' });
    expect(result.current.hasAnySubscription).toBe(true);
  });

  it('isOnActiveSub erkennt eine Serie auf einem aktiven Provider', async () => {
    fb.store[subsPath] = { providers: { Netflix: { active: true } } };
    fb.store[providersPath] = { Netflix: { active: true } };

    const { result } = renderHook(() => useActiveSubscriptions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.isOnActiveSub(makeSeries(1, ['Netflix']))).toBe(true);
    expect(result.current.isOnActiveSub(makeSeries(2, ['Disney Plus']))).toBe(false);
  });

  it('isOnActiveSub berücksichtigt einen Serien-Override', async () => {
    fb.store[subsPath] = {
      providers: { Netflix: { active: true } },
      seriesOverrides: { '7': 'Netflix' },
    };
    fb.store[providersPath] = { Netflix: { active: true } };

    const { result } = renderHook(() => useActiveSubscriptions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Serie 7 läuft laut Catalog auf Disney, aber Override zeigt auf Netflix (aktiv).
    expect(result.current.isOnActiveSub(makeSeries(7, ['Disney Plus']))).toBe(true);
    expect(result.current.getSeriesOverride(7)).toBe('Netflix');
    expect(result.current.getSeriesOverride(99)).toBeNull();
  });

  it('hasAnySubscription bleibt false, wenn keine Provider gepflegt sind', async () => {
    fb.store[subsPath] = { providers: {} };
    fb.store[providersPath] = {};

    const { result } = renderHook(() => useActiveSubscriptions());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.hasAnySubscription).toBe(false);
    expect(result.current.isOnActiveSub(makeSeries(1, ['Netflix']))).toBe(false);
  });

  it('liest ohne User nicht aus Firebase', () => {
    authState.uid = undefined;
    const { result } = renderHook(() => useActiveSubscriptions());
    expect(result.current.loading).toBe(true);
    // Ohne User feuert der Effekt nichts.
    expect(fb.refMock).not.toHaveBeenCalled();
  });
});
