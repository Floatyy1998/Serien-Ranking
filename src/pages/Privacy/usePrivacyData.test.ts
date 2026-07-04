// @vitest-environment jsdom
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePrivacyData } from './usePrivacyData';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('usePrivacyData', () => {
  it('lädt die Datenschutz-JSON vom Backend', async () => {
    const payload = { title: 'Datenschutz' };
    const fetchMock = vi.fn(async (_url: string) => ({ json: async () => payload }));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => usePrivacyData());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(payload);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('/legal/privacy.json');
  });

  it('bleibt bei Fehler ohne Daten und loggt', async () => {
    const fetchMock = vi.fn(async () => {
      throw new Error('offline');
    });
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => usePrivacyData());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });
});
