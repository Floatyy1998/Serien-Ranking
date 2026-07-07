// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type ValueCb = (snap: { val: () => unknown }) => void;

const fb = vi.hoisted(() => {
  const state = {
    ticketsData: null as unknown,
    listeners: [] as ValueCb[],
    updateCalls: [] as Array<{ path: string; value: unknown }>,
    setCalls: [] as Array<{ path: string; value: unknown }>,
    removeCalls: [] as string[],
    deletedUrls: [] as string[],
  };
  const makeRef = (path: string) => {
    const refObj: Record<string, unknown> = { path };
    refObj.orderByKey = () => refObj;
    refObj.limitToLast = () => refObj;
    refObj.on = (_e: string, cb: ValueCb) => {
      state.listeners.push(cb);
      return cb;
    };
    refObj.off = () => {};
    refObj.update = async (value: unknown) => {
      state.updateCalls.push({ path, value });
    };
    refObj.set = async (value: unknown) => {
      state.setCalls.push({ path, value });
    };
    refObj.remove = async () => {
      state.removeCalls.push(path);
    };
    refObj.push = () => ({ key: 'push-id' });
    return refObj;
  };
  const ref = (path?: string) => makeRef(path ?? '');
  const database = Object.assign(() => ({ ref }), {});
  const storage = () => ({
    refFromURL: (url: string) => ({
      delete: async () => {
        state.deletedUrls.push(url);
      },
    }),
  });
  return { state, ref, database, storage };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database, storage: fb.storage } }));
vi.mock('firebase/compat/database', () => ({}));
vi.mock('firebase/compat/storage', () => ({}));

const authState = vi.hoisted(() => ({
  user: { uid: 'admin', displayName: 'Boss' } as { uid: string; displayName?: string } | null,
}));
vi.mock('../../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const notify = vi.hoisted(() => ({ sendNotificationToUser: vi.fn(async () => {}) }));
vi.mock('../../../../hooks/useDiscussionHelpers', () => ({
  sendNotificationToUser: notify.sendNotificationToUser,
}));

const searchParamsState = vi.hoisted(() => ({ params: new URLSearchParams() }));
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [searchParamsState.params, vi.fn()] as const,
}));

import { useTicketsData } from './useTicketsData';

function fireTickets(data: unknown) {
  act(() => fb.state.listeners[0]?.({ val: () => data }));
}

const SAMPLE = {
  t1: {
    id: 't1',
    title: 'Login kaputt',
    description: 'geht nicht',
    createdByName: 'Alice',
    createdBy: 'user-a',
    status: 'open',
    ticketType: 'bug',
    updatedAt: '2026-05-01T00:00:00Z',
    screenshots: ['https://cdn/a.png'],
  },
  t2: {
    id: 't2',
    title: 'Dark Mode Wunsch',
    description: 'bitte',
    createdByName: 'Bob',
    createdBy: 'user-b',
    status: 'done',
    ticketType: 'feature',
    updatedAt: '2026-06-01T00:00:00Z',
  },
};

beforeEach(() => {
  fb.state.listeners = [];
  fb.state.updateCalls = [];
  fb.state.setCalls = [];
  fb.state.removeCalls = [];
  fb.state.deletedUrls = [];
  notify.sendNotificationToUser.mockClear();
  authState.user = { uid: 'admin', displayName: 'Boss' };
  searchParamsState.params = new URLSearchParams();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('useTicketsData – list & filter', () => {
  it('lädt Tickets (neueste zuerst) und berechnet Counts', async () => {
    const { result } = renderHook(() => useTicketsData());
    fireTickets(SAMPLE);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tickets.map((t) => t.id)).toEqual(['t2', 't1']);
    expect(result.current.counts.all).toBe(2);
    expect(result.current.counts.bug).toBe(1);
    expect(result.current.counts.feature).toBe(1);
    expect(result.current.counts.open).toBe(1);
  });

  it('filtert nach Status, Typ und Suchbegriff', async () => {
    const { result } = renderHook(() => useTicketsData());
    fireTickets(SAMPLE);
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.setStatusFilter('open'));
    expect(result.current.filtered.map((t) => t.id)).toEqual(['t1']);

    act(() => result.current.setStatusFilter('all'));
    act(() => result.current.setTypeFilter('feature'));
    expect(result.current.filtered.map((t) => t.id)).toEqual(['t2']);

    act(() => result.current.setTypeFilter('all'));
    act(() => result.current.setSearchQuery('login'));
    expect(result.current.filtered.map((t) => t.id)).toEqual(['t1']);
  });

  it('übernimmt expandedId aus dem ticket-Query-Param', () => {
    searchParamsState.params = new URLSearchParams('ticket=t9');
    const { result } = renderHook(() => useTicketsData());
    expect(result.current.expandedId).toBe('t9');
  });
});

describe('useTicketsData – mutations', () => {
  it('updateTicket schreibt Update und benachrichtigt bei Statuswechsel', async () => {
    const { result } = renderHook(() => useTicketsData());
    fireTickets(SAMPLE);
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.updateTicket('t1', { status: 'in-progress' });
    });
    expect(fb.state.updateCalls.some((c) => c.path === 'bugTickets/t1')).toBe(true);
    expect(notify.sendNotificationToUser).toHaveBeenCalledWith('user-a', expect.any(Object));
  });

  it('updateTicket löscht Screenshots bei Abschluss-Status', async () => {
    const { result } = renderHook(() => useTicketsData());
    fireTickets(SAMPLE);
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.updateTicket('t1', { status: 'done' });
    });
    expect(fb.state.deletedUrls).toContain('https://cdn/a.png');
  });

  it('addAdminComment schreibt Kommentar + updatedAt und benachrichtigt', async () => {
    const { result } = renderHook(() => useTicketsData());
    fireTickets(SAMPLE);
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.addAdminComment('t1', 'Wir schauen es uns an');
    });
    expect(fb.state.setCalls.some((c) => c.path === 'bugTickets/t1/comments/push-id')).toBe(true);
    expect(fb.state.setCalls.some((c) => c.path === 'bugTickets/t1/updatedAt')).toBe(true);
    expect(notify.sendNotificationToUser).toHaveBeenCalled();
  });

  it('addAdminNote schreibt eine interne Notiz', async () => {
    const { result } = renderHook(() => useTicketsData());
    fireTickets(SAMPLE);
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.addAdminNote('t1', 'Interner Hinweis');
    });
    expect(fb.state.setCalls.some((c) => c.path === 'bugTickets/t1/adminNotes/push-id')).toBe(true);
  });

  it('deleteTicket entfernt Ticket samt Screenshots', async () => {
    const { result } = renderHook(() => useTicketsData());
    fireTickets(SAMPLE);
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.deleteTicket('t1');
    });
    expect(fb.state.removeCalls).toContain('bugTickets/t1');
    expect(fb.state.deletedUrls).toContain('https://cdn/a.png');
  });
});
