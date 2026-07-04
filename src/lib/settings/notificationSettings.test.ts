import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// In-Memory-Firebase (hierarchisch: Multi-Path-`update` schreibt verschachtelte
// Keys, Whole-Node-`once` rekonstruiert sie).
const fb = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const readPath = (path?: string): unknown => {
    if (!path) return null;
    if (store.has(path)) return store.get(path);
    const prefix = path + '/';
    const childKeys = [...store.keys()].filter((k) => k.startsWith(prefix));
    if (childKeys.length === 0) return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result: any = {};
    for (const k of childKeys) {
      const parts = k.slice(prefix.length).split('/');
      let cur = result;
      for (let i = 0; i < parts.length - 1; i++) {
        cur[parts[i]] = cur[parts[i]] ?? {};
        cur = cur[parts[i]];
      }
      cur[parts[parts.length - 1]] = store.get(k);
    }
    return result;
  };
  const deleteTree = (path: string) => {
    store.delete(path);
    const prefix = path + '/';
    for (const k of [...store.keys()]) if (k.startsWith(prefix)) store.delete(k);
  };
  const makeRef = (path?: string) => ({
    once: async () => ({ val: () => readPath(path) }),
    set: async (v: unknown) => {
      if (path) {
        deleteTree(path);
        store.set(path, v);
      }
    },
    update: async (m: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(m)) {
        if (v === null) deleteTree(k);
        else store.set(k, v);
      }
    },
  });
  return { store, makeRef };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: (p?: string) => fb.makeRef(p) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

const DAY = 24 * 60 * 60 * 1000;
const UID = 'u1';

// Modul hat einen 60s-Cache → zwischen Tests frisch laden.
const load = () => import('./notificationSettings');

beforeEach(() => {
  vi.resetModules();
  fb.store.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-04T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('getInactiveThresholdDays', () => {
  it('Default 30 wenn nichts gespeichert', async () => {
    const { getInactiveThresholdDays } = await load();
    await expect(getInactiveThresholdDays(UID)).resolves.toBe(30);
  });

  it('liefert gespeicherten gültigen Wert (60)', async () => {
    fb.store.set('users/u1/notificationSettings', { inactiveThresholdDays: 60 });
    const { getInactiveThresholdDays } = await load();
    await expect(getInactiveThresholdDays(UID)).resolves.toBe(60);
  });

  it('ungültiger Wert (nicht in Options) → Default 30', async () => {
    fb.store.set('users/u1/notificationSettings', { inactiveThresholdDays: 45 });
    const { getInactiveThresholdDays } = await load();
    await expect(getInactiveThresholdDays(UID)).resolves.toBe(30);
  });

  it('0 ist ein gültiger Wert (Feature aus)', async () => {
    fb.store.set('users/u1/notificationSettings', { inactiveThresholdDays: 0 });
    const { getInactiveThresholdDays } = await load();
    await expect(getInactiveThresholdDays(UID)).resolves.toBe(0);
  });
});

describe('getProviderNotificationsEnabled', () => {
  it('Default true wenn nichts gespeichert', async () => {
    const { getProviderNotificationsEnabled } = await load();
    await expect(getProviderNotificationsEnabled(UID)).resolves.toBe(true);
  });

  it('false wenn explizit deaktiviert', async () => {
    fb.store.set('users/u1/notificationSettings', { providerNotificationsEnabled: false });
    const { getProviderNotificationsEnabled } = await load();
    await expect(getProviderNotificationsEnabled(UID)).resolves.toBe(false);
  });

  it('nicht-boolescher Wert → Default true', async () => {
    fb.store.set('users/u1/notificationSettings', {
      providerNotificationsEnabled: 'nope' as unknown as boolean,
    });
    const { getProviderNotificationsEnabled } = await load();
    await expect(getProviderNotificationsEnabled(UID)).resolves.toBe(true);
  });
});

describe('60s-Cache', () => {
  it('zweiter Aufruf innerhalb 60s liefert gecachten Wert; nach Ablauf frisch', async () => {
    fb.store.set('users/u1/notificationSettings', { inactiveThresholdDays: 60 });
    const { getInactiveThresholdDays } = await load();
    await expect(getInactiveThresholdDays(UID)).resolves.toBe(60);

    // Store ändern — innerhalb TTL noch gecacht
    fb.store.set('users/u1/notificationSettings', { inactiveThresholdDays: 90 });
    vi.advanceTimersByTime(30_000);
    await expect(getInactiveThresholdDays(UID)).resolves.toBe(60);

    // Nach TTL-Ablauf frisch geladen
    vi.advanceTimersByTime(31_000);
    await expect(getInactiveThresholdDays(UID)).resolves.toBe(90);
  });

  it('setInactiveThresholdDays invalidiert den Cache', async () => {
    const { getInactiveThresholdDays, setInactiveThresholdDays } = await load();
    // Erster Aufruf cached den Default (30)
    await expect(getInactiveThresholdDays(UID)).resolves.toBe(30);

    await setInactiveThresholdDays(UID, 90);
    // Ohne Invalidierung käme weiter der gecachte Default 30
    await expect(getInactiveThresholdDays(UID)).resolves.toBe(90);
  });

  it('setProviderNotificationsEnabled invalidiert den Cache', async () => {
    const { getProviderNotificationsEnabled, setProviderNotificationsEnabled } = await load();
    await expect(getProviderNotificationsEnabled(UID)).resolves.toBe(true);
    await setProviderNotificationsEnabled(UID, false);
    await expect(getProviderNotificationsEnabled(UID)).resolves.toBe(false);
  });
});

describe('Snooze', () => {
  it('snoozeNotifications schreibt snoozeUntil und getSnoozedUntil liest sie zurück', async () => {
    const { snoozeNotifications, getSnoozedUntil } = await load();
    await snoozeNotifications('inactive', [1, 2], UID, 7);
    const table = await getSnoozedUntil('inactive', UID);
    const expected = Date.now() + 7 * DAY;
    expect(table).toEqual({ '1': expected, '2': expected });
  });

  it('snoozeNotifications mit leerer id-Liste → kein Write', async () => {
    const { snoozeNotifications } = await load();
    await snoozeNotifications('inactive', [], UID, 7);
    expect(fb.store.size).toBe(0);
  });

  it('getSnoozedUntil ohne Einträge → {}', async () => {
    const { getSnoozedUntil } = await load();
    await expect(getSnoozedUntil('completed', UID)).resolves.toEqual({});
  });

  it('Snooze-Kategorien sind isoliert', async () => {
    const { snoozeNotifications, getSnoozedUntil } = await load();
    await snoozeNotifications('inactive', [1], UID, 1);
    await expect(getSnoozedUntil('completed', UID)).resolves.toEqual({});
  });
});

describe('cleanupSnoozes', () => {
  it('entfernt abgelaufene und nicht mehr gültige Einträge, behält gültige', async () => {
    const now = Date.now();
    fb.store.set('users/u1/notificationSnooze/inactive/1', now + DAY); // gültig, in validIds
    fb.store.set('users/u1/notificationSnooze/inactive/2', now - DAY); // abgelaufen
    fb.store.set('users/u1/notificationSnooze/inactive/3', now + DAY); // gültig, NICHT in validIds

    const { cleanupSnoozes, getSnoozedUntil } = await load();
    await cleanupSnoozes('inactive', UID, new Set(['1', '2']));

    const remaining = await getSnoozedUntil('inactive', UID);
    expect(remaining).toEqual({ '1': now + DAY });
  });

  it('nichts zu tun → kein Fehler', async () => {
    const { cleanupSnoozes } = await load();
    await expect(cleanupSnoozes('inactive', UID, new Set())).resolves.toBeUndefined();
  });
});

describe('snoozeLabel', () => {
  it('mappt Tage auf deutsche Labels', async () => {
    const { snoozeLabel } = await load();
    expect(snoozeLabel(1)).toBe('1 Tag');
    expect(snoozeLabel(7)).toBe('1 Woche');
    expect(snoozeLabel(30)).toBe('1 Monat');
  });
});
