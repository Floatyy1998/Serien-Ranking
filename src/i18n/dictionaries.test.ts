/**
 * Wächter über die Wörterbücher. Die Rückfallkette sorgt dafür, dass eine
 * fehlende Übersetzung nie etwas bricht — sie sorgt aber auch dafür, dass es
 * niemandem auffällt. Diese Tests machen genau das sichtbar:
 *
 * - Jede Sprache deckt denselben Schlüsselsatz ab wie Englisch. Schlägt das
 *   fehl, wurde ein neuer `t()`-Text nur ins englische Wörterbuch übernommen.
 * - Platzhalter überleben die Übersetzung. Ein verlorenes „{n}" zeigt dem
 *   Nutzer eine Lücke, ein umbenanntes zeigt ihm „{n}" im Klartext.
 */

import { describe, expect, it } from 'vitest';
import en from './en';
import es from './es';
import fr from './fr';
import { LOCALES, SOURCE_LOCALE, type Locale } from './locales';

const DICTIONARIES: Partial<Record<Locale, Record<string, string>>> = { en, es, fr };

const placeholders = (text: string): string[] =>
  (text.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).slice().sort();

describe('Wörterbücher', () => {
  it('deckt jede Sprache außer der Quellsprache ab', () => {
    for (const locale of LOCALES) {
      if (locale === SOURCE_LOCALE) continue;
      expect(DICTIONARIES[locale], `Wörterbuch fehlt: ${locale}`).toBeDefined();
    }
  });

  const englishKeys = Object.keys(en);

  for (const locale of Object.keys(DICTIONARIES) as Locale[]) {
    if (locale === 'en') continue;
    it(`${locale} kennt jeden englischen Schlüssel`, () => {
      const dict = DICTIONARIES[locale] ?? {};
      const missing = englishKeys.filter((key) => !(key in dict));
      expect(
        missing,
        `${missing.length} Texte fehlen in ${locale}: ${missing.slice(0, 5).join(' | ')}`
      ).toEqual([]);
    });
  }

  for (const [locale, dict] of Object.entries(DICTIONARIES) as [Locale, Record<string, string>][]) {
    it(`${locale} lässt keinen Eintrag leer`, () => {
      const empty = Object.entries(dict)
        .filter(([, value]) => !value || !value.trim())
        .map(([key]) => key);
      expect(empty, `leere Übersetzungen in ${locale}: ${empty.slice(0, 5).join(' | ')}`).toEqual(
        []
      );
    });

    it(`${locale} behält alle Platzhalter`, () => {
      const broken = Object.entries(dict)
        .filter(([key, value]) => placeholders(key).join() !== placeholders(value).join())
        .map(([key, value]) => `${key} → ${value}`);
      expect(
        broken,
        `Platzhalter weichen ab in ${locale}: ${broken.slice(0, 5).join(' | ')}`
      ).toEqual([]);
    });
  }
});
