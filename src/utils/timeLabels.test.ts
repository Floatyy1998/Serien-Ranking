import { describe, expect, it } from 'vitest';
import { calendarDaysBetween, formatAgoLabel, formatDateTimeLabel } from './timeLabels';

const at = (y: number, m: number, d: number, h = 12, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();

describe('formatDateTimeLabel', () => {
  const now = at(2026, 8, 3, 20, 0);

  it('zeigt heutige Zeitstempel mit Uhrzeit', () => {
    expect(formatDateTimeLabel(at(2026, 8, 3, 14, 32), now)).toBe('Heute, 14:32');
  });

  it('zeigt gestrige Zeitstempel mit Uhrzeit', () => {
    expect(formatDateTimeLabel(at(2026, 8, 2, 23, 5), now)).toBe('Gestern, 23:05');
  });

  it('zeigt ältere Zeitstempel als Datum mit Uhrzeit', () => {
    expect(formatDateTimeLabel(at(2026, 7, 12, 18, 4), now)).toBe('12.07., 18:04');
    expect(formatDateTimeLabel(at(2025, 7, 12, 18, 4), now)).toBe('12.07.2025, 18:04');
  });

  it('behandelt Zukunfts-Zeitstempel als heute', () => {
    expect(formatDateTimeLabel(now + 5000, now)).toBe('Heute, 20:00');
  });

  it('faengt ungueltige Werte ab', () => {
    expect(formatDateTimeLabel(undefined, now)).toBe('—');
    expect(formatDateTimeLabel('keine-zeit', now)).toBe('—');
  });
});

describe('formatAgoLabel', () => {
  const now = at(2026, 8, 3, 20, 0);

  it('klemmt Zeitstempel aus der Zukunft auf "gerade eben"', () => {
    expect(formatAgoLabel(now + 60_000, now)).toBe('gerade eben');
  });

  it('staffelt Minuten, Stunden und Tage', () => {
    expect(formatAgoLabel(now - 5 * 60_000, now)).toBe('vor 5 Min.');
    expect(formatAgoLabel(now - 3 * 3_600_000, now)).toBe('vor 3 Std.');
    expect(formatAgoLabel(now - 26 * 3_600_000, now)).toBe('vor 1 Tag');
    expect(formatAgoLabel(now - 4 * 86_400_000, now)).toBe('vor 4 Tagen');
  });

  it('faellt ab einer Woche auf das absolute Datum zurueck', () => {
    expect(formatAgoLabel(at(2026, 7, 12, 18, 4), now)).toBe('12.07., 18:04');
  });
});

describe('calendarDaysBetween', () => {
  it('zaehlt Kalendertage, keine 24-Stunden-Bloecke', () => {
    expect(
      calendarDaysBetween(new Date(at(2026, 8, 2, 23, 50)), new Date(at(2026, 8, 3, 0, 10)))
    ).toBe(1);
  });
});
