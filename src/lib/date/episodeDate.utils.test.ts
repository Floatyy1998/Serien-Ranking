import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getUnifiedEpisodeDate } from './episodeDate.utils';

describe('getUnifiedEpisodeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Feste Systemzeit: 15.06.2024 12:00 Berlin (Sommerzeit UTC+2)
    vi.setSystemTime(new Date('2024-06-15T10:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('gibt leeren String für leere Eingabe zurück', () => {
    expect(getUnifiedEpisodeDate('')).toBe('');
  });

  it('gibt leeren String für ungültiges Datum zurück', () => {
    expect(getUnifiedEpisodeDate('kein-datum')).toBe('');
  });

  it('gibt "Heute" zurück, wenn das Episodendatum dem heutigen Berliner Datum entspricht', () => {
    expect(getUnifiedEpisodeDate('2024-06-15T09:00:00Z')).toBe('Heute');
  });

  it('gibt "Morgen" zurück, wenn das Episodendatum dem morgigen Berliner Datum entspricht', () => {
    expect(getUnifiedEpisodeDate('2024-06-16T09:00:00Z')).toBe('Morgen');
  });

  it('formatiert ein sonstiges Datum als DD.MM.YYYY (Berliner Zeitzone)', () => {
    expect(getUnifiedEpisodeDate('2024-06-20T09:00:00Z')).toBe('20.06.2024');
  });

  it('akzeptiert ein Date-Objekt als Eingabe', () => {
    expect(getUnifiedEpisodeDate(new Date('2024-06-20T09:00:00Z'))).toBe('20.06.2024');
  });

  it('formatiert ein weit zurückliegendes Datum vollständig', () => {
    expect(getUnifiedEpisodeDate('2020-01-02T12:00:00Z')).toBe('02.01.2020');
  });
});
