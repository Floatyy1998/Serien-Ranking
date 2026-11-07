/**
 * Bildschirmfoto des sichtbaren Ausschnitts für Bug-Tickets, per html-to-image.
 *
 * Der Klon kennt keine Scrollposition: der Seiten-Scroller stünde im Bild
 * wieder ganz oben. Für die Dauer der Aufnahme wird der Scroll deshalb in
 * einen negativen Rand am ersten Kind umgerechnet — für das Auge dasselbe
 * Bild, auch klebende Kopfzeilen bleiben, wo sie sind — und danach
 * zurückgestellt.
 */
import { toCanvas } from 'html-to-image';

const TIMEOUT_MS = 4000;
const MEDIA_TAGS = new Set(['IMG', 'PICTURE', 'VIDEO', 'IFRAME', 'CANVAS']);
const NO_SHOT_ATTR = 'data-no-shot';

const background = (): string =>
  getComputedStyle(document.documentElement).getPropertyValue('--theme-background').trim() ||
  '#000000';

/** Medien unterhalb des Ausschnitts müssen nicht eingebettet werden — spart die meiste Zeit. */
const keepNode = (node: HTMLElement): boolean => {
  if (!(node instanceof Element)) return true;
  if (node.hasAttribute(NO_SHOT_ATTR)) return false;
  if (!MEDIA_TAGS.has(node.tagName)) return true;
  return node.getBoundingClientRect().top < window.innerHeight + 40;
};

const IN_FLOW = new Set(['static', 'relative', 'sticky']);

/** Das erste Kind im normalen Fluss — sein Rand schiebt alles Folgende mit. */
const firstInFlow = (scroller: HTMLElement): HTMLElement | null =>
  Array.from(scroller.children).find(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el.offsetHeight > 0 && IN_FLOW.has(getComputedStyle(el).position)
  ) ?? null;

/** Rechnet scrollTop in margin-top um; gibt die Rücknahme zurück. */
function freezeScroll(scroller: HTMLElement | null): () => void {
  const first = scroller ? firstInFlow(scroller) : null;
  const top = scroller?.scrollTop ?? 0;
  if (!scroller || !first || top <= 0) return () => {};
  const before = first.style.marginTop;
  const margin = parseFloat(getComputedStyle(first).marginTop) || 0;
  first.style.marginTop = `${margin - top}px`;
  scroller.scrollTo({ top: 0, behavior: 'instant' });
  return () => {
    first.style.marginTop = before;
    scroller.scrollTo({ top, behavior: 'instant' });
  };
}

async function render(skipFonts: boolean, windowScroll: number): Promise<Blob | null> {
  const canvas = await toCanvas(document.body, {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio || 1, 2),
    backgroundColor: background(),
    filter: keepNode,
    skipFonts,
    ...(windowScroll > 0 ? { style: { marginTop: `-${windowScroll}px` } } : {}),
  });
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
}

async function renderWithFallback(windowScroll: number): Promise<Blob | null> {
  try {
    return await render(false, windowScroll);
  } catch {
    return render(true, windowScroll);
  }
}

/**
 * `scroller` ist der Seiten-Scroller (in der App `.mobile-content`), ohne ihn
 * gilt die Fensterposition. null, wenn das Rendern scheitert oder zu lange
 * dauert — das Ticket geht dann ohne Bild.
 */
export async function capturePageShot(scroller: HTMLElement | null): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  const windowScroll = Math.round(window.scrollY || 0);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), TIMEOUT_MS);
  });
  let restore = () => {};
  try {
    restore = freezeScroll(scroller);
    const blob = await Promise.race([renderWithFallback(windowScroll).catch(() => null), timeout]);
    return blob && blob.size > 0 ? blob : null;
  } catch {
    return null;
  } finally {
    restore();
    clearTimeout(timer);
  }
}
