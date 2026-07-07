/**
 * Persistente Offline-Write-Queue für Episode-Marks.
 *
 * Hintergrund: Reads sind offline-first (IndexedDB), aber das Firebase-Web-SDK
 * hält ausstehende Writes nur IN-MEMORY — ein Reload im Offline-Zustand
 * (Zug/Flug-Binge) verliert alle Marks. Diese Queue persistiert die
 * Multi-Path-Update-Maps in IndexedDB und spielt sie FIFO nach, sobald die
 * Verbindung zurück ist (siehe `queuedUpdate.ts` für Trigger + Firebase-Writer).
 *
 * Bewusste Trade-offs:
 * - watchCount-Werte in den Update-Maps sind ABSOLUT berechnet (zum Zeitpunkt
 *   des Marks). Ändert ein anderes Gerät denselben Zähler, während Einträge
 *   hier warten, gewinnt beim Replay der Queue-Wert (Last-Write-Wins).
 * - `{'.sv':'timestamp'}`-Werte (serienVersion-Bump) bleiben unangetastet im
 *   Update-Map gespeichert und werden erst beim Replay vom RTDB-Server
 *   aufgelöst — der Bump trägt also den Sync-Zeitpunkt, genau richtig.
 * - permission-denied beim Replay verwirft den Eintrag (z. B. Queue-Reste
 *   eines anderen Accounts nach Logout/Login) statt endlos zu retryen.
 *
 * Der IndexedDB-Zugriff ist hinter `PendingWriteStorage` abstrahiert, damit
 * die Queue-Mechanik ohne fake-indexeddb testbar ist (In-Memory-Storage im
 * Test, `pendingWritesIDB.ts` in Produktion).
 */

import { idbPendingWriteStorage } from './pendingWritesIDB';

export interface PendingWriteEntry {
  id: string;
  uid: string;
  /** Multi-Path-Update-Map relativ zum DB-Root (inkl. serienVersion-Bump). */
  updates: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  label?: string;
}

export interface PendingWriteStorage {
  getAll(): Promise<PendingWriteEntry[]>;
  put(entry: PendingWriteEntry): Promise<void>;
  remove(id: string): Promise<void>;
}

/** Harte Obergrenze — beim Überschreiten fliegt der älteste Eintrag. */
export const MAX_QUEUE_SIZE = 200;

/** Nach so vielen fehlgeschlagenen Replay-Versuchen wird ein Eintrag verworfen. */
export const MAX_ATTEMPTS = 10;

export type PendingWriteWriter = (entry: PendingWriteEntry) => Promise<void>;

export interface ReplayResult {
  /** Erfolgreich nachgespielte (und gelöschte) Einträge. */
  replayed: number;
  /** Verworfene Einträge (permission-denied oder MAX_ATTEMPTS erreicht). */
  dropped: number;
  /** Nach der Runde noch wartende Einträge. */
  remaining: number;
  /** false = Runde wegen Netzwerkfehler abgebrochen oder Replay lief bereits. */
  ranToCompletion: boolean;
}

export interface PendingWriteQueue {
  enqueue(
    uid: string,
    updates: Record<string, unknown>,
    label?: string
  ): Promise<PendingWriteEntry>;
  /** Spielt alle Einträge FIFO nach. Nur ein Replay gleichzeitig (Guard). */
  replayAll(write: PendingWriteWriter): Promise<ReplayResult>;
  size(): Promise<number>;
  /** Feuert nach jeder Änderung mit der aktuellen Queue-Größe. */
  onChange(listener: (size: number) => void): () => void;
}

/** Erkennt Firebase-RTDB permission-denied-Fehler (compat: code/message). */
export function isPermissionDenied(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const code = (err as { code?: unknown }).code;
  if (typeof code === 'string' && code.toUpperCase().includes('PERMISSION_DENIED')) return true;
  const message = (err as { message?: unknown }).message;
  return typeof message === 'string' && message.toLowerCase().includes('permission_denied');
}

function sortFifo(entries: PendingWriteEntry[]): PendingWriteEntry[] {
  return [...entries].sort((a, b) => a.createdAt - b.createdAt || (a.id < b.id ? -1 : 1));
}

export function createPendingWriteQueue(storage: PendingWriteStorage): PendingWriteQueue {
  const listeners = new Set<(size: number) => void>();
  // Basis-36 mit Padding, damit die ID-Sortierung innerhalb derselben
  // Millisekunde die Enqueue-Reihenfolge erhält (FIFO-Tiebreaker).
  let seq = 0;
  const nextId = (createdAt: number): string =>
    `${createdAt.toString(36)}-${(seq++).toString(36).padStart(4, '0')}`;

  let replaying = false;

  async function currentSize(): Promise<number> {
    return (await storage.getAll()).length;
  }

  async function emitChange(): Promise<void> {
    if (listeners.size === 0) return;
    const size = await currentSize();
    for (const listener of [...listeners]) {
      try {
        listener(size);
      } catch {
        // Listener-Fehler dürfen die Queue nie beeinträchtigen.
      }
    }
  }

  return {
    async enqueue(uid, updates, label) {
      const createdAt = Date.now();
      const entry: PendingWriteEntry = {
        id: nextId(createdAt),
        uid,
        updates,
        createdAt,
        attempts: 0,
        ...(label ? { label } : {}),
      };
      await storage.put(entry);

      // Cap: ältesten Eintrag verwerfen, bis das Limit wieder eingehalten ist.
      const all = sortFifo(await storage.getAll());
      let overflow = all.length - MAX_QUEUE_SIZE;
      let idx = 0;
      while (overflow > 0) {
        const oldest = all[idx++];
        await storage.remove(oldest.id);
        console.warn(
          `[pendingWriteQueue] Queue voll (${MAX_QUEUE_SIZE}) — ältester Eintrag verworfen:`,
          oldest.label ?? oldest.id
        );
        overflow--;
      }

      await emitChange();
      return entry;
    },

    async replayAll(write) {
      if (replaying) {
        return { replayed: 0, dropped: 0, remaining: await currentSize(), ranToCompletion: false };
      }
      replaying = true;
      try {
        const entries = sortFifo(await storage.getAll());
        let replayed = 0;
        let dropped = 0;
        let aborted = false;

        for (const entry of entries) {
          try {
            await write(entry);
            await storage.remove(entry.id);
            replayed++;
          } catch (err) {
            if (isPermissionDenied(err)) {
              // Endgültig — Eintrag verwerfen, mit den restlichen weitermachen.
              console.error(
                '[pendingWriteQueue] permission-denied beim Replay — Eintrag verworfen:',
                entry.label ?? entry.id,
                err
              );
              await storage.remove(entry.id);
              dropped++;
              continue;
            }
            // Netzwerk-/sonstiger Fehler: Versuch zählen, Runde abbrechen
            // (die restlichen Einträge scheitern dann sehr wahrscheinlich auch).
            const attempts = entry.attempts + 1;
            if (attempts >= MAX_ATTEMPTS) {
              console.error(
                `[pendingWriteQueue] Eintrag nach ${MAX_ATTEMPTS} Versuchen verworfen:`,
                entry.label ?? entry.id,
                err
              );
              await storage.remove(entry.id);
              dropped++;
            } else {
              await storage.put({ ...entry, attempts });
            }
            aborted = true;
            break;
          }
        }

        if (replayed > 0 || dropped > 0) {
          await emitChange();
        }
        return {
          replayed,
          dropped,
          remaining: await currentSize(),
          ranToCompletion: !aborted,
        };
      } finally {
        replaying = false;
      }
    },

    size() {
      return currentSize();
    },

    onChange(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

/** App-weite Queue-Instanz (IndexedDB-backed; no-op wenn IDB fehlt). */
export const pendingWriteQueue: PendingWriteQueue = createPendingWriteQueue(idbPendingWriteStorage);
