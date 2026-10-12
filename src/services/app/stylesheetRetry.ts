// Vite fordert ein gescheitertes Stylesheet nie neu an — die Seite bliebe ungestylt.

const ATTEMPT_ATTR = 'data-css-retry';
const RETRY_DELAYS_MS = [1000, 4000, 10000];

let installed = false;
const pending = new Set<Promise<void>>();

const attemptOf = (link: Element): number => Number(link.getAttribute(ATTEMPT_ATTR) || 0);

const isStylesheet = (target: EventTarget | null): target is HTMLLinkElement =>
  target instanceof HTMLLinkElement && target.rel.toLowerCase() === 'stylesheet';

export function willRetryStylesheet(link: Element): boolean {
  return installed && link.isConnected && attemptOf(link) < RETRY_DELAYS_MS.length;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function whenUsable(): Promise<void> {
  return new Promise((resolve) => {
    const ready = () => document.visibilityState !== 'hidden' && navigator.onLine !== false;
    if (ready()) {
      resolve();
      return;
    }
    const onChange = () => {
      if (!ready()) return;
      document.removeEventListener('visibilitychange', onChange);
      window.removeEventListener('online', onChange);
      resolve();
    };
    document.addEventListener('visibilitychange', onChange);
    window.addEventListener('online', onChange);
  });
}

function scheduleRetry(failed: HTMLLinkElement): void {
  const attempt = attemptOf(failed) + 1;
  const task = (async () => {
    await wait(RETRY_DELAYS_MS[attempt - 1]);
    await whenUsable();
    if (!failed.isConnected) return;
    const fresh = failed.cloneNode(false) as HTMLLinkElement;
    fresh.setAttribute(ATTEMPT_ATTR, String(attempt));
    await new Promise<void>((resolve) => {
      fresh.addEventListener('load', () => resolve(), { once: true });
      fresh.addEventListener('error', () => resolve(), { once: true });
      failed.replaceWith(fresh);
    });
  })();
  pending.add(task);
  void task.finally(() => pending.delete(task));
}

function onError(event: Event): void {
  const target = event.target;
  if (!isStylesheet(target) || !willRetryStylesheet(target)) return;
  scheduleRetry(target);
}

export async function stylesheetRetriesSettled(maxWaitMs = 5000): Promise<void> {
  const deadline = Date.now() + maxWaitMs;
  while (pending.size > 0) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return;
    await Promise.race([Promise.all(pending), wait(remaining)]);
  }
}

export function installStylesheetRetry(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('error', onError, true);
}

export function resetStylesheetRetry(): void {
  if (installed) window.removeEventListener('error', onError, true);
  installed = false;
  pending.clear();
}
