/**
 * Anzeigegröße: skaliert die GESAMTE Oberfläche proportional (wie Browser-Zoom),
 * damit Text, Abstände, Buttons und Bilder zusammen wachsen — nichts bricht.
 *
 * Umsetzung über `zoom` auf dem Wurzelelement (reflowt korrekt, im Gegensatz zu
 * transform:scale, das position:fixed zerschießen würde). Gerätelokal in
 * localStorage — wie eine Zoom-Einstellung üblich.
 */
const KEY = 'displayScale';

export const DISPLAY_SCALES = [0.9, 1, 1.1, 1.25] as const;
export type DisplayScale = (typeof DISPLAY_SCALES)[number];

const isAllowed = (v: number): v is DisplayScale =>
  (DISPLAY_SCALES as readonly number[]).includes(v);

export function getDisplayScale(): DisplayScale {
  try {
    const raw = localStorage.getItem(KEY);
    const v = raw ? parseFloat(raw) : 1;
    return isAllowed(v) ? v : 1;
  } catch {
    return 1;
  }
}

/**
 * Breiten-Stufe der Oberfläche als Attribut am Wurzelelement.
 *
 * `zoom` teilt den Platz, den die Inhalte bekommen (412px bei Zoom 1.25 sind
 * effektiv 330px) — **Media Queries merken das nicht**: `(max-width: 360px)`
 * bleibt dort `false`. Damit greifen alle Umbruchpunkte der App unter Zoom
 * nicht mehr, und Kopfbereiche, Kachelraster und Beschriftungen brechen.
 *
 * Deshalb rechnen wir die tatsächlich verfügbare Breite aus und stellen sie als
 * `data-width="xs|sm|md"` bereit. Layouts, die eng werden können, hängen sich
 * an dieses Attribut statt an eine Media Query.
 */
export type WidthStep = 'xs' | 'sm' | 'md';

/** xs: < 360px nutzbar (kleines Gerät oder Zoom) · sm: < 420px · md: darüber */
export const widthStepFor = (effectiveWidth: number): WidthStep =>
  effectiveWidth < 360 ? 'xs' : effectiveWidth < 420 ? 'sm' : 'md';

/** Nutzbare Layout-Breite in CSS-Pixeln — Fensterbreite geteilt durch den Zoom. */
export const effectiveWidth = (innerWidth: number, scale: number): number =>
  scale > 0 ? innerWidth / scale : innerWidth;

/** Gleiche Schwelle wie useDeviceType — CSS und JSX sollen dasselbe meinen. */
export const MOBILE_LAYOUT_MAX = 768;

function applyWidthStep(scale: number): void {
  try {
    const root = document.documentElement;
    const width = effectiveWidth(window.innerWidth || 0, scale || 1);
    root.dataset.width = widthStepFor(width);
    // Zweite, groebere Stufe fuer Layouts, die zwischen Handy und Desktop
    // umschalten. Eine Media Query taugt dafuer nicht: sie misst den Viewport
    // und sieht den Anzeige-Zoom nicht — bei 800px Fenster und Zoom 1.25
    // rendert JSX bereits mobil, waehrend `@media (max-width: 767px)` noch
    // nicht greift. Genau dort lief der Titel ueber das Poster.
    root.dataset.layout = width < MOBILE_LAYOUT_MAX ? 'mobile' : 'desktop';
    root.style.setProperty('--effective-width', `${Math.round(width)}px`);
  } catch {
    /* niemals crashen wegen einer Anzeige-Einstellung */
  }
}

let widthWatcherBound = false;

/** Einmalig an resize/orientationchange hängen, damit die Stufe mitläuft. */
export function watchWidthStep(): void {
  if (widthWatcherBound || typeof window === 'undefined') return;
  widthWatcherBound = true;
  const update = () => applyWidthStep(getDisplayScale());
  window.addEventListener('resize', update, { passive: true });
  window.addEventListener('orientationchange', update, { passive: true });
  update();
}

export function applyDisplayScale(scale: number): void {
  try {
    const s = isAllowed(scale) ? scale : 1;
    const root = document.documentElement;
    const style = root.style as CSSStyleDeclaration & { zoom?: string };
    // 1 = kein zoom-Attribut setzen (sauberster Zustand)
    style.zoom = s === 1 ? '' : String(s);
    // WICHTIG: zoom skaliert auch die Viewport-Hoehe mit hoch, wodurch fixe
    // Vollbild-Layouts (Chat-Composer, Bottom-Nav) aus dem Viewport gedrueckt
    // werden. Deshalb geben wir den Layout-Containern eine kompensierte
    // Viewport-Hoehe via --vh (durch den Zoom-Faktor geteilt). KEIN var(--vh)
    // hier verwenden — das waere eine Selbstreferenz.
    if (s === 1) {
      root.style.removeProperty('--vh');
      root.style.removeProperty('--display-scale');
      root.style.removeProperty('--display-scale-inverse');
    } else {
      root.style.setProperty('--vh', `calc(100dvh / ${s})`);
      // Roher Faktor für Elemente, die NICHT mitskalieren sollen (z. B. Splash).
      root.style.setProperty('--display-scale', String(s));
      // Kehrwert fertig ausgerechnet: `zoom: calc(...)` ist nicht überall
      // zuverlässig, `zoom: var(--display-scale-inverse)` ist eine schlichte
      // Zahl und funktioniert damit garantiert.
      root.style.setProperty('--display-scale-inverse', String(1 / s));
    }
  } catch {
    /* niemals crashen wegen einer Anzeige-Einstellung */
  }
  applyWidthStep(scale);
  // Alle Groessen-Abhaengigen (useDeviceType, Layout-Hooks) neu bewerten
  // lassen — ein Zoomwechsel aendert die nutzbare Breite wie ein Resize.
  try {
    window.dispatchEvent(new Event('resize'));
  } catch {
    /* ignore */
  }
}

export function setDisplayScale(scale: DisplayScale): void {
  try {
    if (scale === 1) localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, String(scale));
  } catch {
    /* quota — Einstellung ist dann nur für diese Sitzung */
  }
  applyDisplayScale(scale);
}
