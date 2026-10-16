// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookSearchResult } from '../../types/Book';

const fetchPage = vi.hoisted(() => vi.fn());
vi.mock('../../services/api/bookDiscovery', () => ({ fetchCatalogPage: fetchPage }));

import { useCatalogFeed } from './useCatalogFeed';

const book = (n: number): BookSearchResult => ({
  id: `hc-${n}`,
  title: `Buch ${n}`,
  authors: [`Autor ${n}`],
  source: 'hardcover',
});

describe('useCatalogFeed', () => {
  beforeEach(() => {
    fetchPage.mockReset();
  });

  it('lädt die erste Seite sofort', async () => {
    fetchPage.mockResolvedValue({ items: [book(1), book(2)], done: false });
    const { result } = renderHook(() => useCatalogFeed('fantasy', { sort: 'popular' }));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(result.current.loading).toBe(false);
    expect(fetchPage).toHaveBeenCalledTimes(1);
    expect(fetchPage).toHaveBeenCalledWith(
      'fantasy',
      { mood: undefined, sort: 'popular', audience: undefined },
      1
    );
  });

  it('meldet Fehler der ersten Seite und hört dann auf', async () => {
    fetchPage.mockRejectedValue(new Error('pausiert'));
    const { result } = renderHook(() => useCatalogFeed('horror', {}));
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.loading).toBe(false);
    expect(result.current.finished).toBe(true);
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it('beginnt bei neuem Filter von vorn und verwirft die alte Antwort', async () => {
    let releaseFirst: (value: unknown) => void = () => {};
    fetchPage
      .mockImplementationOnce(() => new Promise((resolve) => (releaseFirst = resolve)))
      .mockResolvedValue({ items: [book(9)], done: true });
    const { result, rerender } = renderHook(
      ({ mood }: { mood?: string }) => useCatalogFeed('fantasy', { mood }),
      { initialProps: {} as { mood?: string } }
    );
    rerender({ mood: 'dark' });
    await waitFor(() => expect(result.current.items.map((b) => b.id)).toEqual(['hc-9']));
    await act(async () => {
      releaseFirst({ items: [book(1)], done: true });
    });
    expect(result.current.items.map((b) => b.id)).toEqual(['hc-9']);
  });
});
