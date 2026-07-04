import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const throwPaths = new Set<string>();
  const onceMock = vi.fn(async (path: string) => {
    if (throwPaths.has(path)) throw new Error('permission_denied');
    return { val: () => (store.has(path) ? store.get(path) : null) };
  });
  const refMock = vi.fn((path: string) => ({ once: () => onceMock(path) }));
  return { store, throwPaths, onceMock, refMock };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.refMock }) },
}));
vi.mock('firebase/compat/database', () => ({}));

import { fetchPublicUserFields, getUserDisplayData } from './userDisplayData';

beforeEach(() => {
  fb.store.clear();
  fb.throwPaths.clear();
  fb.onceMock.mockClear();
  fb.refMock.mockClear();
});

describe('getUserDisplayData', () => {
  it('bevorzugt data.displayName/photoURL aus der DB', async () => {
    fb.store.set('users/u1', { displayName: 'DB-Name', photoURL: 'db.png' });
    const result = await getUserDisplayData({
      uid: 'u1',
      displayName: 'Auth-Name',
      photoURL: 'auth.png',
    });
    expect(result).toEqual({ username: 'DB-Name', photoURL: 'db.png' });
  });

  it('faellt auf authUser.displayName/photoURL zurueck, wenn DB leer', async () => {
    // kein Store-Eintrag → snapshot.val() null → {}
    const result = await getUserDisplayData({
      uid: 'u2',
      displayName: 'Auth-Name',
      photoURL: 'auth.png',
    });
    expect(result).toEqual({ username: 'Auth-Name', photoURL: 'auth.png' });
    expect(fb.refMock).toHaveBeenCalledWith('users/u2');
  });

  it('faellt auf den Email-Prefix zurueck, wenn kein Name vorhanden', async () => {
    const result = await getUserDisplayData({
      uid: 'u3',
      displayName: null,
      email: 'max.mustermann@example.com',
      photoURL: null,
    });
    expect(result.username).toBe('max.mustermann');
    expect(result.photoURL).toBeUndefined();
  });

  it("letzte Instanz ist 'Anonym', photoURL undefined", async () => {
    const result = await getUserDisplayData({ uid: 'u4' });
    expect(result).toEqual({ username: 'Anonym', photoURL: undefined });
  });

  it('DB-Name gewinnt auch bei vorhandenem Auth-Name (Prioritaet)', async () => {
    fb.store.set('users/u5', { displayName: 'X' });
    const result = await getUserDisplayData({ uid: 'u5', displayName: 'Y', email: 'z@z.de' });
    expect(result.username).toBe('X');
  });
});

describe('fetchPublicUserFields', () => {
  it('liest username/displayName/photoURL als Einzelfelder', async () => {
    fb.store.set('users/u1/username', 'maxi');
    fb.store.set('users/u1/displayName', 'Max Muster');
    fb.store.set('users/u1/photoURL', 'https://p/a.png');
    const result = await fetchPublicUserFields('u1');
    expect(result).toEqual({
      username: 'maxi',
      displayName: 'Max Muster',
      photoURL: 'https://p/a.png',
    });
  });

  it('leere/whitespace-only Strings werden zu null', async () => {
    fb.store.set('users/u2/username', '   ');
    fb.store.set('users/u2/displayName', '');
    // photoURL fehlt komplett
    const result = await fetchPublicUserFields('u2');
    expect(result).toEqual({ username: null, displayName: null, photoURL: null });
  });

  it('nicht-String-Werte werden zu null', async () => {
    fb.store.set('users/u3/username', 42);
    fb.store.set('users/u3/displayName', { nested: true });
    fb.store.set('users/u3/photoURL', 'https://ok');
    const result = await fetchPublicUserFields('u3');
    expect(result).toEqual({ username: null, displayName: null, photoURL: 'https://ok' });
  });

  it('einzelne Read-Fehler werden abgefangen (Feld → null), wirft nie', async () => {
    fb.store.set('users/u4/username', 'ok');
    fb.throwPaths.add('users/u4/displayName');
    fb.throwPaths.add('users/u4/photoURL');
    const result = await fetchPublicUserFields('u4');
    expect(result).toEqual({ username: 'ok', displayName: null, photoURL: null });
  });
});
