import { ensurePrimaryReadability } from './colorUtils';

const cache = new Map<string, string>();

/**
 * Fest verdrahtete Signalfarben (Amber, Hellgrün, Lavendel …) sind für dunklen Grund gewählt.
 * Als Schrift auf einem hellen Theme wären sie zu blass — dann liefert das hier eine
 * abgedunkelte, lesbare Variante. Auf dunklen Themes kommt die Farbe unverändert zurück.
 */
export function toneColor(color: string): string {
  if (typeof document === 'undefined') return color;
  const root = document.documentElement;
  if (root.dataset.tone !== 'light') return color;
  const background = root.style.getPropertyValue('--theme-background').trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(background) || !/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  const key = `${color}|${background}`;
  let result = cache.get(key);
  if (!result) {
    result = ensurePrimaryReadability(color, background, 3.5);
    cache.set(key, result);
  }
  return result;
}
