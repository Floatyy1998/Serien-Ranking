import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  stored: null as unknown,
  sets: [] as { path: string; value: unknown }[],
}));

vi.mock('./db/ref', () => ({
  userPath: (_uid: string, ...parts: (string | number)[]) => parts.join('/'),
  dbRef: vi.fn((path: string) => ({
    once: async () => ({ val: () => fb.stored }),
    set: async (value: unknown) => {
      fb.sets.push({ path, value });
    },
  })),
}));

import { syncTimezoneToProfile } from './timezoneSync';

const mockZone = (tz: string | undefined) => {
  vi.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
    resolvedOptions: () => ({ timeZone: tz }) as Intl.ResolvedDateTimeFormatOptions,
  } as Intl.DateTimeFormat);
};

beforeEach(() => {
  fb.stored = null;
  fb.sets = [];
  vi.restoreAllMocks();
});

describe('syncTimezoneToProfile', () => {
  it('schreibt die Geräte-Zeitzone, wenn noch keine gespeichert ist', async () => {
    mockZone('Europe/Berlin');
    await syncTimezoneToProfile('u1');
    expect(fb.sets).toEqual([{ path: 'timezone', value: 'Europe/Berlin' }]);
  });

  it('schreibt nichts, wenn die gespeicherte Zone schon stimmt', async () => {
    fb.stored = 'America/New_York';
    mockZone('America/New_York');
    await syncTimezoneToProfile('u1');
    expect(fb.sets).toEqual([]);
  });

  it('zieht nach, wenn der Nutzer die Zeitzone wechselt', async () => {
    fb.stored = 'Europe/Berlin';
    mockZone('Asia/Tokyo');
    await syncTimezoneToProfile('u1');
    expect(fb.sets).toEqual([{ path: 'timezone', value: 'Asia/Tokyo' }]);
  });

  it('ohne auflösbare Zeitzone passiert nichts', async () => {
    mockZone(undefined);
    await syncTimezoneToProfile('u1');
    expect(fb.sets).toEqual([]);
  });
});
