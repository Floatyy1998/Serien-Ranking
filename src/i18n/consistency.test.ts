import { describe, expect, it } from 'vitest';
import { LOCALES, SOURCE_LOCALE } from './locales';

/**
 * Jede Sprache verteilt ihre Übersetzungen auf Bereichsdateien, die
 * `<lang>/index.ts` zu einem Objekt zusammenspreadet. Steht derselbe deutsche
 * Schlüssel in zwei Dateien mit unterschiedlichem Wert, gewinnt stumm die
 * zuletzt gespreadete Datei — der andere Text ist tot und niemandem fällt auf,
 * dass die App etwas anderes zeigt als in der Datei steht.
 */
const modules = import.meta.glob('./*/*.ts', { eager: true }) as Record<
  string,
  { default?: unknown }
>;

const TRANSLATION_LOCALES = LOCALES.filter((l) => l !== SOURCE_LOCALE);

/** Bereichsdateien je Sprache — ohne index.ts (die enthält nur die Summe). */
const filesFor = (lang: string): [string, Record<string, string>][] =>
  Object.entries(modules)
    .filter(([path]) => path.startsWith(`./${lang}/`) && !path.endsWith('/index.ts'))
    .map(([path, mod]) => [
      path.split('/').pop() as string,
      (mod.default ?? {}) as Record<string, string>,
    ]);

describe.each(TRANSLATION_LOCALES)('Wörterbuch %s', (lang) => {
  it('hat überhaupt Bereichsdateien', () => {
    expect(filesFor(lang).length).toBeGreaterThan(0);
  });

  it('übersetzt jeden Schlüssel überall gleich', () => {
    const seen = new Map<string, { file: string; value: string }>();
    const conflicts: string[] = [];

    for (const [file, dict] of filesFor(lang)) {
      for (const [key, value] of Object.entries(dict)) {
        const previous = seen.get(key);
        if (!previous) {
          seen.set(key, { file, value });
        } else if (previous.value !== value) {
          conflicts.push(`${key}: ${previous.file}="${previous.value}" vs ${file}="${value}"`);
        }
      }
    }

    expect(conflicts).toEqual([]);
  });
});
