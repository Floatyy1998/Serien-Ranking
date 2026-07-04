import { describe, expect, it } from 'vitest';
import { formatValue } from './leaderboardUtils';

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
