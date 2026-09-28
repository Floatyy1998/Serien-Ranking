/**
 * Erscheinungsjahr-Filter für die geteilten QuickFilter-Komponenten. Der Bereich
 * wird wie Genre/Provider als String gehalten („1990-2005", „2010-", „-1999"),
 * damit State und URL (`?year=…`) unverändert Strings bleiben.
 */

export interface YearRange {
  from: number | null;
  to: number | null;
}

const toYear = (value: string | undefined): number | null => {
  if (!value) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n >= 1000 && n <= 9999 ? n : null;
};

export function parseYearRange(value: string | null | undefined): YearRange {
  if (!value) return { from: null, to: null };
  const [fromRaw, toRaw] = value.split('-');
  const from = toYear(fromRaw?.trim());
  const to = toYear(toRaw?.trim());
  if (from !== null && to !== null && from > to) return { from: to, to: from };
  return { from, to };
}

export function formatYearRange(from: number | null, to: number | null): string {
  if (from === null && to === null) return '';
  return `${from ?? ''}-${to ?? ''}`;
}

export function hasYearRange(value: string | null | undefined): boolean {
  const { from, to } = parseYearRange(value);
  return from !== null || to !== null;
}

/** Jahr aus einem Datum/Jahres-String („2019-04-12" → 2019). */
export function releaseYearOf(date: string | number | null | undefined): number | null {
  if (date === null || date === undefined) return null;
  return toYear(String(date).slice(0, 4));
}

/** Titel ohne bekanntes Jahr fallen bei aktivem Filter raus. */
export function matchesYearRange(
  value: string | null | undefined,
  year: number | null | undefined
): boolean {
  const { from, to } = parseYearRange(value);
  if (from === null && to === null) return true;
  if (year === null || year === undefined) return false;
  if (from !== null && year < from) return false;
  if (to !== null && year > to) return false;
  return true;
}

interface DatedEpisode {
  airDate?: string | null;
  air_date?: string | null;
  airstamp?: string | null;
}

/** Frühestes Ausstrahlungsdatum aus Katalog-Staffeln (Serien haben kein eigenes Startdatum). */
export function firstAirDateOfSeasons(
  seasons: Record<string, { episodes?: (DatedEpisode | null)[] | null }> | null | undefined
): string | undefined {
  if (!seasons) return undefined;
  let earliest: string | undefined;
  for (const season of Object.values(seasons)) {
    for (const ep of season?.episodes ?? []) {
      const d = ep?.airDate || ep?.air_date || ep?.airstamp;
      if (d && (!earliest || d < earliest)) earliest = d;
    }
  }
  return earliest?.slice(0, 10);
}

export function isReleaseSort(sortBy: string | null | undefined): boolean {
  return sortBy === 'release-desc' || sortBy === 'release-asc';
}

/** Nach Erscheinungsdatum („YYYY-MM-DD…"); Titel ohne Datum stehen in beiden Richtungen hinten. */
export function compareByRelease(
  a: string | null | undefined,
  b: string | null | undefined,
  sortBy: string
): number {
  const da = a ? String(a).slice(0, 10) : '';
  const db = b ? String(b).slice(0, 10) : '';
  if (!da || !db) return da ? -1 : db ? 1 : 0;
  if (da === db) return 0;
  const asc = da < db ? -1 : 1;
  return sortBy === 'release-asc' ? asc : -asc;
}
