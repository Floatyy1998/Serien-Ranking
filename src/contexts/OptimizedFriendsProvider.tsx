import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from '../App';
import { useEnhancedFirebaseCache } from '../hooks/useEnhancedFirebaseCache';
import { Friend, FriendActivity, FriendRequest } from '../types/Friend';
import { getOfflineBadgeSystem } from '../features/badges/offlineBadgeSystem';

interface OptimizedFriendsContextType {
  friends: Friend[];
  friendRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  friendActivities: FriendActivity[];
  loading: boolean;
  unreadRequestsCount: number;
  unreadActivitiesCount: number;
  markRequestsAsRead: () => void;
  markActivitiesAsRead: () => void;
  sendFriendRequest: (username: string) => Promise<boolean>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  updateUserActivity: (
    activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
  ) => Promise<void>;
  refreshFriends: () => void;
}

export const OptimizedFriendsContext =
  createContext<OptimizedFriendsContextType>({
    friends: [],
    friendRequests: [],
    sentRequests: [],
    friendActivities: [],
    loading: true,
    unreadRequestsCount: 0,
    unreadActivitiesCount: 0,
    markRequestsAsRead: () => {},
    markActivitiesAsRead: () => {},
    sendFriendRequest: async () => false,
    acceptFriendRequest: async () => {},
    declineFriendRequest: async () => {},
    removeFriend: async () => {},
    updateUserActivity: async () => {},
    refreshFriends: () => {},
  });

export const OptimizedFriendsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth()!;

  // 🚀 Enhanced Cache mit Offline-Support für Freunde
  const {
    data: friendsData,
    loading: friendsLoading,
    refetch: refetchFriends,
  } = useEnhancedFirebaseCache<Record<string, Friend>>(
    user ? `users/${user.uid}/friends` : '',
    {
      ttl: 2 * 60 * 1000, // 2 Minuten Cache
      useRealtimeListener: true, // Realtime für sofortige Updates
      enableOfflineSupport: true, // Offline-First Unterstützung
      syncOnReconnect: true, // Auto-Sync bei Reconnect
    }
  );

  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friendActivities, setFriendActivities] = useState<FriendActivity[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [lastReadRequestsTime, setLastReadRequestsTime] = useState<number>(0);
  const [lastReadActivitiesTime, setLastReadActivitiesTime] =
    useState<number>(0);
  const [unreadRequestsCount, setUnreadRequestsCount] = useState(0);
  const [unreadActivitiesCount, setUnreadActivitiesCount] = useState(0);

  const friends: Friend[] = friendsData ? Object.values(friendsData) : [];

  // LocalStorage-Keys für die letzten Lesezeiten
  const getLastReadKey = (type: 'requests' | 'activities') =>
    `friends_last_read_${type}_${user?.uid}`;

  // Lade gespeicherte Lesezeiten
  useEffect(() => {
    if (user) {
      const savedRequestsTime = localStorage.getItem(
        getLastReadKey('requests')
      );
      const savedActivitiesTime = localStorage.getItem(
        getLastReadKey('activities')
      );

      setLastReadRequestsTime(
        savedRequestsTime ? parseInt(savedRequestsTime) : 0
      );
      setLastReadActivitiesTime(
        savedActivitiesTime ? parseInt(savedActivitiesTime) : 0
      );
    }
  }, [user]);

  // 🚀 Optimiert: Friend Requests nur alle 2 Minuten laden + Smart Caching
  useEffect(() => {
    if (!user) {
      setFriendRequests([]);
      setSentRequests([]);
      setLoading(false);
      return;
    }

    let requestsCache: {
      timestamp: number;
      data: { incoming: FriendRequest[]; outgoing: FriendRequest[] };
    } | null = null;
    const CACHE_DURATION = 60 * 1000; // 1 Minute Cache

    const loadRequests = async (forceRefresh = false) => {
      // Prüfe Cache zuerst (außer bei forceRefresh)
      if (
        !forceRefresh &&
        requestsCache &&
        Date.now() - requestsCache.timestamp < CACHE_DURATION
      ) {
        setFriendRequests(requestsCache.data.incoming);
        setSentRequests(requestsCache.data.outgoing);
        return;
      }

      try {
        // Parallele Abfragen für bessere Performance
        const [incomingSnapshot, outgoingSnapshot] = await Promise.all([
          firebase
            .database()
            .ref('friendRequests')
            .orderByChild('toUserId')
            .equalTo(user.uid)
            .once('value'),
          firebase
            .database()
            .ref('friendRequests')
            .orderByChild('fromUserId')
            .equalTo(user.uid)
            .once('value'),
        ]);

        const incomingData = incomingSnapshot.val();
        const incomingRequests = incomingData
          ? Object.keys(incomingData).map((key) => ({
              id: key,
              ...incomingData[key],
            }))
          : [];
        const pendingIncoming = incomingRequests.filter(
          (r) => r.status === 'pending'
        );

        const outgoingData = outgoingSnapshot.val();
        const outgoingRequests = outgoingData
          ? Object.keys(outgoingData).map((key) => ({
              id: key,
              ...outgoingData[key],
            }))
          : [];
        const pendingOutgoing = outgoingRequests.filter(
          (r) => r.status === 'pending'
        );

        // Cache aktualisieren
        requestsCache = {
          timestamp: Date.now(),
          data: { incoming: pendingIncoming, outgoing: pendingOutgoing },
        };

        setFriendRequests(pendingIncoming);
        setSentRequests(pendingOutgoing);

        // Unread count
        const unreadCount = pendingIncoming.filter(
          (request) => request.sentAt > lastReadRequestsTime
        ).length;
        setUnreadRequestsCount(unreadCount);
      } catch (error) {
        console.warn('Failed to load friend requests:', error);
      }
    };

    // Initial load
    loadRequests();

    // Setup interval für Friend Requests
    const interval = setInterval(
      () => {
        loadRequests();
      },
      unreadRequestsCount > 0 ? 30 * 1000 : 2 * 60 * 1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [user?.uid, lastReadRequestsTime]); // Stabile Dependencies

  // 🚀 Optimiert: Friend Activities mit intelligenter Paginierung und Caching
  const loadFriendActivities = useCallback(async () => {
    if (!user || friends.length === 0) {
      setFriendActivities([]);
      setUnreadActivitiesCount(0);
      return;
    }

    try {
      const allActivities: FriendActivity[] = [];

      // Intelligente Freund-Auswahl: Priorisiere aktive Freunde
      const activeFriends = friends
        .sort((a, b) => (b.lastActive || 0) - (a.lastActive || 0)) // Sortiere nach letzter Aktivität
        .slice(0, 8); // Reduziere von 10 auf 8 für bessere Performance

      const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000; // Reduziere von 7 auf 3 Tage

      // Batch alle Requests parallel statt sequenziell
      const activityPromises = activeFriends.map(async (friend) => {
        try {
          const activitiesRef = firebase
            .database()
            .ref(`activities/${friend.uid}`)
            .orderByChild('timestamp')
            .startAt(threeDaysAgo)
            .limitToLast(15); // Reduziere von 20 auf 15 pro Freund

          const snapshot = await activitiesRef.once('value');
          const data = snapshot.val();

          if (data) {
            return Object.keys(data).map((key) => ({
              id: key,
              ...data[key],
            }));
          }
          return [];
        } catch (error) {
          console.warn(
            `Failed to load activities for friend ${friend.uid}:`,
            error
          );
          return [];
        }
      });

      // Warte auf alle Requests parallel
      const activityResults = await Promise.all(activityPromises);

      // Flatten und sammle alle Activities
      activityResults.forEach((activities) => {
        allActivities.push(...activities);
      });

      // Sortiere nach Zeitstempel und limitiere früher
      allActivities.sort((a, b) => b.timestamp - a.timestamp);
      const recentActivities = allActivities.slice(0, 30); // Reduziere von 50 auf 30
      setFriendActivities(recentActivities);

      // Unread count
      const unreadCount = recentActivities.filter(
        (activity) => activity.timestamp > lastReadActivitiesTime
      ).length;
      setUnreadActivitiesCount(unreadCount);
    } catch (error) {
      console.warn('Failed to load friend activities:', error);
    }
  }, [user, friends, lastReadActivitiesTime]);

  // Smart loading: Nur initial und dann adaptive Intervalle
  useEffect(() => {
    if (!user || friends.length === 0) return;

    // Initial load
    loadFriendActivities();

    // Adaptive Intervalle basierend auf Aktivität
    const getActivityInterval = () => {
      if (unreadActivitiesCount > 0) return 2 * 60 * 1000; // 2 Minuten wenn ungelesen
      if (friendActivities.length > 10) return 3 * 60 * 1000; // 3 Minuten wenn viel Aktivität
      return 5 * 60 * 1000; // 5 Minuten standard
    };

    // Setup interval
    const interval = setInterval(() => {
      loadFriendActivities();
    }, getActivityInterval());

    return () => {
      clearInterval(interval);
    };
  }, [user?.uid, friends.length]); // Stabile Dependencies

  useEffect(() => {
    setLoading(friendsLoading);
  }, [friendsLoading]);

  // Funktionen zum Markieren als gelesen
  const markRequestsAsRead = useCallback(() => {
    const now = Date.now();
    setLastReadRequestsTime(now);
    localStorage.setItem(getLastReadKey('requests'), now.toString());
    setUnreadRequestsCount(0);
  }, [getLastReadKey]);

  const markActivitiesAsRead = useCallback(() => {
    const now = Date.now();
    setLastReadActivitiesTime(now);
    localStorage.setItem(getLastReadKey('activities'), now.toString());
    setUnreadActivitiesCount(0);
  }, [getLastReadKey]);

  const sendFriendRequest = async (username: string): Promise<boolean> => {
    if (!user) return false;

    try {
      const usersRef = firebase.database().ref('users');
      const snapshot = await usersRef
        .orderByChild('username')
        .equalTo(username)
        .once('value');
      const userData = snapshot.val();

      if (!userData) return false;

      const targetUserId = Object.keys(userData)[0];
      const targetUserData = userData[targetUserId];

      // Aktueller User Daten laden für fromUsername/fromUserEmail
      const currentUserRef = firebase.database().ref(`users/${user.uid}`);
      const currentUserSnapshot = await currentUserRef.once('value');
      const currentUserData = currentUserSnapshot.val();

      const requestRef = firebase.database().ref('friendRequests').push();

      await requestRef.set({
        fromUserId: user.uid,
        toUserId: targetUserId,
        fromUsername:
          currentUserData?.username || user.displayName || 'Unbekannt',
        toUsername: targetUserData?.username || username,
        fromUserEmail: currentUserData?.email || user.email || '',
        toUserEmail: targetUserData?.email || '',
        status: 'pending',
        sentAt: firebase.database.ServerValue.TIMESTAMP,
      });

      return true;
    } catch (error) {
      throw error;
    }
  };

  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;

    try {
      const requestRef = firebase.database().ref(`friendRequests/${requestId}`);
      const snapshot = await requestRef.once('value');
      const request = snapshot.val();

      if (!request) return;

      const fromUserRef = firebase
        .database()
        .ref(`users/${request.fromUserId}`);
      const fromUserSnapshot = await fromUserRef.once('value');
      const fromUserData = fromUserSnapshot.val();

      const currentUserRef = firebase.database().ref(`users/${user.uid}`);
      const currentUserSnapshot = await currentUserRef.once('value');
      const currentUserData = currentUserSnapshot.val();

      // Freund zur eigenen Liste hinzufügen
      await firebase
        .database()
        .ref(`users/${user.uid}/friends/${request.fromUserId}`)
        .set({
          uid: request.fromUserId,
          email: fromUserData?.email,
          username: fromUserData?.username || 'unknown',
          displayName: fromUserData?.displayName || fromUserData?.username,
          photoURL: fromUserData?.photoURL || null,
          friendsSince: firebase.database.ServerValue.TIMESTAMP,
        });

      // Sich selbst zur Freundesliste hinzufügen
      await firebase
        .database()
        .ref(`users/${request.fromUserId}/friends/${user.uid}`)
        .set({
          uid: user.uid,
          email: user.email,
          username: currentUserData?.username || 'unknown',
          displayName:
            currentUserData?.displayName ||
            currentUserData?.username ||
            user.displayName,
          photoURL: currentUserData?.photoURL || user.photoURL || null,
          friendsSince: firebase.database.ServerValue.TIMESTAMP,
        });

      await firebase.database().ref(`friendRequests/${requestId}`).update({
        status: 'accepted',
        respondedAt: firebase.database.ServerValue.TIMESTAMP,
      });

      // Badge-Check ausführen (Social badges für neue Freunde)
      try {
        const badgeSystem = getOfflineBadgeSystem(user.uid);
        badgeSystem.invalidateCache(); // Cache leeren für frische Friend-Zählung
        await badgeSystem.checkForNewBadges();
      } catch (badgeError) {
        console.error('Badge-Check Fehler nach Friend-Request:', badgeError);
      }

      // Refresh friends data
      refetchFriends();
    } catch (error) {
      throw error;
    }
  };

  const declineFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;

    try {
      await firebase.database().ref(`friendRequests/${requestId}`).update({
        status: 'declined',
        respondedAt: firebase.database.ServerValue.TIMESTAMP,
      });
    } catch (error) {
      throw error;
    }
  };

  const removeFriend = async (friendId: string): Promise<void> => {
    if (!user) return;

    try {
      await firebase
        .database()
        .ref(`users/${user.uid}/friends/${friendId}`)
        .remove();

      await firebase
        .database()
        .ref(`users/${friendId}/friends/${user.uid}`)
        .remove();

      // Refresh friends data
      refetchFriends();
    } catch (error) {
      throw error;
    }
  };

  const updateUserActivity = async (
    activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
  ): Promise<void> => {
    if (!user) return;

    try {
      const activitiesRef = firebase.database().ref(`activities/${user.uid}`);

      // Add new activity
      const newActivityRef = activitiesRef.push();
      await newActivityRef.set({
        ...activity,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Unbekannt',
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      });

      // Limit to max 20 activities
      const snapshot = await activitiesRef.orderByChild('timestamp').once('value');
      const activities = snapshot.val();
      
      if (activities) {
        const activityKeys = Object.keys(activities);
        if (activityKeys.length > 20) {
          // Sort by timestamp and remove oldest entries
          const sortedKeys = activityKeys.sort((a, b) => {
            const timestampA = activities[a].timestamp || 0;
            const timestampB = activities[b].timestamp || 0;
            return timestampA - timestampB;
          });
          
          // Remove excess activities (keep only newest 20)
          const toRemove = sortedKeys.slice(0, activityKeys.length - 20);
          const updates: { [key: string]: null } = {};
          toRemove.forEach(key => {
            updates[key] = null;
          });
          
          await activitiesRef.update(updates);
        }
      }
    } catch (error) {
      console.warn('Failed to update user activity:', error);
    }
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
        removeFriend,
        updateUserActivity,
        refreshFriends,
      }}
    >
      {children}
    </OptimizedFriendsContext.Provider>
  );
};

export const useOptimizedFriends = () => useContext(OptimizedFriendsContext);
