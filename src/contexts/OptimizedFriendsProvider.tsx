import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { dbRef, dbGet, dbUpdate, userPath, paths } from '../services/db/ref';
import { useAuth } from './AuthContext';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import type { Friend, FriendActivity, FriendRequest } from '../types/Friend';
import {
  sendFriendRequestOp,
  acceptFriendRequestOp,
  declineFriendRequestOp,
  cancelFriendRequestOp,
  removeFriendOp,
  updateUserActivityOp,
} from './friendOperations';
import { OptimizedFriendsContext } from './OptimizedFriendsContext';

export const OptimizedFriendsProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth() || {};

  const {
    data: friendsData,
    loading: friendsLoading,
    refetch: refetchFriends,
  } = useEnhancedFirebaseCache<Record<string, Friend>>(user ? `users/${user.uid}/friends` : '', {
    ttl: 15 * 60 * 1000,
    useRealtimeListener: true,
    enableOfflineSupport: true,
    syncOnReconnect: true,
  });

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friendActivities, setFriendActivities] = useState<FriendActivity[]>([]);
  // loading direkt aus friendsLoading abgeleitet (vorher: useState + Effect-
  // Mirror — sinnloser Doppelzustand, der set-state-in-effect verletzte).
  const loading = user ? friendsLoading : false;
  const [lastReadRequestsTime, setLastReadRequestsTime] = useState<number>(0);
  const [lastReadActivitiesTime, setLastReadActivitiesTime] = useState<number>(0);
  const [unreadRequestsCount, setUnreadRequestsCount] = useState(0);
  const [unreadActivitiesCount, setUnreadActivitiesCount] = useState(0);
  const [readTimesLoaded, setReadTimesLoaded] = useState(false);

  const lastReadActivitiesTimeRef = useRef(lastReadActivitiesTime);
  const lastReadRequestsTimeRef = useRef(lastReadRequestsTime);
  const loadFriendActivitiesRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    lastReadActivitiesTimeRef.current = lastReadActivitiesTime;
  }, [lastReadActivitiesTime]);
  useEffect(() => {
    lastReadRequestsTimeRef.current = lastReadRequestsTime;
  }, [lastReadRequestsTime]);

  const friends: Friend[] = useMemo(
    () => (friendsData ? Object.values(friendsData) : []),
    [friendsData]
  );

  // Lesezeiten aus Firebase per Realtime-Listener — so wandert ein „als gelesen
  // markiert" von einem Gerät live auf alle anderen (sonst blieb der Bell-Badge
  // auf Gerät B stehen, weil der Wert nur einmal beim Mount gelesen wurde).
  useEffect(() => {
    if (!user) return;
    const ref = dbRef(userPath(user.uid, 'readTimes'));
    let baselineWritten = false;
    const listener = ref.on(
      'value',
      (snap) => {
        const data = snap.val() as { requests?: number; activities?: number } | null;
        if (data) {
          setLastReadRequestsTime(data.requests || 0);
          setLastReadActivitiesTime(data.activities || 0);
          setReadTimesLoaded(true);
        } else if (!baselineWritten) {
          // Erstbesuch: Baseline setzen (der Listener feuert danach mit den Werten).
          baselineWritten = true;
          const now = Date.now();
          setLastReadRequestsTime(now);
          setLastReadActivitiesTime(now);
          void dbRef(userPath(user.uid, 'readTimes')).set({ requests: now, activities: now });
          setReadTimesLoaded(true);
        }
      },
      (error: Error) => {
        console.error('Failed to load read times:', error);
        const now = Date.now();
        setLastReadRequestsTime(now);
        setLastReadActivitiesTime(now);
        setReadTimesLoaded(true);
      }
    );
    return () => ref.off('value', listener);
  }, [user]);

  // Unread-Zähler neu berechnen, wenn sich die Lesezeit ändert (auch wenn die
  // Änderung von einem anderen Gerät via Listener oben hereinkommt).
  useEffect(() => {
    setUnreadRequestsCount(friendRequests.filter((r) => r.sentAt > lastReadRequestsTime).length);
  }, [friendRequests, lastReadRequestsTime]);

  useEffect(() => {
    setUnreadActivitiesCount(
      friendActivities.filter(
        (a) =>
          a.timestamp > lastReadActivitiesTime &&
          a.type !== 'episode_watched' &&
          a.type !== 'episodes_watched'
      ).length
    );
  }, [friendActivities, lastReadActivitiesTime]);

  // Friend Requests mit Realtime Listener. Reset auf [] passiert im Cleanup
  // (legitim als Teardown), nicht im Effect-Body (das war set-state-in-effect).
  useEffect(() => {
    if (!user) return;

    const incomingRef = dbRef('friendRequests')
      .orderByChild('toUserId')
      .equalTo(user.uid)
      .limitToLast(50);

    const outgoingRef = dbRef('friendRequests')
      .orderByChild('fromUserId')
      .equalTo(user.uid)
      .limitToLast(50);

    const incomingListener = incomingRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const requests = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
      const pending = requests.filter((r) => r.status === 'pending');
      setFriendRequests(pending);

      const unreadCount = pending.filter(
        (request) => request.sentAt > lastReadRequestsTimeRef.current
      ).length;
      setUnreadRequestsCount(unreadCount);
    });

    const outgoingListener = outgoingRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const requests = data
        ? Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }))
        : [];
      const pending = requests.filter((r) => r.status === 'pending');
      setSentRequests(pending);
    });

    return () => {
      incomingRef.off('value', incomingListener);
      outgoingRef.off('value', outgoingListener);
      setFriendRequests([]);
      setSentRequests([]);
    };
  }, [user]);

  // Aufräumen: beantwortete Requests (accepted/declined) älter als 30 Tage
  // löschen — das UI zeigt nur pending, alles andere wächst sonst unbegrenzt.
  useEffect(() => {
    if (!user) return;
    const RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
    const cleanupOldRequests = async () => {
      try {
        const [incoming, outgoing] = await Promise.all([
          dbRef('friendRequests').orderByChild('toUserId').equalTo(user.uid).once('value'),
          dbRef('friendRequests').orderByChild('fromUserId').equalTo(user.uid).once('value'),
        ]);
        const cutoff = Date.now() - RETENTION_MS;
        const updates: Record<string, null> = {};
        for (const snap of [incoming, outgoing]) {
          const data = snap.val() as Record<
            string,
            { status?: string; respondedAt?: number; sentAt?: number }
          > | null;
          if (!data) continue;
          for (const [key, req] of Object.entries(data)) {
            if (!req || !req.status || req.status === 'pending') continue;
            const ts = req.respondedAt || req.sentAt || 0;
            if (ts && ts < cutoff) updates[`friendRequests/${key}`] = null;
          }
        }
        if (Object.keys(updates).length > 0) await dbUpdate(updates);
      } catch {
        // best-effort
      }
    };
    cleanupOldRequests();
  }, [user]);

  // Friend Activities: Einmaliger Load + child_added Listener für neue Activities
  const loadFriendActivities = useCallback(async () => {
    if (!user || friends.length === 0) {
      setFriendActivities([]);
      setUnreadActivitiesCount(0);
      return;
    }

    // localStorage-Cache (5 min TTL): spart N-parallel-Reads bei Tab-Wechseln.
    // Periodischer Poll statt permanenter child_added Listener bringt neue
    // Activities trotzdem zeitnah rein.
    const cacheKey = `friendActivities:${user.uid}`;
    const cacheTTL = 5 * 60 * 1000;
    try {
      const rawCached = localStorage.getItem(cacheKey);
      if (rawCached) {
        const cached = JSON.parse(rawCached) as {
          savedAt: number;
          friendIds: string[];
          activities: FriendActivity[];
        };
        const friendIdsKey = friends
          .map((f) => f.uid)
          .sort()
          .join(',');
        const cachedIdsKey = [...cached.friendIds].sort().join(',');
        if (
          Date.now() - cached.savedAt < cacheTTL &&
          friendIdsKey === cachedIdsKey &&
          Array.isArray(cached.activities)
        ) {
          setFriendActivities(cached.activities);
          const unreadActivities = cached.activities.filter(
            (activity) =>
              activity.timestamp > lastReadActivitiesTimeRef.current &&
              // „Gesehen"-Aktivitäten zählen NICHT in den Bell-Badge.
              activity.type !== 'episode_watched' &&
              activity.type !== 'episodes_watched'
          );
          setUnreadActivitiesCount(unreadActivities.length);
          return;
        }
      }
    } catch {
      // ignore cache errors
    }

    try {
      const allActivities: FriendActivity[] = [];

      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const activityPromises = friends.map(async (friend) => {
        try {
          const activitiesRef = dbRef(userPath(friend.uid, 'activities'))
            .orderByChild('timestamp')
            .startAt(sevenDaysAgo)
            .limitToLast(30);

          const snapshot = await activitiesRef.once('value');
          const data = snapshot.val();

          if (data) {
            return Object.keys(data).map((key) => ({
              id: key,
              userId: friend.uid,
              userName: friend.displayName || friend.email?.split('@')[0] || 'Unbekannt',
              ...data[key],
            }));
          }
          return [];
        } catch {
          return [];
        }
      });

      const activityResults = await Promise.all(activityPromises);

      activityResults.forEach((activities) => {
        allActivities.push(...activities);
      });

      allActivities.sort((a, b) => b.timestamp - a.timestamp);
      const recentActivities = allActivities.slice(0, 100);
      setFriendActivities(recentActivities);

      const unreadActivities = recentActivities.filter(
        (activity) =>
          activity.timestamp > lastReadActivitiesTimeRef.current &&
          // „Gesehen"-Aktivitäten zählen NICHT in den Bell-Badge.
          activity.type !== 'episode_watched' &&
          activity.type !== 'episodes_watched'
      );
      setUnreadActivitiesCount(unreadActivities.length);

      // Cache fuer naechsten App-Reopen
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({
            savedAt: Date.now(),
            friendIds: friends.map((f) => f.uid),
            activities: recentActivities,
          })
        );
      } catch {
        // quota o.ae.
      }
    } catch {
      // Silent fail
    }
  }, [user, friends]);

  useEffect(() => {
    loadFriendActivitiesRef.current = loadFriendActivities;
  }, [loadFriendActivities]);

  // Einmaliger Load + Realtime child_added Listener pro Freund für neue Activities
  useEffect(() => {
    if (!user || friends.length === 0 || !readTimesLoaded) {
      return;
    }

    // 1. Einmaliger initialer Load
    loadFriendActivitiesRef.current?.();

    // 2. Periodischer Poll alle 5 Min statt N child_added-Listener.
    //    Spart N persistente Verbindungen (N = Anzahl Freunde).
    //    Pausiert wenn der Tab im Hintergrund liegt — der Friend-Activity-
    //    Feed muss nicht laufend frisch sein wenn niemand hinschaut.
    //    Beim Re-Visit feuern wir einmal sofort, damit der Feed nicht
    //    veraltet wirkt.
    let interval: ReturnType<typeof setInterval> | null = null;
    const start = () => {
      if (interval) return;
      interval = setInterval(
        () => {
          loadFriendActivitiesRef.current?.();
        },
        5 * 60 * 1000
      );
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        loadFriendActivitiesRef.current?.();
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, [user, friends, readTimesLoaded]);

  // Sync eigenes Profil (photoURL, displayName, username) in die friend-Einträge
  // bei allen Freunden. Der Snapshot in users/{friend}/friends/{user} wird sonst
  // nur beim Accept des Friend-Requests geschrieben und veraltet, sobald der
  // User sein Profilbild ändert. Max 1x alle 14 Tage pro Session.
  const profileSyncDone = useRef(false);
  useEffect(() => {
    if (!user || friends.length === 0 || profileSyncDone.current) return;
    profileSyncDone.current = true;

    const syncKey = `friendProfileSync:${user.uid}`;
    const syncInterval = 14 * 24 * 60 * 60 * 1000;
    try {
      const last = Number(localStorage.getItem(syncKey) || 0);
      if (Date.now() - last < syncInterval) return;
    } catch {
      // ignore
    }

    const syncProfile = async () => {
      try {
        const currentUserData: Record<string, string | null | undefined> =
          (await dbGet<Record<string, string | null | undefined>>(paths.user(user.uid))) || {};

        const update = {
          photoURL: currentUserData.photoURL || user.photoURL || null,
          displayName:
            currentUserData.displayName || currentUserData.username || user.displayName || null,
          username: currentUserData.username || null,
          email: currentUserData.email || user.email || null,
        };

        await Promise.all(
          friends.map((friend) =>
            dbRef(userPath(friend.uid, 'friends', user.uid))
              .update(update)
              .catch(() => {
                // Silent fail fuer einzelne Freunde (z.B. Permission)
              })
          )
        );

        try {
          localStorage.setItem(syncKey, String(Date.now()));
        } catch {
          // quota
        }
      } catch (error) {
        console.error('Friend profile sync failed:', error);
      }
    };

    syncProfile();
  }, [user, friends]);

  const markRequestsAsRead = useCallback(async () => {
    if (!user) return;
    const now = Date.now();
    // Ref SOFORT updaten
    lastReadRequestsTimeRef.current = now;
    setUnreadRequestsCount(0);

    setLastReadRequestsTime(now);

    try {
      await dbRef(userPath(user.uid, 'readTimes', 'requests')).set(now);
    } catch (error) {
      console.error('Failed to save read time:', error);
    }
  }, [user]);

  const markActivitiesAsRead = useCallback(async () => {
    if (!user) return;
    const now = Date.now();
    // Ref SOFORT updaten damit loadFriendActivities den neuen Wert sieht
    lastReadActivitiesTimeRef.current = now;
    setUnreadActivitiesCount(0);
    setFriendActivities((prevActivities) => {
      return prevActivities;
    });

    setLastReadActivitiesTime(now);

    try {
      await dbRef(userPath(user.uid, 'readTimes', 'activities')).set(now);
    } catch (error) {
      console.error('Failed to save read time:', error);
    }
  }, [user]);

  const sendFriendRequest = useCallback(
    async (username: string): Promise<boolean> => {
      if (!user) return false;
      return sendFriendRequestOp(user, username);
    },
    [user]
  );

  const acceptFriendRequest = useCallback(
    async (requestId: string): Promise<void> => {
      if (!user) return;
      await acceptFriendRequestOp(user, requestId, setFriendRequests, refetchFriends);
    },
    [user, refetchFriends]
  );

  const declineFriendRequest = useCallback(
    async (requestId: string): Promise<void> => {
      if (!user) return;
      await declineFriendRequestOp(user.uid, requestId, setFriendRequests);
    },
    [user]
  );

  const cancelFriendRequest = useCallback(
    async (requestId: string): Promise<void> => {
      if (!user) return;
      await cancelFriendRequestOp(user.uid, requestId, setSentRequests);
    },
    [user]
  );

  const removeFriend = useCallback(
    async (friendId: string): Promise<void> => {
      if (!user) return;
      await removeFriendOp(user.uid, friendId, refetchFriends);
    },
    [user, refetchFriends]
  );

  const updateUserActivity = useCallback(
    async (
      activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
    ): Promise<void> => {
      if (!user) return;
      await updateUserActivityOp(user, activity);
    },
    [user]
  );

  const refreshFriends = useCallback(() => {
    refetchFriends();
    loadFriendActivities();
  }, [refetchFriends, loadFriendActivities]);

  // Memoize so the 14+ HomePage hook reads don't all re-render on every
  // friends-provider render cycle. Each field is a stable ref by itself
  // (useState/useCallback/useMemo upstream); without this wrapper the inline
  // object literal would still force fresh identity per render.
  const contextValue = useMemo(
    () => ({
      friends,
      friendRequests,
      sentRequests,
      friendActivities,
      loading,
      unreadRequestsCount,
      unreadActivitiesCount,
      lastReadActivitiesTime,
      markRequestsAsRead,
      markActivitiesAsRead,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      cancelFriendRequest,
      removeFriend,
      updateUserActivity,
      refreshFriends,
    }),
    [
      friends,
      friendRequests,
      sentRequests,
      friendActivities,
      loading,
      unreadRequestsCount,
      unreadActivitiesCount,
      lastReadActivitiesTime,
      markRequestsAsRead,
      markActivitiesAsRead,
      sendFriendRequest,
      acceptFriendRequest,
      declineFriendRequest,
      cancelFriendRequest,
      removeFriend,
      updateUserActivity,
      refreshFriends,
    ]
  );

  return (
    <OptimizedFriendsContext.Provider value={contextValue}>
      {children}
    </OptimizedFriendsContext.Provider>
  );
};
