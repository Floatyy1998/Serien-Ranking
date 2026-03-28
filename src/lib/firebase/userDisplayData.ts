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
