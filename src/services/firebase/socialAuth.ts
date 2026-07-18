/**
 * Google/Apple-Login — Web via signInWithPopup, native Hülle via
 * FirebaseAuthentication-Plugin (WebViews blocken Google-OAuth, daher Bridge).
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

export type SocialProvider = 'google' | 'apple';

interface NativeSignInResult {
  credential?: { idToken?: string; nonce?: string; accessToken?: string } | null;
  user?: { displayName?: string | null; email?: string | null } | null;
}

interface FirebaseAuthenticationPlugin {
  signInWithGoogle?: (options?: {
    skipNativeAuth?: boolean;
    scopes?: string[];
  }) => Promise<NativeSignInResult>;
  signInWithApple?: (options?: {
    skipNativeAuth?: boolean;
    scopes?: string[];
  }) => Promise<NativeSignInResult>;
}

interface CapacitorAuthGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: { FirebaseAuthentication?: FirebaseAuthenticationPlugin };
}

const getCapacitor = (): CapacitorAuthGlobal | null => {
  if (typeof window === 'undefined') return null;
  const cap = (window as { Capacitor?: CapacitorAuthGlobal }).Capacitor;
  return cap?.isNativePlatform?.() ? cap : null;
};

/** 'web' im Browser/Electron, sonst 'ios' | 'android'. */
export const getAuthPlatform = (): string => getCapacitor()?.getPlatform?.() ?? 'web';

// Electron: Popups landen via setWindowOpenHandler im System-Browser (Login
// käme dort nie zurück) — deshalb Redirect-Flow im selben Fenster.
const isElectronShell = (): boolean =>
  typeof window !== 'undefined' && !!window.electronAPI?.isElectron;

const isCancelError = (err: unknown): boolean => {
  const e = err as { code?: string; message?: string };
  if (
    e.code === 'auth/popup-closed-by-user' ||
    e.code === 'auth/cancelled-popup-request' ||
    e.code === 'auth/user-cancelled'
  ) {
    return true;
  }
  const msg = (e.message || '').toLowerCase();
  return msg.includes('cancel') || msg.includes('abgebrochen') || msg.includes('1001');
};

const buildWebProvider = (provider: SocialProvider): firebase.auth.AuthProvider => {
  if (provider === 'google') {
    const google = new firebase.auth.GoogleAuthProvider();
    google.setCustomParameters({ prompt: 'select_account' });
    return google;
  }
  const apple = new firebase.auth.OAuthProvider('apple.com');
  apple.addScope('email');
  apple.addScope('name');
  apple.setCustomParameters({ locale: 'de' });
  return apple;
};

/** Nativ eingesammelte Tokens in ein Firebase-JS-Credential übersetzen. */
const toFirebaseCredential = (
  provider: SocialProvider,
  result: NativeSignInResult
): firebase.auth.AuthCredential => {
  const idToken = result.credential?.idToken;
  if (!idToken) throw new Error('Kein ID-Token vom nativen Login erhalten.');
  if (provider === 'google') {
    return firebase.auth.GoogleAuthProvider.credential(idToken, result.credential?.accessToken);
  }
  return new firebase.auth.OAuthProvider('apple.com').credential({
    idToken,
    rawNonce: result.credential?.nonce,
  });
};

const nativeSignIn = async (
  provider: SocialProvider,
  plugin: FirebaseAuthenticationPlugin
): Promise<firebase.auth.UserCredential> => {
  const call = provider === 'google' ? plugin.signInWithGoogle : plugin.signInWithApple;
  if (!call) throw new Error('Login in dieser App-Version noch nicht verfügbar.');
  const result = await call({ skipNativeAuth: true });
  const userCredential = await firebase
    .auth()
    .signInWithCredential(toFirebaseCredential(provider, result));

  // Apple liefert den Namen nur beim allerersten Login und nur nativ mit.
  const nativeName = result.user?.displayName;
  if (nativeName && userCredential.user && !userCredential.user.displayName) {
    await userCredential.user.updateProfile({ displayName: nativeName }).catch(() => {});
  }
  return userCredential;
};

/**
 * Login starten. Gibt null zurück, wenn der Nutzer abgebrochen hat.
 * Wirft ansonsten — Fehlertext via socialAuthErrorMessage() holen.
 */
export const signInWithSocial = async (
  provider: SocialProvider
): Promise<firebase.auth.UserCredential | null> => {
  const plugin = getCapacitor()?.Plugins?.FirebaseAuthentication;
  try {
    if (plugin) return await nativeSignIn(provider, plugin);
    if (isElectronShell()) {
      // Ergebnis kommt nach der Rückkehr über onAuthStateChanged an.
      await firebase.auth().signInWithRedirect(buildWebProvider(provider));
      return null;
    }
    return await firebase.auth().signInWithPopup(buildWebProvider(provider));
  } catch (err) {
    if (isCancelError(err)) return null;
    if ((err as { code?: string }).code === 'auth/popup-blocked') {
      // Popup geblockt (z. B. iOS Safari) — Redirect-Flow; onAuthStateChanged fängt das Ergebnis.
      await firebase.auth().signInWithRedirect(buildWebProvider(provider));
      return null;
    }
    throw err;
  }
};

const methodLabel = (methods: string[]): string => {
  if (methods.includes('password')) return 'E-Mail & Passwort';
  if (methods.includes('google.com')) return 'Google';
  if (methods.includes('apple.com')) return 'Apple';
  return methods[0] || 'einer anderen Methode';
};

/** Firebase-Fehler in eine deutsche, anzeigbare Meldung übersetzen. */
export const socialAuthErrorMessage = async (err: unknown): Promise<string> => {
  const e = err as { code?: string; message?: string; email?: string };
  if (e.code === 'auth/account-exists-with-different-credential') {
    let label = 'einer anderen Methode';
    if (e.email) {
      try {
        label = methodLabel(await firebase.auth().fetchSignInMethodsForEmail(e.email));
      } catch {
        /* Label-Fallback reicht */
      }
    }
    return `Für diese E-Mail existiert bereits ein Konto mit ${label}. Bitte melde dich damit an.`;
  }
  if (e.code === 'auth/operation-not-allowed') {
    return 'Diese Anmeldemethode ist noch nicht freigeschaltet. Bitte versuche es später erneut.';
  }
  if (e.code === 'auth/network-request-failed') {
    return 'Netzwerkfehler — bitte prüfe deine Internetverbindung.';
  }
  if (e.code === 'auth/too-many-requests') {
    return 'Zu viele Versuche — bitte warte einen Moment.';
  }
  return `Anmeldung fehlgeschlagen: ${e.code || e.message || 'Unbekannter Fehler'}`;
};

/** True, wenn das Konto ein Passwort hat (Extension-Login funktioniert). */
export const hasPasswordProvider = (user: firebase.User | null): boolean =>
  !!user?.providerData.some((p) => p?.providerId === 'password');

/** Erster Social-Provider des Kontos ('google' | 'apple' | null). */
export const getSocialProvider = (user: firebase.User | null): SocialProvider | null => {
  for (const p of user?.providerData ?? []) {
    if (p?.providerId === 'google.com') return 'google';
    if (p?.providerId === 'apple.com') return 'apple';
  }
  return null;
};

/** Re-Auth über den Social-Provider (für sensible Aktionen wie Konto-Löschung). */
export const reauthenticateSocial = async (user: firebase.User): Promise<void> => {
  const provider = getSocialProvider(user);
  if (!provider) throw new Error('Kein Social-Login-Konto.');
  const plugin = getCapacitor()?.Plugins?.FirebaseAuthentication;
  if (plugin) {
    const call = provider === 'google' ? plugin.signInWithGoogle : plugin.signInWithApple;
    if (!call) throw new Error('Login in dieser App-Version noch nicht verfügbar.');
    const result = await call({ skipNativeAuth: true });
    await user.reauthenticateWithCredential(toFirebaseCredential(provider, result));
    return;
  }
  if (isElectronShell()) {
    await user.reauthenticateWithRedirect(buildWebProvider(provider));
    return;
  }
  await user.reauthenticateWithPopup(buildWebProvider(provider));
};

/**
 * Passwort für ein Social-Only-Konto festlegen (macht Extension-Login möglich).
 * Re-authentifiziert bei Bedarf automatisch über den Social-Provider.
 */
export const linkPasswordToAccount = async (password: string): Promise<void> => {
  const user = firebase.auth().currentUser;
  if (!user?.email) throw new Error('Kein angemeldeter Nutzer mit E-Mail.');
  const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
  try {
    await user.linkWithCredential(credential);
  } catch (err) {
    if ((err as { code?: string }).code !== 'auth/requires-recent-login') throw err;
    await reauthenticateSocial(user);
    await user.linkWithCredential(credential);
  }
};
