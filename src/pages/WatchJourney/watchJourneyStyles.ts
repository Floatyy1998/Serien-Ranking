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

/** Standard-Analytics-Karte (Surface + Border). Ersetzt den wiederholten Block. */
export const wjCard = (theme: ThemeLike): CSSProperties => ({
  margin: '0 var(--space-5) var(--space-6)',
  padding: 'var(--space-5)',
  borderRadius: 'var(--radius-xl)',
  background: theme.background.surface,
  border: `1px solid ${theme.border.default}`,
});

/** Hero-Karte oben in jedem Tab (etwas groesser gerundet, mehr Innenabstand). */
export const wjHero = (theme: ThemeLike): CSSProperties => ({
  margin: '0 var(--space-5) var(--space-6)',
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-2xl)',
  background: theme.background.surface,
  border: `1px solid ${theme.border.default}`,
});

/** Sektions-Ueberschrift (Display-Font). */
export const wjHeading = (color: string, marginBottom = 16): CSSProperties => ({
  color,
  fontSize: 16,
  fontFamily: 'var(--font-display)',
  fontWeight: 700,
  margin: `0 0 ${marginBottom}px`,
});
