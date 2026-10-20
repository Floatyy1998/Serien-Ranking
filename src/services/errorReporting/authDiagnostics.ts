import type firebase from 'firebase/compat/app';
import { PAGE_REPLACING_EVENT } from '../../lib/errorReport/pageReplacing';
import { captureError } from './errorReporter';

const SLOW_AUTH_MS = 5000;
const DAY_MS = 24 * 60 * 60 * 1000;

const FIREBASE_IDB = 'firebaseLocalStorageDb';
const FIREBASE_STORE = 'firebaseLocalStorage';
const RETRY_FLAG = 'authIdbRetry';
const PROBE_TIMEOUT_MS = 3000;

type IdbProbe = 'user' | 'leer' | 'fehlt' | 'fehler';

interface StartSnapshot {
  hadSession: boolean;
  storageKeys: number;
  startedAt: number;
  idb?: IdbProbe;
}

let snapshot: StartSnapshot | null = null;
let firstEventSeen = false;
let startedLoggedOut = false;

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
  snapshot = { hadSession, storageKeys, startedAt: Date.now() };
  firstEventSeen = false;
  startedLoggedOut = false;
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
  if (!firstEventSeen) {
    firstEventSeen = true;
    const waitedMs = Date.now() - snapshot.startedAt;
    if (!user) {
      startedLoggedOut = true;
      if (snapshot.hadSession) void recoverUnreadSession();
      return;
    }
    if (readRetryFlag()) {
      writeRetryFlag(false);
      captureError({
        kind: 'error',
        name: 'AuthIdbRecovered',
        message: 'Login war unlesbar, nach Neuladen wiederhergestellt',
      });
    }
    if (waitedMs > SLOW_AUTH_MS) {
      captureError({
        kind: 'error',
        name: 'AuthSlowStart',
        message: `Anmeldung erst nach ${waitedMs} ms bereit`,
      });
    }
    return;
  }
  if (!user || !startedLoggedOut) return;
  startedLoggedOut = false;
  const createdAt = Date.parse(user.metadata?.creationTime || '') || Date.now();
  if (Date.now() - createdAt < DAY_MS) return;
  const { hadSession, storageKeys, idb } = snapshot;
  writeRetryFlag(false);
  void describeStorage().then((storage) =>
    captureError({
      kind: 'error',
      name: 'AuthRelogin',
      message: `Bestandskonto musste sich neu anmelden (cachedUser: ${hadSession ? 'ja' : 'nein'}, Firebase-IDB: ${idb ?? 'ungeprüft'}, localStorage-Einträge beim Start: ${storageKeys}, ${storage})`,
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
