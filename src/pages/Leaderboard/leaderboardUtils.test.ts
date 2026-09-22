import { describe, expect, it } from 'vitest';
import { formatTotalWatchtime, formatValue } from './leaderboardUtils';

describe('formatValue', () => {
  describe('watchtimeThisMonth (Minuten → h/m)', () => {
    it('unter 60 Minuten bleibt in Minuten', () => {
      expect(formatValue(0, 'watchtimeThisMonth')).toBe('0m');
      expect(formatValue(45, 'watchtimeThisMonth')).toBe('45m');
      expect(formatValue(59, 'watchtimeThisMonth')).toBe('59m');
    });

    it('volle Stunden ohne Minutenrest', () => {
      expect(formatValue(60, 'watchtimeThisMonth')).toBe('1h');
      expect(formatValue(120, 'watchtimeThisMonth')).toBe('2h');
    });

    it('Stunden mit Minutenrest', () => {
      expect(formatValue(90, 'watchtimeThisMonth')).toBe('1h 30m');
      expect(formatValue(125, 'watchtimeThisMonth')).toBe('2h 5m');
    });
  });

  describe('sonstige Kategorien: reine Zahl als String', () => {
    it('episodesThisMonth', () => {
      expect(formatValue(42, 'episodesThisMonth')).toBe('42');
    });

    it('moviesThisMonth', () => {
      expect(formatValue(3, 'moviesThisMonth')).toBe('3');
    });

    it('streakThisMonth / streakAllTime', () => {
      expect(formatValue(7, 'streakThisMonth')).toBe('7');
      expect(formatValue(365, 'streakAllTime')).toBe('365');
    });

    it('60 Minuten werden für Nicht-Watchtime NICHT umgerechnet', () => {
      expect(formatValue(60, 'episodesThisMonth')).toBe('60');
    });
  });
});

describe('formatTotalWatchtime (Gesamtwertung)', () => {
  it('unter einer Stunde bleiben Minuten stehen', () => {
    expect(formatTotalWatchtime(0)).toBe('0 Min');
    expect(formatTotalWatchtime(59)).toBe('59 Min');
  });

  it('Stunden mit und ohne Minutenrest', () => {
    expect(formatTotalWatchtime(60)).toBe('1 Std');
    expect(formatTotalWatchtime(125)).toBe('2 Std 5 Min');
  });

  it('ab einem Tag wird in Tagen gezaehlt \u2014 der eigentliche Punkt des Formats', () => {
    expect(formatTotalWatchtime(24 * 60)).toBe('1 T');
    expect(formatTotalWatchtime(36245)).toBe('25 T 4 Std');
  });

  it('ab einem Jahr kommen Jahre dazu', () => {
    expect(formatTotalWatchtime(365 * 24 * 60)).toBe('1 J');
    expect(formatTotalWatchtime(400 * 24 * 60)).toBe('1 J 35 T');
  });
});

describe('formatValue fuer die Gesamt-Kategorien', () => {
  it('watchtimeMinutes nutzt das Tage-Format statt h/m', () => {
    expect(formatValue(36245, 'watchtimeMinutes')).toBe('25 T 4 Std');
  });

  it('Zaehl-Kategorien bleiben blanke Zahlen', () => {
    expect(formatValue(63, 'seriesStarted')).toBe('63');
    expect(formatValue(212, 'movies')).toBe('212');
    expect(formatValue(1480, 'episodes')).toBe('1480');
  });
});
