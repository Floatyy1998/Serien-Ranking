// Ohne Service Worker bemerkt die native Huelle einen Deploy sonst erst am 404 eines alten Chunks.
import { PAGE_REPLACING_EVENT } from '../../lib/errorReport/pageReplacing';
import { isNativeApp } from './nativeShell';
import { showUpdatePill } from './updatePill';

const CHECK_INTERVAL_MS = 10 * 60 * 1000;
const MIN_CHECK_GAP_MS = 60 * 1000;
const RESUME_RELOAD_AFTER_MS = 5 * 60 * 1000;
const FETCH_RETRY_MS = 3000;

const ENTRY_RE = /<script\b[^>]*\bsrc="([^"]*\/assets\/index-[^"]+\.js)"/;

let installed = false;
let hiddenAt: number | null = null;
let lastCheckAt = 0;
let interactedSinceResume = false;
let updateFound = false;
let checking = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

export function entryScriptOf(html: string): string | null {
  const match = ENTRY_RE.exec(html);
  return match ? new URL(match[1], location.href).pathname : null;
}

function runningEntry(): string | null {
  const el = document.querySelector('script[type="module"][src*="/assets/index-"]');
  const src = el?.getAttribute('src');
  return src ? new URL(src, location.href).pathname : null;
}

async function fetchDeployedEntry(): Promise<string | null> {
  try {
    const res = await fetch(`/index.html?v=${Date.now()}`, { cache: 'no-store' });
    return res.ok ? entryScriptOf(await res.text()) : null;
  } catch {
    return null;
  }
}

function reloadNow(): void {
  window.dispatchEvent(new Event(PAGE_REPLACING_EVENT));
  window.location.reload();
}

async function check(hiddenForMs: number): Promise<void> {
  if (updateFound || checking) return;
  const running = runningEntry();
  if (!running) return;
  checking = true;
  lastCheckAt = Date.now();

  // Nach dem Aufwachen scheitert die erste Anfrage auf iOS oft an der gekappten Verbindung.
  let deployed = await fetchDeployedEntry();
  if (!deployed) {
    await new Promise((resolve) => setTimeout(resolve, FETCH_RETRY_MS));
    deployed = await fetchDeployedEntry();
  }
  checking = false;
  if (!deployed || deployed === running) return;
  updateFound = true;

  if (
    hiddenForMs >= RESUME_RELOAD_AFTER_MS &&
    !interactedSinceResume &&
    document.visibilityState === 'visible'
  ) {
    reloadNow();
    return;
  }
  showUpdatePill(reloadNow);
}

function onVisibilityChange(): void {
  if (document.visibilityState === 'hidden') {
    hiddenAt = Date.now();
    if (updateFound) reloadNow();
    return;
  }
  const hiddenForMs = hiddenAt === null ? 0 : Date.now() - hiddenAt;
  hiddenAt = null;
  interactedSinceResume = false;
  // iOS friert die WebView ein, bevor der Reload im Hintergrund greift.
  if (updateFound) {
    reloadNow();
    return;
  }
  if (hiddenForMs >= RESUME_RELOAD_AFTER_MS || Date.now() - lastCheckAt >= MIN_CHECK_GAP_MS) {
    void check(hiddenForMs);
  }
}

function markInteraction(): void {
  interactedSinceResume = true;
}

export function installNativeUpdateCheck(): void {
  if (installed || typeof window === 'undefined' || !isNativeApp()) return;
  installed = true;
  hiddenAt = document.visibilityState === 'hidden' ? Date.now() : null;
  lastCheckAt = Date.now();

  document.addEventListener('pointerdown', markInteraction, true);
  document.addEventListener('keydown', markInteraction, true);
  document.addEventListener('visibilitychange', onVisibilityChange);
  intervalId = setInterval(() => {
    if (document.visibilityState === 'visible') void check(0);
  }, CHECK_INTERVAL_MS);
}

export function resetNativeUpdateCheck(): void {
  document.removeEventListener('pointerdown', markInteraction, true);
  document.removeEventListener('keydown', markInteraction, true);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  if (intervalId) clearInterval(intervalId);
  intervalId = null;
  installed = false;
  hiddenAt = null;
  lastCheckAt = 0;
  interactedSinceResume = false;
  updateFound = false;
  checking = false;
}
