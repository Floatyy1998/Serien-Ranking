// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const svc = vi.hoisted(() => ({
  cached: null as { name: string; logo: string }[] | null,
  fetch: vi.fn<() => Promise<{ name: string; logo: string }[]>>(),
}));

vi.mock('../services/itemProviders', () => ({
  getCachedItemProviders: () => svc.cached,
  fetchItemProviderDetails: svc.fetch,
}));

import { useItemProviders } from './useItemProviders';

const NETFLIX = [{ name: 'Netflix', logo: 'https://img/nf.jpg' }];

beforeEach(() => {
  svc.cached = null;
  svc.fetch.mockReset().mockResolvedValue(NETFLIX);
});

describe('useItemProviders', () => {
  it('liefert gecachte Provider sofort, ohne zu laden', () => {
    svc.cached = NETFLIX;
    const { result } = renderHook(() => useItemProviders('series', 1));
    expect(result.current).toEqual(NETFLIX);
    expect(svc.fetch).not.toHaveBeenCalled();
  });

  it('lädt fehlende Provider nach', async () => {
    const { result } = renderHook(() => useItemProviders('movie', 2));
    expect(result.current).toEqual([]);
    await waitFor(() => expect(result.current).toEqual(NETFLIX));
    expect(svc.fetch).toHaveBeenCalledWith('movie', 2);
  });

  it('lädt nichts, solange der Hook abgeschaltet ist', () => {
    svc.cached = NETFLIX;
    const { result } = renderHook(() => useItemProviders('series', 3, false));
    expect(result.current).toEqual([]);
    expect(svc.fetch).not.toHaveBeenCalled();
  });

  it('verwirft eine Antwort nach dem Unmount', async () => {
    let resolve: (v: { name: string; logo: string }[]) => void = () => {};
    svc.fetch.mockReturnValue(new Promise((r) => (resolve = r)));
    const { result, unmount } = renderHook(() => useItemProviders('series', 4));
    unmount();
    resolve(NETFLIX);
    await Promise.resolve();
    expect(result.current).toEqual([]);
  });
});
