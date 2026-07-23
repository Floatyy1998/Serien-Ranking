/**
 * Film-Verfügbarkeits-Erkennung: meldet, wenn ein noch ungesehener Film aus
 * der Liste NEU auf einem aktiv abonnierten Provider verfügbar wird.
 *
 * State: users/$uid/movieProviderData/{movieId} = { known: string[], subSince?: number }
 * — `known` sind die zuletzt gesehenen (kanonischen) Provider-Namen,
 * `subSince` ist der Zeitpunkt, seit dem der Film auf einem aktiven Abo läuft.
 * Erster Lauf pro Film ist Baseline (keine Meldung), danach melden nur echte
 * Übergänge „vorher nicht auf meinem Abo → jetzt schon".
 */

import { dbGet, dbRef, userPath } from '../db/ref';
import { mergeProviderNames } from '../../lib/providerMerge';
import { isMovieWatched } from '../../lib/rating/rating';
import { isEnglish } from '../i18n';
import type { Movie } from '../../types/Movie';

interface MovieProviderState {
  known?: string[];
  subSince?: number;
}

export interface AvailableMovie {
  movie: Movie;
  /** Aktive Abo-Provider, auf denen der Film läuft (kanonische Namen). */
  providers: string[];
  /** Seit wann der Film auf einem aktiven Abo verfügbar ist (ms). */
  subSince: number;
}

const THROTTLE_MS = 6 * 60 * 60 * 1000;

function throttleKey(uid: string): string {
  return `movieAvailCheck_${uid}`;
}

function isThrottled(uid: string): boolean {
  try {
    const last = Number(localStorage.getItem(throttleKey(uid)) || 0);
    return Date.now() - last < THROTTLE_MS;
  } catch {
    return false;
  }
}

function markRun(uid: string): void {
  try {
    localStorage.setItem(throttleKey(uid), String(Date.now()));
  } catch {
    /* quota — Drossel ist optional */
  }
}

function movieProviderNames(movie: Movie): string[] {
  return mergeProviderNames({ catalog: movie.provider?.provider });
}

function isUnwatched(movie: Movie): boolean {
  // isMovieWatched: „gesehen" = watched-Flag ODER Bewertung (genre-keyed).
  return !isMovieWatched(movie);
}

/**
 * Läuft über alle ungesehenen Filme, aktualisiert den Provider-State und gibt
 * (a) frisch verfügbar gewordene und (b) alle aktuell auf Abos verfügbaren
 * Filme zurück. Schreibt für frische Übergänge eine In-App-Notification.
 */
export async function detectMovieAvailability(
  userId: string,
  movies: Movie[],
  activeProviders: Set<string>,
  options?: { force?: boolean }
): Promise<{ newlyAvailable: AvailableMovie[]; availableNow: AvailableMovie[] }> {
  const empty = { newlyAvailable: [], availableNow: [] };
  if (!userId || movies.length === 0 || activeProviders.size === 0) return empty;

  const state =
    (await dbGet<Record<string, MovieProviderState>>(userPath(userId, 'movieProviderData')).catch(
      () => null
    )) || {};

  const throttled = !options?.force && isThrottled(userId);
  const now = Date.now();
  const updates: Record<string, unknown> = {};
  const newlyAvailable: AvailableMovie[] = [];
  const availableNow: AvailableMovie[] = [];

  for (const movie of movies) {
    if (!isUnwatched(movie)) continue;
    const names = movieProviderNames(movie);
    const subNames = names.filter((n) => activeProviders.has(n));
    const entry = state[String(movie.id)];

    if (subNames.length > 0) {
      const since = entry?.subSince ?? now;
      availableNow.push({ movie, providers: subNames, subSince: since });
    }

    // Gedrosselt: nur den aktuellen Stand fürs Rendern liefern, kein State-Diff.
    if (throttled) continue;

    if (!entry || !Array.isArray(entry.known)) {
      // Baseline: erster Kontakt mit diesem Film — keine Meldung.
      updates[`${String(movie.id)}/known`] = names;
      updates[`${String(movie.id)}/subSince`] = subNames.length > 0 ? now : null;
      continue;
    }

    const known = new Set(entry.known);
    const fresh = subNames.filter((n) => !known.has(n));
    const knownChanged = names.length !== entry.known.length || names.some((n) => !known.has(n));

    if (fresh.length > 0 && entry.subSince === undefined) {
      newlyAvailable.push({ movie, providers: fresh, subSince: now });
      updates[`${String(movie.id)}/subSince`] = now;
      // Frisch erkannter Eintrag soll in dieser Session schon oben stehen.
      const hit = availableNow.find((a) => a.movie.id === movie.id);
      if (hit) hit.subSince = now;
    } else if (subNames.length === 0 && entry.subSince !== undefined) {
      // Vom Abo verschwunden → Merker zurücksetzen (erneutes Auftauchen meldet wieder).
      updates[`${String(movie.id)}/subSince`] = null;
    }
    if (knownChanged) updates[`${String(movie.id)}/known`] = names;
  }

  if (!throttled) {
    markRun(userId);
    if (Object.keys(updates).length > 0) {
      await dbRef(userPath(userId, 'movieProviderData'))
        .update(updates)
        .catch(() => {});
    }
    if (newlyAvailable.length > 0) {
      await writeAvailabilityNotification(userId, newlyAvailable).catch(() => {});
    }
  }

  availableNow.sort((a, b) => b.subSince - a.subSince);
  return { newlyAvailable, availableNow };
}

async function writeAvailabilityNotification(
  userId: string,
  newly: AvailableMovie[]
): Promise<void> {
  const en = isEnglish();
  const ref = dbRef(userPath(userId, 'notifications'));

  if (newly.length === 1) {
    const { movie, providers } = newly[0];
    await ref.push({
      type: 'movie_available',
      title: en ? 'Now streaming for you' : 'Jetzt für dich streambar',
      message: en
        ? `"${movie.title}" from your list is now available on ${providers.join(', ')}.`
        : `„${movie.title}" von deiner Liste ist jetzt bei ${providers.join(', ')} verfügbar.`,
      timestamp: Date.now(),
      read: false,
      data: { movieId: movie.id, itemType: 'movie', itemId: movie.id },
    });
    return;
  }

  const titles = newly.map((n) => `„${n.movie.title}"`).slice(0, 4);
  const rest = newly.length - titles.length;
  const list = titles.join(', ') + (rest > 0 ? ` +${rest}` : '');
  await ref.push({
    type: 'movie_available',
    title: en
      ? `${newly.length} movies from your list are now streamable`
      : `${newly.length} Filme aus deiner Liste jetzt streambar`,
    message: en
      ? `Now available on your subscriptions: ${list}`
      : `Jetzt auf deinen Abos verfügbar: ${list}`,
    timestamp: Date.now(),
    read: false,
  });
}
