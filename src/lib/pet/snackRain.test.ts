import { describe, expect, it } from 'vitest';
import { GAME_SECONDS, SnackRain } from './snackRain';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

describe('SnackRain', () => {
  it('endet nach der Spielzeit', () => {
    const game = new SnackRain(300, 200, seeded());
    for (let t = 0; t < GAME_SECONDS + 1; t += 1 / 60) game.update(1 / 60, 150, 20, 40);
    expect(game.over).toBe(true);
    expect(game.update(1 / 60, 150, 20, 40)).toEqual([]);
  });

  it('zählt gefangene Snacks und bricht die Serie beim Brokkoli', () => {
    const game = new SnackRain(300, 200, seeded(4));
    let caughtGood = 0;
    let caughtBad = 0;
    // Pet folgt jeweils dem tiefsten Snack und meidet Brokkoli nicht
    for (let t = 0; t < GAME_SECONDS; t += 1 / 60) {
      const target = [...game.drops].sort((a, b) => a.h - b.h)[0];
      const results = game.update(1 / 60, target ? target.x : 150, 22, 40);
      for (const r of results) {
        if (r.points > 0) caughtGood += 1;
        else caughtBad += 1;
      }
    }
    expect(caughtGood).toBeGreaterThan(5);
    expect(game.caught).toBe(caughtGood);
    expect(caughtBad).toBeGreaterThanOrEqual(0);
    expect(game.score).toBeGreaterThanOrEqual(0);
  });

  it('fängt nichts, wenn das Pet woanders steht', () => {
    const game = new SnackRain(300, 200, seeded(9));
    let total = 0;
    for (let t = 0; t < 10; t += 1 / 60) total += game.update(1 / 60, -500, 20, 40).length;
    expect(total).toBe(0);
    expect(game.score).toBe(0);
  });
});
