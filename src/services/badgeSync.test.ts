import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  appBadge: null as number | null,
  sets: [] as { path: string; value: unknown }[],
  pushes: [] as { path: string; value: unknown }[],
}));

vi.mock('./db/ref', () => ({
  userPath: (_uid: string, ...parts: (string | number)[]) => parts.join('/'),
  dbGet: vi.fn(async (path: string) => (path === 'appBadge' ? fb.appBadge : null)),
  dbRef: vi.fn((path: string) => ({
    set: async (value: unknown) => {
      fb.sets.push({ path, value });
    },
    push: async (value: unknown) => {
      fb.pushes.push({ path, value });
    },
  })),
}));

import { syncAppBadgeAcrossDevices, _resetBadgeSyncForTests } from './badgeSync';

beforeEach(() => {
  vi.useFakeTimers();
  fb.appBadge = null;
  fb.sets = [];
  fb.pushes = [];
  _resetBadgeSyncForTests();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('syncAppBadgeAcrossDevices', () => {
  it('spiegelt geänderte Zahl und stößt einen Badge-Push an', async () => {
    fb.appBadge = 5;
    syncAppBadgeAcrossDevices('u1', 2);
    await vi.runAllTimersAsync();
    expect(fb.sets).toEqual([{ path: 'appBadge', value: 2 }]);
    expect(fb.pushes).toHaveLength(1);
    expect(fb.pushes[0].path).toBe('badgeQueue');
    expect(fb.pushes[0].value).toMatchObject({ uid: 'u1', count: 2 });
  });

  it('unveränderter Stand (RTDB gleich) erzeugt keinen Push', async () => {
    fb.appBadge = 3;
    syncAppBadgeAcrossDevices('u1', 3);
    await vi.runAllTimersAsync();
    expect(fb.sets).toHaveLength(0);
    expect(fb.pushes).toHaveLength(0);
  });

  it('debounced: nur der letzte Wert einer Serie wird geschrieben', async () => {
    fb.appBadge = 10;
    syncAppBadgeAcrossDevices('u1', 9);
    syncAppBadgeAcrossDevices('u1', 8);
    syncAppBadgeAcrossDevices('u1', 7);
    await vi.runAllTimersAsync();
    expect(fb.sets).toEqual([{ path: 'appBadge', value: 7 }]);
    expect(fb.pushes).toHaveLength(1);
  });

  it('ohne uid passiert nichts', async () => {
    syncAppBadgeAcrossDevices(undefined, 4);
    await vi.runAllTimersAsync();
    expect(fb.sets).toHaveLength(0);
    expect(fb.pushes).toHaveLength(0);
  });
});
