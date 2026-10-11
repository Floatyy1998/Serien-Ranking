import { describe, expect, it } from 'vitest';
import { PetBrain, SIGNATURE_OF, type Activity, type BrainEnv, type Species } from './petBrain';
import { walkCycle } from './petMotion';

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

function run(brain: PetBrain, seconds: number, env: Partial<BrainEnv> = {}): Set<Activity> {
  const seen = new Set<Activity>();
  for (let t = 0; t < seconds; t += 1 / 60) {
    brain.update(1 / 60, { ...ENV, ...env });
    seen.add(brain.activity);
  }
  return seen;
}

describe('walkCycle', () => {
  it('hebt die Pfoten abwechselnd und kippt auf das Standbein', () => {
    const left = walkCycle(Math.PI / 2);
    const right = walkCycle((Math.PI * 3) / 2);
    expect(left.pawLift[0]).toBeGreaterThan(0);
    expect(left.pawLift[1]).toBe(0);
    expect(right.pawLift[1]).toBeGreaterThan(0);
    expect(Math.sign(left.tilt)).toBe(-Math.sign(right.tilt));
  });
});

describe('PetBrain', () => {
  it('bleibt tagsüber wach und läuft innerhalb des Docks herum', () => {
    const brain = new PetBrain(200, seeded(3));
    let minX = Infinity;
    let maxX = -Infinity;
    for (let t = 0; t < 120; t += 1 / 60) {
      brain.update(1 / 60, ENV);
      expect(brain.activity).not.toBe('sleep');
      minX = Math.min(minX, brain.x);
      maxX = Math.max(maxX, brain.x);
    }
    expect(minX).toBeGreaterThanOrEqual(ENV.minX);
    expect(maxX).toBeLessThanOrEqual(ENV.maxX);
    expect(maxX - minX).toBeGreaterThan(60);
  });

  it('schläft nachts irgendwann ein', () => {
    const brain = new PetBrain(200, seeded(5));
    expect(run(brain, 240, { hour: 2 }).has('sleep')).toBe(true);
  });

  it('bettelt, wenn es hungrig ist', () => {
    const brain = new PetBrain(200, seeded(7));
    expect(run(brain, 90, { hungry: true }).has('beg')).toBe(true);
  });

  it('läuft ohne Erlaubnis zum Herumlaufen nicht los', () => {
    const brain = new PetBrain(200, seeded(9));
    const seen = run(brain, 90, { roam: false });
    expect(seen.has('walk')).toBe(false);
    expect(brain.x).toBe(200);
  });

  it('springt beim Jubeln hoch und landet wieder', () => {
    const brain = new PetBrain(200, seeded(2));
    brain.update(1 / 60, ENV);
    brain.react('cheer');
    let maxH = 0;
    for (let i = 0; i < 120; i++) {
      brain.update(1 / 60, ENV);
      maxH = Math.max(maxH, brain.h);
    }
    expect(maxH).toBeGreaterThan(20);
    expect(brain.h).toBe(0);
  });

  it('feiert eine Party mit Konfetti', () => {
    const brain = new PetBrain(200, seeded(2));
    brain.update(1 / 60, ENV);
    brain.react('party');
    expect(brain.activity).toBe('party');
    expect(brain.particles.some((p) => p.kind === 'confetti')).toBe(true);
  });

  it('fällt nach dem Loslassen zu Boden und meldet die Landung', () => {
    const brain = new PetBrain(200, seeded(4));
    brain.update(1 / 60, ENV);
    brain.grab(200, 0);
    brain.drag(220, 150, 1 / 60);
    expect(brain.activity).toBe('carried');
    brain.release(0, 0);
    const events: string[] = [];
    for (let i = 0; i < 120; i++) {
      brain.update(1 / 60, ENV);
      events.push(...brain.drainEvents());
    }
    expect(events).toContain('landed');
    expect(brain.h).toBe(0);
  });

  it('holt sich einen Snack und meldet das Füttern', () => {
    const brain = new PetBrain(100, seeded(6));
    brain.update(1 / 60, ENV);
    brain.dropSnack(260, 60);
    const events: string[] = [];
    for (let i = 0; i < 60 * 12; i++) {
      brain.update(1 / 60, ENV);
      events.push(...brain.drainEvents());
    }
    expect(events).toContain('fed');
    expect(brain.props.some((p) => p.kind === 'snack')).toBe(false);
  });

  it('bringt einen Brief und legt ihn ab', () => {
    const brain = new PetBrain(200, seeded(8));
    brain.update(1 / 60, ENV);
    brain.react('letter');
    run(brain, 20);
    const letter = brain.props.find((p) => p.kind === 'letter');
    expect(letter).toBeDefined();
    expect(letter?.carried).toBe(false);
    brain.dismissLetter();
    expect(brain.hasLetter).toBe(false);
  });

  it('lässt den Brief liegen, bis er geöffnet wird, ohne das Pet zu blockieren', () => {
    const brain = new PetBrain(200, seeded(8));
    brain.update(1 / 60, ENV);
    brain.react('letter');
    run(brain, 150);
    expect(brain.hasLetter).toBe(true);
    expect(brain.engaged).toBe(false);
    brain.dismissLetter();
    expect(brain.hasLetter).toBe(false);
  });

  it('spielt Ball und meldet die Schüsse', () => {
    const brain = new PetBrain(200, seeded(11));
    brain.update(1 / 60, ENV);
    brain.react('play');
    const events: string[] = [];
    for (let i = 0; i < 60 * 12; i++) {
      brain.update(1 / 60, ENV);
      events.push(...brain.drainEvents());
    }
    expect(events.filter((e) => e === 'kicked').length).toBeGreaterThanOrEqual(1);
  });

  it('weckt ein schlafendes Pet bei einer Reaktion erst auf', () => {
    const brain = new PetBrain(200, seeded(5));
    run(brain, 240, { hour: 2 });
    if (brain.activity !== 'sleep') return;
    brain.react('cheer');
    expect(brain.activity).toBe('wake');
    const seen = run(brain, 2, { hour: 2 });
    expect(seen.has('jump')).toBe(true);
  });

  it('liegt still, wenn das Pet nicht mehr lebt', () => {
    const brain = new PetBrain(200, seeded(1));
    const seen = run(brain, 10, { alive: false });
    expect([...seen]).toEqual(['dead']);
    expect(brain.view().pose.eyes).toBe('closed');
  });

  it('bleibt stehen, wenn das Ziel hinter dem Rand liegt', () => {
    const brain = new PetBrain(200, seeded(4));
    brain.update(1 / 60, ENV);
    brain.walkTo(ENV.maxX + 80, 1.4);
    for (let i = 0; i < 60 * 15; i++) {
      brain.update(1 / 60, ENV);
      if (brain.activity !== 'walk') break;
    }
    expect(brain.activity).not.toBe('walk');
    expect(brain.x).toBe(ENV.maxX);
  });

  it('lässt zwischen zwei Aktionen genug Ruhe', () => {
    const ACTION: Activity[] = ['trick', 'hunt', 'chase', 'zoomies'];
    const brain = new PetBrain(200, seeded(13));
    const starts: number[] = [];
    let prev: Activity = brain.activity;
    let t = 0;
    for (; t < 300; t += 1 / 60) {
      brain.update(1 / 60, ENV);
      if (ACTION.includes(brain.activity) && !ACTION.includes(prev)) starts.push(t);
      prev = brain.activity;
    }
    expect(starts.length).toBeGreaterThan(2);
    expect(starts[0]).toBeGreaterThan(9);
    for (let i = 1; i < starts.length; i++) expect(starts[i] - starts[i - 1]).toBeGreaterThan(20);
  });

  it('zeigt für jede Tierart ihre Spezialbewegung und landet wieder', () => {
    for (const species of Object.keys(SIGNATURE_OF) as Species[]) {
      const brain = new PetBrain(200, seeded(3));
      const env = { ...ENV, species };
      brain.update(1 / 60, env);
      brain.trick('signature');
      expect(brain.activity).toBe('trick');
      let rose = false;
      for (let i = 0; i < 60 * 4; i++) {
        brain.update(1 / 60, env);
        const v = brain.view();
        expect(Number.isFinite(v.x) && Number.isFinite(v.h) && Number.isFinite(v.roll)).toBe(true);
        if (brain.h > 0) rose = true;
      }
      expect(brain.activity).not.toBe('trick');
      expect(brain.h).toBe(0);
      if (
        ['fly', 'soar', 'float', 'pounce', 'mousejump', 'binky'].includes(SIGNATURE_OF[species])
      ) {
        expect(rose).toBe(true);
      }
    }
  });
});
