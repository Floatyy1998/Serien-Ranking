import { logMovieAdded, logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import { backendFetch } from '../api/backendApi';
import { trackMovieAdded, trackSeriesAdded } from '../firebase/analytics';

export type AddToLibraryResult = 'added' | 'exists' | 'failed';

/** Serie oder Film über das Backend in die eigene Bibliothek legen. */
export async function addToLibrary(
  uid: string,
  item: { id: number; type: 'series' | 'movie'; title: string; posterPath?: string | null },
  source: string
): Promise<AddToLibraryResult> {
  const res = await backendFetch(item.type === 'series' ? '/add' : '/addMovie', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: import.meta.env.VITE_USER, id: item.id, uuid: uid }),
  });
  if (!res.ok) {
    const data = typeof res.json === 'function' ? await res.json().catch(() => null) : null;
    const message = typeof data?.error === 'string' ? data.error : '';
    return message.includes('bereits vorhanden') ? 'exists' : 'failed';
  }
  const poster = item.posterPath ?? undefined;
  if (item.type === 'series') {
    trackSeriesAdded(String(item.id), item.title, source);
    await logSeriesAdded(uid, item.title, item.id, poster);
  } else {
    trackMovieAdded(String(item.id), item.title, source);
    await logMovieAdded(uid, item.title, item.id, poster);
  }
  return 'added';
}
