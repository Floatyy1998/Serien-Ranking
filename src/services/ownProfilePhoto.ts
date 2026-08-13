import { useSyncExternalStore } from 'react';
import { dbRef, paths } from './db/ref';

/**
 * Das eigene Profilbild als eine reaktive Quelle für die ganze App.
 *
 * Vorher holte sich jede Seite die Adresse einmalig per `dbGet` in lokalen
 * State, und `user.photoURL` aus dem Auth-Context behält nach `updateProfile()`
 * seine Objekt-Identität — React rendert deshalb nicht neu. Nach einem Upload
 * blieb das alte Bild also fast überall stehen, bis die Seite neu geladen wurde.
 *
 * Hier hängt genau EIN Listener auf `users/$uid/photoURL`, egal wie viele
 * Komponenten zuschauen. `setOwnPhotoURL` setzt den Wert sofort, damit das neue
 * Bild schon steht, bevor die Datenbank zurückmeldet.
 */

let current: string | null = null;
let subscribedUid: string | null = null;
let detach: (() => void) | null = null;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export const getOwnPhotoURL = (): string | null => current;

/** Sofort sichtbar machen (optimistisch, direkt nach dem Upload). */
export const setOwnPhotoURL = (url: string | null): void => {
  if (current === url) return;
  current = url;
  notify();
};

/**
 * Bindet den Listener an das Konto. Mehrfach aufrufbar; ein Wechsel der uid
 * loest die alte Bindung. `null` beim Abmelden.
 */
export const bindOwnPhotoURL = (uid: string | null | undefined): void => {
  const next = uid || null;
  if (next === subscribedUid) return;

  detach?.();
  detach = null;
  subscribedUid = next;

  if (!next) {
    setOwnPhotoURL(null);
    return;
  }

  try {
    const ref = dbRef(paths.photoURL(next));
    const handler = (snapshot: { val: () => unknown }) => {
      const value = snapshot.val();
      setOwnPhotoURL(typeof value === 'string' && value ? value : null);
    };
    ref.on('value', handler);
    detach = () => ref.off('value', handler);
  } catch {
    /* offline oder Firebase noch nicht bereit — der optimistische Wert traegt */
  }
};

const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/**
 * Das eigene Profilbild. `fallback` ist ueblicherweise `user.photoURL` — das
 * Google-/Apple-Bild, solange in der Datenbank keins liegt.
 */
export const useOwnPhotoURL = (fallback?: string | null): string | null => {
  const value = useSyncExternalStore(subscribe, getOwnPhotoURL, getOwnPhotoURL);
  return value || fallback || null;
};
