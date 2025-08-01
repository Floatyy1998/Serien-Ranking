import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../App';
import { Friend, FriendActivity, FriendRequest } from '../interfaces/Friend';

interface FriendsContextType {
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
}

export const FriendsContext = createContext<FriendsContextType>({
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
});

export const FriendsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { user } = useAuth()!;
  const [friends, setFriends] = useState<Friend[]>([]);
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

  // Funktionen zum Markieren als gelesen
  const markRequestsAsRead = () => {
    const now = Date.now();
    setLastReadRequestsTime(now);
    localStorage.setItem(getLastReadKey('requests'), now.toString());
    setUnreadRequestsCount(0);
  };

  const markActivitiesAsRead = () => {
    const now = Date.now();
    setLastReadActivitiesTime(now);
    localStorage.setItem(getLastReadKey('activities'), now.toString());
    setUnreadActivitiesCount(0);
  };

  // Freunde laden
  useEffect(() => {
    if (!user) {
      setFriends([]);
      setFriendRequests([]);
      setSentRequests([]);
      setFriendActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Freunde laden
    const friendsRef = firebase.database().ref(`users/${user.uid}/friends`);
    friendsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      setFriends(data ? Object.values(data) : []);
    });

    // Eingehende Freundschaftsanfragen
    const incomingRequestsRef = firebase
      .database()
      .ref('friendRequests')
      .orderByChild('toUserId')
      .equalTo(user.uid);

    incomingRequestsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const requests = data
        ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        : [];
      const pendingRequests = requests.filter((r) => r.status === 'pending');
      setFriendRequests(pendingRequests);

      // Zähle ungelesene Anfragen
      const unreadCount = pendingRequests.filter(
        (request) => request.sentAt > lastReadRequestsTime
      ).length;
      setUnreadRequestsCount(unreadCount);
    });

    // Ausgehende Freundschaftsanfragen
    const outgoingRequestsRef = firebase
      .database()
      .ref('friendRequests')
      .orderByChild('fromUserId')
      .equalTo(user.uid);

    outgoingRequestsRef.on('value', (snapshot) => {
      const data = snapshot.val();
      const requests = data
        ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        : [];
      setSentRequests(requests.filter((r) => r.status === 'pending'));
    });

    setLoading(false);

    return () => {
      friendsRef.off();
      incomingRequestsRef.off();
      outgoingRequestsRef.off();
    };
  }, [user]);

  // Freunde-Aktivitäten laden (nur von Freunden)
  useEffect(() => {
    if (!user || friends.length === 0) {
      setFriendActivities([]);
      return;
    }

    const activitiesRef = firebase.database().ref('userActivities');
    activitiesRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allActivities: FriendActivity[] = [];

        // Nur Aktivitäten von Freunden sammeln
        friends.forEach((friend) => {
          const friendActivities = data[friend.uid];
          if (friendActivities) {
            Object.keys(friendActivities).forEach((key) => {
              allActivities.push({
                id: key,
                ...friendActivities[key],
              });
            });
          }
        });

        // Nach Timestamp sortieren (neueste zuerst)
        allActivities.sort((a, b) => b.timestamp - a.timestamp);
        const recentActivities = allActivities.slice(0, 50); // Nur die letzten 50 Aktivitäten
        setFriendActivities(recentActivities);

        // Zähle ungelesene Aktivitäten
        const unreadCount = recentActivities.filter(
          (activity) => activity.timestamp > lastReadActivitiesTime
        ).length;
        setUnreadActivitiesCount(unreadCount);
      } else {
        setFriendActivities([]);
        setUnreadActivitiesCount(0);
      }
    });

    return () => activitiesRef.off();
  }, [user, friends, lastReadActivitiesTime]);

  // Zusätzlicher UseEffect für Request-Count Updates
  useEffect(() => {
    if (friendRequests.length > 0) {
      const unreadCount = friendRequests.filter(
        (request) => request.sentAt > lastReadRequestsTime
      ).length;
      setUnreadRequestsCount(unreadCount);
    } else {
      setUnreadRequestsCount(0);
    }
  }, [friendRequests, lastReadRequestsTime]);

  const sendFriendRequest = async (username: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Nutzer anhand des Usernames finden
      const usersRef = firebase.database().ref('users');
      const snapshot = await usersRef
        .orderByChild('username')
        .equalTo(username)
        .once('value');
      const userData = snapshot.val();

      if (!userData) {
        throw new Error('Benutzer nicht gefunden');
      }

      const targetUserId = Object.keys(userData)[0];
      const targetUserData = userData[targetUserId];

      // Prüfen ob bereits befreundet oder Anfrage existiert
      const existingRequestSnapshot = await firebase
        .database()
        .ref('friendRequests')
        .orderByChild('fromUserId')
        .equalTo(user.uid)
        .once('value');

      const existingRequests = existingRequestSnapshot.val();
      if (existingRequests) {
        const hasExistingRequest = Object.values(existingRequests).some(
          (req: any) =>
            req.toUserId === targetUserId && req.status === 'pending'
        );
        if (hasExistingRequest) {
          throw new Error('Freundschaftsanfrage bereits gesendet');
        }
      }

      // Eigenen Username aus der Datenbank holen
      const currentUserSnapshot = await firebase
        .database()
        .ref(`users/${user.uid}`)
        .once('value');
      const currentUserData = currentUserSnapshot.val();

      if (!currentUserData?.username) {
        throw new Error('Du musst erst einen Benutzernamen festlegen');
      }

      // Freundschaftsanfrage erstellen
      const requestRef = firebase.database().ref('friendRequests').push();
      await requestRef.set({
        fromUserId: user.uid,
        toUserId: targetUserId,
        fromUserEmail: user.email,
        toUserEmail: targetUserData.email,
        fromUsername: currentUserData.username,
        toUsername: username,
        status: 'pending',
        sentAt: firebase.database.ServerValue.TIMESTAMP,
      });

      return true;
    } catch (error) {throw error;
    }
  };

  const acceptFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;

    try {
      // Request-Daten holen
      const requestSnapshot = await firebase
        .database()
        .ref(`friendRequests/${requestId}`)
        .once('value');

      const requestData = requestSnapshot.val();
      if (!requestData) throw new Error('Freundschaftsanfrage nicht gefunden');

      // Freund-Daten holen
      const fromUserSnapshot = await firebase
        .database()
        .ref(`users/${requestData.fromUserId}`)
        .once('value');

      const fromUserData = fromUserSnapshot.val();

      // Eigene Daten holen
      const currentUserSnapshot = await firebase
        .database()
        .ref(`users/${user.uid}`)
        .once('value');
      const currentUserData = currentUserSnapshot.val();

      // Freund zu eigenem Profil hinzufügen
      await firebase
        .database()
        .ref(`users/${user.uid}/friends/${requestData.fromUserId}`)
        .set({
          uid: requestData.fromUserId,
          email: requestData.fromUserEmail,
          username: fromUserData?.username || requestData.fromUsername,
          displayName: fromUserData?.displayName || fromUserData?.username,
          photoURL: fromUserData?.photoURL || null,
          friendsSince: firebase.database.ServerValue.TIMESTAMP,
        });

      // Sich selbst zu Freund hinzufügen
      await firebase
        .database()
        .ref(`users/${requestData.fromUserId}/friends/${user.uid}`)
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

      // Request als akzeptiert markieren
      await firebase.database().ref(`friendRequests/${requestId}`).update({
        status: 'accepted',
        respondedAt: firebase.database.ServerValue.TIMESTAMP,
      });
    } catch (error) {throw error;
    }
  };

  const declineFriendRequest = async (requestId: string): Promise<void> => {
    if (!user) return;

    try {
      await firebase.database().ref(`friendRequests/${requestId}`).update({
        status: 'declined',
        respondedAt: firebase.database.ServerValue.TIMESTAMP,
      });
    } catch (error) {throw error;
    }
  };

  const removeFriend = async (friendId: string): Promise<void> => {
    if (!user) return;

    try {
      // Freund aus eigener Liste entfernen
      await firebase
        .database()
        .ref(`users/${user.uid}/friends/${friendId}`)
        .remove();

      // Sich selbst aus Freundesliste entfernen
      await firebase
        .database()
        .ref(`users/${friendId}/friends/${user.uid}`)
        .remove();
    } catch (error) {throw error;
    }
  };

  const updateUserActivity = async (
    activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
  ): Promise<void> => {
    if (!user) return;

    try {
      const activitiesRef = firebase.database().ref(`activities/${user.uid}`);

      // Neue Aktivität hinzufügen
      const newActivityRef = activitiesRef.push();
      await newActivityRef.set({
        ...activity,
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Unbekannt',
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      });

      // Alle Aktivitäten abrufen und nach Timestamp sortieren
      const snapshot = await activitiesRef
        .orderByChild('timestamp')
        .once('value');
      const activities = snapshot.val();

      if (activities) {
        const sortedActivities = Object.entries(activities)
          .map(([id, activity]: [string, any]) => ({ id, ...activity }))
          .sort((a, b) => b.timestamp - a.timestamp);

        // Wenn mehr als 20 Aktivitäten vorhanden sind, die ältesten löschen
        if (sortedActivities.length > 20) {
          const activitiesToDelete = sortedActivities.slice(20);
          const updates: { [key: string]: null } = {};

          activitiesToDelete.forEach((activity) => {
            updates[activity.id] = null;
          });

          await activitiesRef.update(updates);
        }
      }
    } catch (error) {}
  };

  return (
    <FriendsContext.Provider
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
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
};

export const useFriends = () => useContext(FriendsContext);
