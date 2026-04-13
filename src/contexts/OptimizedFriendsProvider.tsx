import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../AuthContext';
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
  const [loading, setLoading] = useState(true);
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

  // Lade gespeicherte Lesezeiten aus Firebase
  useEffect(() => {
    if (user) {
      const loadReadTimes = async () => {
        try {
          const readTimesRef = firebase.database().ref(`users/${user.uid}/readTimes`);
          const snapshot = await readTimesRef.once('value');
          const data = snapshot.val();

          if (data) {
            setLastReadRequestsTime(data.requests || 0);
            setLastReadActivitiesTime(data.activities || 0);
            setReadTimesLoaded(true);
          } else {
            const now = Date.now();
            setLastReadRequestsTime(now);
            setLastReadActivitiesTime(now);
            await firebase.database().ref(`users/${user.uid}/readTimes`).set({
              requests: now,
              activities: now,
            });
            setReadTimesLoaded(true);
          }
        } catch (error) {
          console.error('Failed to load read times:', error);
          const now = Date.now();
          setLastReadRequestsTime(now);
          setLastReadActivitiesTime(now);
          setReadTimesLoaded(true);
        }
      };

      loadReadTimes();
    }
  }, [user]);

  // Friend Requests mit Realtime Listener
  useEffect(() => {
    if (!user) {
      setFriendRequests([]);
      setSentRequests([]);
      setLoading(false);
      return;
    }

    const incomingRef = firebase
      .database()
      .ref('friendRequests')
      .orderByChild('toUserId')
      .equalTo(user.uid)
      .limitToLast(50);

    const outgoingRef = firebase
      .database()
      .ref('friendRequests')
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
    };
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
            (activity) => activity.timestamp > lastReadActivitiesTimeRef.current
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
          const activitiesRef = firebase
            .database()
            .ref(`users/${friend.uid}/activities`)
            .orderByChild('timestamp')
            .startAt(sevenDaysAgo)
            .limitToLast(20);

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
        (activity) => activity.timestamp > lastReadActivitiesTimeRef.current
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
    const interval = setInterval(
      () => {
        loadFriendActivitiesRef.current?.();
      },
      5 * 60 * 1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [user, friends, readTimesLoaded]);

  useEffect(() => {
    setLoading(friendsLoading);
  }, [friendsLoading]);

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
        const currentUserSnapshot = await firebase
          .database()
          .ref(`users/${user.uid}`)
          .once('value');
        const currentUserData = currentUserSnapshot.val() || {};

        const update = {
          photoURL: currentUserData.photoURL || user.photoURL || null,
          displayName:
            currentUserData.displayName || currentUserData.username || user.displayName || null,
          username: currentUserData.username || null,
          email: currentUserData.email || user.email || null,
        };

        await Promise.all(
          friends.map((friend) =>
            firebase
              .database()
              .ref(`users/${friend.uid}/friends/${user.uid}`)
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
      await firebase.database().ref(`users/${user.uid}/readTimes/requests`).set(now);
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
      await firebase.database().ref(`users/${user.uid}/readTimes/activities`).set(now);
    } catch (error) {
      console.error('Failed to save read time:', error);
    }
  }, [user]);

  const sendFriendRequest = async (username: string): Promise<boolean> => {
    if (!user) return false;
    return sendFriendRequestOp(user, username);
  };

  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;
    await acceptFriendRequestOp(user, requestId, setFriendRequests, refetchFriends);
  };

  const declineFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;
    await declineFriendRequestOp(requestId, setFriendRequests);
  };

  const cancelFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;
    await cancelFriendRequestOp(requestId, setSentRequests);
  };

  const removeFriend = async (friendId: string): Promise<void> => {
    if (!user) return;
    await removeFriendOp(user.uid, friendId, refetchFriends);
  };

  const updateUserActivity = async (
    activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
  ): Promise<void> => {
    if (!user) return;
    await updateUserActivityOp(user, activity);
  };

  const refreshFriends = useCallback(() => {
    refetchFriends();
    loadFriendActivities();
  }, [refetchFriends, loadFriendActivities]);

  return (
    <OptimizedFriendsContext.Provider
      value={{
        friends,
        friendRequests,
        sentRequests,
        friendActivities,
        loading,
        unreadRequestsCount,
        unreadActivitiesCount,
        markRequestsAsRead,
        markActivitiesAsRead,
        sendFriendRequest,
        acceptFriendRequest,
        declineFriendRequest,
        cancelFriendRequest,
        removeFriend,
        updateUserActivity,
        refreshFriends,
      }}
    >
      {children}
    </OptimizedFriendsContext.Provider>
  );
};
