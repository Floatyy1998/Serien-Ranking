/**
 * Mehrfach-Auswahl-Filter (ODER-Verknüpfung) für die geteilten QuickFilter-
 * Komponenten (Ratings, Public/Friend Profile, Manga-Ratings).
 *
 * Datenmodell bewusst als kommagetrennter String, damit State + URL
 * (`?genre=Action,Comedy`) unverändert Strings bleiben — nur die Semantik
 * wird „mehrere". Leerer String bzw. der „Alle"-Sentinel = kein Filter.
 */

/** „Action,Comedy" → ["Action","Comedy"] (leere/Sentinel-Werte raus). */
export function parseCsv(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0 && v !== 'Alle' && v !== 'All');
}

/** Wert im CSV umschalten (hinzufügen/entfernen). */
export function toggleCsv(csv: string | null | undefined, value: string): string {
  const list = parseCsv(csv);
  const idx = list.indexOf(value);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(value);
  return list.join(',');
}

/** Ist der Wert aktuell ausgewählt? */
export function csvIncludes(csv: string | null | undefined, value: string): boolean {
  return parseCsv(csv).includes(value);
}

/**
 * ODER-Match: leere Auswahl → alles durchlassen, sonst muss mindestens EINER
 * der Item-Werte in der Auswahl liegen. Vergleich case-insensitiv.
 */
export function matchesAnyCsv(
  csv: string | null | undefined,
  itemValues: (string | null | undefined)[]
): boolean {
  const selected = parseCsv(csv);
  if (selected.length === 0) return true;
  const selectedLower = new Set(selected.map((s) => s.toLowerCase()));
  return itemValues.some((v) => typeof v === 'string' && selectedLower.has(v.toLowerCase()));
}
