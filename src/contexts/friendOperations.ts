import { dbRef, dbGet, serverTimestamp, userPath, paths } from '../services/db/ref';
import { getOfflineBadgeSystem } from '../features/badges/offlineBadgeSystem';
import type { FriendActivity, FriendRequest } from '../types/Friend';

export async function sendFriendRequestOp(
  user: { uid: string; displayName: string | null; email: string | null },
  username: string
): Promise<boolean> {
  // Match on lowercased slug so "Spixi" can be reached as "spixi". Der
  // Lookup läuft über den userSearchIndex-Knoten (der users-Root ist unter
  // den gehärteten Rules nicht mehr lesbar). Solange Rules/Backfill noch
  // nicht deployt sind, greift der Legacy-Fallback auf den users-Root
  // (dort zusätzlich case-sensitiv für Alt-User ohne usernameLower).
  const lower = username.toLowerCase();
  let userData: Record<string, Record<string, unknown>> | null = null;
  try {
    const snapshot = await dbRef('userSearchIndex')
      .orderByChild('usernameLower')
      .equalTo(lower)
      .once('value');
    userData = snapshot.val();
  } catch {
    // Alte Rules: userSearchIndex existiert/erlaubt noch nichts.
  }
  if (!userData) {
    try {
      const usersRef = dbRef('users');
      let snapshot = await usersRef.orderByChild('usernameLower').equalTo(lower).once('value');
      userData = snapshot.val();
      if (!userData) {
        snapshot = await usersRef.orderByChild('username').equalTo(username).once('value');
        userData = snapshot.val();
      }
    } catch {
      // Neue Rules: users-Root nicht mehr lesbar — Index ist die Quelle.
    }
  }

  if (!userData) return false;

  const targetUserId = Object.keys(userData)[0];
  const targetUserData = userData[targetUserId];

  // Aktueller User Daten laden für fromUsername/fromUserEmail
  const currentUserData = await dbGet<Record<string, unknown>>(paths.user(user.uid));

  const requestRef = dbRef('friendRequests').push();

  await requestRef.set({
    fromUserId: user.uid,
    toUserId: targetUserId,
    fromUsername: currentUserData?.username || user.displayName || 'Unbekannt',
    toUsername: targetUserData?.username || username,
    fromUserEmail: currentUserData?.email || user.email || '',
    toUserEmail: targetUserData?.email || '',
    status: 'pending',
    sentAt: serverTimestamp(),
  });

  // Consent-Marker im EIGENEN Baum: erst dadurch darf der Empfänger sich später
  // in UNSERE friends-Liste eintragen (die Rule prüft genau diesen Marker).
  // Ohne ihn könnte sich jeder Fremde ungefragt als Freund eintragen und damit
  // unsere friend-gegateten Privatdaten lesen (Leseeskalation, BUG-SEC-0).
  await dbRef(userPath(user.uid, 'sentRequestTo', targetUserId)).set(serverTimestamp());

  return true;
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
  const request = await dbGet<{ fromUserId: string }>(`friendRequests/${requestId}`);

  if (!request) return;

  // Punkt-Reads statt Vollknoten-Read: users/$other ist unter den gehärteten
  // Rules nicht mehr komplett lesbar — username/displayName/photoURL bleiben
  // einzeln lesbar. email ist dann nicht mehr lesbar → best-effort (null).
  const readVal = async (path: string): Promise<unknown> => {
    try {
      return await dbGet(path);
    } catch {
      return null;
    }
  };
  const [fromUsername, fromDisplayName, fromPhotoURL, fromEmail] = await Promise.all([
    readVal(`users/${request.fromUserId}/username`),
    readVal(`users/${request.fromUserId}/displayName`),
    readVal(`users/${request.fromUserId}/photoURL`),
    readVal(`users/${request.fromUserId}/email`),
  ]);

  const currentUserData = await dbGet<Record<string, unknown>>(paths.user(user.uid));

  // Freund zur eigenen Liste hinzufügen
  await dbRef(userPath(user.uid, 'friends', request.fromUserId)).set({
    uid: request.fromUserId,
    email: fromEmail ?? null,
    username: fromUsername || 'unknown',
    displayName: fromDisplayName || fromUsername || null,
    photoURL: fromPhotoURL || null,
    friendsSince: serverTimestamp(),
  });

  // Sich selbst zur Freundesliste hinzufügen
  await dbRef(userPath(request.fromUserId, 'friends', user.uid)).set({
    uid: user.uid,
    email: user.email,
    username: currentUserData?.username || 'unknown',
    displayName: currentUserData?.displayName || currentUserData?.username || user.displayName,
    photoURL: currentUserData?.photoURL || user.photoURL || null,
    friendsSince: serverTimestamp(),
  });

  await dbRef(`friendRequests/${requestId}`).update({
    status: 'accepted',
    respondedAt: serverTimestamp(),
  });

  // Verbrauchten Consent-Marker des Absenders entfernen (der Empfänger darf ihn
  // löschen). Best-effort — schlägt es fehl, bleibt nur ein harmloser Marker.
  try {
    await dbRef(userPath(request.fromUserId, 'sentRequestTo', user.uid)).remove();
  } catch {
    // best-effort
  }

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
}

export async function declineFriendRequestOp(
  uid: string,
  requestId: string,
  setFriendRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>
): Promise<void> {
  // fromUserId lesen, um den Consent-Marker des Absenders aufzuräumen.
  const request = await dbGet<{ fromUserId: string }>(`friendRequests/${requestId}`);

  await dbRef(`friendRequests/${requestId}`).update({
    status: 'declined',
    respondedAt: serverTimestamp(),
  });

  if (request?.fromUserId) {
    try {
      await dbRef(userPath(request.fromUserId, 'sentRequestTo', uid)).remove();
    } catch {
      // best-effort
    }
  }

  setFriendRequests((prev) => prev.filter((req) => req.id !== requestId));
}

export async function cancelFriendRequestOp(
  uid: string,
  requestId: string,
  setSentRequests: React.Dispatch<React.SetStateAction<FriendRequest[]>>
): Promise<void> {
  // toUserId lesen (vor dem Löschen), um den eigenen Consent-Marker zu entfernen.
  const request = await dbGet<{ toUserId: string }>(`friendRequests/${requestId}`);

  await dbRef(`friendRequests/${requestId}`).remove();

  if (request?.toUserId) {
    try {
      await dbRef(userPath(uid, 'sentRequestTo', request.toUserId)).remove();
    } catch {
      // best-effort
    }
  }

  setSentRequests((prev) => prev.filter((req) => req.id !== requestId));
}

export async function removeFriendOp(
  userId: string,
  friendId: string,
  refetchFriends: () => void
): Promise<void> {
  await dbRef(userPath(userId, 'friends', friendId)).remove();

  await dbRef(userPath(friendId, 'friends', userId)).remove();

  refetchFriends();
}

export async function updateUserActivityOp(
  user: { uid: string; displayName: string | null; email: string | null },
  activity: Omit<FriendActivity, 'id' | 'userId' | 'userName' | 'timestamp'>
): Promise<void> {
  try {
    const activitiesRef = dbRef(userPath(user.uid, 'activities'));

    // Add new activity
    const newActivityRef = activitiesRef.push();
    await newActivityRef.set({
      ...activity,
      userId: user.uid,
      userName: user.displayName || user.email?.split('@')[0] || 'Unbekannt',
      timestamp: serverTimestamp(),
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
  } catch {
    // Silently ignore activity logging failures
  }
}
