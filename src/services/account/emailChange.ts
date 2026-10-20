/**
 * E-Mail-Adresse ändern: Re-Auth mit dem Passwort (Social-Only-Konten über
 * Google/Apple), dann schickt das Backend
 * den Bestätigungslink an die neue Adresse (eigene Domain, App-Sprache).
 * Geändert wird erst beim Klick auf den Link. Fällt der Backend-Weg aus,
 * übernimmt Firebase den Versand (verifyBeforeUpdateEmail).
 */

import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { backendFetch } from '../api/backendApi';
import { reauthenticateSocial } from '../firebase/socialAuth';
import { appLocale } from '../i18n';

const authError = (code: string) => Object.assign(new Error(code), { code });

const BACKEND_ERRORS: Record<string, string> = {
  email_in_use: 'auth/email-already-in-use',
  invalid_email: 'auth/invalid-email',
  same_email: 'auth/same-email',
};

/** password = null → Social-Only-Konto, Re-Auth über den Google/Apple-Provider. */
export async function requestEmailChange(newEmail: string, password: string | null): Promise<void> {
  const user = firebase.auth().currentUser;
  if (!user?.email) throw authError('auth/no-current-user');
  const email = newEmail.trim();
  if (email.toLowerCase() === user.email.toLowerCase()) throw authError('auth/same-email');

  if (password !== null) {
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, password);
    await user.reauthenticateWithCredential(credential);
  } else {
    await reauthenticateSocial(user);
  }
  // Das Backend verlangt ein Token mit frischem auth_time.
  await user.getIdToken(true);

  try {
    const res = await backendFetch('/auth/change-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newEmail: email, lang: appLocale }),
    });
    if (res.ok) return;
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    const mapped = body.error && BACKEND_ERRORS[body.error];
    if (mapped) throw authError(mapped);
    if (res.status === 429) throw authError('auth/too-many-requests');
  } catch (e) {
    if ((e as { code?: string }).code) throw e;
  }
  await user.verifyBeforeUpdateEmail(email);
}
