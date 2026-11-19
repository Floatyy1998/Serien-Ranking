/**
 * Erkennt, wann die App unter dem Splash fertig aufgebaut ist: im sichtbaren
 * Bereich dreht kein Lader mehr, steht kein Platzhalter mehr, sind alle Bilder
 * da und es kommt seit kurzem nichts Neues hinzu.
 */
const QUIET_MS = 300;
const POLL_MS = 100;
/**
 * Ein hängendes Bild oder ein Platzhalter darf den Start nicht ewig halten.
 * Für einen Seiten-Lader gilt das Limit nicht: auf ihn deckt der Splash nie auf.
 */
export const RENDER_SETTLE_MAX_MS = 8000;

const LOADER_SELECTOR = '[data-app-loading]';
const PLACEHOLDER_SELECTOR = '.skeleton-shimmer';

function inViewport(el: Element): boolean {
  if (el.getClientRects().length === 0) return false;
  const rect = el.getBoundingClientRect();
  return (
    rect.bottom >= 0 &&
    rect.top <= window.innerHeight &&
    rect.right >= 0 &&
    rect.left <= window.innerWidth
  );
}

function hasVisible(root: HTMLElement, selector: string): boolean {
  for (const el of root.querySelectorAll(selector)) {
    if (inViewport(el)) return true;
  }
  return false;
}

function isContentPending(root: HTMLElement): boolean {
  if (hasVisible(root, PLACEHOLDER_SELECTOR)) return true;
  for (const img of root.querySelectorAll('img')) {
    if (!img.complete && inViewport(img)) return true;
  }
  return false;
}

/** Ruft `onSettled` genau einmal; die Rückgabe bricht das Warten ab. */
export function whenRenderSettled(
  root: HTMLElement,
  onSettled: () => void,
  maxMs: number = RENDER_SETTLE_MAX_MS
): () => void {
  let contentSince = Date.now();
  let lastChange = contentSince;
  let done = false;

  // Versteckt vorgemountete Tabs und alles unterhalb des Bildschirms zählen nicht.
  const observer = new MutationObserver((records) => {
    if (records.some((rec) => rec.target instanceof Element && inViewport(rec.target))) {
      lastChange = Date.now();
    }
  });
  observer.observe(root, { childList: true, subtree: true });

  const stop = () => {
    done = true;
    observer.disconnect();
    clearInterval(timer);
  };

  const timer = setInterval(() => {
    if (done) return;
    const now = Date.now();
    if (hasVisible(root, LOADER_SELECTOR)) {
      contentSince = now;
      lastChange = now;
      return;
    }
    const expired = now - contentSince >= maxMs;
    if (!expired && (now - lastChange < QUIET_MS || isContentPending(root))) return;
    stop();
    onSettled();
  }, POLL_MS);

  return () => {
    if (!done) stop();
  };
}
