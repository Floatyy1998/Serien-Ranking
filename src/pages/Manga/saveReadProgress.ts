import { logReadingActivity } from '../../features/badges/minimalActivityLogger';
import { mangaUnit } from '../../lib/manga/progress';
import { dbRef, paths } from '../../services/db/ref';
import { logChapterRead, logVolumeRead } from '../../services/discussion/readActivityService';
import type { Manga } from '../../types/Manga';
import { shouldAutoComplete } from './mangaUtils';

interface ReadStep {
  next: number;
  /** Stand vor dem Schritt — lokal geführt, Firebase hinkt bei schnellen Klicks hinterher. */
  previous: number;
  /** Bekannte Gesamtzahl inkl. Live-Daten; null = unbekannt. */
  total: number | null;
}

/**
 * Lesestand in der Zählweise des Manga speichern (Kapitel oder Bände): „Geplant" wird
 * „Lese ich", das Ende einer abgeschlossenen Reihe schließt ab, Fortschritt landet im Verlauf.
 */
export async function saveReadProgress(
  uid: string,
  manga: Manga,
  { next, previous, total }: ReadStep
): Promise<void> {
  const unit = mangaUnit(manga);
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    [unit === 'volume' ? 'currentVolume' : 'currentChapter']: next,
    lastReadAt: now,
  };
  if (manga.readStatus === 'planned' && next > 0) {
    updates.readStatus = 'reading';
    if (!manga.startedAt) updates.startedAt = now;
  }
  if (manga.readStatus !== 'completed' && shouldAutoComplete(manga, total, previous, next)) {
    updates.readStatus = 'completed';
    updates.completedAt = now;
  }

  await dbRef(paths.mangaItem(uid, manga.anilistId)).update(updates);
  if (updates.readStatus === 'completed') {
    void logReadingActivity(uid, {
      type: 'manga_finished',
      itemId: manga.anilistId,
      itemTitle: manga.title,
      poster: manga.poster,
    });
  }
  if (next > previous) {
    const log = unit === 'volume' ? logVolumeRead : logChapterRead;
    await log(uid, manga, next, previous);
  }
}
