import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const state = {
    databaseURL: 'https://serien-ranking.firebaseio.com' as string | undefined,
    token: 'idtok' as string | undefined,
    getIdTokenThrows: false,
  };
  const appMock = vi.fn(() => ({ options: { databaseURL: state.databaseURL } }));
  const authMock = vi.fn(() => ({
    currentUser: {
      getIdToken: vi.fn(async () => {
        if (state.getIdTokenThrows) throw new Error('no token');
        return state.token;
      }),
    },
  }));
  return { state, appMock, authMock };
});

vi.mock('firebase/compat/app', () => ({
  default: { app: fb.appMock, auth: fb.authMock },
}));
vi.mock('firebase/compat/database', () => ({}));

import { buildUserSearchIndexEntry, syncUserSearchIndex } from './userSearchIndex';

describe('buildUserSearchIndexEntry', () => {
  it('baut username/displayName + Lowercase-Varianten', () => {
    const entry = buildUserSearchIndexEntry({ username: 'MaxiPad', displayName: 'Max Muster' });
    expect(entry).toEqual({
      username: 'MaxiPad',
      usernameLower: 'maxipad',
      displayName: 'Max Muster',
      displayNameLower: 'max muster',
    });
  });

  it('laesst fehlende Felder weg (nicht als null)', () => {
    const entry = buildUserSearchIndexEntry({ username: 'nur-name' });
    expect(entry).toEqual({ username: 'nur-name', usernameLower: 'nur-name' });
    expect(entry).not.toHaveProperty('displayName');
    expect(entry).not.toHaveProperty('photoURL');
    expect(entry).not.toHaveProperty('bio');
  });

  it('whitespace-only / nicht-String-Werte werden ignoriert', () => {
    expect(buildUserSearchIndexEntry({ username: '   ', displayName: 42 })).toBeNull();
    expect(buildUserSearchIndexEntry({ username: null, displayName: undefined })).toBeNull();
  });

  it('kein einziges Feld → null', () => {
    expect(buildUserSearchIndexEntry({})).toBeNull();
  });

  it('kuerzt Name-Felder auf 100 Zeichen', () => {
    const long = 'a'.repeat(150);
    const entry = buildUserSearchIndexEntry({ username: long });
    expect(entry?.username).toHaveLength(100);
    expect(entry?.usernameLower).toHaveLength(100);
  });

  it('uebernimmt photoURL bis 2048 Zeichen, laesst laengere weg', () => {
    const ok = 'https://p/' + 'a'.repeat(2000);
    const tooLong = 'https://p/' + 'a'.repeat(2048);
    expect(buildUserSearchIndexEntry({ username: 'u', photoURL: ok })?.photoURL).toBe(ok);
    const entry = buildUserSearchIndexEntry({ username: 'u', photoURL: tooLong });
    expect(entry).not.toHaveProperty('photoURL');
    expect(entry?.username).toBe('u');
  });

  it('kuerzt bio auf 500 Zeichen', () => {
    const entry = buildUserSearchIndexEntry({ username: 'u', bio: 'b'.repeat(600) });
    expect(entry?.bio).toHaveLength(500);
  });

  it('nur photoURL (ohne Namen) ergibt trotzdem einen Eintrag', () => {
    const entry = buildUserSearchIndexEntry({ photoURL: 'https://p/x.png' });
    expect(entry).toEqual({ photoURL: 'https://p/x.png' });
  });
});

describe('syncUserSearchIndex', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fb.state.databaseURL = 'https://serien-ranking.firebaseio.com';
    fb.state.token = 'idtok';
    fb.state.getIdTokenThrows = false;
    fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('PATCHt den Index per REST mit Token in der URL und JSON-Body', async () => {
    await syncUserSearchIndex('uid 1', { username: 'Max' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      'https://serien-ranking.firebaseio.com/userSearchIndex/uid%201.json?auth=idtok'
    );
    expect(init.method).toBe('PATCH');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual({ username: 'Max', usernameLower: 'max' });
  });

  it('kein baubarer Eintrag → kein fetch', async () => {
    await syncUserSearchIndex('uid1', { username: '   ' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fehlende databaseURL → kein fetch', async () => {
    fb.state.databaseURL = undefined;
    await syncUserSearchIndex('uid1', { username: 'Max' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fehlendes Token → kein fetch', async () => {
    fb.state.token = undefined;
    await syncUserSearchIndex('uid1', { username: 'Max' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('wirft nie — getIdToken-Fehler wird verschluckt', async () => {
    fb.state.getIdTokenThrows = true;
    await expect(syncUserSearchIndex('uid1', { username: 'Max' })).resolves.toBeUndefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('wirft nie — fetch-Fehler wird verschluckt', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network'));
    await expect(syncUserSearchIndex('uid1', { username: 'Max' })).resolves.toBeUndefined();
  });
});
