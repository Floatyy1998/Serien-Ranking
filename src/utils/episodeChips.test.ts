import { describe, expect, it } from 'vitest';
import { chipColor, chipLabel, detectEpisodeChip, type EpisodeChipType } from './episodeChips';

type Ep = { air_date?: string; airstamp?: string; airDate?: string; firstAired?: string };
const d = (air_date: string): Ep => ({ air_date });
const noDate: Ep = {};

describe('detectEpisodeChip', () => {
  it('undefined für leere oder fehlende Episodenliste', () => {
    expect(detectEpisodeChip([], 0, false)).toBeUndefined();
    expect(detectEpisodeChip(undefined as unknown as Ep[], 0, false)).toBeUndefined();
  });

  it('undefined wenn der Index außerhalb liegt', () => {
    expect(detectEpisodeChip([d('2024-01-01')], 5, false)).toBeUndefined();
  });

  it('undefined wenn die Ziel-Episode kein Datum hat', () => {
    expect(detectEpisodeChip([noDate, d('2024-01-08')], 0, false)).toBeUndefined();
  });

  it('"season-start" für die erste Episode', () => {
    expect(detectEpisodeChip([d('2024-01-01'), d('2024-01-08')], 0, false)).toBe('season-start');
  });

  it('"mid-season-return" bei großem Abstand zur Vorgängerepisode (> 28 Tage)', () => {
    const eps = [d('2024-01-01'), d('2024-03-01')];
    expect(detectEpisodeChip(eps, 1, false)).toBe('mid-season-return');
  });

  it('"season-finale" für die letzte Episode wenn Season >= 4 Episoden hat', () => {
    const eps = [d('2024-01-01'), d('2024-01-08'), d('2024-01-15'), d('2024-01-22')];
    expect(detectEpisodeChip(eps, 3, true)).toBe('season-finale');
  });

  it('"season-finale" für die letzte Episode einer kurzen, nicht mehr produzierten Season', () => {
    const eps = [d('2024-01-01'), d('2024-01-08')];
    expect(detectEpisodeChip(eps, 1, false)).toBe('season-finale');
  });

  it('kurze Season noch in Produktion → letzte Episode ist KEIN Finale', () => {
    const eps = [d('2024-01-01'), d('2024-01-08')];
    expect(detectEpisodeChip(eps, 1, true)).toBeUndefined();
  });

  it('"season-break" wenn die nächste Episode > 28 Tage später kommt', () => {
    const eps = [d('2024-01-01'), d('2024-01-08'), d('2024-03-01')];
    expect(detectEpisodeChip(eps, 1, false)).toBe('season-break');
  });

  it('"season-break" wenn keine der folgenden (mehreren) Episoden ein Datum hat', () => {
    const eps = [d('2024-01-01'), d('2024-01-08'), noDate, noDate];
    expect(detectEpisodeChip(eps, 1, false)).toBe('season-break');
  });

  it('kein Break, wenn nur EINE datumslose Episode folgt', () => {
    const eps = [d('2024-01-01'), d('2024-01-08'), noDate];
    expect(detectEpisodeChip(eps, 1, false)).toBeUndefined();
  });

  it('undefined für eine normale Mittelepisode mit regulärem Abstand', () => {
    const eps = [d('2024-01-01'), d('2024-01-08'), d('2024-01-15')];
    expect(detectEpisodeChip(eps, 1, false)).toBeUndefined();
  });

  it('überspringt die mid-season-Prüfung, wenn der Vorgänger kein Datum hat', () => {
    const eps = [noDate, d('2024-01-08'), d('2024-01-15')];
    // Kein Vorgängerdatum → kein mid-season-return; regulärer Abstand nach vorn → undefined
    expect(detectEpisodeChip(eps, 1, false)).toBeUndefined();
  });
});

describe('chipLabel', () => {
  it('mappt jeden Typ auf sein deutsches Label', () => {
    expect(chipLabel('season-start')).toBe('Staffelstart');
    expect(chipLabel('mid-season-return')).toBe('Rückkehr');
    expect(chipLabel('season-finale')).toBe('Staffelende');
    expect(chipLabel('season-break')).toBe('Staffelpause');
  });
});

describe('chipColor', () => {
  it('mappt jeden Typ auf eine Farbe', () => {
    const types: EpisodeChipType[] = [
      'season-start',
      'mid-season-return',
      'season-finale',
      'season-break',
    ];
    for (const t of types) {
      expect(chipColor(t)).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('Start und Rückkehr teilen sich die Amber-Farbe', () => {
    expect(chipColor('season-start')).toBe('#f59e0b');
    expect(chipColor('mid-season-return')).toBe('#f59e0b');
    expect(chipColor('season-finale')).toBe('#7c3aed');
    expect(chipColor('season-break')).toBe('#a78bfa');
  });
});
