import { logReadingActivity } from '../../features/badges/minimalActivityLogger';
import type { Manga } from '../../types/Manga';
import { dbUpdate, paths } from '../db/ref';

const CHUNK = 150;

async function writeFields(
  uid: string,
  changes: { id: number; fields: Record<string, unknown> }[]
): Promise<void> {
  for (let i = 0; i < changes.length; i += CHUNK) {
    const updates: Record<string, unknown> = {};
    for (const { id, fields } of changes.slice(i, i + CHUNK)) {
      for (const [field, value] of Object.entries(fields)) {
        updates[`${paths.mangaItem(uid, id)}/${field}`] = value;
      }
    }
    if (Object.keys(updates).length) await dbUpdate(updates);
  }
}

/**
 * Lesestatus vieler Manga setzen — dieselben Felder wie die Detailseite. `earlier`: früher beendet,
 * ohne Datum und ohne Aktivität.
 */
export async function setMangaStatus(
  uid: string,
  list: Manga[],
  status: Manga['readStatus'],
  earlier = false
): Promise<void> {
  const now = new Date().toISOString();
  const changed = list.filter(
    (m) => m.readStatus !== status || (status === 'completed' && earlier)
  );
  await writeFields(
    uid,
    changed.map((manga) => {
      const fields: Record<string, unknown> = { readStatus: status };
      if (status === 'reading' && !manga.startedAt) fields.startedAt = now;
      if (status === 'completed') fields.completedAt = earlier ? null : now;
      return { id: manga.anilistId, fields };
    })
  );
  if (status !== 'completed' || earlier) return;
  for (const manga of changed) {
    if (manga.readStatus === 'completed') continue;
    void logReadingActivity(uid, {
      type: 'manga_finished',
      itemId: manga.anilistId,
      itemTitle: manga.title,
      poster: manga.poster,
    });
  }
}

/** „Im Besitz" für viele Manga setzen oder entfernen. */
export async function setMangaOwned(uid: string, list: Manga[], owned: boolean): Promise<void> {
  const value = owned ? new Date().toISOString() : null;
  await writeFields(
    uid,
    list.map((m) => ({ id: m.anilistId, fields: { ownedAt: value } }))
  );
}

/** Viele Manga aus- oder wieder einblenden. */
export async function setMangaHidden(uid: string, list: Manga[], hidden: boolean): Promise<void> {
  await writeFields(
    uid,
    list.map((m) => ({ id: m.anilistId, fields: { hidden: hidden ? true : null } }))
  );
}
