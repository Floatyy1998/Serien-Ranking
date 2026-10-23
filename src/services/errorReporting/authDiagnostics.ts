import type firebase from 'firebase/compat/app';
import { PAGE_REPLACING_EVENT } from '../../lib/errorReport/pageReplacing';
import { captureError } from './errorReporter';

const SLOW_AUTH_MS = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

const FIREBASE_IDB = 'firebaseLocalStorageDb';
const FIREBASE_STORE = 'firebaseLocalStorage';
const RETRY_FLAG = 'authIdbRetry';
const LAST_EXIT_KEY = 'authLastExit';
const PROBE_TIMEOUT_MS = 3000;

type IdbProbe = 'user' | 'leer' | 'fehlt' | 'fehler';
type ExitKind = 'manuell' | 'beim Start' | 'in Sitzung';

interface LastExit {
  at: number;
  how: ExitKind;
}

interface StartSnapshot {
  hadSession: boolean;
  storageKeys: number;
  firebaseLocal: boolean;
  lastExit: LastExit | null;
  startedAt: number;
  idb?: IdbProbe;
}

let snapshot: StartSnapshot | null = null;
let firstEventSeen = false;
let startedLoggedOut = false;
let hiddenDuringStart = false;
let signedIn = false;

function readLastExit(): LastExit | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(LAST_EXIT_KEY) || 'null') as LastExit | null;
    return typeof parsed?.at === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

function writeLastExit(how: ExitKind | null): void {
  try {
    if (how) localStorage.setItem(LAST_EXIT_KEY, JSON.stringify({ at: Date.now(), how }));
    else localStorage.removeItem(LAST_EXIT_KEY);
  } catch {
    // localStorage gesperrt
  }
}

/** Vor einem bewussten Abmelden aufrufen — sonst sieht der nächste Neu-Login wie ein Sitzungsverlust aus. */
export function markManualSignOut(): void {
  writeLastExit('manuell');
}

function hasFirebaseLocalUser(): boolean {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.startsWith('firebase:authUser:')) return true;
    }
  } catch {
    // localStorage gesperrt
  }
  return false;
}

function describeLastExit(exit: LastExit | null): string {
  if (!exit) return 'unbekannt';
  const hours = Math.round((Date.now() - exit.at) / 3_600_000);
  return `${exit.how} vor ${hours < 48 ? `${hours} h` : `${Math.round(hours / 24)} d`}`;
}

/** Liegt Firebases Login noch in IndexedDB, obwohl Firebase „abgemeldet“ meldet? */
export function probeFirebaseIdb(): Promise<IdbProbe> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve('fehler'), PROBE_TIMEOUT_MS);
    const done = (result: IdbProbe) => {
      clearTimeout(timer);
      resolve(result);
    };
    try {
      const request = indexedDB.open(FIREBASE_IDB);
      request.onupgradeneeded = () => {
        request.transaction?.abort();
        done('fehlt');
      };
      request.onerror = () => done('fehler');
      request.onsuccess = () => {
        const db = request.result;
        try {
          if (!db.objectStoreNames.contains(FIREBASE_STORE)) {
            db.close();
            done('leer');
            return;
          }
          const keys = db.transaction(FIREBASE_STORE, 'readonly').objectStore(FIREBASE_STORE);
          const all = keys.getAllKeys();
          all.onsuccess = () => {
            db.close();
            done(
              all.result.some((k) => String(k).startsWith('firebase:authUser:')) ? 'user' : 'leer'
            );
          };
          all.onerror = () => {
            db.close();
            done('fehler');
          };
        } catch {
          db.close();
          done('fehler');
        }
      };
    } catch {
      done('fehler');
    }
  });
}

function readRetryFlag(): boolean {
  try {
    return sessionStorage.getItem(RETRY_FLAG) === '1';
  } catch {
    return true;
  }
}

function writeRetryFlag(on: boolean): void {
  try {
    if (on) sessionStorage.setItem(RETRY_FLAG, '1');
    else sessionStorage.removeItem(RETRY_FLAG);
  } catch {
    // sessionStorage gesperrt
  }
}

/** Firebase hat den Login nicht lesen können, er liegt aber noch da: einmal neu laden. */
async function recoverUnreadSession(): Promise<void> {
  const idb = await probeFirebaseIdb();
  if (snapshot) snapshot.idb = idb;
  if (idb !== 'user' || readRetryFlag()) return;
  writeRetryFlag(true);
  window.dispatchEvent(new Event(PAGE_REPLACING_EVENT));
  window.location.reload();
}

/** Zustand beim App-Start festhalten, bevor Firebase die Sitzung prüft. */
export function beginAuthDiagnostics(hadSession: boolean): void {
  let storageKeys = 0;
  try {
    storageKeys = localStorage.length;
  } catch {
    // localStorage gesperrt
  }
  snapshot = {
    hadSession,
    storageKeys,
    firebaseLocal: hasFirebaseLocalUser(),
    lastExit: readLastExit(),
    startedAt: Date.now(),
  };
  firstEventSeen = false;
  startedLoggedOut = false;
  signedIn = false;
  hiddenDuringStart = document.visibilityState === 'hidden';
  document.addEventListener('visibilitychange', markHidden);
}

function markHidden(): void {
  if (document.visibilityState === 'hidden') hiddenDuringStart = true;
}

async function describeStorage(): Promise<string> {
  try {
    const persisted = await navigator.storage?.persisted?.();
    const estimate = await navigator.storage?.estimate?.();
    const usedMb = estimate?.usage ? Math.round(estimate.usage / 1e6) : 0;
    const quotaMb = estimate?.quota ? Math.round(estimate.quota / 1e6) : 0;
    return `persistent: ${persisted ?? 'unbekannt'}, belegt: ${usedMb} von ${quotaMb} MB`;
  } catch {
    return 'persistent: unbekannt';
  }
}

/** Langsamer Start und Neu-Login eines Bestandskontos nach abgemeldetem Start. */
export function trackAuthEvent(user: firebase.User | null): void {
  if (!snapshot) return;
  const wasSignedIn = signedIn;
  signedIn = !!user;
  if (!firstEventSeen) {
    firstEventSeen = true;
    document.removeEventListener('visibilitychange', markHidden);
    const waitedMs = Date.now() - snapshot.startedAt;
    if (!user) {
      startedLoggedOut = true;
      if (snapshot.hadSession) writeLastExit('beim Start');
      // Auch ohne cachedUser prüfen: der kann schon in einer früheren Sitzung verschwunden sein.
      void recoverUnreadSession();
      return;
    }
    writeLastExit(null);
    if (readRetryFlag()) {
      writeRetryFlag(false);
      captureError({
        kind: 'error',
        name: 'AuthIdbRecovered',
        message: 'Login war unlesbar, nach Neuladen wiederhergestellt',
      });
    }
    // Im Hintergrund friert die WebView ein — die Wartezeit sagt dann nichts über Firebase.
    if (waitedMs > SLOW_AUTH_MS && !hiddenDuringStart) {
      captureError({
        kind: 'error',
        name: 'AuthSlowStart',
        message: `Anmeldung erst nach ${waitedMs} ms bereit`,
      });
    }
    return;
  }
  if (!user) {
    const exit = readLastExit();
    const justSignedOut = exit?.how === 'manuell' && Date.now() - exit.at < 60_000;
    if (wasSignedIn && !justSignedOut) writeLastExit('in Sitzung');
    return;
  }
  if (!startedLoggedOut) return;
  startedLoggedOut = false;
  const { hadSession, storageKeys, firebaseLocal, idb } = snapshot;
  const lastExit = snapshot.lastExit ?? readLastExit();
  writeLastExit(null);
  const createdAt = Date.parse(user.metadata?.creationTime || '') || Date.now();
  if (Date.now() - createdAt < DAY_MS) return;
  writeRetryFlag(false);
  // Nach einem bewussten Abmelden ist der Neu-Login kein Befund.
  if (lastExit?.how === 'manuell') return;
  void describeStorage().then((storage) =>
    captureError({
      kind: 'error',
      name: 'AuthRelogin',
      message: `Bestandskonto musste sich neu anmelden (cachedUser: ${hadSession ? 'ja' : 'nein'}, Firebase-IDB: ${idb ?? 'ungeprüft'}, Firebase-localStorage: ${firebaseLocal ? 'ja' : 'nein'}, zuvor: ${describeLastExit(lastExit)}, localStorage-Einträge beim Start: ${storageKeys}, ${storage})`,
    })
  );
}

/** Bittet den Browser, den Speicher der App nicht unter Platzdruck zu räumen (dort liegt die Sitzung). */
export function requestPersistentStorage(): void {
  try {
    if (/firefox/i.test(navigator.userAgent)) return;
    void navigator.storage?.persist?.().catch(() => {});
  } catch {
    // nicht unterstützt
  }
}
