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
    } else {
      root.style.setProperty('--vh', `calc(100dvh / ${s})`);
      // Roher Faktor für Elemente, die NICHT mitskalieren sollen (z. B. Splash):
      // sie gegen-zoomen mit calc(1 / var(--display-scale)).
      root.style.setProperty('--display-scale', String(s));
    }
  } catch {
    /* niemals crashen wegen einer Anzeige-Einstellung */
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
