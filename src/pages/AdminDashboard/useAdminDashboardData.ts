import { useCallback, useEffect, useMemo, useState } from 'react';
import { dbRef, paths } from '../../services/db/ref';

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
      const stats: DailyStats[] = [];

      for (let i = 0; i < daysRange; i++) {
        const dk = dateKey(i);
        try {
          const snap = await dbRef(`analytics/global/daily/${dk}`).once('value');
          const val = snap.val();
          if (val) {
            // Zähler liegen geshardet unter shards/{n}; Legacy-Daten (vor der
            // Sharding-Umstellung) direkt auf dem Tages-Knoten — beides summieren.
            let totalEvents = val.totalEvents || 0;
            const events: Record<string, number> = { ...(val.events || {}) };
            const pageViews: Record<string, number> = { ...(val.pageViews || {}) };
            for (const s of Object.values(val.shards || {}) as Array<{
              totalEvents?: number;
              events?: Record<string, number>;
              pageViews?: Record<string, number>;
            }>) {
              totalEvents += s.totalEvents || 0;
              for (const [k, v] of Object.entries(s.events || {})) events[k] = (events[k] || 0) + v;
              for (const [k, v] of Object.entries(s.pageViews || {}))
                pageViews[k] = (pageViews[k] || 0) + v;
            }
            stats.push({
              date: dk,
              totalEvents,
              pageViews,
              events,
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

  // Load user metas + extension sessions for today in EINEM Read.
  // Vorher liefen zwei separate once('value') auf analytics/users (haelfte
  // der Bytes gedoppelt). Beide States werden aus demselben Snapshot befuellt.
  useEffect(() => {
    const today = dateKey(0);

    dbRef('analytics/users')
      .once('value')
      .then((snap) => {
        const val = snap.val();
        if (!val) return;

        const metas: Record<string, UserMeta> = {};
        const sessions: Record<string, ExtensionSession[]> = {};
        for (const uid of Object.keys(val)) {
          if (val[uid]?.meta) {
            metas[uid] = { uid, ...val[uid].meta };
          }
          const userSessions = val[uid]?.extension?.sessions?.[today];
          if (userSessions) {
            sessions[uid] = Object.values(userSessions);
          }
        }
        setUserMetas(metas);
        setExtensionSessions(sessions);
      })
      .catch((error) =>
        console.error('Analytics-Nutzerdaten konnten nicht geladen werden:', error)
      );
  }, [refreshKey]);

  // Load user profiles for display names (einzeln pro UID statt /users komplett)
  useEffect(() => {
    const uids = new Set([...Object.keys(userMetas), ...realtimeUsers.map((u) => u.uid)]);
    if (uids.size === 0) return;

    Promise.all(
      [...uids].map(async (uid) => {
        try {
          const snap = await dbRef(paths.user(uid)).once('value');
          const val = snap.val();
          if (!val) return null;
          return {
            uid,
            displayName: val.displayName || '',
            photoURL: val.photoURL || '',
            username: val.username || '',
          };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      const profiles: typeof userProfiles = {};
      for (const r of results) {
        if (r)
          profiles[r.uid] = {
            displayName: r.displayName,
            photoURL: r.photoURL,
            username: r.username,
          };
      }
      setUserProfiles(profiles);
    });
  }, [userMetas, realtimeUsers, refreshKey]);

  // Realtime users listener
  useEffect(() => {
    const ref = dbRef('analytics/global/realtime/activeUsers');

    const handler = ref.on('value', (snap) => {
      const val = snap.val();
      if (!val) {
        setRealtimeUsers([]);
        return;
      }
      // Heartbeat-Präsenz: Einträge ohne frischen ts-Stempel sind verwaiste
      // Sessions (kein onDisconnect mehr) — nur die letzten 10 Min zählen.
      const cutoff = Date.now() - 10 * 60 * 1000;
      const users: RealtimeUser[] = Object.entries(val)
        .filter(([, data]) => {
          const d = data as { ts?: number; since?: number };
          return (d?.ts || d?.since || 0) >= cutoff;
        })
        .map(([uid, data]) => ({
          uid,
          page: (data as { page?: string })?.page || 'unknown',
          since: (data as { since?: number })?.since || 0,
        }));
      setRealtimeUsers(users);
    });

    return () => ref.off('value', handler);
  }, []);

  // Computed metrics

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

  const topEvents = useMemo(() => {
    if (!today?.events) return [];
    return Object.entries(today.events)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 15)
      .map(([name, count]) => ({ name, count: count as number }));
  }, [today]);

  const topPages = useMemo(() => {
    if (!today?.pageViews) return [];
    return Object.entries(today.pageViews)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([name, count]) => ({ name, count: count as number }));
  }, [today]);

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

  const loadUserDailyStats = useCallback(
    async (uid: string, days = 7): Promise<UserDailyStats[]> => {
      const stats: UserDailyStats[] = [];
      for (let i = 0; i < days; i++) {
        const dk = dateKey(i);
        try {
          const snap = await dbRef(`analytics/users/${uid}/daily/${dk}`).once('value');
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

  const loadUserEvents = useCallback(async (uid: string, date: string) => {
    try {
      const snap = await dbRef(`analytics/users/${uid}/events/${date}`).once('value');
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

  const loadAllRawEvents = useCallback(async (date?: string) => {
    const targetDate = date || dateKey(0);
    try {
      const snap = await dbRef('analytics/users').once('value');
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
