/**
 * useAdminDashboardData - Fetches analytics data from Firebase RTDB
 * for the admin dashboard overview and all tabs.
 */
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────

export interface DailyStats {
  date: string;
  totalEvents: number;
  pageViews: Record<string, number>;
  events: Record<string, number>;
  activeUsers: Record<string, number>;
  newUsers: number;
}

export interface UserMeta {
  uid: string;
  firstSeen: number;
  lastSeen: number;
  platform: string;
}

export interface UserDailyStats {
  events: Record<string, number>;
  pageViews: Record<string, number>;
  lastSeen: number;
  extension?: Record<string, number>;
}

export interface RealtimeUser {
  uid: string;
  page: string;
  since: number;
}

export interface ExtensionSession {
  platform: string;
  startedAt: number;
  endedAt: number;
  durationSec: number;
  seriesName: string;
  tmdbId: number;
  season: number;
  episodesWatched: number;
  autoTracked: boolean;
  bingeDetected: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function dateKey(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function monthKey(monthsAgo = 0): string {
  const d = new Date();
  d.setMonth(d.getMonth() - monthsAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

// ─── Hook ────────────────────────────────────────────────────────────────

export function useAdminDashboardData(daysRange = 30) {
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [userMetas, setUserMetas] = useState<Record<string, UserMeta>>({});
  const [realtimeUsers, setRealtimeUsers] = useState<RealtimeUser[]>([]);
  const [userProfiles, setUserProfiles] = useState<
    Record<string, { displayName: string; photoURL: string; username: string }>
  >({});
  const [extensionSessions, setExtensionSessions] = useState<Record<string, ExtensionSession[]>>(
    {}
  );
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Load global daily stats
  useEffect(() => {
    const loadDailyStats = async () => {
      setLoading(true);
      const db = firebase.database();
      const stats: DailyStats[] = [];

      for (let i = 0; i < daysRange; i++) {
        const dk = dateKey(i);
        try {
          const snap = await db.ref(`analytics/global/daily/${dk}`).once('value');
          const val = snap.val();
          if (val) {
            stats.push({
              date: dk,
              totalEvents: val.totalEvents || 0,
              pageViews: val.pageViews || {},
              events: val.events || {},
              activeUsers: val.activeUsers || {},
              newUsers: val.newUsers || 0,
            });
          } else {
            stats.push({
              date: dk,
              totalEvents: 0,
              pageViews: {},
              events: {},
              activeUsers: {},
              newUsers: 0,
            });
          }
        } catch {
          stats.push({
            date: dk,
            totalEvents: 0,
            pageViews: {},
            events: {},
            activeUsers: {},
            newUsers: 0,
          });
        }
      }

      setDailyStats(stats);
      setLoading(false);
    };

    loadDailyStats();
  }, [daysRange, refreshKey]);

  // Load user metas
  useEffect(() => {
    const db = firebase.database();
    const ref = db.ref('analytics/users');

    ref
      .once('value')
      .then((snap) => {
        const val = snap.val();
        if (!val) return;

        const metas: Record<string, UserMeta> = {};
        for (const uid of Object.keys(val)) {
          if (val[uid]?.meta) {
            metas[uid] = { uid, ...val[uid].meta };
          }
        }
        setUserMetas(metas);
      })
      .catch(() => {});

    return () => {};
  }, [refreshKey]);

  // Load user profiles for display names
  useEffect(() => {
    const db = firebase.database();
    db.ref('users')
      .once('value')
      .then((snap) => {
        const val = snap.val();
        if (!val) return;
        const profiles: typeof userProfiles = {};
        for (const uid of Object.keys(val)) {
          profiles[uid] = {
            displayName: val[uid]?.displayName || '',
            photoURL: val[uid]?.photoURL || '',
            username: val[uid]?.username || '',
          };
        }
        setUserProfiles(profiles);
      })
      .catch(() => {});
  }, [refreshKey]);

  // Realtime users listener
  useEffect(() => {
    const db = firebase.database();
    const ref = db.ref('analytics/global/realtime/activeUsers');

    const handler = ref.on('value', (snap) => {
      const val = snap.val();
      if (!val) {
        setRealtimeUsers([]);
        return;
      }
      const users: RealtimeUser[] = Object.entries(val).map(([uid, data]) => ({
        uid,
        page: (data as { page?: string })?.page || 'unknown',
        since: (data as { since?: number })?.since || 0,
      }));
      setRealtimeUsers(users);
    });

    return () => ref.off('value', handler);
  }, []);

  // Load extension sessions for today
  useEffect(() => {
    const db = firebase.database();
    const today = dateKey(0);

    db.ref('analytics/users')
      .once('value')
      .then((snap) => {
        const val = snap.val();
        if (!val) return;

        const sessions: Record<string, ExtensionSession[]> = {};
        for (const uid of Object.keys(val)) {
          const userSessions = val[uid]?.extension?.sessions?.[today];
          if (userSessions) {
            sessions[uid] = Object.values(userSessions);
          }
        }
        setExtensionSessions(sessions);
      })
      .catch(() => {});
  }, [refreshKey]);

  // ─── Computed Metrics ────────────────────────────────────────────────

  const today = dailyStats[0];
  const yesterday = dailyStats[1];

  const dauToday = today ? Object.keys(today.activeUsers).length : 0;
  const dauYesterday = yesterday ? Object.keys(yesterday.activeUsers).length : 0;
  const dauDelta = dauYesterday > 0 ? ((dauToday - dauYesterday) / dauYesterday) * 100 : 0;

  const eventsToday = today?.totalEvents || 0;
  const eventsYesterday = yesterday?.totalEvents || 0;
  const eventsDelta =
    eventsYesterday > 0 ? ((eventsToday - eventsYesterday) / eventsYesterday) * 100 : 0;

  const totalUsers = Object.keys(userMetas).length;

  // Extension users (users with platform = 'both' or any extension events)
  const extensionUserCount = Object.values(userMetas).filter(
    (m) => m.platform === 'extension' || m.platform === 'both'
  ).length;

  // DAU sparkline data (last 14 days, reversed for chart)
  const dauSparkline = useMemo(
    () =>
      dailyStats
        .slice(0, 14)
        .map((d) => ({
          date: d.date,
          value: Object.keys(d.activeUsers).length,
        }))
        .reverse(),
    [dailyStats]
  );

  // Events sparkline
  const eventsSparkline = useMemo(
    () =>
      dailyStats
        .slice(0, 14)
        .map((d) => ({
          date: d.date,
          value: d.totalEvents,
        }))
        .reverse(),
    [dailyStats]
  );

  // Top events today
  const topEvents = useMemo(() => {
    if (!today?.events) return [];
    return Object.entries(today.events)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 15)
      .map(([name, count]) => ({ name, count: count as number }));
  }, [today]);

  // Top pages today
  const topPages = useMemo(() => {
    if (!today?.pageViews) return [];
    return Object.entries(today.pageViews)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([name, count]) => ({ name, count: count as number }));
  }, [today]);

  // Activity chart data (30 days reversed)
  const activityChartData = useMemo(
    () =>
      dailyStats
        .slice(0, daysRange)
        .map((d) => ({
          date: d.date.slice(5), // MM-DD
          dau: Object.keys(d.activeUsers).length,
          events: d.totalEvents,
          newUsers: d.newUsers,
        }))
        .reverse(),
    [dailyStats, daysRange]
  );

  // Hourly heatmap (aggregated from events)
  // We'll derive this from raw events later; for now use page_view counts

  // Users list for UsersTab
  const usersList = useMemo(() => {
    return Object.entries(userMetas)
      .map(([uid, meta]) => ({
        uid,
        displayName:
          userProfiles[uid]?.displayName ||
          userProfiles[uid]?.username ||
          (uid === 'undefined' ? 'Unbekannt (Extension)' : uid.slice(0, 8)),
        photoURL: userProfiles[uid]?.photoURL || '',
        username: userProfiles[uid]?.username || '',
        firstSeen: meta.firstSeen,
        lastSeen: meta.lastSeen,
        platform: meta.platform,
        isOnline: realtimeUsers.some((u) => u.uid === uid),
      }))
      .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  }, [userMetas, userProfiles, realtimeUsers]);

  // Per-user daily stats loader
  const loadUserDailyStats = useCallback(
    async (uid: string, days = 7): Promise<UserDailyStats[]> => {
      const db = firebase.database();
      const stats: UserDailyStats[] = [];
      for (let i = 0; i < days; i++) {
        const dk = dateKey(i);
        try {
          const snap = await db.ref(`analytics/users/${uid}/daily/${dk}`).once('value');
          const val = snap.val();
          if (val) {
            stats.push({
              events: val.events || {},
              pageViews: val.pageViews || {},
              lastSeen: val.lastSeen || 0,
              extension: val.extension,
            });
          }
        } catch {
          // skip
        }
      }
      return stats;
    },
    []
  );

  // Per-user raw events loader
  const loadUserEvents = useCallback(async (uid: string, date: string) => {
    const db = firebase.database();
    try {
      const snap = await db.ref(`analytics/users/${uid}/events/${date}`).once('value');
      const val = snap.val();
      if (!val) return [];
      const allEvents: Array<{ e: string; p?: Record<string, unknown>; t: number }> = [];
      for (const batch of Object.values(val) as Array<{ events?: unknown[] }>) {
        if (batch?.events) {
          allEvents.push(
            ...(batch.events as Array<{ e: string; p?: Record<string, unknown>; t: number }>)
          );
        }
      }
      return allEvents.sort((a, b) => b.t - a.t);
    } catch {
      return [];
    }
  }, []);

  // Load all raw events for today across all users
  const loadAllRawEvents = useCallback(async (date?: string) => {
    const db = firebase.database();
    const targetDate = date || dateKey(0);
    try {
      const snap = await db.ref('analytics/users').once('value');
      const val = snap.val();
      if (!val) return [];
      const allEvents: Array<{
        e: string;
        p?: Record<string, unknown>;
        t: number;
        uid: string;
      }> = [];
      for (const uid of Object.keys(val)) {
        const dayEvents = val[uid]?.events?.[targetDate];
        if (!dayEvents) continue;
        for (const batch of Object.values(dayEvents) as Array<{ events?: unknown[] }>) {
          if (batch?.events) {
            for (const ev of batch.events as Array<{
              e: string;
              p?: Record<string, unknown>;
              t: number;
            }>) {
              allEvents.push({ ...ev, uid });
            }
          }
        }
      }
      return allEvents.sort((a, b) => b.t - a.t);
    } catch {
      return [];
    }
  }, []);

  return {
    loading,
    refresh,
    // KPIs
    dauToday,
    dauDelta,
    eventsToday,
    eventsDelta,
    totalUsers,
    extensionUserCount,
    realtimeUsers,
    // Sparklines
    dauSparkline,
    eventsSparkline,
    // Charts
    activityChartData,
    topEvents,
    topPages,
    // Users
    usersList,
    userProfiles,
    loadUserDailyStats,
    loadUserEvents,
    // Extension
    extensionSessions,
    // Raw events
    loadAllRawEvents,
    // Daily stats
    dailyStats,
  };
}
