import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const state = { updateResult: () => Promise.resolve() as Promise<void> };
  const updateMock = vi.fn(() => state.updateResult());
  const onMock = vi.fn();
  const onAuthMock = vi.fn();
  const database = () => ({
    ref: (path?: string) => (path === '.info/connected' ? { on: onMock } : { update: updateMock }),
  });
  const auth = () => ({ currentUser: { uid: 'u1' }, onAuthStateChanged: onAuthMock });
  const firebaseDefault = { apps: [{}], database, auth };
  const enqueue = vi.fn(async () => ({ id: 'e1' }));
  const replayAll = vi.fn(async () => ({
    replayed: 0,
    dropped: 0,
    remaining: 0,
    ranToCompletion: true,
  }));
  const showToast = vi.fn();
  const hapticSuccess = vi.fn();
  return {
    state,
    updateMock,
    onMock,
    onAuthMock,
    firebaseDefault,
    enqueue,
    replayAll,
    showToast,
    hapticSuccess,
  };
});

vi.mock('firebase/compat/app', () => ({ default: mocks.firebaseDefault }));
vi.mock('firebase/compat/auth', () => ({}));
vi.mock('firebase/compat/database', () => ({}));
vi.mock('../haptics', () => ({ hapticSuccess: mocks.hapticSuccess }));
vi.mock('../toast', () => ({ showToast: mocks.showToast }));
vi.mock('./pendingWriteQueue', () => ({
  isPermissionDenied: (err: unknown) => {
    if (!err || typeof err !== 'object') return false;
    const code = (err as { code?: unknown }).code;
    if (typeof code === 'string' && code.toUpperCase().includes('PERMISSION_DENIED')) return true;
    const message = (err as { message?: unknown }).message;
    return typeof message === 'string' && message.toLowerCase().includes('permission_denied');
  },
  pendingWriteQueue: { enqueue: mocks.enqueue, replayAll: mocks.replayAll },
}));

const UPDATES = { 'users/u1/seriesWatch/1/seasons/0/eps/9': { w: 1 } };

async function load(online = true) {
  vi.resetModules();
  const win = { addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal('navigator', { onLine: online });
  vi.stubGlobal('window', win);
  const mod = await import('./queuedUpdate');
  return { mod, win };
}

beforeEach(() => {
  mocks.state.updateResult = () => Promise.resolve();
  mocks.updateMock.mockClear();
  mocks.onMock.mockClear();
  mocks.onAuthMock.mockClear();
  mocks.enqueue.mockClear();
  mocks.replayAll.mockClear();
  mocks.showToast.mockClear();
  mocks.hapticSuccess.mockClear();
  // Console-Rauschen (console.warn im Queue-Fallback) unterdruecken.
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Selbst-Initialisierung beim Import', () => {
  it('registriert den online-Listener und die Firebase-Replay-Listener', async () => {
    const { win } = await load(true);
    expect(win.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    // .info/connected .on + auth().onAuthStateChanged
    expect(mocks.onMock).toHaveBeenCalledTimes(1);
    expect(mocks.onAuthMock).toHaveBeenCalledTimes(1);
  });
});

describe('applyUserUpdate — Online', () => {
  it('direkter Write erfolgreich → { queued: false }, kein Enqueue', async () => {
    const { mod } = await load(true);
    const r = await mod.applyUserUpdate('u1', UPDATES, 'mark');
    expect(r).toEqual({ queued: false });
    expect(mocks.updateMock).toHaveBeenCalledWith(UPDATES);
    expect(mocks.enqueue).not.toHaveBeenCalled();
    expect(mocks.showToast).not.toHaveBeenCalled();
  });

  it('permission-denied wird NICHT gequeued, sondern durchgereicht', async () => {
    mocks.state.updateResult = () =>
      Promise.reject({ code: 'PERMISSION_DENIED', message: 'denied' });
    const { mod } = await load(true);
    await expect(mod.applyUserUpdate('u1', UPDATES, 'mark')).rejects.toHaveProperty(
      'code',
      'PERMISSION_DENIED'
    );
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });

  it('sonstiger Write-Fehler → Enqueue + Offline-Toast, { queued: true }', async () => {
    mocks.state.updateResult = () => Promise.reject(new Error('boom'));
    const { mod } = await load(true);
    const r = await mod.applyUserUpdate('u1', UPDATES, 'mark');
    expect(r).toEqual({ queued: true });
    expect(mocks.enqueue).toHaveBeenCalledWith('u1', UPDATES, 'mark');
    expect(mocks.showToast).toHaveBeenCalledTimes(1);
  });

  it('Timeout ohne Server-Ack → Enqueue', async () => {
    vi.useFakeTimers();
    mocks.state.updateResult = () => new Promise<void>(() => {}); // haengt endlos
    const { mod } = await load(true);
    const p = mod.applyUserUpdate('u1', UPDATES, 'mark');
    await vi.advanceTimersByTimeAsync(8000);
    const r = await p;
    expect(r).toEqual({ queued: true });
    expect(mocks.enqueue).toHaveBeenCalledWith('u1', UPDATES, 'mark');
    vi.useRealTimers();
  });
});

describe('applyUserUpdate — Offline', () => {
  it('erkannt offline → Enqueue + lokales SDK-Echo + Toast, { queued: true }', async () => {
    const { mod } = await load(false);
    const r = await mod.applyUserUpdate('u1', UPDATES, 'mark');
    expect(r).toEqual({ queued: true });
    expect(mocks.enqueue).toHaveBeenCalledWith('u1', UPDATES, 'mark');
    // lokales Echo: update wurde (nicht awaitet) trotzdem abgesetzt
    expect(mocks.updateMock).toHaveBeenCalledWith(UPDATES);
    expect(mocks.showToast).toHaveBeenCalledTimes(1);
  });

  it('Offline-Toast erscheint nur einmal pro Session', async () => {
    const { mod } = await load(false);
    await mod.applyUserUpdate('u1', UPDATES, 'a');
    await mod.applyUserUpdate('u1', UPDATES, 'b');
    expect(mocks.enqueue).toHaveBeenCalledTimes(2);
    expect(mocks.showToast).toHaveBeenCalledTimes(1);
  });

  it('Echo-Write-Fehler wird verschluckt (Queue reicht)', async () => {
    mocks.state.updateResult = () => Promise.reject(new Error('offline echo fail'));
    const { mod } = await load(false);
    const r = await mod.applyUserUpdate('u1', UPDATES, 'mark');
    expect(r).toEqual({ queued: true });
    expect(mocks.enqueue).toHaveBeenCalled();
  });
});
