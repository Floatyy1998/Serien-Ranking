// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BugTicket } from './types';

type ValueCb = (snap: { val: () => unknown }) => void;

const fb = vi.hoisted(() => {
  const state = {
    dataByPath: {} as Record<string, unknown>,
    listeners: [] as Array<{ path: string; cb: ValueCb }>,
    setCalls: [] as Array<{ path: string; value: unknown }>,
    updateCalls: [] as Array<{ path: string; value: unknown }>,
    removeCalls: [] as string[],
    putFiles: [] as string[],
  };
  const snap = (path: string) => ({ val: () => state.dataByPath[path] ?? null });
  const makeRef = (path: string) => {
    const refObj: Record<string, unknown> = { path };
    refObj.orderByChild = () => refObj;
    refObj.equalTo = () => refObj;
    refObj.limitToLast = () => refObj;
    refObj.on = (_e: string, cb: ValueCb) => {
      state.listeners.push({ path, cb });
      return cb;
    };
    refObj.off = () => {};
    refObj.once = async () => snap(path);
    refObj.set = async (value: unknown) => {
      state.setCalls.push({ path, value });
    };
    refObj.update = async (value: unknown) => {
      state.updateCalls.push({ path, value });
    };
    refObj.remove = async () => {
      state.removeCalls.push(path);
    };
    refObj.push = () => ({ key: 'push-id' });
    return refObj;
  };
  const ref = (path?: string) => makeRef(path ?? '');
  const database = Object.assign(() => ({ ref }), {});
  const storageRef = {
    put: async (f: File) => {
      state.putFiles.push(f.name);
    },
    getDownloadURL: async () => 'https://cdn/screenshot.png',
  };
  const storage = () => ({
    ref: () => storageRef,
    refFromURL: () => ({ delete: async () => {} }),
  });
  return { state, ref, database, storage };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database, storage: fb.storage } }));
vi.mock('firebase/compat/database', () => ({}));
vi.mock('firebase/compat/storage', () => ({}));

const authState = vi.hoisted(() => ({
  user: null as { uid: string; displayName?: string } | null,
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const notify = vi.hoisted(() => ({ sendNotificationToUser: vi.fn(async () => {}) }));
vi.mock('../../hooks/useDiscussionHelpers', () => ({
  sendNotificationToUser: notify.sendNotificationToUser,
}));

import { useBugReportData } from './useBugReportData';

beforeEach(() => {
  fb.state.dataByPath = {};
  fb.state.listeners = [];
  fb.state.setCalls = [];
  fb.state.updateCalls = [];
  fb.state.removeCalls = [];
  fb.state.putFiles = [];
  notify.sendNotificationToUser.mockClear();
  authState.user = { uid: 'u1', displayName: 'Tester' };
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useBugReportData – listener', () => {
  it('lädt eigene Tickets und sortiert neueste zuerst', async () => {
    const { result } = renderHook(() => useBugReportData());
    const cb = fb.state.listeners[0]?.cb;
    act(() =>
      cb?.({
        val: () => ({
          a: { id: 'a', createdAt: '2026-01-01T00:00:00Z', title: 'Alt' },
          b: { id: 'b', createdAt: '2026-05-01T00:00:00Z', title: 'Neu' },
        }),
      })
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tickets.map((t) => t.id)).toEqual(['b', 'a']);
  });

  it('subscribed nicht ohne User', () => {
    authState.user = null;
    const { result } = renderHook(() => useBugReportData());
    expect(fb.state.listeners).toHaveLength(0);
    expect(result.current.loading).toBe(true);
  });
});

describe('useBugReportData – mutations', () => {
  it('createTicket schreibt Ticket und benachrichtigt den Admin', async () => {
    const { result } = renderHook(() => useBugReportData());
    let ok = false;
    await act(async () => {
      ok = await result.current.createTicket({
        ticketType: 'bug',
        title: 'Absturz',
        description: 'desc',
        stepsToReproduce: 'steps',
        screenshots: [],
        priority: 'high',
      });
    });
    expect(ok).toBe(true);
    const setCall = fb.state.setCalls.find((c) => c.path === 'bugTickets/push-id');
    expect((setCall?.value as BugTicket)?.title).toBe('Absturz');
    expect(notify.sendNotificationToUser).toHaveBeenCalled();
  });

  it('createTicket gibt false ohne User zurück', async () => {
    authState.user = null;
    const { result } = renderHook(() => useBugReportData());
    let ok = true;
    await act(async () => {
      ok = await result.current.createTicket({
        ticketType: 'feature',
        title: 'x',
        description: 'd',
        stepsToReproduce: 's',
        screenshots: [],
        priority: 'low',
      });
    });
    expect(ok).toBe(false);
    expect(fb.state.setCalls).toHaveLength(0);
  });

  it('addComment schreibt Kommentar + updatedAt und benachrichtigt', async () => {
    fb.state.dataByPath['bugTickets/t1'] = { title: 'Bug T', ticketType: 'bug' };
    const { result } = renderHook(() => useBugReportData());
    let ok = false;
    await act(async () => {
      ok = await result.current.addComment('t1', 'Mein Kommentar');
    });
    expect(ok).toBe(true);
    expect(fb.state.setCalls.some((c) => c.path === 'bugTickets/t1/comments/push-id')).toBe(true);
    expect(fb.state.setCalls.some((c) => c.path === 'bugTickets/t1/updatedAt')).toBe(true);
    expect(notify.sendNotificationToUser).toHaveBeenCalled();
  });

  it('updateTicket aktualisiert Felder mit Timestamp', async () => {
    const { result } = renderHook(() => useBugReportData());
    let ok = false;
    await act(async () => {
      ok = await result.current.updateTicket('t1', { title: 'Neu' });
    });
    expect(ok).toBe(true);
    const upd = fb.state.updateCalls.find((c) => c.path === 'bugTickets/t1');
    expect((upd?.value as Record<string, unknown>)?.title).toBe('Neu');
    expect((upd?.value as Record<string, unknown>)?.updatedAt).toBeTypeOf('string');
  });

  it('uploadScreenshot lädt Datei hoch und liefert URL', async () => {
    const { result } = renderHook(() => useBugReportData());
    let url: string | null = null;
    await act(async () => {
      url = await result.current.uploadScreenshot(new File(['x'], 'shot.png'));
    });
    expect(url).toBe('https://cdn/screenshot.png');
    expect(fb.state.putFiles).toContain('shot.png');
  });
});
