// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import type { AnimeFillerData, FillerEpisode } from '../services/animeFillerService';

const svc = vi.hoisted(() => {
  const lookup = new Map<string, unknown>([['s1-e1', { type: 'filler' }]]);
  return {
    lookup,
    getAnimeFillerData: vi.fn<() => Promise<AnimeFillerData | null>>(),
    refreshAnimeFillerViaBackend: vi.fn<() => Promise<AnimeFillerData | null>>(),
    buildFillerLookup: vi.fn(() => lookup as Map<string, FillerEpisode>),
  };
});

vi.mock('../services/animeFillerService', () => ({
  getAnimeFillerData: svc.getAnimeFillerData,
  refreshAnimeFillerViaBackend: svc.refreshAnimeFillerViaBackend,
  buildFillerLookup: svc.buildFillerLookup,
}));

import { useAnimeFillerData } from './useAnimeFillerData';

const DATA = { episodes: [{ episodeNumber: 1 }] } as unknown as AnimeFillerData;
const seasons = [{ seasonNumber: 1, episodes: [{}] }];

beforeEach(() => {
  svc.getAnimeFillerData.mockReset().mockResolvedValue(DATA);
  svc.refreshAnimeFillerViaBackend.mockReset().mockResolvedValue(DATA);
  svc.buildFillerLookup.mockClear();
});

describe('useAnimeFillerData', () => {
  it('bleibt inert (data=null, enabled=false) ohne seriesId', () => {
    const { result } = renderHook(() => useAnimeFillerData(undefined, seasons));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.enabled).toBe(false);
    expect(result.current.fillerByKey.size).toBe(0);
    expect(svc.getAnimeFillerData).not.toHaveBeenCalled();
  });

  it('lädt Filler-Daten für eine seriesId und setzt enabled=true', async () => {
    const { result } = renderHook(() => useAnimeFillerData(123, seasons));
    expect(svc.getAnimeFillerData).toHaveBeenCalledWith(123);
    await waitFor(() => expect(result.current.data).toBe(DATA));
    expect(result.current.loading).toBe(false);
    expect(result.current.enabled).toBe(true);
  });

  it('baut fillerByKey aus den geladenen Daten und den Staffeln', async () => {
    const { result } = renderHook(() => useAnimeFillerData(123, seasons));
    await waitFor(() => expect(result.current.data).toBe(DATA));
    expect(svc.buildFillerLookup).toHaveBeenCalledWith(seasons, DATA.episodes);
    expect(result.current.fillerByKey).toBe(svc.lookup);
  });

  it('liefert leere Map wenn keine Staffeln übergeben werden', async () => {
    const { result } = renderHook(() => useAnimeFillerData(123));
    await waitFor(() => expect(result.current.data).toBe(DATA));
    expect(result.current.fillerByKey.size).toBe(0);
    expect(svc.buildFillerLookup).not.toHaveBeenCalled();
  });

  it('reload() ruft den Backend-Refresh auf und aktualisiert die Daten', async () => {
    const refreshed = { episodes: [] } as unknown as AnimeFillerData;
    svc.refreshAnimeFillerViaBackend.mockResolvedValue(refreshed);
    const { result } = renderHook(() => useAnimeFillerData(123, seasons));
    await waitFor(() => expect(result.current.data).toBe(DATA));

    result.current.reload();
    await waitFor(() => expect(svc.refreshAnimeFillerViaBackend).toHaveBeenCalledWith(123));
  });

  it('setzt data zurück wenn seriesId entfällt', async () => {
    const { result, rerender } = renderHook(
      ({ id }: { id?: number }) => useAnimeFillerData(id, seasons),
      { initialProps: { id: 123 as number | undefined } }
    );
    await waitFor(() => expect(result.current.data).toBe(DATA));
    rerender({ id: undefined });
    await waitFor(() => expect(result.current.data).toBeNull());
  });
});
