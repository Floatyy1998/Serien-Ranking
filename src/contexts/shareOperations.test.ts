import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  values: new Map<string, unknown>(),
  sets: [] as { path: string; value: unknown }[],
  updates: [] as Record<string, unknown>[],
  removed: [] as string[],
  queries: [] as { path: string; child: string; equalTo: string }[],
}));

vi.mock('../services/db/ref', () => ({
  dbGet: (path: string) => Promise.resolve(db.values.get(path) ?? null),
  dbUpdate: (updates: Record<string, unknown>) => {
    db.updates.push(updates);
    return Promise.resolve();
  },
  serverTimestamp: () => 1234,
  userPath: (uid: string, ...segments: (string | number)[]) =>
    ['users', uid, ...segments].join('/'),
  dbRef: (path: string) => {
    const api = {
      set: (value: unknown) => {
        db.sets.push({ path, value });
        return Promise.resolve();
      },
      remove: () => {
        db.removed.push(path);
        return Promise.resolve();
      },
      push: () => ({
        set: (value: unknown) => {
          db.sets.push({ path: `${path}/neu`, value });
          return Promise.resolve();
        },
      }),
      orderByChild: (child: string) => ({
        equalTo: (value: string) => ({
          once: () => {
            db.queries.push({ path, child, equalTo: value });
            return Promise.resolve({
              val: () => db.values.get(`${path}?${child}=${value}`) ?? null,
            });
          },
        }),
      }),
    };
    return api;
  },
}));

import {
  acceptShareOp,
  declineShareOp,
  requestShareOp,
  revokeShareOp,
  shareWithAllOp,
  withdrawShareRequestOp,
} from './shareOperations';

const me = { uid: 'me', displayName: 'Ich', email: 'ich@example.com' };

beforeEach(() => {
  db.values.clear();
  db.sets.length = 0;
  db.updates.length = 0;
  db.removed.length = 0;
  db.queries.length = 0;
});

describe('requestShareOp', () => {
  it('legt eine Anfrage an', async () => {
    expect(await requestShareOp(me, 'freund')).toBe(true);
    expect(db.sets[0].path).toBe('shareRequests/neu');
    expect(db.sets[0].value).toMatchObject({
      fromUserId: 'me',
      toUserId: 'freund',
      status: 'pending',
    });
  });

  it('fragt nicht, wenn schon freigegeben ist', async () => {
    db.values.set('users/freund/shares/me', true);
    expect(await requestShareOp(me, 'freund')).toBe(true);
    expect(db.sets).toHaveLength(0);
  });

  it('fasst eine zweite Anfrage zusammen statt sie zu doppeln', async () => {
    db.values.set('shareRequests?fromUserId=me', {
      r1: { fromUserId: 'me', toUserId: 'freund', status: 'pending' },
    });
    expect(await requestShareOp(me, 'freund')).toBe(true);
    expect(db.sets).toHaveLength(0);
  });

  it('sucht über eine Query, nicht über den Wurzelknoten', async () => {
    await requestShareOp(me, 'freund');
    // Der Wurzelknoten ist ohne Query per Rules nicht lesbar.
    expect(db.queries[0]).toEqual({
      path: 'shareRequests',
      child: 'fromUserId',
      equalTo: 'me',
    });
  });

  it('lehnt sich selbst und leere Ziele ab', async () => {
    expect(await requestShareOp(me, 'me')).toBe(false);
    expect(await requestShareOp(me, '')).toBe(false);
    expect(db.sets).toHaveLength(0);
  });
});

describe('Freigabe erteilen und entziehen', () => {
  it('setzt Freigabe und Anfrage-Status in einem Schreibvorgang', async () => {
    await acceptShareOp('me', 'r1', 'freund');
    expect(db.updates).toHaveLength(1);
    expect(db.updates[0]).toEqual({
      'users/me/shares/freund': true,
      'shareRequests/r1/status': 'accepted',
    });
  });

  it('lehnt ab, ohne eine Freigabe zu setzen', async () => {
    await declineShareOp('r1');
    expect(db.sets[0]).toEqual({ path: 'shareRequests/r1/status', value: 'declined' });
    expect(db.updates).toHaveLength(0);
  });

  it('entzieht die Freigabe', async () => {
    await revokeShareOp('me', 'freund');
    expect(db.removed).toEqual(['users/me/shares/freund']);
  });

  it('gibt allen Freunden auf einmal frei', async () => {
    await shareWithAllOp('me', ['a', 'b']);
    expect(db.updates[0]).toEqual({
      'users/me/shares/a': true,
      'users/me/shares/b': true,
    });
  });

  it('hakt offene Bitten beim Freigeben an alle mit ab', async () => {
    // Sonst bleibt die Anfrage stehen und der Absender erfaehrt nichts: die
    // Zusage-Meldung haengt am Statuswechsel, nicht am Freigabe-Knoten.
    db.values.set('shareRequests?toUserId=me', {
      r1: { fromUserId: 'a', toUserId: 'me', status: 'pending' },
      r2: { fromUserId: 'fremd', toUserId: 'me', status: 'pending' },
      r3: { fromUserId: 'b', toUserId: 'me', status: 'declined' },
    });
    await shareWithAllOp('me', ['a', 'b']);
    expect(db.updates[0]).toEqual({
      'users/me/shares/a': true,
      'users/me/shares/b': true,
      'shareRequests/r1/status': 'accepted',
    });
  });

  it('schreibt nichts ohne Freunde', async () => {
    await shareWithAllOp('me', []);
    expect(db.updates).toHaveLength(0);
  });

  it('zieht eine offene eigene Anfrage zurück', async () => {
    db.values.set('shareRequests?fromUserId=me', {
      r7: { fromUserId: 'me', toUserId: 'freund', status: 'pending' },
    });
    await withdrawShareRequestOp('me', 'freund');
    expect(db.removed).toEqual(['shareRequests/r7']);
  });

  it('zieht nichts zurück, wenn keine Anfrage offen ist', async () => {
    await withdrawShareRequestOp('me', 'freund');
    expect(db.removed).toHaveLength(0);
  });
});
