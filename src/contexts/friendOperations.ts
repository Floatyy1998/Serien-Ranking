import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { getOfflineBadgeSystem } from '../features/badges/offlineBadgeSystem';
import { FriendActivity, FriendRequest } from '../types/Friend';

export async function sendFriendRequestOp(
  user: { uid: string; displayName: string | null; email: string | null },
  username: string
): Promise<boolean> {
  try {
    const usersRef = firebase.database().ref('users');
    const snapshot = await usersRef.orderByChild('username').equalTo(username).once('value');
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
      fromUsername: currentUserData?.username || user.displayName || 'Unbekannt',
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
}

export async function acceptFriendRequestOp(
  user: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  },
  requestId: string,
  setFriendRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>,
  refetchFriends: () => void
): Promise<void> {
  try {
    const requestRef = firebase.database().ref(`friendRequests/${requestId}`);
    const snapshot = await requestRef.once('value');
    const request = snapshot.val();

    if (!request) return;

    const fromUserRef = firebase.database().ref(`users/${request.fromUserId}`);
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
        displayName: currentUserData?.displayName || currentUserData?.username || user.displayName,
        photoURL: currentUserData?.photoURL || user.photoURL || null,
        friendsSince: firebase.database.ServerValue.TIMESTAMP,
      });

    await firebase.database().ref(`friendRequests/${requestId}`).update({
      status: 'accepted',
      respondedAt: firebase.database.ServerValue.TIMESTAMP,
    });

    // Remove the request from local state immediately
    setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
    // Refresh friends data FIRST to ensure database is updated
    await refetchFriends();

    // Badge-Check ausführen AFTER friend data is refreshed
    setTimeout(async () => {
      try {
        const badgeSystem = getOfflineBadgeSystem(user.uid);
        badgeSystem.invalidateCache();
        await badgeSystem.checkForNewBadges();

        const friendBadgeSystem = getOfflineBadgeSystem(request.fromUserId);
        friendBadgeSystem.invalidateCache();
        await friendBadgeSystem.checkForNewBadges();
      } catch (badgeError) {
        console.error('Badge-Check Fehler nach Friend-Request:', badgeError);
      }
    }, 1000);
  } catch (error) {
    throw error;
  }
}

export async function declineFriendRequestOp(
  requestId: string,
  setFriendRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>
): Promise<void> {
  try {
    await firebase.database().ref(`friendRequests/${requestId}`).update({
      status: 'declined',
      respondedAt: firebase.database.ServerValue.TIMESTAMP,
    });

    setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
  } catch (error) {
    throw error;
  }
}

export async function cancelFriendRequestOp(
  requestId: string,
  setSentRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>
): Promise<void> {
  try {
    await firebase.database().ref(`friendRequests/${requestId}`).remove();

    setSentRequests((prev) => prev.filter((req) => req.id !== requestId));
  } catch (error) {
    throw error;
  }
}

export async function removeFriendOp(
  userId: string,
  friendId: string,
  refetchFriends: () => void
): Promise<void> {
  try {
    await firebase.database().ref(`users/${userId}/friends/${friendId}`).remove();

    await firebase.database().ref(`users/${friendId}/friends/${userId}`).remove();

    refetchFriends();
  } catch (error) {
    throw error;
  }
}

export async function updateUserActivityOp(
  user: { uid: string; displayName: string | null; email: string | null },
  activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
): Promise<void> {
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

    // Limit to max 30 activities per user
    const snapshot = await activitiesRef.orderByChild('timestamp').once('value');
    const activities = snapshot.val();

    if (activities) {
      const activityKeys = Object.keys(activities);
      if (activityKeys.length > 30) {
        const sortedKeys = activityKeys.sort((a, b) => {
          const timestampA = activities[a].timestamp || 0;
          const timestampB = activities[b].timestamp || 0;
          return timestampA - timestampB;
        });

        const toRemove = sortedKeys.slice(0, activityKeys.length - 30);
        const updates: { [key: string]: null } = {};
        toRemove.forEach((key) => {
          updates[key] = null;
        });

        await activitiesRef.update(updates);
      }
    }
  } catch (error) {
    // // console.warn('Failed to update user activity:', error);
  }
}
