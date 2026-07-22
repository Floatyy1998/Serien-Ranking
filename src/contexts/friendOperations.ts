import { dbRef, dbGet, dbUpdate, serverTimestamp, userPath } from '../services/db/ref';
import { getOfflineBadgeSystem } from '../features/badges/offlineBadgeSystem';
import type { FriendActivity, FriendRequest } from '../types/Friend';

export async function sendFriendRequestOp(
  user: { uid: string; displayName: string | null; email: string | null },
  username: string
): Promise<boolean> {
  // Match on lowercased slug so "Spixi" can be reached as "spixi". Der Lookup
  // läuft ausschließlich über den userSearchIndex-Knoten — der users-Root ist
  // unter den gehärteten Rules nicht lesbar, ein Fallback dorthin erzeugt nur
  // eine nicht abfangbare permission_denied-Warnung in der Konsole.
  const lower = username.toLowerCase();
  let userData: Record<string, Record<string, unknown>> | null = null;
  try {
    const snapshot = await dbRef('userSearchIndex')
      .orderByChild('usernameLower')
      .equalTo(lower)
      .once('value');
    userData = snapshot.val();
  } catch {
    // Index nicht lesbar (Rules-Drift) — Suche schlägt kontrolliert fehl.
  }

  if (!userData) return false;

  const targetUserId = Object.keys(userData)[0];
  const targetUserData = userData[targetUserId];

  const [ownUsername, ownEmail] = await Promise.all([
    dbGet<string>(userPath(user.uid, 'username')).catch(() => null),
    dbGet<string>(userPath(user.uid, 'email')).catch(() => null),
  ]);

  const requestKey = dbRef('friendRequests').push().key;
  if (!requestKey) return false;

  // Request + Consent-Marker atomar: erst der Marker erlaubt dem Empfänger,
  // sich später in UNSERE friends-Liste einzutragen (die Rule prüft genau ihn).
  // Getrennt geschrieben könnte ein Abbruch dazwischen einen Request ohne
  // Marker hinterlassen — der Accept scheitert dann mit PERMISSION_DENIED.
  await dbUpdate({
    [`friendRequests/${requestKey}`]: {
      fromUserId: user.uid,
      toUserId: targetUserId,
      fromUsername: ownUsername || user.displayName || 'Unbekannt',
      toUsername: targetUserData?.username || username,
      fromUserEmail: ownEmail || user.email || '',
      toUserEmail: targetUserData?.email || '',
      status: 'pending',
      sentAt: serverTimestamp(),
    },
    [userPath(user.uid, 'sentRequestTo', targetUserId)]: serverTimestamp(),
  });

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
  const [
    fromUsername,
    fromDisplayName,
    fromPhotoURL,
    fromEmail,
    ownUsername,
    ownDisplayName,
    ownPhotoURL,
  ] = await Promise.all([
    readVal(`users/${request.fromUserId}/username`),
    readVal(`users/${request.fromUserId}/displayName`),
    readVal(`users/${request.fromUserId}/photoURL`),
    readVal(`users/${request.fromUserId}/email`),
    readVal(userPath(user.uid, 'username')),
    readVal(userPath(user.uid, 'displayName')),
    readVal(userPath(user.uid, 'photoURL')),
  ]);

  // Alle vier Writes atomar: getrennt ausgeführt konnte ein Teil-Fehlschlag
  // (z.B. fehlender Consent-Marker → PERMISSION_DENIED beim Gegenseiten-Write)
  // eine asymmetrische Freundschaft + ewig "pending" Request hinterlassen.
  await dbUpdate({
    [userPath(user.uid, 'friends', request.fromUserId)]: {
      uid: request.fromUserId,
      email: fromEmail ?? null,
      username: fromUsername || 'unknown',
      displayName: fromDisplayName || fromUsername || null,
      photoURL: fromPhotoURL || null,
      friendsSince: serverTimestamp(),
    },
    [userPath(request.fromUserId, 'friends', user.uid)]: {
      uid: user.uid,
      email: user.email,
      username: ownUsername || 'unknown',
      displayName: ownDisplayName || ownUsername || user.displayName,
      photoURL: ownPhotoURL || user.photoURL || null,
      friendsSince: serverTimestamp(),
    },
    [`friendRequests/${requestId}/status`]: 'accepted',
    [`friendRequests/${requestId}/respondedAt`]: serverTimestamp(),
    [userPath(request.fromUserId, 'sentRequestTo', user.uid)]: null,
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
