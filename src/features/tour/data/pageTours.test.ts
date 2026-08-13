import { describe, expect, it } from 'vitest';
import en from '../../../i18n/en';
import es from '../../../i18n/es';
import fr from '../../../i18n/fr';
import pt from '../../../i18n/pt';
import { TOUR_ICONS } from '../tourIcons';
import { PAGE_TOURS } from './pageTours';

const DICTIONARIES = { en, es, fr, pt } as const;

/** Jeder deutsche Quelltext, den eine Seitenhilfe rendert. */
const allStrings = PAGE_TOURS.flatMap((tour) => [
  tour.title,
  tour.intro,
  ...tour.actions.flatMap((a) => [a.title, a.text]),
]);

describe('PAGE_TOURS — Struktur', () => {
  it('ist nicht leer', () => {
    expect(PAGE_TOURS.length).toBeGreaterThan(0);
  });

  it('vergibt jeden Pfad nur einmal', () => {
    const paths = PAGE_TOURS.map((t) => t.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('beginnt jeden Pfad mit einem Schrägstrich', () => {
    const bad = PAGE_TOURS.filter((t) => !t.path.startsWith('/'));
    expect(bad.map((t) => t.path)).toEqual([]);
  });

  it('gibt jeder Seite eine positive Version', () => {
    const bad = PAGE_TOURS.filter((t) => !Number.isInteger(t.version) || t.version < 1);
    expect(bad.map((t) => t.path)).toEqual([]);
  });

  it('gibt jeder Seite mindestens zwei Aktionen', () => {
    const bad = PAGE_TOURS.filter((t) => t.actions.length < 2);
    expect(bad.map((t) => t.path)).toEqual([]);
  });

  it('verwendet nur bekannte Icons', () => {
    const unknown = PAGE_TOURS.flatMap((t) =>
      t.actions.filter((a) => !(a.icon in TOUR_ICONS)).map((a) => `${t.path}: ${a.icon}`)
    );
    expect(unknown).toEqual([]);
  });

  it('lässt keinen Text leer', () => {
    expect(allStrings.filter((s) => !s || !s.trim())).toEqual([]);
  });
});

// Ohne diese Prüfung sehen fremdsprachige Nutzer bei einer neuen Seite still
// deutschen Text — t() fällt auf den Quelltext zurück, ohne dass etwas bricht.
describe.each(Object.entries(DICTIONARIES))('PAGE_TOURS — Übersetzung nach %s', (_lang, dict) => {
  it('kennt jeden Text der Seitenhilfe', () => {
    const missing = [...new Set(allStrings)].filter((s) => !(s in dict));
    expect(missing).toEqual([]);
  });

  it('übersetzt keinen Text ins Leere', () => {
    const empty = [...new Set(allStrings)].filter((s) => s in dict && !dict[s].trim());
    expect(empty).toEqual([]);
  });
});
