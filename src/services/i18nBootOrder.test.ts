/**
 * Waechter ueber die Lade-Reihenfolge der Woerterbuecher.
 *
 * Die Sprachtabellen werden nachgeladen (~970 kB, frueher statisch im
 * modulepreload der index.html). Damit `t()` trotzdem ueberall sofort richtig
 * antwortet, laedt `services/i18n` die aktive Sprache per **Top-Level-await**.
 *
 * Das ist load-bearing und nicht durch ein `await` in index.tsx ersetzbar:
 * statische Importe werden vollstaendig ausgewertet, bevor irgendein
 * Rumpf-Code in index.tsx laeuft — und ueber 40 Module rufen `t()` bereits
 * beim Auswerten ihres Moduls auf (Badge-Definitionen im Initial-Chunk,
 * Poster-Platzhalter und Filter-Listen im ui-Chunk). Ohne Top-Level-await
 * saehen Nutzer mit einer anderen Sprache dort dauerhaft die deutschen
 * Quelltexte — still, ohne Fehler, nur falsch.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const i18nSource = readFileSync(join(__dirname, 'i18n.ts'), 'utf-8');

describe('i18n-Ladereihenfolge', () => {
  it('laedt die aktive Sprache per Top-Level-await', () => {
    const topLevelAwait = /^await ensureActiveDictionaries\(\);$/m;
    expect(i18nSource).toMatch(topLevelAwait);
  });

  it('importiert keine Sprachtabelle statisch', () => {
    // Ein statischer Import zoege die volle Tabelle wieder in den Start-Payload.
    expect(i18nSource).not.toMatch(/^import \w+ from '\.\.\/i18n\/(en|es|fr|pt)'/m);
  });
});
