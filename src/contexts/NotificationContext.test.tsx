// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

interface FakeSnapshot {
  val: () => unknown;
  exists: () => boolean;
}
interface FakeRef {
  orderByChild: () => FakeRef;
  limitToLast: () => FakeRef;
  on: (event: string, cb: (snap: FakeSnapshot) => void) => (snap: FakeSnapshot) => void;
  off: () => void;
  once: () => Promise<FakeSnapshot>;
  push: () => Promise<{ key: string }>;
  update: () => Promise<void>;
  set: () => Promise<void>;
  remove: () => Promise<void>;
}

const fb = vi.hoisted(() => {
  const emptySnap: FakeSnapshot = { val: () => null, exists: () => false };
  const makeRef = (): FakeRef => {
    const ref: FakeRef = {
      orderByChild: () => ref,
      limitToLast: () => ref,
      // Fire the listener once with an empty snapshot so the provider
      // resolves to an empty (but exercised) notifications list.
      on: (_event, cb) => {
        cb(emptySnap);
        return cb;
      },
      off: () => {},
      once: async () => emptySnap,
      push: async () => ({ key: 'n1' }),
      update: async () => {},
      set: async () => {},
      remove: async () => {},
    };
    return ref;
  };
  return { database: () => ({ ref: () => makeRef() }) };
});

const authUser = vi.hoisted(() => ({ uid: 'u1' }));
vi.mock('../AuthContext', () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

import { NotificationProvider } from './NotificationContext';
import { useNotifications } from './NotificationContextDef';

const Consumer = () => {
  const { notifications, unreadCount } = useNotifications();
  return <div data-testid="notif">{`${notifications.length}|${unreadCount}`}</div>;
};

afterEach(() => {
  cleanup();
});

describe('NotificationProvider', () => {
  it('mounts, exposes the notification context and renders children', () => {
    render(
      <NotificationProvider>
        <Consumer />
      </NotificationProvider>
    );
    expect(screen.getByTestId('notif').textContent).toBe('0|0');
  });
});
