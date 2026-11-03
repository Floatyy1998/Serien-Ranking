// @vitest-environment jsdom
import { act, cleanup, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookSearchResult } from '../../../types/Book';

const state = vi.hoisted(() => ({ ask: false, add: vi.fn(async () => null) }));

vi.mock('../hooks/useBookActions', () => ({ useBookActions: () => ({ add: state.add }) }));
vi.mock('../../../hooks/ui/useBookAddPrompt', () => ({ useBookAddPrompt: () => state.ask }));
vi.mock('../../../hooks/books/useOwnedBooks', () => ({ useOwnsResult: () => () => false }));
vi.mock('../components/AddBookSheet', () => ({
  AddBookSheet: ({
    result,
    onPick,
  }: {
    result: BookSearchResult | null;
    onPick: (choice: { status: string }) => void;
  }) =>
    result ? (
      <button type="button" onClick={() => onPick({ status: 'reading' })}>
        Sheet: {result.title}
      </button>
    ) : null,
}));

import { useAddFlow } from './useAddFlow';

const book: BookSearchResult = {
  id: 'hc-1',
  title: 'Onyx Storm',
  authors: [],
  source: 'hardcover',
};

describe('useAddFlow', () => {
  beforeEach(() => {
    cleanup();
    state.add.mockClear();
  });

  it('legt ein Buch ohne Nachfrage direkt auf die Leseliste', async () => {
    state.ask = false;
    const onAdded = vi.fn();
    const { result } = renderHook(() => useAddFlow(undefined, onAdded));
    await act(async () => {
      result.current.openAdd(book);
    });
    expect(state.add).toHaveBeenCalledWith(book, 'planned', undefined);
    expect(onAdded).toHaveBeenCalledTimes(1);
    render(<>{result.current.sheet}</>);
    expect(screen.queryByText(/Sheet:/)).toBeNull();
  });

  it('öffnet das Sheet mit der Lesestand-Wahl, wenn das Konto das so will', async () => {
    state.ask = true;
    const { result } = renderHook(() => useAddFlow());
    await act(async () => {
      result.current.openAdd(book);
    });
    expect(state.add).not.toHaveBeenCalled();
    render(<>{result.current.sheet}</>);
    expect(screen.getByText('Sheet: Onyx Storm')).toBeTruthy();
  });

  it('behält die Wahl „als Buch“ für Manga-Bände auch über das Sheet', async () => {
    state.ask = true;
    const { result } = renderHook(() => useAddFlow());
    await act(async () => {
      result.current.openAdd(book, { asBookOf: 105398 });
    });
    render(<>{result.current.sheet}</>);
    await act(async () => {
      screen.getByText('Sheet: Onyx Storm').click();
    });
    expect(state.add).toHaveBeenCalledWith(book, 'reading', {
      finishedEarlier: undefined,
      asBookOf: 105398,
    });
  });
});
