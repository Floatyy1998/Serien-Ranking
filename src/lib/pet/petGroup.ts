import type { PetBrain, Prop } from './petBrain';

/** Regie für zwei oder drei Pets auf einer Bühne: gemeinsame Szenen mit ruhigen Pausen dazwischen. */

export type GroupScene = 'greet' | 'chase' | 'dance' | 'race' | 'parade' | 'wave' | 'soccer';

export const GROUP_SCENES: GroupScene[] = [
  'greet',
  'chase',
  'dance',
  'race',
  'parade',
  'wave',
  'soccer',
];
const MAX_SCENE_SECONDS = 18;
/** Fußball darf länger dauern als die anderen Szenen. */
const SOCCER_SECONDS = 26;
/** So nah muss ein Pet am Ball sein, um ihn zu spielen. */
const REACH = 12;
const PET_GAP = 56;

export interface GroupOptions {
  /** Pause zwischen zwei Szenen in Sekunden [min, max]. */
  gap: [number, number];
  /** Wartezeit bis zur ersten Szene. */
  first?: number;
  /** Abstand zwischen zwei Pets in Pixeln (größere Pets brauchen mehr). */
  spacing?: number;
  rand?: () => number;
}

interface Bounds {
  minX: number;
  maxX: number;
}

export class GroupDirector {
  scene: GroupScene | null = null;
  private cast: PetBrain[] = [];
  private brains: PetBrain[];
  private wait: number;
  private t = 0;
  private sub = 0;
  private last: GroupScene | null = null;
  private winner: PetBrain | null = null;
  private ball: Prop | null = null;
  private ballHolder: PetBrain | null = null;
  private lastKicker: PetBrain | null = null;
  private kickCooldown = 0;
  private kicks = 0;
  private goals = 0;
  private readonly rand: () => number;
  private readonly gap: [number, number];
  private readonly spacing: number;

  constructor(brains: PetBrain[], options: GroupOptions) {
    this.brains = brains;
    this.rand = options.rand ?? Math.random;
    this.gap = options.gap;
    this.spacing = options.spacing ?? PET_GAP;
    this.wait = options.first ?? this.nextGap();
  }

  setBrains(brains: PetBrain[]): void {
    if (this.scene) this.end();
    this.brains = brains;
  }

  /** Startet eine Szene sofort (Entwickler-Vorschau, Besuch). */
  play(scene: GroupScene, bounds: Bounds): boolean {
    const cast = this.available();
    if (cast.length < 2) return false;
    if (this.scene) this.end();
    this.begin(scene, cast, bounds);
    return true;
  }

  update(dt: number, bounds: Bounds): void {
    if (!this.scene) {
      this.wait -= dt;
      if (this.wait > 0) return;
      const cast = this.available();
      if (cast.length < 2) {
        this.wait = 3;
        return;
      }
      const options = GROUP_SCENES.filter((s) => s !== this.last);
      this.begin(options[Math.floor(this.rand() * options.length)], cast, bounds);
      return;
    }
    const limit = this.scene === 'soccer' ? SOCCER_SECONDS : MAX_SCENE_SECONDS;
    if (this.cast.some((b) => !b.canAct || b.engaged) || this.t > limit) {
      this.end();
      return;
    }
    this.t += dt;
    this.run(dt, bounds);
  }

  private available(): PetBrain[] {
    return this.brains.filter(
      (b) =>
        b.canAct &&
        !b.engaged &&
        b.activity !== 'sleep' &&
        b.activity !== 'yawn' &&
        b.activity !== 'wake'
    );
  }

  private begin(scene: GroupScene, cast: PetBrain[], bounds: Bounds): void {
    this.scene = scene;
    this.last = scene;
    this.cast = [...cast].sort((a, b) => a.x - b.x);
    this.t = 0;
    this.sub = 0;
    this.winner = null;
    for (const b of this.cast) b.setScripted(true);
    this.run(0, bounds);
  }

  private end(): void {
    this.removeBall();
    for (const b of this.cast) {
      b.setScripted(false);
      b.rest();
    }
    this.cast = [];
    this.scene = null;
    this.wait = this.nextGap();
  }

  /** Ball fällt bei x aus der Höhe h; er hängt physikalisch am ersten Pet der Szene. */
  private dropBall(x: number, h: number): void {
    this.removeBall();
    const holder = this.cast[0];
    if (!holder) return;
    const ball: Prop = { kind: 'ball', x, h, vx: 0, vh: 0, rot: 0, ttl: Infinity, carried: false };
    holder.props.push(ball);
    this.ball = ball;
    this.ballHolder = holder;
  }

  private removeBall(): void {
    if (this.ball && this.ballHolder) {
      const ball = this.ball;
      this.ballHolder.props = this.ballHolder.props.filter((p) => p !== ball);
    }
    this.ball = null;
    this.ballHolder = null;
  }

  private nextGap(): number {
    const [min, max] = this.gap;
    return min + this.rand() * (max - min);
  }

  private allArrived(): boolean {
    return this.cast.every((b) => !b.busy);
  }

  private every(sec: number, dt: number): boolean {
    return Math.floor(this.t / sec) !== Math.floor((this.t - dt) / sec);
  }

  private run(dt: number, { minX, maxX }: Bounds): void {
    const cast = this.cast;
    const mid = (minX + maxX) / 2;
    const span = maxX - minX;
    // Abstand zwischen zwei Pets, damit sie nicht übereinander stehen
    const gap = Math.min(this.spacing, span / Math.max(2, cast.length));
    const lane = (i: number) => mid + (i - (cast.length - 1) / 2) * gap;

    switch (this.scene) {
      case 'greet': {
        // aufeinander zu, Nase an Nase, Herzchen, dann zusammen sitzen
        if (this.sub === 0) {
          const reach = ((cast.length - 1) / 2) * gap;
          const center = Math.max(
            minX + reach,
            Math.min(maxX - reach, cast[0].x / 2 + cast[cast.length - 1].x / 2)
          );
          cast.forEach((b, i) => b.walkTo(center + (i - (cast.length - 1) / 2) * gap, 1));
          this.sub = 1;
        } else if (this.sub === 1 && this.allArrived()) {
          cast.forEach((b, i) => b.face(i < cast.length / 2 ? 1 : -1));
          cast[0].react('love');
          this.sub = 2;
          this.t = 0;
        } else if (this.sub === 2 && this.t > 0.5) {
          cast.slice(1).forEach((b) => b.react('love'));
          this.sub = 3;
        } else if (this.sub === 3 && this.t > 2.6 && this.allArrived()) {
          cast.forEach((b, i) => b.sitFor(4.5, i < cast.length / 2 ? 1 : -1));
          this.sub = 4;
          this.t = 0;
        } else if (this.sub === 4 && this.t > 4.6) {
          this.end();
        }
        break;
      }
      case 'chase': {
        // Fangen: einer flieht, einer jagt, nach der Hälfte wird getauscht
        const swap = this.t >= 4;
        const runner = swap ? cast[cast.length - 1] : cast[0];
        const chaser = swap ? cast[0] : cast[cast.length - 1];
        if (this.sub === 0 || (swap && this.sub === 1)) {
          runner.walkTo(runner.x > mid ? minX + span * 0.04 : maxX - span * 0.04, 1.9);
          this.sub += 1;
        }
        if (this.every(0.45, dt) || this.t === 0) {
          chaser.walkTo(runner.x + (runner.x > chaser.x ? -gap : gap) * 0.8, 1.75);
          for (const b of cast) {
            if (b !== runner && b !== chaser)
              b.walkTo(chaser.x + (chaser.x > b.x ? -gap : gap), 1.2);
          }
        }
        if (this.t > 8.2) this.end();
        break;
      }
      case 'dance': {
        // nebeneinander aufstellen, dann gleichzeitig tanzen
        if (this.sub === 0) {
          cast.forEach((b, i) => b.walkTo(lane(i), 1));
          this.sub = 1;
        } else if (this.sub === 1 && this.allArrived()) {
          cast.forEach((b) => b.trick('dance', 4.2));
          this.sub = 2;
          this.t = 0;
        } else if (this.sub === 2 && this.t > 4.4) {
          this.end();
        }
        break;
      }
      case 'race': {
        // Wettrennen von links nach rechts, der Sieger jubelt
        if (this.sub === 0) {
          cast.forEach((b, i) => b.walkTo(minX + i * gap, 1.1));
          this.sub = 1;
        } else if (this.sub === 1 && this.allArrived()) {
          cast.forEach((b) => {
            b.face(1);
            b.sitFor(1.1, 1);
          });
          this.sub = 2;
          this.t = 0;
        } else if (this.sub === 2 && this.t > 1.2) {
          cast.forEach((b, i) =>
            b.walkTo(maxX - (cast.length - 1 - i) * gap, 2.2 + this.rand() * 0.7)
          );
          this.sub = 3;
          this.t = 0;
        } else if (this.sub === 3) {
          if (!this.winner) this.winner = cast.find((b) => !b.busy) ?? null;
          if (this.winner) {
            this.winner.react('cheer');
            this.sub = 4;
            this.t = 0;
          }
        } else if (this.sub === 4 && this.t > 2.4 && this.allArrived()) {
          cast.forEach((b) => b !== this.winner && b.sitFor(1.5, -1));
          this.sub = 5;
          this.t = 0;
        } else if (this.sub === 5 && this.t > 1.6) {
          this.end();
        }
        break;
      }
      case 'parade': {
        // Polonaise: einer führt, die anderen laufen hinterher
        const leader = cast[0];
        if (this.sub === 0) {
          leader.walkTo(leader.x > mid ? minX + span * 0.06 : maxX - span * 0.06, 0.95);
          this.sub = 1;
        } else if (this.sub === 1 && !leader.busy) {
          leader.walkTo(leader.x > mid ? minX + span * 0.2 : maxX - span * 0.2, 0.95);
          this.sub = 2;
        } else if (this.sub === 2 && !leader.busy) {
          this.end();
          break;
        }
        if (this.every(0.3, dt)) {
          cast.slice(1).forEach((b, i) => {
            const target = leader.x - leader.dir * gap * (i + 1);
            if (Math.abs(target - b.x) > 6) b.walkTo(target, 1.05);
          });
        }
        break;
      }
      case 'soccer': {
        this.soccer(dt, minX, maxX);
        break;
      }
      case 'wave': {
        // La-Ola: nebeneinander aufstellen, dann nacheinander hochhüpfen, zweimal
        if (this.sub === 0) {
          cast.forEach((b, i) => b.walkTo(lane(i), 1));
          this.sub = 1;
          break;
        }
        if (this.sub === 1) {
          if (!this.allArrived()) break;
          cast.forEach((b) => b.face(1));
          this.sub = 2;
          this.t = 0;
        }
        const total = cast.length * 2;
        const hop = this.sub - 2;
        if (hop < total && this.t > hop * 0.38) {
          cast[hop % cast.length].react('cheer');
          this.sub += 1;
        }
        if (hop >= total && this.t > total * 0.38 + 1.4 && this.allArrived()) this.end();
        break;
      }
    }
  }

  /** Fußball: Pässe hin und her, ab und zu ein Torschuss; wer trifft, jubelt. */
  private soccer(dt: number, minX: number, maxX: number): void {
    const cast = this.cast;
    const span = maxX - minX;
    const mid = (minX + maxX) / 2;
    const home = (i: number) => minX + span * (0.18 + (0.64 * i) / Math.max(1, cast.length - 1));
    this.kickCooldown -= dt;

    if (this.sub === 0) {
      this.kicks = 0;
      this.goals = 0;
      this.lastKicker = null;
      cast.forEach((b, i) => b.walkTo(home(i), 1.15));
      this.dropBall(mid, 70);
      this.sub = 1;
      this.t = 0;
      return;
    }

    const ball = this.ball;
    if (!ball) {
      this.end();
      return;
    }

    if (this.sub === 1) {
      // Anstoß, sobald der Ball liegt
      if (this.t > 1.1 && ball.h === 0) {
        this.sub = 2;
        this.t = 0;
      }
      return;
    }

    if (this.sub === 2) {
      // Tor, wenn der Ball an die Bande rollt
      if (this.lastKicker && (ball.x <= minX - 7 || ball.x >= maxX + 7)) {
        const scorer = this.lastKicker;
        scorer.react('cheer');
        scorer.sparkle(6);
        cast.forEach((b) => b !== scorer && b.sitFor(1.4, b.x < scorer.x ? 1 : -1));
        this.goals += 1;
        this.sub = 3;
        this.t = 0;
        return;
      }

      const chaser = cast.reduce((best, b) =>
        Math.abs(b.x - ball.x) < Math.abs(best.x - ball.x) ? b : best
      );
      const reach = Math.abs(ball.x - chaser.x) < REACH && ball.h < 16;
      if (reach && this.kickCooldown <= 0) {
        const others = cast.filter((b) => b !== chaser);
        const target = others[Math.floor(this.rand() * others.length)];
        const shot = this.rand() < 0.3;
        let dir: 1 | -1 = target.x >= ball.x ? 1 : -1;
        if (Math.abs(target.x - ball.x) < 8) dir = ball.x < mid ? 1 : -1;
        const dist = Math.abs(target.x - ball.x);
        ball.vx =
          dir * (shot ? 380 + this.rand() * 60 : Math.min(330, Math.max(170, dist * 1.4 + 60)));
        ball.vh = shot ? 90 + this.rand() * 60 : 150 + this.rand() * 140;
        chaser.kick(dir);
        this.lastKicker = chaser;
        this.kicks += 1;
        this.kickCooldown = 0.6;
      } else if (this.every(0.2, dt) && this.kickCooldown <= 0.1) {
        chaser.walkTo(ball.x, 1.75);
      }

      if (this.every(0.5, dt)) {
        cast.forEach((b, i) => {
          if (b === chaser) return;
          if (Math.abs(b.x - home(i)) > 20) b.walkTo(home(i), 1);
          else if (!b.busy) b.face(ball.x > b.x ? 1 : -1);
        });
      }

      if (this.t > 15 || this.kicks >= 12) {
        this.sub = 4;
        this.t = 0;
      }
      return;
    }

    if (this.sub === 3 && this.t > 1.9 && this.allArrived()) {
      // nach dem Tor neuer Anstoß, nach zwei Toren Schluss
      if (this.goals >= 2) {
        this.sub = 4;
        this.t = 0;
      } else {
        this.dropBall(mid, 70);
        this.lastKicker = null;
        cast.forEach((b, i) => b.walkTo(home(i), 1.1));
        this.sub = 1;
        this.t = 0;
      }
      return;
    }

    if (this.sub === 4) {
      // Abpfiff: alle jubeln zusammen
      this.removeBall();
      cast.forEach((b) => b.react('cheer'));
      this.sub = 5;
      this.t = 0;
      return;
    }

    if (this.sub === 5 && this.t > 1.6 && this.allArrived()) this.end();
  }
}
