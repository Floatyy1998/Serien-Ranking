/**
 * Erfassung unbehandelter Client-Fehler und Ablage unter RTDB `clientErrors`.
 *
 * Zwei Dinge sind hier wichtig: die Berichterstattung darf niemals selbst
 * werfen (deshalb überall stilles catch), und sie muss gedrosselt sein — ein
 * Fehler in einer Render-Schleife würde sonst die Datenbank fluten.
 *
 * Fehler vor dem Login lassen sich nicht schreiben: die Rules verlangen ein
 * `auth`-Objekt. Sie werden gepuffert und gehen raus, sobald der Nutzer
 * bekannt ist; ohne Anmeldung gehen sie verloren.
 */
import { buildFingerprint } from '../../lib/errorReport/fingerprint';
import { shortStack, truncate } from '../../lib/errorReport/redact';
import { decideThrottle, type ThrottleState } from '../../lib/errorReport/throttle';
import { dbRef, serverTimestamp } from '../db/ref';
import { addBreadcrumb, getBreadcrumbs, installBreadcrumbs } from './breadcrumbs';
import { collectEnvironment, primeErrorContext } from './context';
import type { ErrorKind, ErrorReport } from '../../types/ErrorReport';

const STORAGE_KEY = 'errorReportThrottle';
const QUEUE_MAX = 10;

type ReportDraft = Omit<ErrorReport, 'id' | 'uid' | 'ts' | 'status'>;

interface CaptureInput {
  kind: ErrorKind;
  name: string;
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
}

let currentUid: string | null = null;
let installed = false;
let sessionErrorCount = 0;
let queued: ReportDraft[] = [];

function loadState(): ThrottleState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ThrottleState) : null;
  } catch {
    return null;
  }
}

function saveState(state: ThrottleState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota oder blockierter Storage — dann greift nur die Sitzungsdrosselung
  }
}

async function persist(draft: ReportDraft, uid: string): Promise<void> {
  try {
    const ref = dbRef('clientErrors').push();
    const id = ref.key ?? crypto.randomUUID();
    await ref.set({ ...draft, id, uid, ts: serverTimestamp(), status: 'open' });
  } catch {
    // Best effort wie alle Firebase-Writes der App
  }
}

/** Sobald der Nutzer bekannt ist, geht der Puffer raus. */
export function setErrorReporterUser(uid: string | null): void {
  currentUid = uid;
  if (!uid || queued.length === 0) return;
  const flush = queued;
  queued = [];
  for (const draft of flush) void persist(draft, uid);
}

/**
 * Voller Geraetespeicher bzw. verweigerter Storage-Zugriff. Das ist ein
 * Zustand des Geraets, kein Defekt der App: IndexedDB und localStorage sind
 * ueberall abgesichert, ohne sie laeuft die App nur ohne Offline-Cache
 * weiter. Gemeldet waere es eine Zeile, an der niemand etwas reparieren kann
 * — und sie kaeme wieder, bis der Nutzer Platz schafft.
 */
function isStorageCondition(input: CaptureInput): boolean {
  if (input.name === 'QuotaExceededError') return true;
  const message = input.message || '';
  return /full disk|backing store|quota ?exceeded|storage is full/i.test(message);
}

/**
 * Fehlgeschlagene Service-Worker-Registrierung. Der Manager behandelt das
 * bereits als folgenlos und versucht es erneut, sobald wieder Netz da ist.
 * Ausloeser ist praktisch immer eine abgerissene Verbindung beim Start — eine
 * Meldung, an der niemand etwas reparieren kann.
 */
function isServiceWorkerRegistration(input: CaptureInput): boolean {
  return /failed to register a serviceworker/i.test(input.message || '');
}

/**
 * "ResizeObserver loop completed with undelivered notifications" — der Browser
 * sagt damit, dass er die Groessenmeldungen eines Frames auf den naechsten
 * verschiebt. Nichts bricht, und die Meldung kommt ohne Stack, ist also auch
 * nicht zuzuordnen. Die bekannten Ausloeser (Layout lesen + Zustand setzen in
 * derselben Rueckmeldung) sind in HorizontalScrollContainer und
 * BottomNavigation auf den naechsten Frame verlegt; hier bleibt nur der
 * Rueckfall, damit Fremdquellen die Berichte nicht zumuellen.
 */
function isResizeObserverLoop(input: CaptureInput): boolean {
  return /resizeobserver loop/i.test(input.message || '');
}

export function captureError(input: CaptureInput): void {
  try {
    if (isStorageCondition(input)) return;
    if (isServiceWorkerRegistration(input)) return;
    if (isResizeObserverLoop(input)) return;
    const fingerprint = buildFingerprint(input);
    const now = Date.now();
    const today = new Date(now).toISOString().slice(0, 10);
    const decision = decideThrottle(loadState(), fingerprint, now, today);
    saveState(decision.next);
    if (!decision.allow) return;

    sessionErrorCount += 1;
    const draft: ReportDraft = {
      fingerprint,
      kind: input.kind,
      name: truncate(input.name || 'Error', 100),
      message: truncate(input.message || '', 500),
      ...(input.stack ? { stack: shortStack(input.stack, 12) } : {}),
      ...(input.componentStack ? { componentStack: shortStack(input.componentStack, 12) } : {}),
      ...(input.source ? { source: truncate(input.source, 200) } : {}),
      clientTs: new Date(now).toISOString(),
      suppressed: decision.suppressed,
      env: collectEnvironment(sessionErrorCount),
      breadcrumbs: getBreadcrumbs(),
    };

    addBreadcrumb('error', `${draft.name}: ${draft.message}`, input.kind);

    if (currentUid) void persist(draft, currentUid);
    else if (queued.length < QUEUE_MAX) queued.push(draft);
  } catch {
    // Die Fehlererfassung darf unter keinen Umstaenden selbst werfen
  }
}

/** Von der ErrorBoundary aufgerufen — React-Render-Fehler. */
export function reportRenderError(error: Error, componentStack?: string): void {
  captureError({
    kind: 'render',
    name: error?.name || 'Error',
    message: error?.message || String(error),
    stack: error?.stack,
    ...(componentStack ? { componentStack } : {}),
  });
}

function onWindowError(event: ErrorEvent): void {
  const target = event.target as Element | null;
  // Ressourcenfehler haben kein `error`-Objekt. Bilder schlagen im Alltag
  // staendig fehl (Poster) — nur Skripte und Stylesheets sind ein Signal.
  if (!event.error && target && target !== (window as unknown as EventTarget)) {
    const tag = String(target.tagName || '').toLowerCase();
    if (tag !== 'script' && tag !== 'link') return;
    // Bei <link> zaehlt nur das Stylesheet. modulepreload/preload/prefetch
    // sind blosse Hinweise: scheitern sie (iOS kappt im Hintergrund die
    // Verbindungen), holt der Browser das Modul beim echten Import ganz
    // normal nach — gemeldet wuerde also ein folgenloser Abbruch.
    if (tag === 'link' && (target.getAttribute?.('rel') || '').toLowerCase() !== 'stylesheet') {
      return;
    }
    const src = target.getAttribute?.('src') || target.getAttribute?.('href') || '';
    captureError({
      kind: 'resource',
      name: 'ResourceError',
      message: `${tag} konnte nicht geladen werden`,
      source: src,
    });
    return;
  }

  const error = event.error as Error | undefined;
  captureError({
    kind: 'error',
    name: error?.name || 'Error',
    message: error?.message || event.message || 'Unbekannter Fehler',
    stack: error?.stack,
    source: event.filename ? `${event.filename}:${event.lineno}:${event.colno}` : undefined,
  });
}

function onUnhandledRejection(event: PromiseRejectionEvent): void {
  const reason = event.reason;
  const error = reason instanceof Error ? reason : undefined;
  captureError({
    kind: 'promise',
    name: error?.name || 'UnhandledRejection',
    message: error?.message || truncate(String(reason), 500),
    stack: error?.stack,
  });
}

export function installErrorReporting(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  installBreadcrumbs();
  void primeErrorContext();

  window.addEventListener('error', onWindowError, true);
  window.addEventListener('unhandledrejection', onUnhandledRejection);
}

/** Nur für Tests. */
export function resetErrorReporter(): void {
  currentUid = null;
  installed = false;
  sessionErrorCount = 0;
  queued = [];
}
