import { describe, expect, it } from 'vitest';
import {
  FALLBACK_CHAIN,
  LOCALES,
  LOCALE_LABEL,
  LOCALE_TAG,
  SOURCE_LOCALE,
  TMDB_LANGUAGE,
  isLocale,
  matchLocale,
} from './locales';

describe('Sprachtabelle', () => {
  it('ist für jede Sprache vollständig', () => {
    for (const locale of LOCALES) {
      expect(LOCALE_LABEL[locale], `Label fehlt: ${locale}`).toBeTruthy();
      expect(LOCALE_TAG[locale], `BCP-47 fehlt: ${locale}`).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      expect(TMDB_LANGUAGE[locale], `TMDB-Sprache fehlt: ${locale}`).toMatch(/^[a-z]{2}-[A-Z]{2}$/);
      expect(FALLBACK_CHAIN[locale], `Rückfallkette fehlt: ${locale}`).toBeDefined();
    }
  });

  it('führt die Quellsprache mit', () => {
    expect(LOCALES).toContain(SOURCE_LOCALE);
  });

  it('lässt keine Rückfallkette im Kreis laufen', () => {
    for (const locale of LOCALES) {
      expect(FALLBACK_CHAIN[locale]).not.toContain(locale);
    }
  });

  it('verweist nur auf bekannte Sprachen', () => {
    for (const locale of LOCALES) {
      for (const next of FALLBACK_CHAIN[locale]) expect(LOCALES).toContain(next);
    }
  });
});

describe('isLocale', () => {
  it('erkennt unterstützte Sprachen', () => {
    expect(isLocale('es')).toBe(true);
    expect(isLocale('fr')).toBe(true);
  });

  it('weist alles andere ab', () => {
    expect(isLocale('it')).toBe(false);
    expect(isLocale('auto')).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(undefined)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });
});

describe('matchLocale', () => {
  it('nimmt die erste Browsersprache, die wir sprechen', () => {
    expect(matchLocale(['it-IT', 'fr-FR', 'de-DE'])).toBe('fr');
  });

  it('ignoriert die Region', () => {
    expect(matchLocale(['es-419'])).toBe('es');
    expect(matchLocale(['de-AT'])).toBe('de');
    expect(matchLocale(['pt-BR'])).toBe('pt');
    expect(matchLocale(['pt-PT'])).toBe('pt');
  });

  it('ist unabhängig von Groß- und Kleinschreibung', () => {
    expect(matchLocale(['FR-ca'])).toBe('fr');
  });

  it('gibt null ohne Treffer', () => {
    expect(matchLocale(['it', 'nl-NL'])).toBeNull();
    expect(matchLocale([])).toBeNull();
  });

  it('vertraegt Unsinn in der Liste', () => {
    expect(matchLocale(['', null as unknown as string, 'es'])).toBe('es');
  });
});
