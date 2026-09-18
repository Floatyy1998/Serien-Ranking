import { autoUnhideUpdates } from '../../lib/series/autoUnhide';
import { showToast } from '../../lib/interaction/toast';
import { bumpSeriesVersion, dbRef, paths, updateWithSeriesVersion } from '../db/ref';
import { t } from '../i18n';

/** Schreibt/entfernt das `hidden`-Flag einer Serie und bumpt die Serien-Version. */
export async function setSeriesHidden(
  userId: string,
  seriesId: number | string,
  hidden: boolean
): Promise<void> {
  const ref = dbRef(`${paths.seriesItem(userId, seriesId)}/hidden`);
  if (hidden) {
    await ref.set(true);
  } else {
    await ref.remove();
  }
  bumpSeriesVersion(userId);
}

// Mehrere Folgen hintereinander abhaken feuert den Fanout mehrfach, bevor der
// RTDB-Listener das geloeschte hidden-Flag zurueckspielt. Ohne dieses Fenster
// schriebe jede Folge erneut und der Toast poppte mehrfach.
const RECENTLY_UNHIDDEN_MS = 30_000;
const recentlyUnhidden = new Map<number, number>();

/**
 * Blendet eine ausgeblendete Serie wieder ein, sobald der User eine Folge davon
 * schaut — sie taucht dadurch wieder in Watchlist und Kalender auf.
 *
 * Bewusst best-effort (abweichend vom sonstigen Fanout-Verhalten): dass das
 * Wiedereinblenden scheitert, darf weder Pet-XP noch Badges verschlucken und
 * schon gar nicht den Undo-Toast der bereits geschriebenen Folge ausloesen.
 */
export async function unhideSeriesOnWatch(
  userId: string,
  seriesId: number,
  seriesTitle?: string
): Promise<void> {
  const last = recentlyUnhidden.get(seriesId);
  const now = Date.now();
  if (last !== undefined && now - last < RECENTLY_UNHIDDEN_MS) return;
  recentlyUnhidden.set(seriesId, now);

  try {
    await updateWithSeriesVersion(
      userId,
      autoUnhideUpdates(userId, { id: seriesId, hidden: true })
    );
    showToast(
      seriesTitle
        ? t('„{title}" wird wieder angezeigt', { title: seriesTitle })
        : t('Serie wird wieder angezeigt'),
      2500,
      'info'
    );
  } catch (error) {
    recentlyUnhidden.delete(seriesId);
    console.error('[hiddenSeries] Wiedereinblenden fehlgeschlagen:', error);
  }
}
