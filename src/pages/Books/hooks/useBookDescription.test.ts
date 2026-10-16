// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookLinks } from '../../../types/Book';

vi.mock('../../../services/i18n', () => ({ appLocale: 'de', t: (text: string) => text }));
vi.mock('../../../services/books/bookTranslation', () => ({
  translateBookDescription: vi.fn().mockResolvedValue(null),
}));
vi.mock('../../../services/api/bookDiscovery', () => ({
  fetchWikipediaSummary: vi.fn().mockResolvedValue(null),
}));

import { DESCRIPTION_PATIENCE_MS, useBookDescription } from './useBookDescription';

const noLinks: BookLinks | null = null;

describe('useBookDescription', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('zeigt den Platzhalter, solange Wikidata antwortet, und gibt nach der Wartezeit auf', async () => {
    const { result } = renderHook(() =>
      useBookDescription('hc-1', undefined, false, noLinks, true)
    );
    expect(result.current.loading).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(DESCRIPTION_PATIENCE_MS + 50);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.text).toBe('');
  });

  it('zeigt einen deutschen Klappentext sofort, ohne auf Wikidata zu warten', async () => {
    const text =
      'Harry erfährt an seinem elften Geburtstag, dass er ein Zauberer ist, und kommt nach Hogwarts, wo ihn viele Abenteuer erwarten.';
    const { result } = renderHook(() => useBookDescription('hc-2', text, true, noLinks, true));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10);
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.text).toBe(text);
  });
});
