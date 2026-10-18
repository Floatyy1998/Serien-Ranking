/**
 * Genutzte Lesebereiche (`users/$uid/readingAreas`): Bücher und Manga, nur Bücher
 * oder nur Manga. Fehlt der Wert, gilt beides.
 */
import { parseReadingAreas, type ReadingAreas } from '../../lib/reading/readingMedium';
import { dbRef, userPath } from '../db/ref';
import { subscribeValue } from '../db/subscribeValue';

const STORAGE_PREFIX = 'readingAreas:';

/** Letzter bekannter Wert, damit die Lesen-Seite beim Start nicht umspringt. */
export function readReadingAreasCached(uid: string): ReadingAreas | null {
  try {
    return parseReadingAreas(localStorage.getItem(STORAGE_PREFIX + uid));
  } catch {
    return null;
  }
}

function cacheReadingAreas(uid: string, areas: ReadingAreas | null): void {
  try {
    if (areas) localStorage.setItem(STORAGE_PREFIX + uid, areas);
    else localStorage.removeItem(STORAGE_PREFIX + uid);
  } catch {
    // Quota — der Live-Wert kommt ohnehin aus der RTDB
  }
}

export function subscribeReadingAreas(
  uid: string,
  onChange: (areas: ReadingAreas | null) => void
): () => void {
  return subscribeValue(
    dbRef(userPath(uid, 'readingAreas')),
    (snap) => {
      const areas = parseReadingAreas(snap.val());
      cacheReadingAreas(uid, areas);
      onChange(areas);
    },
    { label: 'readingAreas' }
  );
}

export async function setReadingAreas(uid: string, areas: ReadingAreas): Promise<void> {
  cacheReadingAreas(uid, areas);
  await dbRef(userPath(uid, 'readingAreas')).set(areas);
}
