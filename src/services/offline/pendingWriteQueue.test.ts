/**
 * Tests für die Queue-Mechanik der persistenten Offline-Write-Queue.
 *
 * Bewusst OHNE fake-indexeddb: der IDB-Zugriff ist hinter dem
 * `PendingWriteStorage`-Interface abstrahiert; hier läuft eine
 * In-Memory-Implementierung (node-Umgebung, kein jsdom nötig).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createPendingWriteQueue,
  isPermissionDenied,
  MAX_ATTEMPTS,
  MAX_QUEUE_SIZE,
} from './pendingWriteQueue';
import type { PendingWriteEntry, PendingWriteStorage } from './pendingWriteQueue';

interface MemoryStorage extends PendingWriteStorage {
  entries: Map<string, PendingWriteEntry>;
}

function createMemoryStorage(): MemoryStorage {
  const entries = new Map<string, PendingWriteEntry>();
  return {
    entries,
    async getAll() {
      return [...entries.values()].map((e) => ({ ...e }));
    },
    async put(entry) {
      entries.set(entry.id, { ...entry });
    },
    async remove(id) {
      entries.delete(id);
    },
  };
}

function permissionDeniedError(): Error & { code: string } {
  const err = new Error('PERMISSION_DENIED: Permission denied') as Error & { code: string };
  err.code = 'PERMISSION_DENIED';
  return err;
}

const UID = 'user-1';
const UPDATES = {
  'users/user-1/seriesWatch/42/seasons/0/eps/1001/w': 1,
  'users/user-1/seriesWatch/42/seasons/0/eps/1001/c': 1,
  'users/user-1/meta/serienVersion': { '.sv': 'timestamp' },
};

describe('pendingWriteQueue', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('enqueue persistiert Eintrag mit uid, updates, label und attempts=0', async () => {
    const storage = createMemoryStorage();
    const queue = createPendingWriteQueue(storage);

    const entry = await queue.enqueue(UID, UPDATES, 'Serie S1E1');

    expect(entry.uid).toBe(UID);
    expect(entry.updates).toEqual(UPDATES);
    expect(entry.label).toBe('Serie S1E1');
    expect(entry.attempts).toBe(0);
    expect(entry.createdAt).toBeGreaterThan(0);
    expect(storage.entries.size).toBe(1);
    expect(await queue.size()).toBe(1);
  });

  it('enqueue lässt {".sv":"timestamp"}-Werte (serienVersion-Bump) unangetastet', async () => {
    const storage = createMemoryStorage();
    const queue = createPendingWriteQueue(storage);

    await queue.enqueue(UID, UPDATES);

    const stored = [...storage.entries.values()][0];
    expect(stored.updates['users/user-1/meta/serienVersion']).toEqual({ '.sv': 'timestamp' });
  });

  it('label ist optional', async () => {
    const storage = createMemoryStorage();
    const queue = createPendingWriteQueue(storage);

    const entry = await queue.enqueue(UID, UPDATES);

    expect(entry.label).toBeUndefined();
    expect(await queue.size()).toBe(1);
  });

  it('size() ist 0 für eine leere Queue', async () => {
    const queue = createPendingWriteQueue(createMemoryStorage());
    expect(await queue.size()).toBe(0);
  });

  it(`Cap: bei mehr als ${MAX_QUEUE_SIZE} Einträgen fliegt der älteste (+ console.warn)`, async () => {
    const storage = createMemoryStorage();
    const queue = createPendingWriteQueue(storage);

    for (let i = 0; i < MAX_QUEUE_SIZE + 1; i++) {
      await queue.enqueue(UID, { [`path/${i}`]: i }, `entry-${i}`);
    }

    expect(await queue.size()).toBe(MAX_QUEUE_SIZE);
    expect(console.warn).toHaveBeenCalledTimes(1);
    const labels = [...storage.entries.values()].map((e) => e.label);
    expect(labels).not.toContain('entry-0'); // ältester wurde verworfen
    expect(labels).toContain(`entry-${MAX_QUEUE_SIZE}`); // neuester ist drin
  });

  it('replayAll spielt Einträge FIFO (Enqueue-Reihenfolge) nach', async () => {
    const storage = createMemoryStorage();
    const queue = createPendingWriteQueue(storage);
    await queue.enqueue(UID, { a: 1 }, 'first');
    await queue.enqueue(UID, { b: 2 }, 'second');
    await queue.enqueue(UID, { c: 3 }, 'third');

    const order: string[] = [];
    const result = await queue.replayAll(async (entry) => {
      order.push(entry.label ?? '');
    });

    expect(order).toEqual(['first', 'second', 'third']);
    expect(result).toEqual({ replayed: 3, dropped: 0, remaining: 0, ranToCompletion: true });
    expect(await queue.size()).toBe(0);
  });

  it('replayAll löscht nur erfolgreich geschriebene Einträge', async () => {
    const storage = createMemoryStorage();
    const queue = createPendingWriteQueue(storage);
    await queue.enqueue(UID, { a: 1 }, 'ok');
    await queue.enqueue(UID, { b: 2 }, 'fails');

    const result = await queue.replayAll(async (entry) => {
      if (entry.label === 'fails') throw new Error('network down');
    });

    expect(result.replayed).toBe(1);
    expect(result.remaining).toBe(1);
    expect([...storage.entries.values()][0].label).toBe('fails');
  });

  it('Netzwerkfehler: attempts++ am betroffenen Eintrag und Abbruch der Runde', async () => {
    const storage = createMemoryStorage();
    const queue = createPendingWriteQueue(storage);
    await queue.enqueue(UID, { a: 1 }, 'head');
    await queue.enqueue(UID, { b: 2 }, 'tail');

    const attempted: string[] = [];
    const result = await queue.replayAll(async (entry) => {
      attempted.push(entry.label ?? '');
      throw new Error('network down');
    });

    // Runde bricht nach dem ersten Fehler ab — 'tail' wird gar nicht versucht.
    expect(attempted).toEqual(['head']);
    expect(result).toEqual({ replayed: 0, dropped: 0, remaining: 2, ranToCompletion: false });
    const entries = [...storage.entries.values()];
    expect(entries.find((e) => e.label === 'head')?.attempts).toBe(1);
    expect(entries.find((e) => e.label === 'tail')?.attempts).toBe(0);
  });

  it('fehlgeschlagener Eintrag bleibt FIFO-Kopf und wird in der nächsten Runde erneut versucht', async () => {
    const storage = createMemoryStorage();
    const queue = createPendingWriteQueue(storage);
    await queue.enqueue(UID, { a: 1 }, 'head');
    await queue.enqueue(UID, { b: 2 }, 'tail');

    await queue.replayAll(async () => {
      throw new Error('network down');
    });

    const order: string[] = [];
    const result = await queue.replayAll(async (entry) => {
      order.push(entry.label ?? '');
    });

    expect(order).toEqual(['head', 'tail']);
    expect(result.replayed).toBe(2);
    expect(await queue.size()).toBe(0);
  });

  it(`Eintrag wird nach ${MAX_ATTEMPTS} fehlgeschlagenen Versuchen verworfen`, async () => {
    const storage = createMemoryStorage();
    const queue = createPendingWriteQueue(storage);
    await queue.enqueue(UID, { a: 1 }, 'poison');

    let lastResult;
    for (let round = 0; round < MAX_ATTEMPTS; round++) {
      lastResult = await queue.replayAll(async () => {
        throw new Error('network down');
      });
    }

    expect(lastResult?.dropped).toBe(1);
    expect(await queue.size()).toBe(0);
    expect(console.error).toHaveBeenCalled();
  });

  it('permission-denied: Eintrag wird verworfen (console.error), Runde läuft weiter', async () => {
    const storage = createMemoryStorage();
    const queue = createPendingWriteQueue(storage);
    await queue.enqueue('other-uid', { a: 1 }, 'foreign');
    await queue.enqueue(UID, { b: 2 }, 'mine');

    const result = await queue.replayAll(async (entry) => {
      if (entry.label === 'foreign') throw permissionDeniedError();
    });

    expect(result).toEqual({ replayed: 1, dropped: 1, remaining: 0, ranToCompletion: true });
    expect(console.error).toHaveBeenCalledTimes(1);
    expect(await queue.size()).toBe(0);
  });

  it('Concurrency-Guard: nur ein Replay gleichzeitig, zweiter Aufruf schreibt nichts', async () => {
    const storage = createMemoryStorage();
    const queue = createPendingWriteQueue(storage);
    await queue.enqueue(UID, { a: 1 }, 'slow');

    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });

    let writes = 0;
    const first = queue.replayAll(async () => {
      writes++;
      await gate;
    });
    const second = await queue.replayAll(async () => {
      writes++;
    });

    expect(second.ranToCompletion).toBe(false);
    expect(second.replayed).toBe(0);
    release();
    const firstResult = await first;
    expect(firstResult.replayed).toBe(1);
    expect(writes).toBe(1);
  });

  it('onChange feuert mit aktueller Größe bei enqueue und Replay; Unsubscribe wirkt', async () => {
    const storage = createMemoryStorage();
    const queue = createPendingWriteQueue(storage);
    const sizes: number[] = [];
    const unsubscribe = queue.onChange((size) => sizes.push(size));

    await queue.enqueue(UID, { a: 1 });
    await queue.enqueue(UID, { b: 2 });
    await queue.replayAll(async () => {});

    expect(sizes).toEqual([1, 2, 0]);

    unsubscribe();
    await queue.enqueue(UID, { c: 3 });
    expect(sizes).toEqual([1, 2, 0]); // keine weiteren Events nach Unsubscribe
  });

  it('Listener-Fehler in onChange beeinträchtigen die Queue nicht', async () => {
    const queue = createPendingWriteQueue(createMemoryStorage());
    queue.onChange(() => {
      throw new Error('listener kaputt');
    });

    const entry = await queue.enqueue(UID, { a: 1 });
    expect(entry.attempts).toBe(0);
    expect(await queue.size()).toBe(1);
  });

  it('replayAll auf leerer Queue ist ein No-op', async () => {
    const queue = createPendingWriteQueue(createMemoryStorage());
    const write = vi.fn();
    const result = await queue.replayAll(write);
    expect(write).not.toHaveBeenCalled();
    expect(result).toEqual({ replayed: 0, dropped: 0, remaining: 0, ranToCompletion: true });
  });

  describe('isPermissionDenied', () => {
    it('erkennt Firebase-compat code und message', () => {
      expect(isPermissionDenied(permissionDeniedError())).toBe(true);
      expect(isPermissionDenied({ code: 'PERMISSION_DENIED' })).toBe(true);
      expect(isPermissionDenied(new Error('permission_denied at /users/x'))).toBe(true);
    });

    it('klassifiziert andere Fehler nicht als permission-denied', () => {
      expect(isPermissionDenied(new Error('network down'))).toBe(false);
      expect(isPermissionDenied(new Error('timeout: Firebase-Write nicht bestätigt'))).toBe(false);
      expect(isPermissionDenied(null)).toBe(false);
      expect(isPermissionDenied('PERMISSION_DENIED')).toBe(false);
    });
  });
});
