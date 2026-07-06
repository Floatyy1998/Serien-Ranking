/**
 * applyUserUpdate — Write-Helfer für die primären Episode-Mark-Pfade mit
 * persistenter Offline-Queue (siehe `pendingWriteQueue.ts`).
 *
 * Verhalten:
 * - Online (navigator.onLine && zuletzt bekannter `.info/connected`-Status):
 *   direkter `dbUpdate(updates)`. Bestätigt der
 *   Server nicht innerhalb des Timeouts (SDK hängt Offline-Writes sonst
 *   endlos in-memory), gilt der Write als fehlgeschlagen → Queue.
 * - Offline oder Write fehlgeschlagen: Eintrag wird in IndexedDB gequeued
 *   und zusätzlich als lokales SDK-Echo abgesetzt (nicht awaitet), damit die
 *   UI-Listener wie bisher sofort den neuen Zustand sehen. Doppel-Apply nach
 *   Reconnect ist unkritisch, weil die Update-Maps absolute Werte enthalten.
 * - permission-denied wird NICHT gequeued, sondern wirft wie bisher zur
 *   Call-Site (deren Fehler-Dialoge/Toasts greifen).
 *
 * Replay (Selbst-Initialisierung beim ersten Import, keine Änderungen an
 * App.tsx/MobileApp.tsx/authProvider.tsx nötig):
 * - window 'online'-Event
 * - `.info/connected`-Übergang false→true
 * - einmalig nach Auth-Ready (`onAuthStateChanged` mit User)
 * FIFO über `pendingWriteQueue.replayAll` (Concurrency-Guard in der Queue);
 * bei >0 nachgespielten Einträgen: Erfolgs-Toast + hapticSuccess.
 *
 * Bekannter Trade-off: Der Undo-Toast-Handler an den Call-Sites schreibt
 * weiterhin direkt (gewollt). Wer offline markiert UND innerhalb des
 * Undo-Fensters rückgängig macht, dessen Undo kann verloren gehen, weil der
 * gequeute Mark nach Reconnect nachgespielt wird.
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { dbRef, dbUpdate } from '../db/ref';
import { hapticSuccess } from '../haptics';
import { showToast } from '../toast';
import { isPermissionDenied, pendingWriteQueue } from './pendingWriteQueue';
import type { PendingWriteEntry } from './pendingWriteQueue';

/** Nach so vielen ms ohne Server-Ack gilt ein „Online“-Write als gescheitert. */
const WRITE_TIMEOUT_MS = 8000;

/** Wie oft wir auf die (dynamische) Firebase-Initialisierung warten. */
const INIT_RETRY_LIMIT = 60;
const INIT_RETRY_DELAY_MS = 1000;

// Zuletzt bekannter `.info/connected`-Status. null = noch unbekannt →
// optimistisch als online behandeln (der Write-Timeout fängt Irrtümer ab).
let lastConnected: boolean | null = null;

// Offline-Hinweis nur 1× pro Session zeigen (kein Toast-Spam beim Binge).
let offlineToastShown = false;

let initialized = false;

function isProbablyOnline(): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  return lastConnected !== false;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error('timeout: Firebase-Write nicht bestätigt')),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

function notifyQueuedOnce(): void {
  if (offlineToastShown) return;
  offlineToastShown = true;
  showToast('Offline — wird synchronisiert, sobald du online bist', 3500, 'info');
}

function writeEntry(entry: PendingWriteEntry): Promise<void> {
  return withTimeout(dbUpdate(entry.updates), WRITE_TIMEOUT_MS);
}

async function replayPendingWrites(): Promise<void> {
  try {
    // Ohne eingeloggten User würden die Writes nur an den RTDB-Regeln
    // scheitern (permission-denied → Eintrag weg) — also warten.
    if (!firebase.apps.length || !firebase.auth().currentUser) return;
    if (!isProbablyOnline()) return;

    const result = await pendingWriteQueue.replayAll(writeEntry);
    if (result.replayed > 0) {
      showToast(
        result.replayed === 1
          ? '1 Offline-Änderung synchronisiert'
          : `${result.replayed} Offline-Änderungen synchronisiert`
      );
      hapticSuccess();
    }
  } catch (err) {
    console.error('[offline] Replay der Offline-Writes fehlgeschlagen:', err);
  }
}

function attachFirebaseListeners(attempt: number): void {
  // Firebase wird in authProvider dynamisch initialisiert — hier nur warten,
  // statt die Bootstrap-Reihenfolge anzufassen.
  if (!firebase.apps.length) {
    if (attempt < INIT_RETRY_LIMIT) {
      setTimeout(() => attachFirebaseListeners(attempt + 1), INIT_RETRY_DELAY_MS);
    }
    return;
  }
  try {
    dbRef('.info/connected').on('value', (snap) => {
      const connected = snap.val() === true;
      const wasConnected = lastConnected;
      lastConnected = connected;
      if (connected && wasConnected === false) {
        void replayPendingWrites();
      }
    });
    // Feuert einmal beim Start (Auth ready) und nach jedem Login.
    firebase.auth().onAuthStateChanged((user) => {
      if (user) void replayPendingWrites();
    });
  } catch (err) {
    console.warn('[offline] Replay-Listener konnten nicht registriert werden:', err);
  }
}

function ensureSelfInit(): void {
  if (initialized) return;
  initialized = true;
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      void replayPendingWrites();
    });
  }
  attachFirebaseListeners(0);
}

// Selbst-Initialisierung beim ersten Import dieses Moduls.
ensureSelfInit();

/**
 * Wendet eine Multi-Path-Update-Map auf `users/…` an — online direkt, offline
 * (oder bei fehlgeschlagenem Write) über die persistente Queue.
 *
 * @param uid      User, zu dem der Write gehört (für Queue-Diagnose/Cleanup).
 * @param updates  Multi-Path-Update-Map relativ zum DB-Root, inkl.
 *                 serienVersion-Bump (`{'.sv':'timestamp'}` bleibt erhalten
 *                 und wird erst beim Replay vom Server aufgelöst).
 * @param label    Menschlicher Kurzname für Logs/Diagnose.
 * @returns `{queued: true}` wenn der Write in die Offline-Queue ging.
 */
export async function applyUserUpdate(
  uid: string,
  updates: Record<string, unknown>,
  label?: string
): Promise<{ queued: boolean }> {
  if (isProbablyOnline()) {
    try {
      await withTimeout(dbUpdate(updates), WRITE_TIMEOUT_MS);
      return { queued: false };
    } catch (err) {
      // Regel-Verstöße nicht queuen — die würden beim Replay wieder scheitern.
      if (isPermissionDenied(err)) throw err;
      console.warn('[offline] Direkter Write fehlgeschlagen — wird gequeued:', label, err);
      // Der Write liegt bereits im In-Memory-Puffer des SDK (Timeout-Fall) —
      // lokale Listener haben den neuen Zustand also schon gesehen.
      await pendingWriteQueue.enqueue(uid, updates, label);
      notifyQueuedOnce();
      return { queued: true };
    }
  }

  // Offline erkannt: persistent queuen + lokales SDK-Echo für die UI
  // (nicht awaitet — der Promise hängt offline endlos, das Echo aktualisiert
  // aber sofort den lokalen SDK-Cache und damit die Listener/Provider).
  await pendingWriteQueue.enqueue(uid, updates, label);
  try {
    void dbUpdate(updates).catch(() => {});
  } catch {
    // Firebase evtl. (noch) nicht initialisiert — Queue reicht.
  }
  notifyQueuedOnce();
  return { queued: true };
}
