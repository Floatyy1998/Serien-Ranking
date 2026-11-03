import { useCallback, useState } from 'react';
import { useOwnsResult } from '../../../hooks/books/useOwnedBooks';
import { useBookAddPrompt } from '../../../hooks/ui/useBookAddPrompt';
import type { BookSearchResult } from '../../../types/Book';
import { AddBookSheet, type AddChoice } from '../components/AddBookSheet';
import { useBookActions, type AddOptions } from '../hooks/useBookActions';

const addedHere = new Set<string>();

/** Eigene Bücher fliegen aus dem Stöbern — gerade hier hinzugefügte bleiben mit Haken stehen. */
export function useHideOwned() {
  const owns = useOwnsResult();
  return useCallback((r: BookSearchResult) => owns(r) && !addedHere.has(r.id), [owns]);
}

/**
 * Hinzufügen für beliebige Treffer: openAdd(result) legt das Buch wie eine Serie direkt auf die Leseliste —
 * oder öffnet das Sheet mit der Lesestand-Wahl, wenn das Konto das so eingestellt hat. sheet wird einmal gerendert.
 */
export function useAddFlow(zIndex?: number, onAdded?: () => void) {
  const actions = useBookActions();
  const askOnAdd = useBookAddPrompt();
  const [pending, setPending] = useState<{ result: BookSearchResult; asBookOf?: number } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  const pick = useCallback(
    async (choice: AddChoice) => {
      if (!pending) return;
      setBusy(true);
      addedHere.add(pending.result.id);
      onAdded?.();
      await actions.add(pending.result, choice.status, {
        finishedEarlier: choice.finishedEarlier,
        asBookOf: pending.asBookOf,
      });
      setBusy(false);
      setPending(null);
    },
    [pending, actions, onAdded]
  );

  const openAdd = useCallback(
    (result: BookSearchResult, options?: Pick<AddOptions, 'asBookOf'>) => {
      if (askOnAdd) {
        setPending({ result, asBookOf: options?.asBookOf });
        return;
      }
      addedHere.add(result.id);
      onAdded?.();
      void actions.add(result, 'planned', options);
    },
    [askOnAdd, actions, onAdded]
  );

  const sheet = (
    <AddBookSheet
      result={pending?.result ?? null}
      busy={busy}
      zIndex={zIndex}
      onClose={() => setPending(null)}
      onPick={(c) => void pick(c)}
    />
  );

  return { openAdd, sheet };
}
