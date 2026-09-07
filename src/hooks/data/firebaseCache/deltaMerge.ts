/**
 * Reine Merge-Funktionen für den Delta-Sync (child_added/changed/removed).
 *
 * Contract: Jede Funktion gibt EXAKT `prev` (gleiche Referenz) zurück, wenn
 * das Event nicht anwendbar ist (z.B. Child existiert nicht mehr im State).
 * Der Listener nutzt diese Referenz-Gleichheit, um zu entscheiden, ob der
 * Cache aktualisiert werden muss (`updated !== prev` → saveToCache).
 * Ansonsten wird immer ein neues Objekt erzeugt (immutable update).
 */

/**
 * Sub-Child-Update (deep delta, z.B. eine geänderte Season unter
 * {child}/{subKeyName}). Arrays werden index-basiert aktualisiert
 * (Firebase liefert numerische Keys), Objekte key-basiert.
 */
export function mergeSubChildUpdate<T>(
  prev: T | null,
  childKey: string,
  subKeyName: string,
  subChildKey: string,
  value: unknown
): T | null {
  const prevRecord = prev as Record<string, Record<string, unknown>>;
  const child = prevRecord[childKey];
  if (!child) return prev;
  const subCollection = child[subKeyName];
  let updatedSub: unknown;
  if (Array.isArray(subCollection)) {
    updatedSub = [...subCollection];
    (updatedSub as unknown[])[Number(subChildKey)] = value;
  } else {
    updatedSub = {
      ...(subCollection as Record<string, unknown>),
      [subChildKey]: value,
    };
  }
  return {
    ...prevRecord,
    [childKey]: { ...child, [subKeyName]: updatedSub },
  } as T;
}

/**
 * Sub-Child-Removal (z.B. Season-Knoten gelöscht, weil die letzte Episode
 * einer Staffel unmarkiert wurde → Firebase löscht leere Knoten).
 * Array-Einträge werden per `delete` entfernt (sparse hole, Länge bleibt).
 */
export function mergeSubChildRemoval<T>(
  prev: T | null,
  childKey: string,
  subKeyName: string,
  subChildKey: string
): T | null {
  const prevRecord = prev as Record<string, Record<string, unknown>>;
  const child = prevRecord[childKey];
  if (!child) return prev;
  const subCollection = child[subKeyName];
  if (!subCollection || typeof subCollection !== 'object') return prev;
  const copy = Array.isArray(subCollection)
    ? [...subCollection]
    : { ...(subCollection as Record<string, unknown>) };
  if (Array.isArray(copy)) {
    delete (copy as unknown[])[Number(subChildKey)];
  } else {
    delete (copy as Record<string, unknown>)[subChildKey];
  }
  return {
    ...prevRecord,
    [childKey]: { ...child, [subKeyName]: copy },
  } as T;
}

/**
 * Metadaten-Property eines Childs setzen/aktualisieren
 * (rating, hidden, watchlist etc.).
 */
export function mergePropUpdate<T>(
  prev: T | null,
  targetKey: string,
  propKey: string,
  value: unknown
): T | null {
  const prevRecord = prev as Record<string, Record<string, unknown>>;
  const child = prevRecord[targetKey];
  if (!child) return prev;
  return {
    ...prevRecord,
    [targetKey]: { ...child, [propKey]: value },
  } as T;
}

/** Metadaten-Property eines Childs entfernen. */
export function mergePropRemoval<T>(prev: T | null, targetKey: string, propKey: string): T | null {
  const prevRecord = prev as Record<string, Record<string, unknown>>;
  const child = prevRecord[targetKey];
  if (!child) return prev;
  const copy = { ...child };
  delete copy[propKey];
  return { ...prevRecord, [targetKey]: copy } as T;
}

/**
 * Top-Level-Child setzen/ersetzen (child_changed ohne deltaSubKey bzw.
 * child_added). Erzeugt IMMER ein neues Objekt — auch aus prev=null wird
 * `{ [key]: value }`.
 */
export function mergeChildUpdate<T>(prev: T | null, key: string, value: unknown): T {
  return {
    ...(prev as Record<string, unknown>),
    [key]: value,
  } as T;
}

/** Top-Level-Child entfernen. Kein Objekt-State → unverändert zurückgeben. */
export function mergeChildRemoval<T>(prev: T | null, key: string): T | null {
  if (!prev || typeof prev !== 'object') return prev;
  const copy = { ...(prev as Record<string, unknown>) };
  delete copy[key];
  return copy as T;
}

/**
 * Bekannte Top-Level-Keys der Initialdaten. Firebase feuert child_added für
 * ALLE existierenden Kinder beim Listener-Setup — diese werden über das Set
 * einmalig übersprungen, nur echte Neueinträge werden angewendet.
 */
export function collectKnownKeys(data: unknown): Set<string> {
  return new Set<string>(data && typeof data === 'object' ? Object.keys(data) : []);
}

/** Bekannte Sub-Keys ({childKey}/{subKeyName}) — gleiche Skip-Logik wie collectKnownKeys. */
export function collectKnownSubKeys(
  initialData: unknown,
  childKey: string,
  subKeyName: string
): Set<string> {
  const initChild = (initialData as Record<string, Record<string, unknown>>)[childKey];
  const initSub = initChild?.[subKeyName];
  return new Set<string>(initSub && typeof initSub === 'object' ? Object.keys(initSub) : []);
}

/** Bekannte Property-Keys eines Childs — Skip-Logik für die Prop-Listener. */
export function collectChildPropKeys(initialData: unknown, targetKey: string): Set<string> {
  const initChild = (initialData as Record<string, Record<string, unknown>>)[targetKey];
  return new Set<string>(initChild ? Object.keys(initChild) : []);
}
