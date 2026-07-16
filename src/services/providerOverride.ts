/**
 * Manuelle Serie→Anbieter-Zuordnung (users/$uid/subscriptions/seriesOverrides).
 * Der Override gewinnt überall gegen die automatischen TMDB-Provider
 * (Home-Karten, Kalender, Abo-Matching — siehe useActiveSubscriptions).
 */
import { invalidateActiveSubscriptions } from '../hooks/useActiveSubscriptions';
import { dbGet, dbRef, userPath } from './db/ref';

export async function getSeriesProviderOverride(
  uid: string,
  seriesId: number | string
): Promise<string | null> {
  try {
    return (
      (await dbGet<string>(userPath(uid, 'subscriptions', 'seriesOverrides', String(seriesId)))) ??
      null
    );
  } catch {
    return null;
  }
}

export async function setSeriesProviderOverride(
  uid: string,
  seriesId: number | string,
  providerName: string | null
): Promise<void> {
  const ref = dbRef(userPath(uid, 'subscriptions', 'seriesOverrides', String(seriesId)));
  if (providerName) {
    await ref.set(providerName);
  } else {
    await ref.remove();
  }
  invalidateActiveSubscriptions(uid);
}
