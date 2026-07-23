/**
 * Auth-Mails (Passwort-Reset, Verifizierung) über die eigene Domain: das
 * Backend generiert den Firebase-Aktionslink per Admin-SDK und verschickt
 * ihn via Resend (mail@tv-rank.de, DE/EN nach App-Sprache). Schlägt der
 * Backend-Weg fehl, fällt alles auf den Firebase-Standardversand zurück —
 * der User bekommt seine Mail in jedem Fall.
 */

import type firebase from 'firebase/compat/app';
import { backendFetch } from './backendApi';
import { appLocale } from './i18n';

export async function requestPasswordResetMail(email: string): Promise<void> {
  try {
    const res = await backendFetch('/auth/reset-mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, lang: appLocale }),
    });
    if (res.ok) return;
    throw new Error(`reset-mail ${res.status}`);
  } catch {
    const { default: fb } = await import('firebase/compat/app');
    await fb.auth().sendPasswordResetEmail(email);
  }
}

export async function requestVerificationMail(user: firebase.User): Promise<void> {
  try {
    const res = await backendFetch('/auth/verify-mail', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: appLocale }),
    });
    if (res.ok) return;
    throw new Error(`verify-mail ${res.status}`);
  } catch {
    await user.sendEmailVerification();
  }
}
