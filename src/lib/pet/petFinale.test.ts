import { describe, expect, it } from 'vitest';
import type { Series } from '../../types/Series';
import { detectFinale } from './petFinale';

const ep = (n: number) => ({
  id: n,
  name: `E${n}`,
  air_date: '2026-01-01',
  watched: false,
  episode_number: n,
});

function series(seasons: number[], ended: boolean): Pick<Series, 'seasons' | 'production'> {
  return {
    seasons: seasons.map((count, i) => ({
      seasonNumber: i + 1,
      episodes: Array.from({ length: count }, (_, k) => ep(k + 1)),
    })),
    production: { production: !ended },
  };
}

describe('detectFinale', () => {
  it('erkennt das Staffelfinale', () => {
    expect(detectFinale(series([10, 8], false), 1, 10)).toBe('season');
  });

  it('erkennt das Serienfinale einer beendeten Serie', () => {
    expect(detectFinale(series([10, 8], true), 2, 8)).toBe('series');
  });

  it('meldet bei einer laufenden Serie nur das Staffelende', () => {
    expect(detectFinale(series([10, 8], false), 2, 8)).toBe('season');
  });

  it('meldet mitten in der Staffel nichts', () => {
    expect(detectFinale(series([10], true), 1, 4)).toBeNull();
  });

  it('kommt mit unbekannten Staffeln klar', () => {
    expect(detectFinale(series([3], true), 5, 1)).toBeNull();
  });
});
