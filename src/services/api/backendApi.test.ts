import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const state = {
    token: 'idtoken-abc' as string | undefined,
    throws: false,
    failFirst: 0,
    refreshedToken: undefined as string | undefined,
  };
  const getIdToken = vi.fn(async (forceRefresh?: boolean) => {
    if (state.failFirst > 0) {
      state.failFirst--;
      throw new Error('network-request-failed');
    }
    if (state.throws) throw new Error('token error');
    return forceRefresh && state.refreshedToken ? state.refreshedToken : state.token;
  });
  const authMock = vi.fn(() => ({
    currentUser: state.token || state.throws ? { getIdToken } : null,
  }));
  return { state, getIdToken, authMock };
});

vi.mock('firebase/compat/app', () => ({ default: { auth: fb.authMock } }));
vi.mock('firebase/compat/auth', () => ({}));

let fetchMock: ReturnType<typeof vi.fn>;
const sentinel = { ok: true, status: 200 };

async function loadBackendFetch() {
  vi.resetModules();
  const mod = await import('./backendApi');
  return mod.backendFetch;
}

beforeEach(() => {
  fb.state.token = 'idtoken-abc';
  fb.state.throws = false;
  fb.state.failFirst = 0;
  fb.state.refreshedToken = undefined;
  fb.getIdToken.mockClear();
  vi.stubEnv('VITE_BACKEND_API_URL', 'https://backend.test');
  fetchMock = vi.fn(async () => sentinel);
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('backendFetch', () => {
  it('haengt BACKEND_URL an den Pfad und liefert die Response durch', async () => {
    const backendFetch = await loadBackendFetch();
    const res = await backendFetch('/add');
    expect(res).toBe(sentinel);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://backend.test/add');
  });

  it('setzt den Authorization-Bearer-Header aus dem Firebase-ID-Token', async () => {
    const backendFetch = await loadBackendFetch();
    await backendFetch('/addMovie');
    const init = fetchMock.mock.calls[0][1];
    const headers = init.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer idtoken-abc');
  });

  it('reicht init (method/body) unveraendert durch', async () => {
    const backendFetch = await loadBackendFetch();
    await backendFetch('/ai/summary', { method: 'POST', body: JSON.stringify({ uid: 'x' }) });
    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ uid: 'x' }));
  });

  it('vorhandene Header bleiben erhalten und werden um Authorization ergaenzt', async () => {
    const backendFetch = await loadBackendFetch();
    await backendFetch('/x', { headers: { 'Content-Type': 'application/json' } });
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('Authorization')).toBe('Bearer idtoken-abc');
  });

  it('ohne eingeloggten User: kein Authorization-Header, fetch trotzdem', async () => {
    fb.state.token = undefined;
    const backendFetch = await loadBackendFetch();
    await backendFetch('/public');
    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get('Authorization')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('getIdToken-Fehler wird nach drei Versuchen verschluckt, fetch laeuft ohne Token', async () => {
    vi.useFakeTimers();
    try {
      fb.state.throws = true;
      const backendFetch = await loadBackendFetch();
      const pending = backendFetch('/x');
      await vi.advanceTimersByTimeAsync(2000);
      await pending;
      const headers = fetchMock.mock.calls[0][1].headers as Headers;
      expect(headers.get('Authorization')).toBeNull();
      expect(fb.getIdToken).toHaveBeenCalledTimes(3);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('scheitert das Token kurz am Netz, klappt der zweite Versuch und die Anfrage hat Token', async () => {
    vi.useFakeTimers();
    try {
      fb.state.failFirst = 1;
      const backendFetch = await loadBackendFetch();
      const pending = backendFetch('/add');
      await vi.advanceTimersByTimeAsync(2000);
      await pending;
      const headers = fetchMock.mock.calls[0][1].headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer idtoken-abc');
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('wiederholt bei 401 einmal mit frisch erzwungenem Token', async () => {
    fb.state.refreshedToken = 'idtoken-neu';
    fetchMock
      .mockResolvedValueOnce({ ok: false, status: 401 })
      .mockResolvedValueOnce({ ok: true, status: 201 });
    const backendFetch = await loadBackendFetch();
    const res = await backendFetch('/add', { method: 'POST', body: '{}' });
    expect(res).toEqual({ ok: true, status: 201 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[0][1].headers as Headers).get('Authorization')).toBe(
      'Bearer idtoken-abc'
    );
    expect((fetchMock.mock.calls[1][1].headers as Headers).get('Authorization')).toBe(
      'Bearer idtoken-neu'
    );
  });

  it('401 ohne eingeloggten User wird nicht wiederholt', async () => {
    fb.state.token = undefined;
    fetchMock.mockResolvedValue({ ok: false, status: 401 });
    const backendFetch = await loadBackendFetch();
    const res = await backendFetch('/public');
    expect(res.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
