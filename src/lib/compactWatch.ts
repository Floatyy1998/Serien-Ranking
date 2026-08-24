/**
 * Compact Watch Format – Utility-Funktionen
 *
 * Aktuelles Format (ID-basiert, ab April 2026):
 *   seriesWatch/{sid}/seasons/{sn}/eps/{epId}: { w, c, f, l }
 *
 * Vorheriges Format (Index-basiert, wird noch gelesen fuer Abwaertskompat.
 * waehrend Migration):
 *   seriesWatch/{sid}/seasons/{sn}: {
 *     w: [1,1,0,...],    // by index
 *     c: [10,5,0,...],
 *     f: [unix,...],
 *     l: [unix,...]
 *   }
 *
 * Felder pro Episode:
 *   w: watched (0/1)
 *   c: watchCount
 *   f: firstWatchedAt als Unix-Seconds (0/fehlend = nicht gesetzt)
 *   l: lastWatchedAt als Unix-Seconds (0/fehlend = nicht gesetzt)
 *   r: Folgenbewertung des Nutzers 1–10 (fehlend = unbewertet)
 */

// Types

export interface EpisodeWatchEntry {
  w?: number; // 0 or 1
  c?: number;
  f?: number;
  l?: number;
  r?: number; // Folgenbewertung 1-10
  /** Folgennummer innerhalb der Staffel — macht den Eintrag unabhaengig von
   *  der Episoden-ID der Quelle. */
  n?: number;
  /** Absolute Folgennummer ueber die ganze Serie. Ueberlebt zusaetzlich eine
   *  Umgruppierung der Staffeln: TVMaze schneidet "Haus des Geldes" in
   *  15/8/8/10, TMDB in 15/16/10 — dieselben 41 Folgen, andere Staffeln.
   *  Folge 24 ist bei beiden dieselbe, die Staffel-Nummer waere hier
   *  mehrdeutig. */
  a?: number;
}

export interface EpidSeason {
  eps: Record<string, EpisodeWatchEntry>;
}

/** Legacy Kompaktformat (Index-basierte Arrays). Wird nur noch gelesen. */
export interface LegacyArraySeason {
  w: number[];
  c: number[];
  f?: number[];
  l?: number[];
}

export interface EpisodeWatch {
  watched: boolean;
  watchCount: number;
  firstWatchedAt?: string;
  lastWatchedAt?: string;
  /** Eigene Folgenbewertung 1–10 (r-Feld), undefined = unbewertet. */
  userRating?: number;
}

// Format Detection

/** Prueft ob Season-Daten im ID-basierten Format sind (hat `eps` Map). */
export function isEpidSeason(season: unknown): season is EpidSeason {
  return (
    season != null &&
    typeof season === 'object' &&
    'eps' in (season as Record<string, unknown>) &&
    typeof (season as EpidSeason).eps === 'object' &&
    (season as EpidSeason).eps !== null
  );
}

/** Prueft ob Season-Daten im alten Array-Format sind (hat `w` Array). */
export function isLegacyArraySeason(season: unknown): season is LegacyArraySeason {
  return (
    season != null &&
    typeof season === 'object' &&
    'w' in (season as Record<string, unknown>) &&
    Array.isArray((season as LegacyArraySeason).w)
  );
}

// Read Helpers

/** Liest Episode-Watch-Daten aus einer ID-basierten Season. */
/** Wandelt einen Kompakt-Eintrag in die ausgepackte Form. */
function expandEntry(entry: EpisodeWatchEntry | undefined): EpisodeWatch {
  return {
    watched: (entry?.w ?? 0) === 1,
    watchCount: entry?.c ?? 0,
    firstWatchedAt: unixToIso(entry?.f),
    lastWatchedAt: unixToIso(entry?.l),
    ...(typeof entry?.r === 'number' && entry.r > 0 ? { userRating: entry.r } : {}),
  };
}

export function readEpisodeById(
  season: EpidSeason | null | undefined,
  episodeId: number | string
): EpisodeWatch {
  return expandEntry(season?.eps?.[String(episodeId)]);
}

/**
 * Sucht den Eintrag einer Folge ueber ihre NUMMER statt ueber die ID.
 *
 * Selbstheilung fuer den Fall, dass der Katalog fuer eine Serie die Quelle
 * gewechselt hat (TMDB <-> TVMaze) und die gespeicherte Episoden-ID deshalb
 * nicht mehr existiert. Die Nummer steht seit August 2026 in jedem Eintrag,
 * die Zuordnung ist damit eindeutig — der Nutzer sieht seinen Fortschritt
 * sofort, unabhaengig davon, ob der Nachzug im Backend schon gelaufen ist.
 * Der Suchlauf geht nur ueber eine Staffel und nur im Fehlerfall.
 */
/**
 * Sucht den Eintrag einer Folge ueber ihre ABSOLUTE Nummer — ueber alle
 * Staffeln hinweg.
 *
 * Letzte Stufe der Selbstheilung: Hat die Quelle nicht nur die IDs geaendert,
 * sondern die Staffeln anders geschnitten, liegt der Eintrag unter einem
 * anderen Staffel-Key. Die Suche muss deshalb den ganzen Serien-Knoten
 * durchgehen, nicht nur die aktuelle Staffel.
 */
export function readEpisodeByAbsolute(
  seasons: Record<string, unknown> | null | undefined,
  absolut: number | null | undefined
): EpisodeWatch | null {
  if (!seasons || absolut == null) return null;
  for (const season of Object.values(seasons)) {
    if (!season || !isEpidSeason(season)) continue;
    for (const entry of Object.values(season.eps || {})) {
      if (entry && entry.a === absolut) return expandEntry(entry);
    }
  }
  return null;
}

export function readEpisodeByNumber(
  season: EpidSeason | null | undefined,
  episodeNumber: number | null | undefined
): EpisodeWatch | null {
  if (!season?.eps || episodeNumber == null) return null;
  for (const entry of Object.values(season.eps)) {
    if (entry && entry.n === episodeNumber) return expandEntry(entry);
  }
  return null;
}

/** Liest Episode-Watch-Daten aus altem Array-Format. Nur fuer Migration. */
export function readEpisodeFromLegacyArray(
  season: LegacyArraySeason,
  episodeIdx: number
): EpisodeWatch {
  return {
    watched: (season.w?.[episodeIdx] ?? 0) === 1,
    watchCount: season.c?.[episodeIdx] ?? 0,
    firstWatchedAt: unixToIso(season.f?.[episodeIdx]),
    lastWatchedAt: unixToIso(season.l?.[episodeIdx]),
  };
}

// Write Helpers

/**
 * Erzeugt Firebase Multi-Path-Updates fuer einen Episode-Watched-Event.
 * Key ist die Episode-ID (aus Catalog `episode.id`), nicht der Index.
 *
 * @returns Record<string, unknown> mit Pfaden relativ zum DB-Root
 */
export function buildEpisodeWatchedUpdates(
  uid: string,
  seriesId: number | string,
  seasonIndex: number,
  episodeId: number | string,
  newWatchCount: number,
  nowIso: string,
  isFirstWatch: boolean,
  episodeNumber?: number,
  absoluteNumber?: number
): Record<string, unknown> {
  const base = `users/${uid}/seriesWatch/${seriesId}/seasons/${seasonIndex}/eps/${episodeId}`;
  const updates: Record<string, unknown> = {
    [`${base}/w`]: 1,
    [`${base}/c`]: newWatchCount,
    [`${base}/l`]: isoToUnix(nowIso),
    [`users/${uid}/meta/serienVersion`]: { '.sv': 'timestamp' },
  };
  // Die Folgennummer macht den Eintrag unabhaengig von der Episoden-ID der
  // Quelle. Wechselt der Katalog zwischen TMDB und TVMaze, ist die Zuordnung
  // damit eindeutig statt auf den alten Katalog angewiesen.
  if (episodeNumber != null) updates[`${base}/n`] = episodeNumber;
  // Zusaetzlich die absolute Nummer: sie ueberlebt auch eine Umgruppierung
  // der Staffeln, bei der die Staffel-Nummer selbst nicht mehr passt.
  if (absoluteNumber != null) updates[`${base}/a`] = absoluteNumber;
  if (isFirstWatch) {
    updates[`${base}/f`] = isoToUnix(nowIso);
  }
  return updates;
}

/**
 * Erzeugt Firebase Multi-Path-Updates fuer Episode-Unwatch (Revert).
 */
export function buildEpisodeUnwatchUpdates(
  uid: string,
  seriesId: number | string,
  seasonIndex: number,
  episodeId: number | string,
  previousWatched: boolean,
  previousCount: number,
  previousFirstWatchedAt: string | null,
  previousLastWatchedAt: string | null
): Record<string, unknown> {
  const base = `users/${uid}/seriesWatch/${seriesId}/seasons/${seasonIndex}/eps/${episodeId}`;
  // Wenn komplett zurueckgesetzt wird (not watched, count 0), den gesamten
  // eps-Eintrag loeschen statt Nullen zu schreiben.
  if (!previousWatched && previousCount === 0) {
    return {
      [base]: null,
      [`users/${uid}/meta/serienVersion`]: { '.sv': 'timestamp' },
    };
  }
  return {
    [`${base}/w`]: previousWatched ? 1 : 0,
    [`${base}/c`]: previousCount,
    [`${base}/f`]: previousFirstWatchedAt ? isoToUnix(previousFirstWatchedAt) : 0,
    [`${base}/l`]: previousLastWatchedAt ? isoToUnix(previousLastWatchedAt) : 0,
    [`users/${uid}/meta/serienVersion`]: { '.sv': 'timestamp' },
  };
}

// Conversion Helpers

export function isoToUnix(iso: string | undefined | null): number {
  if (!iso) return 0;
  const ts = Math.floor(new Date(iso).getTime() / 1000);
  return isNaN(ts) ? 0 : ts;
}

export function unixToIso(unix: number | undefined | null): string | undefined {
  if (!unix || unix === 0) return undefined;
  return new Date(unix * 1000).toISOString();
}
