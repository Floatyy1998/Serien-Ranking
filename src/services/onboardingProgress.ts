/**
 * Schritt-Marker fuer das Onboarding.
 *
 * Bis hierher war der Trichter blind: gespeichert wurde erst beim Abschluss
 * (Serien, Filme, Abos, Pet, `onboardingComplete`), sodass ein Abbruch nur als
 * "Konto ohne alles" zurueckblieb — ohne zu verraten, an welchem Schritt.
 * Deshalb haelt `users/$uid/onboarding` den zuletzt erreichten Schritt fest.
 *
 * Bewusst KEIN Analytics-Event: die Marke gehoert zum Konto (sie steuert auch,
 * wo ein Wiedereinstieg ansetzen kann) und darf nicht daran haengen, ob jemand
 * den Analytics-Hinweis angenommen hat — der kommt beim frischen Konto ohnehin
 * erst spaeter. Gezaehlt wird spaeter serverseitig, gespeichert werden nur der
 * Schrittname, zwei Zeitstempel und die Anmeldeart.
 */

import { dbRef, serverTimestamp, userPath } from './db/ref';

export type OnboardingStepMark =
  'welcome' | 'series' | 'movies' | 'subscriptions' | 'pet' | 'done' | 'guest-resume' | 'finished';

/** Anmeldeart, auf die drei bekannten Werte reduziert. */
export function signupProvider(providerId?: string | null): string {
  if (!providerId) return 'unbekannt';
  if (providerId.includes('google')) return 'google';
  if (providerId.includes('apple')) return 'apple';
  if (providerId.includes('password')) return 'passwort';
  return providerId;
}

/**
 * Haelt den erreichten Schritt fest. Best-effort wie die uebrigen
 * Fortschritts-Writes: ein Fehler darf das Onboarding nie aufhalten.
 */
export async function markOnboardingStep(
  uid: string,
  step: OnboardingStepMark,
  options: { provider?: string | null; first?: boolean } = {}
): Promise<void> {
  if (!uid) return;
  try {
    const update: Record<string, unknown> = {
      step,
      updatedAt: serverTimestamp(),
    };
    if (options.first) update.startedAt = serverTimestamp();
    if (options.provider) update.via = signupProvider(options.provider);
    if (step === 'finished') update.finishedAt = serverTimestamp();
    await dbRef(userPath(uid, 'onboarding')).update(update);
  } catch {
    /* ignore — der Marker ist Diagnose, kein Teil des Flows */
  }
}
