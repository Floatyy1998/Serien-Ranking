/**
 * Feldgenauer Diff zweier Detection-State-Maps als Multi-Path-Update.
 * Statt den ganzen Node per `.set()` zu überschreiben (clobbert konkurrierende
 * Writes anderer Geräte, z.B. frisch gesetzte notified-Flags), werden nur die
 * tatsächlich geänderten Felder geschrieben und entfernte Einträge genullt.
 */
export const diffDetectionState = <T extends object>(
  pathFor: (key: string, field?: string) => string,
  prev: Record<string, T | undefined>,
  next: Record<string, T>
): Record<string, unknown> => {
  const updates: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(next)) {
    const old = prev[key];
    if (!old || typeof old !== 'object') {
      updates[pathFor(key)] = entry;
      continue;
    }
    const fields = new Set([...Object.keys(old), ...Object.keys(entry)]);
    for (const field of fields) {
      const nv = (entry as Record<string, unknown>)[field];
      const ov = (old as Record<string, unknown>)[field];
      if (nv !== ov) {
        updates[pathFor(key, field)] = nv === undefined ? null : nv;
      }
    }
  }
  for (const key of Object.keys(prev)) {
    if (!(key in next)) {
      updates[pathFor(key)] = null;
    }
  }
  return updates;
};
