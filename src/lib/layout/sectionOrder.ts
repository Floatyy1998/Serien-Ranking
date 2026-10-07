/**
 * Gespeicherte Reihenfolge mit den aktuellen Standard-IDs abgleichen: Unbekannte
 * IDs fallen raus, neue Standard-IDs landen vor ihrem Nachfolger aus den
 * Defaults statt am Ende — so tauchen neue Sektionen dort auf, wo sie gedacht sind.
 */
export function mergeSectionOrder(saved: unknown, defaults: readonly string[]): string[] {
  const known = new Set(defaults);
  const out: string[] = [];
  if (Array.isArray(saved)) {
    for (const id of saved) {
      if (typeof id === 'string' && known.has(id) && !out.includes(id)) out.push(id);
    }
  }
  for (let i = 0; i < defaults.length; i += 1) {
    const id = defaults[i];
    if (out.includes(id)) continue;
    let insertAt = out.length;
    for (let j = i + 1; j < defaults.length; j += 1) {
      const idx = out.indexOf(defaults[j]);
      if (idx !== -1) {
        insertAt = idx;
        break;
      }
    }
    out.splice(insertAt, 0, id);
  }
  return out;
}

/** Ausgeblendete IDs auf bekannte, eindeutige Einträge beschränken. */
export function sanitizeHiddenIds(saved: unknown, defaults: readonly string[]): string[] {
  if (!Array.isArray(saved)) return [];
  const known = new Set(defaults);
  const out: string[] = [];
  for (const id of saved) {
    if (typeof id === 'string' && known.has(id) && !out.includes(id)) out.push(id);
  }
  return out;
}
