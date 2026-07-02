/**
 * 🔄 Delta-Sync-Listener-Wiring (child_changed/added/removed).
 * Spart massiv Bandbreite: Nur geänderte Kinder werden heruntergeladen,
 * nicht der gesamte Datensatz.
 *
 * Die Merge-Logik selbst ist pure (siehe deltaMerge.ts) — hier passiert nur
 * das Firebase-Wiring plus State-/Cache-Updates über die injizierten Deps.
 * Der React-State bleibt im Haupt-Hook (setData/setLastUpdated kommen von dort).
 */
import firebase from 'firebase/compat/app';
import type { Dispatch, SetStateAction } from 'react';
import {
  collectChildPropKeys,
  collectKnownKeys,
  collectKnownSubKeys,
  mergeChildRemoval,
  mergeChildUpdate,
  mergePropRemoval,
  mergePropUpdate,
  mergeSubChildRemoval,
  mergeSubChildUpdate,
} from './deltaMerge';

export interface DeltaListenerDeps<T> {
  path: string;
  deltaSubKey?: string;
  setData: Dispatch<SetStateAction<T | null>>;
  setLastUpdated: Dispatch<SetStateAction<number | null>>;
  /** Fire-and-forget Cache-Write — wird bewusst nicht awaited. */
  saveToCache: (data: T) => void | Promise<void>;
}

/**
 * Delta-Listener auf Basis von initialData aufsetzen.
 * Wird sowohl beim initialen Setup als auch nach Full-Load verwendet.
 * Gibt die Cleanup-Funktion zurück, die ALLE Listener wieder abhängt.
 */
export function attachDeltaListeners<T>(
  ref: firebase.database.Reference,
  initialData: T,
  deps: DeltaListenerDeps<T>
): () => void {
  const { path, deltaSubKey, setData, setLastUpdated, saveToCache } = deps;
  const cleanups: (() => void)[] = [];

  // Deep delta: Listener pro Child auf deren Sub-Key (z.B. seasons).
  // child_changed: bestehender Season-Knoten wurde geaendert (Episode
  //   markiert/unmarkiert in einer Season die bereits Watch-Daten hatte)
  // child_added: neuer Season-Knoten erzeugt (erste Episode in einer
  //   neuen Staffel markiert — z.B. via Extension)
  // child_removed: Season-Knoten geloescht (letzte Episode in einer
  //   Staffel unmarkiert → Firebase loescht leere Knoten)
  const subKeyName = deltaSubKey ?? '';
  const knownSubChildren = new Map<string, Set<string>>();
  const attachSubListener = (childKey: string) => {
    const subRef = firebase.database().ref(`${path}/${childKey}/${subKeyName}`);
    // Track bekannte Sub-Children um initiale child_added Events zu skippen
    knownSubChildren.set(childKey, collectKnownSubKeys(initialData, childKey, subKeyName));

    const applySubUpdate = (subChildKey: string, value: unknown) => {
      setData((prev) => {
        const updated = mergeSubChildUpdate<T>(prev, childKey, subKeyName, subChildKey, value);
        // Referenz-Gleichheit = Merge war nicht anwendbar → Cache unverändert
        if (updated !== prev) saveToCache(updated as T);
        return updated;
      });
      setLastUpdated(Date.now());
    };

    const onSubChanged = subRef.on('child_changed', (snap) => {
      if (snap.key) applySubUpdate(snap.key, snap.val());
    });
    const onSubAdded = subRef.on('child_added', (snap) => {
      const k = snap.key;
      if (!k) return;
      // Initiale Kinder skippen (werden beim Setup gefeuert)
      const known = knownSubChildren.get(childKey);
      if (known?.has(k)) {
        known.delete(k);
        return;
      }
      applySubUpdate(k, snap.val());
    });
    const onSubRemoved = subRef.on('child_removed', (snap) => {
      const k = snap.key;
      if (!k) return;
      setData((prev) => {
        const updated = mergeSubChildRemoval<T>(prev, childKey, subKeyName, k);
        if (updated !== prev) saveToCache(updated as T);
        return updated;
      });
      setLastUpdated(Date.now());
    });
    cleanups.push(
      () => subRef.off('child_changed', onSubChanged),
      () => subRef.off('child_added', onSubAdded),
      () => subRef.off('child_removed', onSubRemoved)
    );
  };

  // Property-Level Listener: fängt Änderungen, Hinzufügen und Entfernen
  // von Metadaten-Properties (rating, hidden, watchlist etc.).
  // Überspringt deltaSubKey (z.B. seasons) — das deckt der Deep-Listener ab.
  const attachPropListeners = (targetKey: string) => {
    const knownProps = collectChildPropKeys(initialData, targetKey);
    const propRef = firebase.database().ref(`${path}/${targetKey}`);

    const applyPropUpdate = (propKey: string, value: unknown) => {
      setData((prev) => {
        const updated = mergePropUpdate<T>(prev, targetKey, propKey, value);
        if (updated !== prev) saveToCache(updated as T);
        return updated;
      });
      setLastUpdated(Date.now());
    };

    const onChanged = propRef.on('child_changed', (snap) => {
      const propKey = snap.key;
      if (!propKey || propKey === subKeyName) return;
      applyPropUpdate(propKey, snap.val());
    });
    const onAdded = propRef.on('child_added', (snap) => {
      const propKey = snap.key;
      if (!propKey || propKey === subKeyName) return;
      if (knownProps.has(propKey)) {
        knownProps.delete(propKey);
        return;
      }
      applyPropUpdate(propKey, snap.val());
    });
    const onRemoved = propRef.on('child_removed', (snap) => {
      const propKey = snap.key;
      if (!propKey || propKey === subKeyName) return;
      setData((prev) => {
        const updated = mergePropRemoval<T>(prev, targetKey, propKey);
        if (updated !== prev) saveToCache(updated as T);
        return updated;
      });
      setLastUpdated(Date.now());
    });
    cleanups.push(
      () => propRef.off('child_changed', onChanged),
      () => propRef.off('child_added', onAdded),
      () => propRef.off('child_removed', onRemoved)
    );
  };

  if (deltaSubKey) {
    for (const childKey of Object.keys(initialData as Record<string, unknown>)) {
      attachSubListener(childKey);
      attachPropListeners(childKey);
    }
  } else {
    const onChanged = ref.on('child_changed', (snap) => {
      const key = snap.key;
      if (!key) return;
      setData((prev) => {
        const updated = mergeChildUpdate<T>(prev, key, snap.val());
        saveToCache(updated);
        return updated;
      });
      setLastUpdated(Date.now());
    });
    cleanups.push(() => ref.off('child_changed', onChanged));
  }

  // child_added: Fängt neue Kinder (z.B. neu hinzugefügte Serien vom Server).
  // Initiale Kinder werden übersprungen (knownKeys), nur echte Neueinträge laden.
  const knownKeys = collectKnownKeys(initialData);
  const onAdded = ref.on('child_added', (snap) => {
    const key = snap.key;
    if (!key) return;
    if (knownKeys.has(key)) {
      knownKeys.delete(key);
      return;
    }
    setData((prev) => {
      const updated = mergeChildUpdate<T>(prev, key, snap.val());
      saveToCache(updated);
      return updated;
    });
    setLastUpdated(Date.now());
    if (deltaSubKey) {
      attachSubListener(key);
      attachPropListeners(key);
    }
  });
  cleanups.push(() => ref.off('child_added', onAdded));

  const onRemoved = ref.on('child_removed', (snap) => {
    const key = snap.key;
    if (!key) return;
    setData((prev) => {
      const updated = mergeChildRemoval<T>(prev, key);
      if (updated !== prev) saveToCache(updated as T);
      return updated;
    });
    setLastUpdated(Date.now());
  });
  cleanups.push(() => ref.off('child_removed', onRemoved));

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
}
