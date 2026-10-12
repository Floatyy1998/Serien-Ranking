import { describe, expect, it } from 'vitest';
import { PetBrain, type BrainEnv } from './petBrain';
import { GROUP_SCENES, GroupDirector, type GroupScene } from './petGroup';

function seeded(seed = 1) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const ENV: BrainEnv = {
  minX: 40,
  maxX: 340,
  hour: 15,
  hungry: false,
  sad: false,
  sleepy: false,
  playful: false,
  tired: false,
  roam: true,
  alive: true,
  ps: 2.5,
};

function makeGroup(count: number, first = 1, gap: [number, number] = [20, 30]) {
  const rand = seeded(5);
  const brains = Array.from({ length: count }, (_, i) => new PetBrain(80 + i * 90, rand));
  const director = new GroupDirector(brains, { gap, first, rand });
  const step = (seconds: number) => {
    for (let t = 0; t < seconds; t += 1 / 60) {
      director.update(1 / 60, ENV);
      for (const b of brains) {
        b.update(1 / 60, ENV);
        b.drainEvents();
      }
    }
  };
  return { brains, director, step };
}

describe('GroupDirector', () => {
  it('spielt jede Szene mit zwei und drei Pets durch und gibt sie wieder frei', () => {
    for (const count of [2, 3]) {
      for (const scene of GROUP_SCENES) {
        const { brains, director, step } = makeGroup(count, 999, [60, 70]);
        step(0.2);
        expect(director.play(scene, ENV)).toBe(true);
        expect(director.scene).toBe(scene);
        step(30);
        expect(director.scene).toBeNull();
        for (const b of brains) {
          expect(b.x).toBeGreaterThanOrEqual(ENV.minX);
          expect(b.x).toBeLessThanOrEqual(ENV.maxX);
          expect(b.h).toBe(0);
        }
      }
    }
  });

  it('lässt zwischen zwei Szenen eine ruhige Pause', () => {
    const { director, step } = makeGroup(3, 2);
    const starts: number[] = [];
    let prev: GroupScene | null = null;
    for (let t = 0; t < 120; t += 0.5) {
      step(0.5);
      if (director.scene && !prev) starts.push(t);
      prev = director.scene;
    }
    expect(starts.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < starts.length; i++) expect(starts[i] - starts[i - 1]).toBeGreaterThan(19);
  });

  it('bricht ab, wenn ein Pet hochgehoben wird', () => {
    const { brains, director, step } = makeGroup(2, 999);
    step(0.2);
    director.play('dance', ENV);
    step(0.5);
    brains[0].grab(brains[0].x, 0);
    step(0.1);
    expect(director.scene).toBeNull();
  });

  it('spielt nicht allein', () => {
    const { director, step } = makeGroup(1, 0);
    step(5);
    expect(director.scene).toBeNull();
  });

  it('Fußball: der Ball fällt ins Spiel, wird mehrfach gespielt und verschwindet am Ende', () => {
    for (const count of [2, 3]) {
      const { brains, director, step } = makeGroup(count, 999, [60, 70]);
      step(0.2);
      expect(director.play('soccer', ENV)).toBe(true);
      const balls = () => brains.flatMap((b) => b.props.filter((p) => p.kind === 'ball'));
      expect(balls()).toHaveLength(1);

      let kicks = 0;
      let lastVx = 0;
      for (let t = 0; t < 30 && director.scene; t += 1 / 60) {
        step(1 / 60);
        const ball = balls()[0];
        if (ball && Math.abs(ball.vx) > 150 && Math.abs(lastVx) < 150) kicks += 1;
        lastVx = ball?.vx ?? 0;
      }
      expect(kicks).toBeGreaterThanOrEqual(3);
      expect(director.scene).toBeNull();
      expect(balls()).toHaveLength(0);
    }
  });
});
