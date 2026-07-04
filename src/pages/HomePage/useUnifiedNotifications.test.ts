// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { ADMIN_UID } from '../../config/admin';

// --- Firebase compat mock ---------------------------------------------------
const fb = vi.hoisted(() => {
  const state: { data: unknown } = { data: null };
  const set = vi.fn(() => Promise.resolve());
  const once = vi.fn(() => Promise.resolve({ val: () => state.data }));
  const ref = vi.fn(() => ({ once, set }));
  const database = vi.fn(() => ({ ref }));
  return { state, set, once, ref, database };
});
vi.mock('firebase/compat/app', () => ({
  default: { database: fb.database },
}));
vi.mock('firebase/compat/database', () => ({}));

// --- Context mocks ----------------------------------------------------------
type FriendsState = {
  unreadActivitiesCount: number;
  lastReadActivitiesTime: number;
  friendActivities: Record<string, unknown>[];
  friendRequests: Record<string, unknown>[];
  unreadRequestsCount: number;
  markActivitiesAsRead: () => void;
  markRequestsAsRead: () => void;
  acceptFriendRequest: (id: string) => void;
  declineFriendRequest: (id: string) => void;
};

const friends = vi.hoisted(() => ({
  value: null as unknown,
}));
vi.mock('../../contexts/OptimizedFriendsContext', () => ({
  useOptimizedFriends: () => friends.value,
}));

const notif = vi.hoisted(() => ({
  notifications: [] as Record<string, unknown>[],
  unreadCount: 0,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}));
vi.mock('../../contexts/NotificationContextDef', () => ({
  useNotifications: () => notif,
}));

const recs = vi.hoisted(() => ({
  recommendations: [] as Record<string, unknown>[],
  pendingCount: 0,
  accept: vi.fn(),
  decline: vi.fn(),
}));
vi.mock('../../hooks/useRecommendations', () => ({
  useRecommendations: () => recs,
}));

const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

import {
  useUnifiedNotifications,
  ANNOUNCEMENTS,
  formatNotificationTime,
} from './useUnifiedNotifications';

// Flush pending microtasks (firebase .once().then()) under fake timers,
// where waitFor's polling would otherwise never advance.
const flush = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
};

const defaultFriends = (): FriendsState => ({
  unreadActivitiesCount: 0,
  lastReadActivitiesTime: 0,
  friendActivities: [],
  friendRequests: [],
  unreadRequestsCount: 0,
  markActivitiesAsRead: vi.fn(),
  markRequestsAsRead: vi.fn(),
  acceptFriendRequest: vi.fn(),
  declineFriendRequest: vi.fn(),
});

beforeEach(() => {
  vi.useFakeTimers();
  // Nach allen Announcement-Daten → hydration markiert alle als gelesen
  vi.setSystemTime(new Date('2026-09-01T12:00:00Z'));
  fb.state.data = null;
  fb.set.mockClear();
  fb.once.mockClear();
  fb.ref.mockClear();
  fb.database.mockClear();
  friends.value = defaultFriends();
  notif.notifications = [];
  notif.unreadCount = 0;
  notif.markAsRead.mockClear();
  notif.markAllAsRead.mockClear();
  recs.recommendations = [];
  recs.pendingCount = 0;
  authState.user = { uid: 'u1' };
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('formatNotificationTime', () => {
  beforeEach(() => vi.setSystemTime(new Date('2026-09-01T12:00:00Z')));
  it('gerade eben', () => {
    expect(formatNotificationTime(Date.now())).toBe('gerade eben');
  });
  it('Minuten', () => {
    expect(formatNotificationTime(Date.now() - 5 * 60000)).toBe('vor 5 Min');
  });
  it('Stunden', () => {
    expect(formatNotificationTime(Date.now() - 3 * 3600000)).toBe('vor 3 Std');
  });
  it('Tage (Singular/Plural)', () => {
    expect(formatNotificationTime(Date.now() - 24 * 3600000)).toBe('vor 1 Tag');
    expect(formatNotificationTime(Date.now() - 48 * 3600000)).toBe('vor 2 Tagen');
  });
});

describe('useUnifiedNotifications', () => {
  it('enthält alle Feature-Announcements', () => {
    const { result } = renderHook(() => useUnifiedNotifications());
    const announcements = result.current.unifiedNotifications.filter(
      (n) => n.kind === 'announcement'
    );
    // limit 30 – aber ANNOUNCEMENTS < 30, alle vorhanden
    expect(announcements.length).toBe(Math.min(ANNOUNCEMENTS.length, 30));
  });

  it('markiert Announcements als gelesen nach Firebase-Hydration (Badge 0)', async () => {
    const { result } = renderHook(() => useUnifiedNotifications());
    expect(fb.once).toHaveBeenCalled();
    await flush();
    // Alle Announcements liegen vor systemTime → gelesen → kein Announcement-Badge
    expect(result.current.totalUnreadBadge).toBe(0);
  });

  it('mappt Freunde-Aktivitäten und filtert "gesehen"-Events heraus', () => {
    friends.value = {
      ...defaultFriends(),
      friendActivities: [
        {
          id: 'a1',
          type: 'series_rated',
          userName: 'Lisa',
          itemTitle: 'X',
          rating: 8,
          timestamp: 5,
          tmdbId: 42,
        },
        { id: 'a2', type: 'episode_watched', userName: 'Lisa', itemTitle: 'Y', timestamp: 6 },
      ],
    };
    const { result } = renderHook(() => useUnifiedNotifications());
    const acts = result.current.unifiedNotifications.filter((n) => n.kind === 'activity');
    expect(acts).toHaveLength(1);
    expect(acts[0].message).toContain('bewertet');
    expect(acts[0].message).toContain('(8/10)');
    expect(acts[0].navigateTo).toBe('/series/42');
    expect(acts[0].icon).toBe('star');
  });

  it('mappt Freundschaftsanfragen', () => {
    friends.value = {
      ...defaultFriends(),
      friendRequests: [{ id: 'r1', fromUsername: 'Max', timestamp: 10 }],
      unreadRequestsCount: 1,
    };
    const { result } = renderHook(() => useUnifiedNotifications());
    const reqs = result.current.unifiedNotifications.filter((n) => n.kind === 'request');
    expect(reqs).toHaveLength(1);
    expect(reqs[0].message).toBe('Max');
    expect(reqs[0].read).toBe(false);
  });

  it('mappt Bug-Ticket-Notifications mit Admin-Navigation', () => {
    authState.user = { uid: ADMIN_UID };
    notif.notifications = [
      {
        id: 'n1',
        type: 'bug_ticket_reply',
        title: 'Ticket',
        message: 'Antwort',
        timestamp: 20,
        read: false,
        data: { ticketId: 'T5', ticketType: 'bug' },
      },
    ];
    const { result } = renderHook(() => useUnifiedNotifications());
    const bug = result.current.unifiedNotifications.find((n) => n.kind === 'bug_ticket');
    expect(bug).toBeDefined();
    expect(bug?.navigateTo).toContain('/admin?tab=tickets&ticket=T5');
    expect(bug?.icon).toBe('bug');
  });

  it('nimmt nur pending Empfehlungen auf', () => {
    recs.recommendations = [
      {
        id: 'x1',
        status: 'pending',
        senderName: 'Ann',
        mediaTitle: 'Movie',
        mediaType: 'movie',
        mediaId: 7,
        timestamp: 30,
      },
      {
        id: 'x2',
        status: 'accepted',
        senderName: 'Bo',
        mediaTitle: 'Show',
        mediaType: 'series',
        mediaId: 8,
        timestamp: 31,
      },
    ];
    const { result } = renderHook(() => useUnifiedNotifications());
    const recItems = result.current.unifiedNotifications.filter((n) => n.kind === 'recommendation');
    expect(recItems).toHaveLength(1);
    expect(recItems[0].navigateTo).toBe('/movie/7');
    expect(recItems[0].recommendationData?.recId).toBe('x1');
  });

  it('sortiert nach timestamp absteigend', () => {
    friends.value = {
      ...defaultFriends(),
      friendRequests: [
        { id: 'old', fromUsername: 'A', timestamp: 1 },
        { id: 'new', fromUsername: 'B', timestamp: 999999999999 },
      ],
    };
    const { result } = renderHook(() => useUnifiedNotifications());
    const ts = result.current.unifiedNotifications.map((n) => n.timestamp);
    for (let i = 1; i < ts.length; i++) {
      expect(ts[i]).toBeLessThanOrEqual(ts[i - 1]);
    }
  });

  it('addiert die Unread-Counts der Quellen in totalUnreadBadge', async () => {
    friends.value = { ...defaultFriends(), unreadActivitiesCount: 2 };
    notif.unreadCount = 3;
    recs.pendingCount = 1;
    const { result } = renderHook(() => useUnifiedNotifications());
    await flush();
    // announcements gelesen (0) + 2 + 3 + 1 = 6
    expect(result.current.totalUnreadBadge).toBe(6);
  });

  it('handleMarkAllNotificationsRead ruft alle Mark-Funktionen und schreibt readTime', () => {
    const markActivitiesAsRead = vi.fn();
    const markRequestsAsRead = vi.fn();
    friends.value = { ...defaultFriends(), markActivitiesAsRead, markRequestsAsRead };
    const { result } = renderHook(() => useUnifiedNotifications());
    act(() => {
      result.current.handleMarkAllNotificationsRead();
    });
    expect(markActivitiesAsRead).toHaveBeenCalledTimes(1);
    expect(markRequestsAsRead).toHaveBeenCalledTimes(1);
    expect(notif.markAllAsRead).toHaveBeenCalledTimes(1);
    expect(fb.set).toHaveBeenCalled();
  });

  it('dismissAnnouncement schreibt den Announcement-Timestamp nach Firebase', async () => {
    // Hydration soll NICHT alle als gelesen markieren → früher systemTime setzen
    vi.setSystemTime(new Date('2000-01-01T00:00:00Z'));
    fb.state.data = 0; // readTime 0 → nichts gelesen
    const { result } = renderHook(() => useUnifiedNotifications());
    expect(fb.once).toHaveBeenCalled();
    await flush();
    fb.set.mockClear();
    const annId = ANNOUNCEMENTS[0].id;
    act(() => {
      result.current.dismissAnnouncement(annId);
    });
    expect(fb.set).toHaveBeenCalledWith(ANNOUNCEMENTS[0].timestamp);
  });
});
