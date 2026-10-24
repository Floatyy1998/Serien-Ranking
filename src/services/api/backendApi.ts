import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { captureError, isPageLeaving } from '../errorReporting/errorReporter';

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

/** Gibt es eine (ggf. noch wiederherzustellende) Anmeldung? Ohne sie lehnt das Backend Routen mit Pflicht-Login ab. */
export function hasBackendSession(): boolean {
  try {
    if (firebase.auth().currentUser) return true;
  } catch {
    // Firebase noch nicht initialisiert
  }
  return hasCachedUser();
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

/** Fehlercode des letzten gescheiterten Token-Abrufs, für den Fehlerbericht. */
let lastTokenError: string | null = null;

async function fetchToken(user: firebase.User, forceRefresh: boolean): Promise<string | null> {
  try {
    const token = (await user.getIdToken(forceRefresh)) || null;
    if (token) lastTokenError = null;
    return token;
  } catch (error) {
    lastTokenError = (error as { code?: string })?.code ?? (error as Error)?.name ?? 'unbekannt';
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

/**
 * Nur das Hinzufügen und reine MangaUpdates-Lesezugriffe werden bei
 * Verbindungsabbruch oder 502/503/504 wiederholt: Das Backend prüft zuerst auf
 * „bereits vorhanden", ein Doppelversand schadet also nicht. Der Prozess startet
 * gelegentlich neu (pm2) und ist dann einige Sekunden nicht erreichbar bzw.
 * reißt die laufende Anfrage ab; im Mobilfunk bricht auch mal eine einzelne ab.
 */
const RETRY_PATHS = new Set([
  '/add',
  '/addMovie',
  '/mangaupdates/batch',
  '/mangaupdates/search',
  '/mangaupdates/titles',
]);
const CONNECTION_RETRY_DELAYS_MS = [1500, 4000];
const TRANSIENT_STATUS = new Set([502, 503, 504]);

/** Teilen sich im Backend einen Topf von 60 Anfragen pro Minute und Konto — wir bleiben knapp darunter. */
const ADD_LIMIT_PATHS = new Set(['/add', '/addMovie', '/refreshAnimeFiller']);
const ADD_LIMIT = 58;
const ADD_WINDOW_MS = 60_000;
const RATE_LIMIT_FALLBACK_WAIT_MS = 30_000;
const addSendTimes: number[] = [];

async function awaitAddSlot(): Promise<void> {
  for (;;) {
    const now = Date.now();
    while (addSendTimes.length && now - addSendTimes[0] >= ADD_WINDOW_MS) addSendTimes.shift();
    if (addSendTimes.length < ADD_LIMIT) {
      addSendTimes.push(now);
      return;
    }
    await sleep(addSendTimes[0] + ADD_WINDOW_MS - now);
  }
}

function retryAfterMs(response: Response): number {
  const seconds = Number(response.headers?.get('Retry-After'));
  if (!Number.isFinite(seconds) || seconds <= 0) return RATE_LIMIT_FALLBACK_WAIT_MS;
  return Math.min(seconds * 1000, ADD_WINDOW_MS);
}

async function send(path: string, init: RequestInit, token: string | null): Promise<Response> {
  if (ADD_LIMIT_PATHS.has(path)) await awaitAddSlot();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(`${BACKEND_URL}${path}`, { ...init, headers });
}

function reportFailure(path: string, init: RequestInit, outcome: string): void {
  captureError({
    kind: 'error',
    name: 'BackendFetch',
    message: `${init.method ?? 'GET'} ${path} ${outcome} (online=${navigator.onLine})`,
    source: path,
  });
}

async function sendWithRetry(
  path: string,
  init: RequestInit,
  token: string | null
): Promise<Response> {
  const delays = RETRY_PATHS.has(path) ? CONNECTION_RETRY_DELAYS_MS : [];
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await send(path, init, token);
      if (!TRANSIENT_STATUS.has(response.status) || attempt >= delays.length) return response;
    } catch (error) {
      if (attempt >= delays.length) {
        // Im Hintergrund kappen Android-WebView und iOS das Netz, beim Update-Reload der Browser selbst — kein Befund.
        const hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
        if (!hidden && !isPageLeaving()) {
          reportFailure(path, init, `Verbindungsfehler: ${(error as Error)?.message ?? error}`);
        }
        throw error;
      }
    }
    await sleep(delays[attempt]);
  }
}

/**
 * fetch() gegen die SerienApi-Backend-Domain. Haengt automatisch das
 * Firebase-ID-Token als `Authorization: Bearer <token>` an (Soft-Auth —
 * das Backend nutzt es als vertrauenswuerdige Identitaet, faellt aber noch
 * auf die im Body gesendete uid/uuid zurueck). `path` beginnt mit '/'.
 * Antwortet das Backend mit 401, wird einmal mit frisch erzwungenem Token
 * wiederholt (abgelaufene oder nicht erneuerte Sitzung). Hinzufügen-Pfade
 * halten das Minutenlimit des Backends selbst ein. Scheitert ein
 * Aufruf endgültig (401/403/429/5xx oder Verbindungsfehler), geht eine
 * Meldung an die Client-Fehlerberichte, damit der Grund sichtbar wird —
 * außer bei `quietStatuses`, die der Aufrufer bewusst selbst abfängt.
 */
export async function backendFetch(
  path: string,
  init: RequestInit = {},
  { quietStatuses = [] }: { quietStatuses?: readonly number[] } = {}
): Promise<Response> {
  lastTokenError = null;
  let token = await getToken();
  let response = await sendWithRetry(path, init, token);

  const user = response.status === 401 ? firebase.auth().currentUser : null;
  if (user) {
    const fresh = await fetchToken(user, true);
    if (fresh && fresh !== token) {
      token = fresh;
      response = await sendWithRetry(path, init, fresh);
    }
  }

  // Andere Geräte, die Extension oder ein zweiter Tab desselben Kontos zählen mit.
  if (response.status === 429 && ADD_LIMIT_PATHS.has(path)) {
    await sleep(retryAfterMs(response));
    response = await sendWithRetry(path, init, token);
  }

  const failed = [401, 403, 429].includes(response.status) || response.status >= 500;
  if (failed && !quietStatuses.includes(response.status)) {
    const tokenState = token
      ? 'mit Token'
      : lastTokenError
        ? `ohne Token, Erneuerung gescheitert: ${lastTokenError}`
        : 'ohne Token';
    reportFailure(path, init, `-> ${response.status} (${tokenState})`);
  }
  return response;
}
