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

const captureError = vi.hoisted(() => vi.fn());
const isPageLeaving = vi.hoisted(() => vi.fn(() => false));
vi.mock('../errorReporting/errorReporter', () => ({ captureError, isPageLeaving }));

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
  captureError.mockClear();
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

  it('wiederholt /add bei Verbindungsabbruch und liefert die spätere Antwort', async () => {
    vi.useFakeTimers();
    try {
      fetchMock
        .mockRejectedValueOnce(new TypeError('Load failed'))
        .mockResolvedValueOnce({ ok: true, status: 201 });
      const backendFetch = await loadBackendFetch();
      const pending = backendFetch('/add', { method: 'POST', body: '{}' });
      await vi.advanceTimersByTimeAsync(2000);
      await expect(pending).resolves.toEqual({ ok: true, status: 201 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(captureError).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('wiederholt /addMovie bei 502 (Neustart des Backends)', async () => {
    vi.useFakeTimers();
    try {
      fetchMock
        .mockResolvedValueOnce({ ok: false, status: 502 })
        .mockResolvedValueOnce({ ok: true, status: 201 });
      const backendFetch = await loadBackendFetch();
      const pending = backendFetch('/addMovie', { method: 'POST' });
      await vi.advanceTimersByTimeAsync(2000);
      await expect(pending).resolves.toEqual({ ok: true, status: 201 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('meldet einen endgültigen Verbindungsfehler und wirft ihn weiter', async () => {
    vi.useFakeTimers();
    try {
      fetchMock.mockRejectedValue(new TypeError('Load failed'));
      const backendFetch = await loadBackendFetch();
      const pending = backendFetch('/add', { method: 'POST' });
      const assertion = expect(pending).rejects.toThrow('Load failed');
      await vi.advanceTimersByTimeAsync(6000);
      await assertion;
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(captureError).toHaveBeenCalledTimes(1);
      expect(captureError.mock.calls[0][0].message).toContain('POST /add Verbindungsfehler');
    } finally {
      vi.useRealTimers();
    }
  });

  it('meldet Verbindungsfehler im Hintergrund nicht, wirft sie aber weiter', async () => {
    vi.stubGlobal('document', { visibilityState: 'hidden' });
    try {
      fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
      const backendFetch = await loadBackendFetch();
      await expect(backendFetch('/hc/search', { method: 'POST' })).rejects.toThrow(
        'Failed to fetch'
      );
      expect(captureError).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('meldet Verbindungsfehler beim Update-Reload nicht, wirft sie aber weiter', async () => {
    isPageLeaving.mockReturnValueOnce(true);
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const backendFetch = await loadBackendFetch();
    await expect(backendFetch('/hc/similar', { method: 'POST' })).rejects.toThrow(
      'Failed to fetch'
    );
    expect(captureError).not.toHaveBeenCalled();
  });

  it.each(['/mangaupdates/batch', '/mangaupdates/titles'])(
    'wiederholt den Lesezugriff %s bei einem einzelnen Verbindungsabbruch',
    async (path) => {
      vi.useFakeTimers();
      try {
        fetchMock
          .mockRejectedValueOnce(new TypeError('Failed to fetch'))
          .mockResolvedValueOnce({ ok: true, status: 200 });
        const backendFetch = await loadBackendFetch();
        const pending = backendFetch(path, { method: 'POST' });
        await vi.advanceTimersByTimeAsync(2000);
        await expect(pending).resolves.toEqual({ ok: true, status: 200 });
        expect(captureError).not.toHaveBeenCalled();
      } finally {
        vi.useRealTimers();
      }
    }
  );

  it('meldet Status, die der Aufrufer selbst abfängt, nicht', async () => {
    const backendFetch = await loadBackendFetch();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 503 });
    await backendFetch('/hc/search', { method: 'POST' }, { quietStatuses: [429, 503] });
    expect(captureError).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    await backendFetch('/hc/search', { method: 'POST' }, { quietStatuses: [429, 503] });
    expect(captureError).toHaveBeenCalledTimes(1);
  });

  it('wiederholt andere Pfade bei Verbindungsfehlern nicht', async () => {
    fetchMock.mockRejectedValue(new TypeError('Load failed'));
    const backendFetch = await loadBackendFetch();
    await expect(backendFetch('/ai/recap', { method: 'POST' })).rejects.toThrow('Load failed');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('meldet 5xx-Antworten, aber keine 400er', async () => {
    const backendFetch = await loadBackendFetch();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 400 });
    await backendFetch('/add', { method: 'POST' });
    expect(captureError).not.toHaveBeenCalled();
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    await backendFetch('/mangaupdates/search', { method: 'POST' });
    expect(captureError).toHaveBeenCalledTimes(1);
    expect(captureError.mock.calls[0][0].message).toContain('/mangaupdates/search -> 500');
  });

  it('hält das Minutenlimit für /add + /addMovie ein, statt in 429 zu laufen', async () => {
    vi.useFakeTimers();
    try {
      const backendFetch = await loadBackendFetch();
      const pending = Array.from({ length: 60 }, (_, i) =>
        backendFetch(i % 2 ? '/add' : '/addMovie', { method: 'POST' })
      );
      await vi.advanceTimersByTimeAsync(59_000);
      expect(fetchMock).toHaveBeenCalledTimes(58);
      await vi.advanceTimersByTimeAsync(1_500);
      await Promise.all(pending);
      expect(fetchMock).toHaveBeenCalledTimes(60);
    } finally {
      vi.useRealTimers();
    }
  });

  it('bremst andere Pfade nicht', async () => {
    const backendFetch = await loadBackendFetch();
    await Promise.all(Array.from({ length: 40 }, () => backendFetch('/hc/search')));
    expect(fetchMock).toHaveBeenCalledTimes(40);
  });

  it('wiederholt /addMovie nach einem 429 einmal nach Retry-After', async () => {
    vi.useFakeTimers();
    try {
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'Retry-After': '12' }),
        })
        .mockResolvedValueOnce({ ok: true, status: 201 });
      const backendFetch = await loadBackendFetch();
      const pending = backendFetch('/addMovie', { method: 'POST' });
      await vi.advanceTimersByTimeAsync(11_000);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1_500);
      await expect(pending).resolves.toEqual({ ok: true, status: 201 });
      expect(captureError).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('meldet ein 429, das auch die Wiederholung trifft', async () => {
    vi.useFakeTimers();
    try {
      fetchMock.mockResolvedValue({ ok: false, status: 429 });
      const backendFetch = await loadBackendFetch();
      const pending = backendFetch('/add', { method: 'POST' });
      await vi.advanceTimersByTimeAsync(31_000);
      await expect(pending).resolves.toEqual({ ok: false, status: 429 });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(captureError.mock.calls[0][0].message).toContain('POST /add -> 429');
    } finally {
      vi.useRealTimers();
    }
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
