import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatSeasonDate, getFormattedDate, toLocalDateString } from './date.utils';

describe('date.utils', () => {
  describe('toLocalDateString', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it('formatiert ein explizites Datum als YYYY-MM-DD (lokale Komponenten)', () => {
      // Lokale Mitternacht → getFullYear/Month/Date sind TZ-unabhängig
      expect(toLocalDateString(new Date(2024, 0, 15))).toBe('2024-01-15');
    });

    it('padded einstellige Monate und Tage auf zwei Stellen', () => {
      expect(toLocalDateString(new Date(2024, 2, 5))).toBe('2024-03-05');
      expect(toLocalDateString(new Date(2001, 8, 9))).toBe('2001-09-09');
    });

    it('behandelt Dezember (Monat 11 → "12") korrekt', () => {
      expect(toLocalDateString(new Date(2023, 11, 31))).toBe('2023-12-31');
    });

    it('nutzt ohne Argument das aktuelle Datum (new Date())', () => {
      vi.setSystemTime(new Date(2026, 6, 4, 12, 0, 0));
      expect(toLocalDateString()).toBe('2026-07-04');
    });
  });

  describe('getFormattedDate', () => {
    it('gibt "Kein Datum" für leeren String zurück', () => {
      expect(getFormattedDate('')).toBe('Kein Datum');
    });

    it('gibt "Ungültiges Datum" für nicht-parsbare Strings zurück', () => {
      expect(getFormattedDate('kein-datum')).toBe('Ungültiges Datum');
    });

    it('formatiert ein valides lokales Datum als DD.MM.YYYY', () => {
      // Lokale Zeit im String → keine UTC-Verschiebung
      expect(getFormattedDate('2024-03-05T12:00:00')).toBe('05.03.2024');
    });

    it('padded Tag und Monat auf zwei Stellen', () => {
      expect(getFormattedDate('2024-01-09T12:00:00')).toBe('09.01.2024');
    });

    it('formatiert ein Datum am Jahresende korrekt', () => {
      expect(getFormattedDate('2023-12-31T12:00:00')).toBe('31.12.2023');
    });
  });

  describe('formatSeasonDate', () => {
    it('formatiert langes deutsches Datum aus einem String', () => {
      expect(formatSeasonDate('2026-07-05T12:00:00')).toBe('5. Juli 2026');
    });

    it('akzeptiert auch ein Date-Objekt', () => {
      expect(formatSeasonDate(new Date(2026, 0, 1, 12))).toBe('1. Januar 2026');
    });

    it('gibt "Ungültiges Datum" für nicht-parsbare Eingaben zurück', () => {
      expect(formatSeasonDate('nope')).toBe('Ungültiges Datum');
    });
  });
});
