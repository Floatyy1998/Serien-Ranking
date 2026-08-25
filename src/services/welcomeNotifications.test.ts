import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => ({
  sets: [] as { path: string; value: Record<string, unknown> }[],
}));

vi.mock('./db/ref', () => ({
  userPath: (uid: string, ...segments: (string | number)[]) =>
    ['users/' + uid, ...segments].join('/'),
  dbRef: vi.fn((path: string) => ({
    set: async (value: Record<string, unknown>) => {
      fb.sets.push({ path, value });
    },
  })),
}));

import { writeWelcomeNotifications } from './welcomeNotifications';

beforeEach(() => {
  fb.sets = [];
});

describe('writeWelcomeNotifications', () => {
  it('schreibt beide Meldungen unter festen Schlüsseln', async () => {
    await writeWelcomeNotifications('abc');
    const pfade = fb.sets.map((s) => s.path);
    expect(pfade).toEqual([
      'users/abc/notifications/welcome',
      'users/abc/notifications/customizeHint',
    ]);
  });

  it('legt sie ungelesen an', async () => {
    await writeWelcomeNotifications('abc');
    for (const s of fb.sets) expect(s.value.read).toBe(false);
  });

  it('stellt die Willkommens-Meldung im Feed nach oben', async () => {
    await writeWelcomeNotifications('abc');
    const [willkommen, hinweis] = fb.sets;
    expect(Number(willkommen.value.timestamp)).toBeGreaterThan(Number(hinweis.value.timestamp));
  });

  it('legt Sprachfassungen neben den deutschen Quelltext', async () => {
    await writeWelcomeNotifications('abc');
    const willkommen = fb.sets[0].value;
    expect(willkommen.title).toBe('Willkommen bei TV-Rank!');
    expect(willkommen.titleL).toBeTypeOf('object');
    expect(Object.keys(willkommen.titleL as object).length).toBeGreaterThan(0);
  });

  it('verdoppelt nichts bei zweimaligem Aufruf (feste Schlüssel)', async () => {
    await writeWelcomeNotifications('abc');
    await writeWelcomeNotifications('abc');
    expect(new Set(fb.sets.map((s) => s.path)).size).toBe(2);
  });
});
