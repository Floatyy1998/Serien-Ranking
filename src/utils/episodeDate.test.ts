/**
 * Characterization-Tests für src/utils/episodeDate.ts
 *
 * Diese Tests pinnen das IST-Verhalten fest (inkl. Quirks/Auffälligkeiten),
 * damit Refactorings nichts stillschweigend ändern. Sie sind KEINE
 * Soll-Spezifikation.
 *
 * Zeitzone: Die TVMaze-Mitternachts-Erkennung arbeitet mit LOKALER Zeit
 * (getHours/getMinutes). Für deterministische Ergebnisse wird die Zeitzone
 * auf Europe/Berlin gepinnt (Node >= 16.2 wertet TZ auch auf Windows zur
 * Laufzeit aus; hier verifiziert mit Node 24).
 *
 * Berlin-Referenz: Sommerzeit (CEST, UTC+2) 29.03.2026 – 25.10.2026,
 * sonst CET (UTC+1).
 */
process.env.TZ = 'Europe/Berlin';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getEpisodeAirDate, getEpisodeAirDateStr, hasEpisodeAired } from './episodeDate';

describe('getEpisodeAirDateStr', () => {
  describe('Null-/Leereingaben', () => {
    it('gibt null für null zurück', () => {
      expect(getEpisodeAirDateStr(null)).toBeNull();
    });

    it('gibt null für undefined zurück', () => {
      expect(getEpisodeAirDateStr(undefined)).toBeNull();
    });

    it('gibt null für ein leeres Objekt zurück', () => {
      expect(getEpisodeAirDateStr({})).toBeNull();
    });
  });

  describe('Feld-Präferenz ohne airstamp', () => {
    it('bevorzugt air_date vor airDate und firstAired', () => {
      expect(
        getEpisodeAirDateStr({
          air_date: '2026-01-01',
          airDate: '2026-02-02',
          firstAired: '2026-03-03',
        })
      ).toBe('2026-01-01');
    });

    it('bevorzugt airDate vor firstAired', () => {
      expect(getEpisodeAirDateStr({ airDate: '2026-02-02', firstAired: '2026-03-03' })).toBe(
        '2026-02-02'
      );
    });

    it('nutzt firstAired als letzten Fallback', () => {
      expect(getEpisodeAirDateStr({ firstAired: '2026-03-03' })).toBe('2026-03-03');
    });

    it('leerer String bei air_date fällt auf airDate durch (falsy-Kette)', () => {
      expect(getEpisodeAirDateStr({ air_date: '', airDate: '2026-02-02' })).toBe('2026-02-02');
    });

    it('BEFUND: ungültige Datums-Strings werden UNVALIDIERT zurückgegeben', () => {
      expect(getEpisodeAirDateStr({ air_date: 'aaaa-bb-cc' })).toBe('aaaa-bb-cc');
    });
  });

  describe('airstamp-Präferenz (ohne Quirk)', () => {
    it('nimmt den UTC-Datumsteil des airstamp statt air_date', () => {
      // 20:15 UTC = 22:15 Berlin → keine lokale Mitternacht → kein Quirk
      expect(
        getEpisodeAirDateStr({ airstamp: '2026-04-30T20:15:00Z', air_date: '2026-04-29' })
      ).toBe('2026-04-30');
    });

    it('BEFUND: UTC-Datumsteil kann vom LOKALEN Kalendertag abweichen (gleicher lokaler Tag → kein Quirk)', () => {
      // 2026-04-30T22:00Z = 01.05. 00:00 Berlin; air_date ist ebenfalls der 01.05.
      // → Differenz 0 Tage, Quirk greift nicht → es wird der UTC-Tag 30.04. geliefert,
      // obwohl die Episode lokal am 01.05. läuft.
      expect(
        getEpisodeAirDateStr({ airstamp: '2026-04-30T22:00:00Z', air_date: '2026-05-01' })
      ).toBe('2026-04-30');
    });

    it('airstamp mit UTC-Mitternacht (lokal 02:00) ist KEIN Quirk → UTC-Datumsteil', () => {
      expect(
        getEpisodeAirDateStr({ airstamp: '2026-05-01T00:00:00Z', air_date: '2026-04-30' })
      ).toBe('2026-05-01');
    });

    it('leerer airstamp-String fällt auf air_date durch', () => {
      expect(getEpisodeAirDateStr({ airstamp: '', air_date: '2026-04-30' })).toBe('2026-04-30');
    });

    it('BEFUND: ungültiger airstamp ohne "T" wird verbatim zurückgegeben und ÜBERDECKT ein gültiges air_date', () => {
      expect(getEpisodeAirDateStr({ airstamp: 'not-a-date', air_date: '2026-04-30' })).toBe(
        'not-a-date'
      );
    });

    it('ungültiger airstamp, der mit "T" beginnt, fällt via split auf air_date durch', () => {
      // 'TOTAL-GARBAGE'.split('T')[0] === '' (falsy) → dateStr
      expect(getEpisodeAirDateStr({ airstamp: 'TOTAL-GARBAGE', air_date: '2026-04-30' })).toBe(
        '2026-04-30'
      );
    });
  });

  describe('TVMaze-Mitternachts-Quirk', () => {
    it('Doku-Beispiel: airstamp = lokale Mitternacht des Folgetags → air_date gewinnt', () => {
      // 2026-04-30T22:00Z = 01.05. 00:00 Berlin, air_date 30.04. → Quirk
      expect(
        getEpisodeAirDateStr({ airstamp: '2026-04-30T22:00:00+00:00', air_date: '2026-04-30' })
      ).toBe('2026-04-30');
    });

    it('Quirk greift auch bei Offset-Notation (+02:00)', () => {
      // 2026-05-01T00:00+02:00 = exakt lokale Mitternacht 01.05. Berlin
      expect(
        getEpisodeAirDateStr({ airstamp: '2026-05-01T00:00:00+02:00', air_date: '2026-04-30' })
      ).toBe('2026-04-30');
    });

    it('Quirk nutzt auch firstAired als Datumsquelle', () => {
      expect(
        getEpisodeAirDateStr({ airstamp: '2026-04-30T22:00:00Z', firstAired: '2026-04-30' })
      ).toBe('2026-04-30');
    });

    it('Sekunden werden ignoriert: 00:00:59 lokal zählt noch als Mitternacht', () => {
      expect(
        getEpisodeAirDateStr({ airstamp: '2026-04-30T22:00:59Z', air_date: '2026-04-30' })
      ).toBe('2026-04-30');
    });

    it('air_date ohne führende Nullen wird akzeptiert und AS-IS zurückgegeben', () => {
      expect(
        getEpisodeAirDateStr({ airstamp: '2026-04-30T22:00:00Z', air_date: '2026-4-30' })
      ).toBe('2026-4-30');
    });

    it('kein Quirk bei 2 Tagen Differenz → UTC-Datumsteil des airstamp', () => {
      expect(
        getEpisodeAirDateStr({ airstamp: '2026-04-30T22:00:00Z', air_date: '2026-04-29' })
      ).toBe('2026-04-30');
    });

    it('kein Quirk bei air_date mit nur 2 Teilen ("2026-04") → UTC-Datumsteil', () => {
      expect(getEpisodeAirDateStr({ airstamp: '2026-04-30T22:00:00Z', air_date: '2026-04' })).toBe(
        '2026-04-30'
      );
    });

    it('01:00 lokal (23:00Z) ist keine Mitternacht → kein Quirk', () => {
      expect(
        getEpisodeAirDateStr({ airstamp: '2026-04-30T23:00:00Z', air_date: '2026-04-30' })
      ).toBe('2026-04-30');
    });
  });
});

describe('getEpisodeAirDate', () => {
  describe('Null-/Leereingaben', () => {
    it('gibt null für null/undefined/leeres Objekt zurück', () => {
      expect(getEpisodeAirDate(null)).toBeNull();
      expect(getEpisodeAirDate(undefined)).toBeNull();
      expect(getEpisodeAirDate({})).toBeNull();
    });

    it('gibt null bei ausschließlich ungültigen Daten zurück', () => {
      expect(getEpisodeAirDate({ air_date: 'aaaa-bb-cc' })).toBeNull();
    });
  });

  describe('airstamp-Pfad', () => {
    it('gibt ohne Quirk den exakten airstamp-Zeitpunkt zurück', () => {
      const d = getEpisodeAirDate({ airstamp: '2026-04-30T20:15:00Z', air_date: '2026-04-29' });
      expect(d?.getTime()).toBe(Date.parse('2026-04-30T20:15:00Z'));
    });

    it('Quirk: gibt LOKALE Mitternacht des air_date zurück (nicht den airstamp)', () => {
      const d = getEpisodeAirDate({ airstamp: '2026-04-30T22:00:00Z', air_date: '2026-04-30' });
      expect(d?.getTime()).toBe(new Date(2026, 3, 30).getTime());
      // Berlin CEST: lokale Mitternacht 30.04. = 29.04. 22:00 UTC
      expect(d?.toISOString()).toBe('2026-04-29T22:00:00.000Z');
    });

    it('ungültiger airstamp fällt auf air_date zurück (anders als die String-Variante)', () => {
      const d = getEpisodeAirDate({ airstamp: 'not-a-date', air_date: '2026-04-30' });
      expect(d?.toISOString()).toBe('2026-04-30T00:00:00.000Z');
    });
  });

  describe('Date-only-Fallback', () => {
    it('BEFUND: date-only wird als UTC-Mitternacht geparst — inkonsistent zur LOKALEN Mitternacht des Quirk-Pfads', () => {
      const d = getEpisodeAirDate({ air_date: '2026-04-30' });
      // UTC-Mitternacht = 02:00 lokal in Berlin (CEST)
      expect(d?.toISOString()).toBe('2026-04-30T00:00:00.000Z');
      expect(d?.getHours()).toBe(2);
    });

    it('unvollständiges Datum "2026-04" wird als 01.04. (UTC) geparst', () => {
      const d = getEpisodeAirDate({ air_date: '2026-04' });
      expect(d?.toISOString()).toBe('2026-04-01T00:00:00.000Z');
    });
  });

  describe('DST-Ränder (Europe/Berlin 2026)', () => {
    it('BEFUND: am Umstellungstag Frühjahr (23h-Tag, 29.03.) wird der echte Quirk NICHT erkannt', () => {
      // 2026-03-29T22:00Z = 30.03. 00:00 CEST (lokale Mitternacht des Folgetags!)
      // Aber: Mitternacht 29.03. (CET) → Mitternacht 30.03. (CEST) sind nur 23h,
      // die Prüfung verlangt exakt 24h → Quirk verfehlt → roher airstamp.
      const d = getEpisodeAirDate({ airstamp: '2026-03-29T22:00:00Z', air_date: '2026-03-29' });
      expect(d?.getTime()).toBe(Date.parse('2026-03-29T22:00:00Z'));
      expect(d?.getTime()).not.toBe(new Date(2026, 2, 29).getTime());
    });

    it('BEFUND: am Umstellungstag Herbst (25h-Tag, 25.10.) wird der echte Quirk NICHT erkannt', () => {
      // 2026-10-25T23:00Z = 26.10. 00:00 CET (lokale Mitternacht des Folgetags!)
      // Mitternacht 25.10. (CEST) → Mitternacht 26.10. (CET) sind 25h → Quirk verfehlt.
      const d = getEpisodeAirDate({ airstamp: '2026-10-25T23:00:00Z', air_date: '2026-10-25' });
      expect(d?.getTime()).toBe(Date.parse('2026-10-25T23:00:00Z'));
      expect(d?.getTime()).not.toBe(new Date(2026, 9, 25).getTime());
    });
  });
});

describe('hasEpisodeAired', () => {
  // Jetzt = 02.07.2026 10:00 Berlin (CEST) = 08:00 UTC
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-07-02T08:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('gibt false für null/undefined/leeres Objekt zurück', () => {
    expect(hasEpisodeAired(null)).toBe(false);
    expect(hasEpisodeAired(undefined)).toBe(false);
    expect(hasEpisodeAired({})).toBe(false);
  });

  it('gibt false bei ungültigem Datum zurück', () => {
    expect(hasEpisodeAired({ air_date: 'kein-datum' })).toBe(false);
  });

  describe('mit airstamp (exakter Zeitvergleich)', () => {
    it('airstamp in der Vergangenheit → true', () => {
      expect(hasEpisodeAired({ airstamp: '2026-07-02T07:59:00Z' })).toBe(true);
    });

    it('airstamp exakt jetzt → true (<= Vergleich)', () => {
      expect(hasEpisodeAired({ airstamp: '2026-07-02T08:00:00Z' })).toBe(true);
    });

    it('airstamp in der Zukunft → false (keine End-of-Day-Kulanz)', () => {
      expect(hasEpisodeAired({ airstamp: '2026-07-02T08:00:01Z' })).toBe(false);
    });

    it('Quirk macht eine heute-Episode zu "aired", obwohl der rohe airstamp in der Zukunft liegt', () => {
      // airstamp 22:00Z = lokale Mitternacht 03.07. → Quirk korrigiert auf 02.07. 00:00 lokal
      expect(hasEpisodeAired({ airstamp: '2026-07-02T22:00:00Z', air_date: '2026-07-02' })).toBe(
        true
      );
    });

    it('gleicher zukünftiger airstamp OHNE air_date (kein Quirk möglich) → false', () => {
      expect(hasEpisodeAired({ airstamp: '2026-07-02T22:00:00Z' })).toBe(false);
    });
  });

  describe('date-only (End-of-Day-Kulanz)', () => {
    it('air_date heute → true, auch wenn es erst Vormittag ist', () => {
      expect(hasEpisodeAired({ air_date: '2026-07-02' })).toBe(true);
    });

    it('air_date gestern → true', () => {
      expect(hasEpisodeAired({ air_date: '2026-07-01' })).toBe(true);
    });

    it('air_date morgen → false', () => {
      expect(hasEpisodeAired({ air_date: '2026-07-03' })).toBe(false);
    });

    it('firstAired heute → true (gleiche Kulanz für Fallback-Felder)', () => {
      expect(hasEpisodeAired({ firstAired: '2026-07-02' })).toBe(true);
    });
  });
});
