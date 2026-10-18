import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL as string;

/** Wartezeiten vor dem 2. und 3. Token-Versuch (Netz ist nach dem App-Aufwachen oft noch weg). */
const TOKEN_RETRY_DELAYS_MS = [300, 900];
/** Länge, die auf die Wiederherstellung der Anmeldung gewartet wird. */
const AUTH_RESTORE_WAIT_MS = 3000;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function hasCachedUser(): boolean {
  try {
    return !!localStorage.getItem('cachedUser');
  } catch {
    return false;
  }
}

/**
 * Der eingeloggte User. Direkt nach dem App-Start ist `currentUser` kurz noch
 * leer, obwohl die Sitzung gespeichert ist — dann (und nur dann) kurz warten.
 */
async function resolveUser(): Promise<firebase.User | null> {
  const auth = firebase.auth();
  if (auth.currentUser || !hasCachedUser() || typeof auth.onAuthStateChanged !== 'function') {
    return auth.currentUser;
  }
  return new Promise((resolve) => {
    let unsubscribe: (() => void) | null = null;
    const done = (user: firebase.User | null) => {
      clearTimeout(timer);
      unsubscribe?.();
      resolve(user);
    };
    const timer = setTimeout(() => done(auth.currentUser), AUTH_RESTORE_WAIT_MS);
    unsubscribe = auth.onAuthStateChanged((user) => done(user));
  });
}

async function fetchToken(user: firebase.User, forceRefresh: boolean): Promise<string | null> {
  try {
    return (await user.getIdToken(forceRefresh)) || null;
  } catch {
    return null;
  }
}

/**
 * ID-Token mit Wiederholungen: Das Auffrischen scheitert auf Mobilgeräten kurz
 * nach dem Aufwachen gern am Netz. Ohne Token lehnt das Backend /add & Co. mit
 * 401 ab — der Nutzer sähe nur „Fehler beim Hinzufügen". Ohne User (Passwort-
 * Reset, Gäste) gibt es nichts zu holen und nichts zu warten.
 */
async function getToken(): Promise<string | null> {
  const user = await resolveUser();
  if (!user) return null;
  let token = await fetchToken(user, false);
  for (const delay of TOKEN_RETRY_DELAYS_MS) {
    if (token) return token;
    await sleep(delay);
    token = await fetchToken(user, true);
  }
  return token;
}

function send(path: string, init: RequestInit, token: string | null): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${BACKEND_URL}${path}`, { ...init, headers });
}

/**
 * fetch() gegen die SerienApi-Backend-Domain. Haengt automatisch das
 * Firebase-ID-Token als `Authorization: Bearer <token>` an (Soft-Auth —
 * das Backend nutzt es als vertrauenswuerdige Identitaet, faellt aber noch
 * auf die im Body gesendete uid/uuid zurueck). `path` beginnt mit '/'.
 * Antwortet das Backend mit 401, wird einmal mit frisch erzwungenem Token
 * wiederholt (abgelaufene oder nicht erneuerte Sitzung).
 */
export async function backendFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = await getToken();
  const response = await send(path, init, token);
  const user = response.status === 401 ? firebase.auth().currentUser : null;
  if (!user) return response;

  const fresh = await fetchToken(user, true);
  if (!fresh || fresh === token) return response;
  return send(path, init, fresh);
}
