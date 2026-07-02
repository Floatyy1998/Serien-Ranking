import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
/** Minimal user shape accepted by getUserDisplayData (works with both compat and modular User). */
interface AuthUserLike {
  uid: string;
  displayName?: string | null;
  email?: string | null;
  photoURL?: string | null;
}

interface UserDisplayData {
  username: string;
  photoURL?: string;
}

/**
 * Fetches the display name and photo URL for a Firebase user.
 * Falls back to auth user data, then email prefix, then 'Anonym'.
 */
export async function getUserDisplayData(authUser: AuthUserLike): Promise<UserDisplayData> {
  const snapshot = await firebase.database().ref(`users/${authUser.uid}`).once('value');
  const data = snapshot.val() || {};

  return {
    username: data.displayName || authUser.displayName || authUser.email?.split('@')[0] || 'Anonym',
    photoURL: data.photoURL || authUser.photoURL || undefined,
  };
}

export interface PublicUserFields {
  username: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Punkt-Reads der öffentlich lesbaren Profil-Felder eines FREMDEN Users.
 * Unter den gehärteten Database-Rules ist der Vollknoten users/$uid nur noch
 * für Owner/Admin lesbar — username/displayName (public carve-outs) und
 * photoURL (auth) bleiben einzeln lesbar. Jeder Read ist einzeln best-effort
 * (fehlgeschlagene Felder werden null), die Funktion wirft nie.
 */
export async function fetchPublicUserFields(uid: string): Promise<PublicUserFields> {
  const readField = async (field: string): Promise<string | null> => {
    try {
      const snap = await firebase.database().ref(`users/${uid}/${field}`).once('value');
      const value = snap.val();
      return typeof value === 'string' && value.trim().length > 0 ? value : null;
    } catch {
      return null;
    }
  };

  const [username, displayName, photoURL] = await Promise.all([
    readField('username'),
    readField('displayName'),
    readField('photoURL'),
  ]);

  return { username, displayName, photoURL };
}
