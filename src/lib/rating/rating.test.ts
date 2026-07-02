/**
 * Characterization-Tests für src/lib/rating/rating.ts
 *
 * Pinnen das IST-Verhalten fest (Refactoring-Schutz). Das Modul wird NICHT verändert.
 * Domäne: rating ist eine Map userId → Zahl; die Gesamtwertung ist das Mittel der
 * POSITIVEN Werte als String mit 2 Nachkommastellen (z. B. "8.50").
 */
import { describe, expect, it } from 'vitest';

import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { calculateCorrectAverageRating, calculateOverallRating } from './rating';

/** Baut ein minimales Series-Objekt mit beliebiger rating-Form (bewusst untypisiert). */
const mk = (rating: unknown): Series => ({ rating }) as unknown as Series;

describe('calculateOverallRating', () => {
  describe('Grundverhalten: Mittel der positiven Werte als String', () => {
    it('gibt einen String zurück', () => {
      expect(typeof calculateOverallRating(mk({ u1: 8 }))).toBe('string');
    });

    it('einzelner positiver Wert → "8.00"', () => {
      expect(calculateOverallRating(mk({ u1: 8 }))).toBe('8.00');
    });

    it('formatiert immer mit 2 Nachkommastellen ("8.50", nicht "8.5")', () => {
      expect(calculateOverallRating(mk({ u1: 8, u2: 9 }))).toBe('8.50');
    });

    it('mittelt mehrere positive Werte mit Rundung: (7+8+8)/3 → "7.67"', () => {
      expect(calculateOverallRating(mk({ u1: 7, u2: 8, u3: 8 }))).toBe('7.67');
    });

    it('mittelt Dezimalwerte: (0.1+0.5)/2 → "0.30"', () => {
      expect(calculateOverallRating(mk({ u1: 0.1, u2: 0.5 }))).toBe('0.30');
    });
  });

  describe('negative Werte und Nullen', () => {
    it('ignoriert negative Werte vollständig (weder Summe noch Zähler)', () => {
      expect(calculateOverallRating(mk({ u1: 8, u2: -3, u3: 10 }))).toBe('9.00');
    });

    it('nur negative Werte → "0.00"', () => {
      expect(calculateOverallRating(mk({ u1: -1, u2: -10 }))).toBe('0.00');
    });

    it('0-Werte zählen nicht als Bewertung: {u1: 0} → "0.00"', () => {
      expect(calculateOverallRating(mk({ u1: 0 }))).toBe('0.00');
    });

    it('0-Werte verwässern das Mittel nicht: {0, 8} → "8.00" (nicht "4.00")', () => {
      expect(calculateOverallRating(mk({ u1: 0, u2: 8 }))).toBe('8.00');
    });
  });

  describe('leere/fehlende/kaputte rating-Maps', () => {
    it('leere Map → "0.00"', () => {
      expect(calculateOverallRating(mk({}))).toBe('0.00');
    });

    it('rating undefined → "0.00" (Exception wird geschluckt)', () => {
      expect(calculateOverallRating(mk(undefined))).toBe('0.00');
    });

    it('rating null → "0.00" (Exception wird geschluckt)', () => {
      expect(calculateOverallRating(mk(null))).toBe('0.00');
    });

    it('rating als sparse Array (RTDB-Serialisierung numerischer Keys) funktioniert', () => {
      // eslint-disable-next-line no-sparse-arrays
      expect(calculateOverallRating(mk([, 8, , 10]))).toBe('9.00');
    });

    it('NaN-Werte werden ignoriert (NaN > 0 ist false)', () => {
      expect(calculateOverallRating(mk({ u1: NaN, u2: 8 }))).toBe('8.00');
    });

    it('BEFUND: Infinity wird als gültiger Wert gemittelt → String "Infinity"', () => {
      expect(calculateOverallRating(mk({ u1: Infinity, u2: 8 }))).toBe('Infinity');
    });
  });

  describe('Rundungsverhalten (round auf 0.01 + toFixed(2))', () => {
    it('rundet kaufmännisch auf: 2.005 → "2.01" (Float macht 200.5000...3)', () => {
      expect(calculateOverallRating(mk({ u1: 2.005 }))).toBe('2.01');
    });

    it('BEFUND Float-Quirk: 1.005 → "1.00" statt "1.01" (1.005*100 = 100.4999…)', () => {
      expect(calculateOverallRating(mk({ u1: 1.005 }))).toBe('1.00');
    });

    it('8.125 → "8.13"', () => {
      expect(calculateOverallRating(mk({ u1: 8.125 }))).toBe('8.13');
    });

    it('8.335 → "8.34"', () => {
      expect(calculateOverallRating(mk({ u1: 8.335 }))).toBe('8.34');
    });

    it('sehr kleine positive Werte runden auf "0.00", gelten aber intern als bewertet', () => {
      expect(calculateOverallRating(mk({ u1: 0.001 }))).toBe('0.00');
    });
  });

  describe('untypisierte Werte (loses "> 0" ohne Zahlen-Check)', () => {
    it('BEFUND: String-Werte konkatenieren die Summe: {"5","3"} → "26.50"', () => {
      // 0 + '5' = '05'; '05' + '3' = '053'; '053' / 2 = 26.5
      expect(calculateOverallRating(mk({ u1: '5', u2: '3' }))).toBe('26.50');
    });

    it('BEFUND: boolean true zählt als 1: {true, 9} → "5.00"', () => {
      expect(calculateOverallRating(mk({ u1: true, u2: 9 }))).toBe('5.00');
    });

    it('negative Zahl-Strings werden wie negative Zahlen ignoriert', () => {
      expect(calculateOverallRating(mk({ u1: '-5', u2: 8 }))).toBe('8.00');
    });
  });
});

describe('calculateCorrectAverageRating', () => {
  const items = (...ratings: unknown[]): (Series | Movie)[] => ratings.map((r) => mk(r));

  describe('leere/fehlende Eingaben', () => {
    it('leeres Array → 0', () => {
      expect(calculateCorrectAverageRating([])).toBe(0);
    });

    it('null → 0', () => {
      expect(calculateCorrectAverageRating(null as unknown as Series[])).toBe(0);
    });

    it('undefined → 0', () => {
      expect(calculateCorrectAverageRating(undefined as unknown as Series[])).toBe(0);
    });

    it('nur unbewertete Items → 0', () => {
      expect(calculateCorrectAverageRating(items({}, undefined, { u1: 0 }))).toBe(0);
    });
  });

  describe('Grundverhalten: Mittel der Item-Gesamtwertungen als Zahl', () => {
    it('gibt eine Zahl zurück (kein String wie calculateOverallRating)', () => {
      expect(typeof calculateCorrectAverageRating(items({ u1: 8 }))).toBe('number');
    });

    it('einzelnes Item: Map {8, 9} → 8.5', () => {
      expect(calculateCorrectAverageRating(items({ u1: 8, u2: 9 }))).toBe(8.5);
    });

    it('mehrere Items werden gemittelt und auf 2 Dezimalen gerundet: (10+10+5)/3 → 8.33', () => {
      expect(calculateCorrectAverageRating(items({ u1: 10 }, { u1: 10 }, { u1: 5 }))).toBe(8.33);
    });

    it('mittelt die bereits gerundeten String-Zwischenwerte (parseFloat der "x.xx"-Strings)', () => {
      // Item 1: (7+8+8)/3 → '7.67' → 7.67 (nicht 7.666…); Item 2: '8.00'
      expect(calculateCorrectAverageRating(items({ u1: 7, u2: 8, u3: 8 }, { u1: 8 }))).toBe(7.84);
    });
  });

  describe('Ausschluss unbewerteter/ungültiger Items', () => {
    it('Items ohne rating-Feld werden übersprungen und verwässern nicht', () => {
      expect(calculateCorrectAverageRating(items({ u1: 8 }, undefined))).toBe(8);
    });

    it('rating null passiert den typeof-Guard, wird aber über "0.00" ausgeschlossen', () => {
      expect(calculateCorrectAverageRating(items({ u1: 8 }, null))).toBe(8);
    });

    it('rating als String wird vom typeof-Guard übersprungen', () => {
      expect(calculateCorrectAverageRating(items({ u1: 8 }, '5'))).toBe(8);
    });

    it('Items mit nur negativen Ratings ziehen den Schnitt nicht auf 0 herunter', () => {
      expect(calculateCorrectAverageRating(items({ u1: -5 }, { u1: 8 }))).toBe(8);
    });

    it('Items mit leerer rating-Map werden ausgeschlossen', () => {
      expect(calculateCorrectAverageRating(items({}, { u1: 6 }))).toBe(6);
    });

    it('Item-Gesamtwertung "0.00" durch Mini-Wert (0.001) wird ausgeschlossen (parseFloat=0)', () => {
      expect(calculateCorrectAverageRating(items({ u1: 0.001 }, { u1: 8 }))).toBe(8);
    });

    it('rating als sparse Array zählt als Objekt und wird normal gewertet', () => {
      // eslint-disable-next-line no-sparse-arrays
      expect(calculateCorrectAverageRating(items([, 8, , 10]))).toBe(9);
    });
  });

  describe('Rundung des Gesamtergebnisses', () => {
    it('rundet das Endergebnis auf 2 Dezimalen: (8.33+8.34)/2 → 8.34', () => {
      expect(calculateCorrectAverageRating(items({ u1: 8.33 }, { u1: 8.34 }))).toBe(8.34);
    });

    it('exaktes Ergebnis bleibt unverändert: (8+9)/2 → 8.5', () => {
      expect(calculateCorrectAverageRating(items({ u1: 8 }, { u1: 9 }))).toBe(8.5);
    });
  });
});
