import { useCallback, useState } from 'react';
import type { BookSearchResult } from '../../../types/Book';
import { AddBookSheet, type AddChoice } from '../components/AddBookSheet';
import { useBookActions } from '../hooks/useBookActions';

/** Hinzufügen-Sheet für beliebige Treffer: openAdd(result) öffnet, sheet wird einmal gerendert. */
export function useAddFlow(zIndex?: number) {
  const actions = useBookActions();
  const [pending, setPending] = useState<BookSearchResult | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = useCallback(
    async (choice: AddChoice) => {
      if (!pending) return;
      setBusy(true);
      await actions.add(pending, choice.status, { finishedEarlier: choice.finishedEarlier });
      setBusy(false);
      setPending(null);
    },
    [pending, actions]
  );

  const sheet = (
    <AddBookSheet
      result={pending}
      busy={busy}
      zIndex={zIndex}
      onClose={() => setPending(null)}
      onPick={(c) => void pick(c)}
    />
  );

  return { openAdd: setPending, sheet };
}
