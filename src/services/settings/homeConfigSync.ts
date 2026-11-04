import type { HomeConfig } from '../../lib/layout/homeLayout';

/** Die Startseite bleibt als Keep-Alive-Tab gemountet; Editor-Änderungen kommen per Ereignis statt Firebase-Listener. */
const CACHE_KEY = 'homeConfig_cache';
const EVENT = 'tvrank:home-config';

export function publishHomeConfig(config: HomeConfig): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent<HomeConfig>(EVENT, { detail: config }));
}

export function subscribeHomeConfig(onChange: (config: HomeConfig) => void): () => void {
  const listener = (e: Event) => onChange((e as CustomEvent<HomeConfig>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
