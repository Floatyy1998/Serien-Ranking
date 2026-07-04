// Vitest global setup. Registriert die jest-dom-Matcher (toBeInTheDocument,
// toHaveTextContent, …) für Komponenten-/Hook-Tests. Harmlos für node-Tests —
// erweitert nur `expect`. Komponenten-/Hook-Tests setzen zusätzlich
// `// @vitest-environment jsdom` als Datei-Pragma (Default bleibt node).
import '@testing-library/jest-dom/vitest';

// jsdom-Polyfills, die viele Komponenten brauchen (framer-motion/useReducedMotion
// → matchMedia; recharts/ResizeObserver). Nur im jsdom-Env aktiv (node hat kein
// window). Einzeln geschützt, damit ein Test sie bei Bedarf überschreiben kann.
if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
  }
  if (!('ResizeObserver' in window)) {
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }
  if (!('IntersectionObserver' in window)) {
    (window as unknown as { IntersectionObserver: unknown }).IntersectionObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    };
  }
  if (!window.scrollTo) {
    window.scrollTo = (() => {}) as unknown as typeof window.scrollTo;
  }
}
