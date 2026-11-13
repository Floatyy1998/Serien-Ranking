/**
 * Geteilte Style-Bausteine fuer die WatchJourney-Tabs.
 *
 * Vor diesem Helfer wiederholte jeder Tab denselben Karten-Block als hart
 * kodierte Pixel (margin '0 20px 24px', padding '20px', borderRadius '20px').
 * Hier gebuendelt und auf die Design-System-Tokens (--space-* / --radius-*)
 * gezogen - gleiche Pixelwerte, aber eine einzige Quelle der Wahrheit.
 */

import type { CSSProperties } from 'react';

interface ThemeLike {
  background: { surface: string };
  border: { default: string };
}

/** Standard-Abschnitt: frei auf der Seite, oben von einer Haarlinie getrennt — kein Kasten. */
export const wjCard = (_theme: ThemeLike): CSSProperties => ({
  margin: '0 var(--space-5)',
  padding: 'var(--space-6) 0',
  borderTop: '1px solid var(--hairline)',
});

/** Hero-Karte oben in jedem Tab (etwas groesser gerundet, mehr Innenabstand). */
export const wjHero = (_theme: ThemeLike): CSSProperties => ({
  margin: '0 var(--space-5) var(--space-6)',
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-xl)',
  background: 'var(--glass-light)',
});

/** Sektions-Ueberschrift (Display-Font). */
export const wjHeading = (color: string, marginBottom = 16): CSSProperties => ({
  color,
  fontSize: 20,
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  margin: `0 0 ${marginBottom}px`,
});
