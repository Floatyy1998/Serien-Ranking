import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// In-Memory-Firebase-Mock (siehe services/leaderboardService.test.ts).
const fb = vi.hoisted(() => {
  const db: Record<string, unknown> = {};
  const state = { pushCounter: 0, failOnce: new Set<string>() };
  const parts = (p: string) => (p === '' ? [] : p.split('/'));
  const getByPath = (path: string): unknown => {
    let n: unknown = db;
    for (const seg of parts(path)) {
      if (n == null || typeof n !== 'object') return undefined;
      n = (n as Record<string, unknown>)[seg];
    }
    return n;
  };
  const setByPath = (path: string, val: unknown) => {
    const segs = parts(path);
    let n = db as Record<string, unknown>;
    for (let i = 0; i < segs.length - 1; i++) {
      if (typeof n[segs[i]] !== 'object' || n[segs[i]] == null) n[segs[i]] = {};
      n = n[segs[i]] as Record<string, unknown>;
    }
    n[segs[segs.length - 1]] = val;
  };
  const removeByPath = (path: string) => {
    const segs = parts(path);
    let n = db as Record<string, unknown>;
    for (let i = 0; i < segs.length - 1; i++) {
      n = n[segs[i]] as Record<string, unknown>;
      if (n == null) return;
    }
    delete n[segs[segs.length - 1]];
  };
  const resolveVal = (v: unknown): unknown => {
    if (v && typeof v === 'object' && '.sv' in (v as Record<string, unknown>)) {
      if ((v as Record<string, unknown>)['.sv'] === 'timestamp') return Date.now();
    }
    return v;
  };
  const snap = (val: unknown) => ({
    val: () => (val === undefined ? null : val),
    exists: () => val !== undefined && val !== null,
  });
  const makeQuery = (path: string, field: string, hasFilter = false, filterVal?: unknown) => ({
    equalTo: (v: unknown) => makeQuery(path, field, true, v),
    once: async () => {
      if (state.failOnce.has(path)) throw new Error('fail ' + path);
      const node = getByPath(path);
      if (!node || typeof node !== 'object') return snap(hasFilter ? null : node);
      let entries = Object.entries(node as Record<string, unknown>);
      if (hasFilter) {
        entries = entries.filter(
          ([, c]) =>
            c && typeof c === 'object' && (c as Record<string, unknown>)[field] === filterVal
        );
      }
      const out: Record<string, unknown> = {};
      for (const [k, v] of entries) out[k] = v;
      return snap(hasFilter && entries.length === 0 ? null : out);
    },
  });
  const makeRef = (path: string): Record<string, unknown> => ({
    key: parts(path).slice(-1)[0],
    once: async () => {
      if (state.failOnce.has(path)) throw new Error('fail ' + path);
      return snap(getByPath(path));
    },
    set: async (v: unknown) => setByPath(path, v),
    remove: async () => removeByPath(path),
    update: async (map: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(map)) {
        const full = path === '' ? k : `${path}/${k}`;
        if (v === null) removeByPath(full);
        else setByPath(full, resolveVal(v));
      }
    },
    push: (v?: unknown) => {
      const key = `-push${state.pushCounter++}`;
      const childPath = path ? `${path}/${key}` : key;
      if (v !== undefined) setByPath(childPath, v);
      const r = makeRef(childPath);
      r.key = key;
      return r;
    },
    orderByChild: (field: string) => makeQuery(path, field),
  });
  const database = (() => ({ ref: (p = '') => makeRef(p) })) as unknown as {
    (): { ref: (p?: string) => Record<string, unknown> };
    ServerValue: { TIMESTAMP: unknown };
  };
  database.ServerValue = { TIMESTAMP: { '.sv': 'timestamp' } };
  return {
    db,
    state,
    getByPath,
    setByPath,
    firebaseDefault: { database },
    reset: () => {
      for (const k of Object.keys(db)) delete db[k];
      state.pushCounter = 0;
      state.failOnce.clear();
    },
  };
});

vi.mock('firebase/compat/app', () => ({ default: fb.firebaseDefault }));
vi.mock('firebase/compat/database', () => ({}));

const badgeSystem = vi.hoisted(() => ({
  invalidateCache: vi.fn(),
  checkForNewBadges: vi.fn(async () => {}),
}));
const getOfflineBadgeSystem = vi.hoisted(() => vi.fn(() => badgeSystem));
vi.mock('../features/badges/offlineBadgeSystem', () => ({ getOfflineBadgeSystem }));

import {
  acceptFriendRequestOp,
  cancelFriendRequestOp,
  declineFriendRequestOp,
  removeFriendOp,
  sendFriendRequestOp,
  updateUserActivityOp,
} from './friendOperations';

const me = {
  uid: 'me',
  displayName: 'Me',
  email: 'me@x.de',
  photoURL: 'me.png',
};

beforeEach(() => {
  fb.reset();
  getOfflineBadgeSystem.mockClear();
  badgeSystem.invalidateCache.mockClear();
  badgeSystem.checkForNewBadges.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sendFriendRequestOp', () => {
  it('findet den Ziel-User über den userSearchIndex und legt eine friendRequest an', async () => {
    fb.setByPath('userSearchIndex', {
      target: { usernameLower: 'spixi', username: 'Spixi' },
    });
    fb.setByPath('users/target', { username: 'Spixi', email: 't@x.de' });
    fb.setByPath('users/me', { username: 'MeName', email: 'me@x.de' });

    const ok = await sendFriendRequestOp(me, 'SpiXi');
    expect(ok).toBe(true);

    const reqs = fb.getByPath('friendRequests') as Record<string, Record<string, unknown>>;
    const req = Object.values(reqs)[0];
    expect(req.fromUserId).toBe('me');
    expect(req.toUserId).toBe('target');
    expect(req.fromUsername).toBe('MeName');
    expect(req.toUsername).toBe('Spixi');
    expect(req.status).toBe('pending');
  });

  it('fällt auf den users-Root zurück, wenn der Index leer ist', async () => {
    fb.setByPath('users', {
      target: { usernameLower: 'bob', username: 'Bob', email: 'b@x.de' },
      me: { username: 'MeName', email: 'me@x.de' },
    });

    const ok = await sendFriendRequestOp(me, 'bob');
    expect(ok).toBe(true);
    const reqs = fb.getByPath('friendRequests') as Record<string, Record<string, unknown>>;
    expect(Object.values(reqs)[0].toUserId).toBe('target');
  });

  it('liefert false, wenn nirgends ein User gefunden wird', async () => {
    const ok = await sendFriendRequestOp(me, 'ghost');
    expect(ok).toBe(false);
    expect(fb.getByPath('friendRequests')).toBeUndefined();
  });
});

describe('acceptFriendRequestOp', () => {
  it('legt beide Freund-Einträge an, markiert die Anfrage als accepted und triggert Badge-Checks', async () => {
    vi.useFakeTimers();
    fb.setByPath('friendRequests/req1', { fromUserId: 'f1', toUserId: 'me' });
    fb.setByPath('users/f1', {
      username: 'Friend',
      displayName: 'Friend One',
      photoURL: 'f.png',
      email: 'f@x.de',
    });
    fb.setByPath('users/me', { username: 'MeName', displayName: 'Me', photoURL: 'me.png' });

    const setFriendRequests = vi.fn();
    const refetchFriends = vi.fn();

    await acceptFriendRequestOp(me, 'req1', setFriendRequests, refetchFriends);

    const myFriend = fb.getByPath('users/me/friends/f1') as Record<string, unknown>;
    expect(myFriend.username).toBe('Friend');
    expect(myFriend.displayName).toBe('Friend One');
    const theirFriend = fb.getByPath('users/f1/friends/me') as Record<string, unknown>;
    expect(theirFriend.username).toBe('MeName');

    expect((fb.getByPath('friendRequests/req1') as Record<string, unknown>).status).toBe(
      'accepted'
    );
    expect(setFriendRequests).toHaveBeenCalled();
    expect(refetchFriends).toHaveBeenCalled();

    // Badge-Check läuft in setTimeout(…, 1000)
    await vi.advanceTimersByTimeAsync(1000);
    expect(getOfflineBadgeSystem).toHaveBeenCalledWith('me');
    expect(getOfflineBadgeSystem).toHaveBeenCalledWith('f1');
    expect(badgeSystem.checkForNewBadges).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('tut nichts, wenn die Anfrage nicht existiert', async () => {
    const setFriendRequests = vi.fn();
    const refetchFriends = vi.fn();
    await acceptFriendRequestOp(me, 'missing', setFriendRequests, refetchFriends);
    expect(refetchFriends).not.toHaveBeenCalled();
    expect(fb.getByPath('users/me/friends')).toBeUndefined();
  });
});

describe('declineFriendRequestOp', () => {
  it('setzt Status declined und entfernt die Anfrage aus dem State', async () => {
    fb.setByPath('friendRequests/req1', { fromUserId: 'f1', status: 'pending' });
    const setFriendRequests = vi.fn();

    await declineFriendRequestOp('req1', setFriendRequests);

    expect((fb.getByPath('friendRequests/req1') as Record<string, unknown>).status).toBe(
      'declined'
    );
    expect(setFriendRequests).toHaveBeenCalled();
  });
});

describe('cancelFriendRequestOp', () => {
  it('entfernt die Anfrage komplett und aus dem sent-State', async () => {
    fb.setByPath('friendRequests/req1', { fromUserId: 'me' });
    const setSentRequests = vi.fn();

    await cancelFriendRequestOp('req1', setSentRequests);

    expect(fb.getByPath('friendRequests/req1')).toBeUndefined();
    expect(setSentRequests).toHaveBeenCalled();
  });
});

describe('removeFriendOp', () => {
  it('löscht die Freundschaft beidseitig und refetcht', async () => {
    fb.setByPath('users/me/friends/f1', { uid: 'f1' });
    fb.setByPath('users/f1/friends/me', { uid: 'me' });
    const refetchFriends = vi.fn();

    await removeFriendOp('me', 'f1', refetchFriends);

    expect(fb.getByPath('users/me/friends/f1')).toBeUndefined();
    expect(fb.getByPath('users/f1/friends/me')).toBeUndefined();
    expect(refetchFriends).toHaveBeenCalled();
  });
});

describe('updateUserActivityOp', () => {
  it('pusht eine neue Activity mit userName-Fallback', async () => {
    await updateUserActivityOp({ uid: 'me', displayName: null, email: 'me@x.de' }, {
      type: 'series_added',
      title: 'Dark',
    } as never);
    const acts = fb.getByPath('users/me/activities') as Record<string, Record<string, unknown>>;
    const act = Object.values(acts)[0];
    expect(act.type).toBe('series_added');
    expect(act.userId).toBe('me');
    expect(act.userName).toBe('me'); // email-Prefix, da displayName null
  });

  it('kürzt auf maximal 30 Aktivitäten (älteste zuerst entfernt)', async () => {
    const activities: Record<string, unknown> = {};
    for (let i = 0; i < 31; i++) {
      activities[`a${i}`] = { type: 'x', timestamp: i };
    }
    fb.setByPath('users/me/activities', activities);

    await updateUserActivityOp({ uid: 'me', displayName: 'Me', email: 'me@x.de' }, {
      type: 'rating_added',
    } as never);

    const acts = fb.getByPath('users/me/activities') as Record<string, unknown>;
    // 31 alte + 1 neue = 32 → auf 30 gekürzt
    expect(Object.keys(acts).length).toBe(30);
    // die ältesten (kleinste timestamps) sind weg
    expect(acts['a0']).toBeUndefined();
    expect(acts['a1']).toBeUndefined();
  });

  it('schluckt Fehler still (kein throw)', async () => {
    fb.state.failOnce.add('users/me/activities');
    await expect(
      updateUserActivityOp({ uid: 'me', displayName: 'Me', email: 'me@x.de' }, {
        type: 'series_added',
      } as never)
    ).resolves.toBeUndefined();
  });
});
