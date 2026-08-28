import { useCallback, useEffect, useMemo, useState } from 'react';
import { dbRef } from '../../services/db/ref';

export interface DailyStats {
  date: string;
  totalEvents: number;
  pageViews: Record<string, number>;
  events: Record<string, number>;
  activeUsers: Record<string, number>;
  newUsers: number;
}

/**
 * Reichweite aus `analytics/reach/daily` — vom Backend-Cron gezaehlt, aus
 * Firebase Auth statt aus dem Analytics-Consent. Deshalb vollstaendig: hier
 * fehlen keine Nutzer, die den Cookie-Hinweis abgelehnt haben.
 */
export interface ReachStats {
  date: string;
  /** Konten insgesamt (Firebase Auth). */
  total: number;
  dau: number;
  /** Unterschiedliche Konten der letzten 7 Tage. */
  wau: number;
  /** Unterschiedliche Konten der letzten 30 Tage. */
  mau: number;
  /** Zeitpunkt des Zaehllaufs — der Zaehler laeuft stuendlich. */
  ts?: number;
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

/**
 * Welcher Tab welche Datenbereiche braucht. 11 der 22 Tabs holen ihre Daten
 * selbst und brauchen aus diesem Hook nichts — vorher loesten auch sie das
 * volle Analytics-Laden aus. Nicht aufgefuehrte Tabs laden nichts.
 *
 *  daily    analytics/global/daily ueber den gewaehlten Zeitraum (KPIs, Charts)
 *  users    analytics/users + Anzeigenamen aus dem Suchindex
 *  live     on('value') auf die aktiven Nutzer
 */
const TAB_DATENBEDARF: Record<string, ReadonlyArray<'daily' | 'users' | 'live'>> = {
  overview: ['daily', 'users', 'live'],
  realtime: ['users', 'live'],
  users: ['users', 'live'],
  activity: ['users'],
  extension: ['users'],
  events: ['daily'],
};

export function useAdminDashboardData(daysRange = 30, activeTab = 'overview') {
  const braucht = useCallback(
    (bereich: 'daily' | 'users' | 'live') => (TAB_DATENBEDARF[activeTab] ?? []).includes(bereich),
    [activeTab]
  );
  const [loading, setLoading] = useState(true);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [reachStats, setReachStats] = useState<ReachStats[]>([]);
  const [userMetas, setUserMetas] = useState<Record<string, UserMeta>>({});
  const [realtimeUsers, setRealtimeUsers] = useState<RealtimeUser[]>([]);
  const [userProfiles, setUserProfiles] = useState<
    Record<string, { displayName: string; photoURL: string; username: string }>
  >({});
  const [extensionSessions, setExtensionSessions] = useState<Record<string, ExtensionSession[]>>(
    {}
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // Kein Auto-Refresh mehr. Der fruehere 10-Minuten-Timer lud ALLE Analytics
  // neu — unabhaengig davon, welcher Tab offen war und ob sich etwas geaendert
  // hatte. Die wirklich fluechtigen Daten (analytics/global/realtime) haengen
  // ohnehin an einem on('value')-Listener und kommen als Delta rein; alles
  // andere aktualisiert der Admin bewusst, mit sichtbarem Datenalter.

  // Load global daily stats
  useEffect(() => {
    if (!braucht('daily')) {
      setLoading(false);
      return;
    }
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
      setLastUpdated(Date.now());
      setLoading(false);
    };

    loadDailyStats();
  }, [daysRange, refreshKey, braucht]);

  // Load user metas + extension sessions for today in EINEM Read.
  // Reichweite: ein flacher Knoten mit wenigen Zahlen je Tag — ein Read reicht.
  useEffect(() => {
    if (!braucht('daily')) return;
    let abgebrochen = false;
    dbRef('analytics/reach/daily')
      .once('value')
      .then((snap) => {
        if (abgebrochen) return;
        const val = (snap.val() || {}) as Record<string, Omit<ReachStats, 'date'>>;
        const list = Object.entries(val)
          .map(([date, s]) => ({
            date,
            total: s?.total ?? 0,
            dau: s?.dau ?? 0,
            wau: s?.wau ?? 0,
            mau: s?.mau ?? 0,
            ts: s?.ts,
          }))
          .sort((a, b) => b.date.localeCompare(a.date));
        setReachStats(list);
      })
      .catch(() => {
        if (!abgebrochen) setReachStats([]);
      });
    return () => {
      abgebrochen = true;
    };
  }, [refreshKey, braucht]);

  // Vorher liefen zwei separate once('value') auf analytics/users (haelfte
  // der Bytes gedoppelt). Beide States werden aus demselben Snapshot befuellt.
  useEffect(() => {
    if (!braucht('users')) return;
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
  }, [refreshKey, braucht]);

  // Anzeigenamen aus dem Suchindex statt aus den Nutzerknoten.
  //
  // Vorher lief pro UID ein once('value') auf users/$uid — das zog die
  // KOMPLETTE Watch-History, Bewertungen, Wrapped-Events, Benachrichtigungen,
  // Pets und Push-Tokens in den Admin-Browser, um daraus drei Felder zu lesen.
  // Abruf ist Verarbeitung (Art. 4 Nr. 2 DSGVO), also ist das mehr, als der
  // Zweck hergibt — und teuer war es obendrein.
  //
  // userSearchIndex/$uid enthaelt genau username, displayName und photoURL
  // (buildUserSearchIndexEntry) und ist ein flacher Knoten: ein Read statt N.
  useEffect(() => {
    if (!braucht('users')) return;
    const uids = new Set([...Object.keys(userMetas), ...realtimeUsers.map((u) => u.uid)]);
    if (uids.size === 0) return;

    dbRef('userSearchIndex')
      .once('value')
      .then((snap) => {
        const index =
          (snap.val() as Record<
            string,
            { displayName?: string; photoURL?: string; username?: string }
          > | null) || {};
        const profiles: typeof userProfiles = {};
        for (const uid of uids) {
          const entry = index[uid];
          if (!entry) continue;
          profiles[uid] = {
            displayName: entry.displayName || '',
            photoURL: entry.photoURL || '',
            username: entry.username || '',
          };
        }
        setUserProfiles(profiles);
      })
      .catch((error) => console.error('Anzeigenamen konnten nicht geladen werden:', error));
  }, [userMetas, realtimeUsers, refreshKey, braucht]);

  // Realtime users listener
  useEffect(() => {
    if (!braucht('live')) {
      setRealtimeUsers([]);
      return;
    }
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
  }, [braucht]);

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

  const reachLatest = reachStats[0] ?? null;

  // Kurve chronologisch, auf den gewaehlten Zeitraum begrenzt.
  const reachChartData = useMemo(
    () =>
      reachStats
        .slice(0, daysRange)
        .map((r) => ({ date: r.date.slice(5), dau: r.dau, wau: r.wau, mau: r.mau }))
        .reverse(),
    [reachStats, daysRange]
  );

  return {
    loading,
    refresh,
    lastUpdated,
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
    // Reichweite (consentfrei, aus Firebase Auth)
    reachStats,
    reachLatest,
    reachChartData,
  };
}
