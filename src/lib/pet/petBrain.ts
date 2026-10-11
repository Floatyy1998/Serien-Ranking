import type { PetPose } from './petPose';
import {
  clamp,
  isNightHour,
  paddleCycle,
  squashSpring,
  STILL,
  walkCycle,
  type MotionFrame,
} from './petMotion';

/** Verhalten des frei laufenden Pets — reine Logik, gezeichnet wird woanders. */

export type Activity =
  | 'idle'
  | 'walk'
  | 'sit'
  | 'look'
  | 'yawn'
  | 'sleep'
  | 'wake'
  | 'jump'
  | 'party'
  | 'zoomies'
  | 'love'
  | 'carried'
  | 'fall'
  | 'land'
  | 'eat'
  | 'chase'
  | 'popcorn'
  | 'deliver'
  | 'beg'
  | 'dead';

export type Reaction =
  'cheer' | 'party' | 'binge' | 'love' | 'movie' | 'rated' | 'levelup' | 'feed' | 'letter' | 'play';

export type ParticleKind = 'heart' | 'z' | 'confetti' | 'sparkle' | 'crumb' | 'dust' | 'popcorn';

export interface Particle {
  kind: ParticleKind;
  x: number;
  h: number;
  vx: number;
  vh: number;
  life: number;
  maxLife: number;
  rot: number;
  vr: number;
  tint: number;
  size: number;
}

export type PropKind = 'ball' | 'letter' | 'snack' | 'popcorn';

export interface Prop {
  kind: PropKind;
  x: number;
  h: number;
  vx: number;
  vh: number;
  rot: number;
  /** Sekunden bis zum Ausblenden; Infinity = bleibt. */
  ttl: number;
  /** Wird gerade vom Pet getragen. */
  carried: boolean;
}

export interface BrainEnv {
  minX: number;
  maxX: number;
  hour: number;
  hungry: boolean;
  sad: boolean;
  sleepy: boolean;
  playful: boolean;
  tired: boolean;
  roam: boolean;
  alive: boolean;
  /** Pixel pro Rastereinheit des Pets. */
  ps: number;
}

export type BrainEvent = 'fed' | 'kicked' | 'landed' | 'woke';

export interface PetView {
  x: number;
  h: number;
  /** -1 = gespiegelt (schaut nach rechts), 1 = normal. */
  flip: 1 | -1;
  tilt: number;
  bob: number;
  squashX: number;
  squashY: number;
  pose: PetPose;
  activity: Activity;
}

const GRAVITY = 1900;
const STRIDE = 13;

type Rand = () => number;

export class PetBrain {
  activity: Activity = 'idle';
  x: number;
  h = 0;
  vx = 0;
  vh = 0;
  dir: 1 | -1 = 1;
  particles: Particle[] = [];
  props: Prop[] = [];

  private t = 0;
  private duration = 2;
  private targetX = 0;
  private phase = 0;
  private lookX = 0;
  private squash = 1;
  private tiltShake = 0;
  private reps = 0;
  private speed = 34;
  private emitTimer = 0;
  private events: BrainEvent[] = [];
  private queued: Reaction[] = [];
  private kicks = 0;
  private dragVX = 0;
  private landImpact = 0;
  private env: BrainEnv | null = null;

  constructor(
    x: number,
    private readonly rand: Rand = Math.random
  ) {
    this.x = x;
    this.targetX = x;
  }

  /** Liefert und leert die seit dem letzten Aufruf entstandenen Ereignisse. */
  drainEvents(): BrainEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }

  get hasLetter(): boolean {
    return this.props.some((p) => p.kind === 'letter');
  }

  // ── Befehle von außen ────────────────────────────────────────────

  react(reaction: Reaction): void {
    if (this.activity === 'dead') return;
    if (this.activity === 'carried' || this.activity === 'fall') {
      this.queued.push(reaction);
      return;
    }
    if (this.activity === 'sleep' || this.activity === 'yawn') {
      this.queued.push(reaction);
      this.start('wake', 0.7);
      return;
    }
    switch (reaction) {
      case 'cheer':
      case 'rated':
        this.reps = reaction === 'rated' ? 2 : 1;
        this.startJump(380);
        break;
      case 'party':
      case 'levelup':
        this.reps = 3;
        this.burst('confetti', 26, 0);
        this.startJump(430, 'party');
        break;
      case 'binge':
        this.reps = 2;
        this.dir = this.x < (this.env ? (this.env.minX + this.env.maxX) / 2 : this.x) ? 1 : -1;
        this.start('zoomies', 12);
        break;
      case 'love':
        this.reps = 1;
        this.burst('heart', 5, 0);
        this.startJump(260, 'love');
        break;
      case 'movie':
        this.props = this.props.filter((p) => p.kind !== 'popcorn');
        this.props.push(this.makeProp('popcorn', this.x, Infinity));
        this.props[this.props.length - 1].carried = true;
        this.start('popcorn', 7);
        break;
      case 'feed':
        this.start('eat', 2.4);
        break;
      case 'play':
        this.spawnBall();
        break;
      case 'letter':
        this.startDelivery();
        break;
    }
  }

  tap(): void {
    if (this.activity === 'dead') return;
    if (this.activity === 'sleep' || this.activity === 'yawn') {
      this.start('wake', 0.7);
      this.events.push('woke');
      return;
    }
    this.react('love');
  }

  grab(x: number, h: number): void {
    if (this.activity === 'dead') return;
    this.dropCarriedProps();
    this.x = x;
    this.h = h;
    this.vx = 0;
    this.vh = 0;
    this.start('carried', Infinity);
  }

  drag(x: number, h: number, dt: number): void {
    if (this.activity !== 'carried') return;
    if (dt > 0) this.dragVX = this.dragVX * 0.7 + ((x - this.x) / dt) * 0.3;
    this.x = x;
    this.h = Math.max(0, h);
  }

  release(vx: number, vh: number): void {
    if (this.activity !== 'carried') return;
    this.vx = clamp(vx, -900, 900);
    this.vh = clamp(vh, -400, 900);
    this.start('fall', Infinity);
  }

  /** Snack fällt an Position x auf den Boden; das Pet holt ihn sich. */
  dropSnack(x: number, h: number): void {
    this.props = this.props.filter((p) => p.kind !== 'snack');
    const snack = this.makeProp('snack', x, 30);
    snack.h = Math.max(0, h);
    this.props.push(snack);
    if (this.activity === 'dead') return;
    if (Math.abs(x - this.x) < 14 && h < 30) {
      this.consumeSnack();
      return;
    }
    if (this.activity === 'sleep') this.start('wake', 0.5);
    else this.goTo(x, 1.3);
  }

  kickBall(): void {
    const ball = this.props.find((p) => p.kind === 'ball');
    if (!ball) return;
    ball.vx = (this.rand() < 0.5 ? -1 : 1) * (240 + this.rand() * 120);
    ball.vh = 260 + this.rand() * 120;
    if (this.activity !== 'carried' && this.activity !== 'fall' && this.activity !== 'dead') {
      this.kicks = 0;
      this.start('chase', 9);
    }
  }

  dismissLetter(): void {
    this.props = this.props.filter((p) => p.kind !== 'letter');
  }

  // ── Takt ─────────────────────────────────────────────────────────

  update(rawDt: number, env: BrainEnv): void {
    const dt = Math.min(rawDt, 0.05);
    this.env = env;
    this.t += dt;

    if (!env.alive) {
      if (this.activity !== 'dead') this.start('dead', Infinity);
    } else if (this.activity === 'dead') {
      this.start('idle', 1);
    }

    this.x = this.activity === 'carried' ? this.x : clamp(this.x, env.minX, env.maxX);

    switch (this.activity) {
      case 'walk':
        this.stepToward(dt, env, false);
        break;
      case 'chase':
        this.updateChase(dt, env);
        break;
      case 'deliver':
        this.stepToward(dt, env, true);
        break;
      case 'zoomies':
        this.updateZoomies(dt, env);
        break;
      case 'jump':
      case 'party':
      case 'love':
        this.updateJump(dt);
        break;
      case 'fall':
        this.updateFall(dt, env);
        break;
      case 'carried':
        this.lookX = clamp(-this.dragVX / 400, -1, 1);
        break;
      case 'sleep':
        this.emitTimer += dt;
        if (this.emitTimer > 1.5) {
          this.emitTimer = 0;
          this.spawn('z', this.x + 5 * env.ps, this.h + 19 * env.ps, 7, 14, 2.6);
        }
        break;
      case 'eat':
        this.emitTimer += dt;
        if (this.emitTimer > 0.35) {
          this.emitTimer = 0;
          this.spawn(
            'crumb',
            this.x + (this.rand() - 0.5) * 8,
            10,
            (this.rand() - 0.5) * 50,
            60,
            0.6
          );
        }
        break;
      case 'popcorn':
        this.emitTimer += dt;
        if (this.emitTimer > 0.9) {
          this.emitTimer = 0;
          this.spawn('popcorn', this.x + 6, 18, (this.rand() - 0.5) * 30, 90, 0.9);
        }
        break;
      case 'beg':
        if (this.t % 1.6 < dt && this.h === 0) this.vh = 160;
        this.applyGravity(dt);
        break;
      default:
        break;
    }

    if (this.activity === 'look') {
      const seq = [-1, -1, 1, 1, 0];
      this.lookX = seq[Math.min(seq.length - 1, Math.floor((this.t / this.duration) * seq.length))];
    }

    this.updateProps(dt, env);
    this.updateParticles(dt);

    if (this.t >= this.duration) this.finish(env);
  }

  view(): PetView {
    const env = this.env;
    let motion: MotionFrame = STILL;
    let eyes: PetPose['eyes'] = 'auto';
    let squashY = 1;
    let tilt = 0;

    switch (this.activity) {
      case 'walk':
      case 'deliver':
        motion = walkCycle(this.phase, 1);
        break;
      case 'chase':
      case 'zoomies':
        motion = walkCycle(this.phase, 1.45);
        eyes = this.activity === 'zoomies' ? 'happy' : 'auto';
        break;
      case 'sit':
      case 'popcorn':
        squashY = 0.92;
        eyes = this.activity === 'popcorn' && this.t % 2.2 > 1.6 ? 'happy' : 'auto';
        break;
      case 'beg':
        squashY = 0.94;
        break;
      case 'idle':
        squashY = this.recoil ? squashSpring(this.t, this.recoil) : 1;
        break;
      case 'yawn':
        eyes = 'closed';
        squashY = 1 + Math.sin((this.t / this.duration) * Math.PI) * 0.08;
        break;
      case 'sleep':
        eyes = 'closed';
        squashY = 0.86 + Math.sin(this.t * 2.2) * 0.025;
        break;
      case 'dead':
        eyes = 'closed';
        squashY = 0.84;
        break;
      case 'wake':
        eyes = this.t < this.duration * 0.6 ? 'closed' : 'auto';
        squashY = 1 + Math.sin((this.t / this.duration) * Math.PI) * 0.1;
        break;
      case 'jump':
      case 'party':
      case 'love':
        eyes = 'happy';
        squashY = this.h > 0 ? 1.08 : this.squash;
        motion = this.h > 0 ? { pawLift: [0.9, 0.9], tilt: 0, bob: 0 } : STILL;
        if (this.activity === 'party') tilt = Math.sin(this.t * 9) * 0.12;
        break;
      case 'carried':
        motion = paddleCycle(this.t);
        eyes = 'happy';
        tilt = clamp(-this.dragVX / 2400, -0.35, 0.35);
        squashY = 1.06;
        break;
      case 'fall':
        motion = paddleCycle(this.t);
        eyes = 'closed';
        squashY = 1.05;
        break;
      case 'land':
        squashY = squashSpring(this.t, 0.28 * this.landImpact);
        tilt =
          this.t > 0.35
            ? Math.sin((this.t - 0.35) * 30) * 0.12 * Math.max(0, 1 - (this.t - 0.35) * 2)
            : 0;
        eyes = this.t < 0.35 ? 'closed' : 'auto';
        break;
      case 'eat':
        squashY = 0.94 + Math.abs(Math.sin(this.t * 9)) * 0.06;
        eyes = this.t % 0.8 < 0.4 ? 'happy' : 'closed';
        break;
      default:
        break;
    }

    const lookX =
      this.activity === 'walk' ||
      this.activity === 'chase' ||
      this.activity === 'zoomies' ||
      this.activity === 'deliver'
        ? this.dir
        : this.lookX;

    const ps = env?.ps ?? 2;
    return {
      x: this.x,
      h: this.h,
      flip: this.flipSign(),
      tilt: motion.tilt + tilt + this.tiltShake,
      bob: motion.bob * ps,
      squashX: 1 + (1 - squashY) * 0.6,
      squashY,
      pose: { pawLift: motion.pawLift, eyes, lookX },
      activity: this.activity,
    };
  }

  // ── Intern ───────────────────────────────────────────────────────

  private flipSign(): 1 | -1 {
    return this.dir > 0 ? -1 : 1;
  }

  private start(activity: Activity, duration: number): void {
    this.activity = activity;
    this.t = 0;
    this.duration = duration;
    this.emitTimer = 0;
    if (activity !== 'look') this.lookX = 0;
    if (activity !== 'land') this.tiltShake = 0;
    this.recoil = 0;
  }

  private startJump(power: number, kind: 'jump' | 'party' | 'love' = 'jump'): void {
    this.start(kind, Infinity);
    this.vh = 0;
    this.squash = 0.86;
    this.pendingPower = power;
  }

  private pendingPower = 0;
  private recoil = 0;

  private updateJump(dt: number): void {
    // kurzes In-die-Knie-Gehen, dann Absprung
    if (this.h === 0 && this.vh === 0 && this.pendingPower > 0) {
      this.squash = Math.min(1, this.squash);
      if (this.t > 0.12) {
        this.vh = this.pendingPower;
        this.pendingPower = 0;
        this.squash = 1;
        if (this.activity === 'party') this.dir = this.dir === 1 ? -1 : 1;
      }
      return;
    }
    this.vh -= GRAVITY * dt;
    this.h += this.vh * dt;
    if (this.activity === 'love' && this.rand() < dt * 3) {
      this.spawn('heart', this.x + (this.rand() - 0.5) * 18, this.h + 26, 4, 38, 1.4);
    }
    if (this.h <= 0) {
      this.h = 0;
      this.vh = 0;
      this.squash = 0.82;
      if (this.activity === 'party') this.burst('confetti', 10, 0);
      else this.burst('sparkle', 5, 4);
      this.reps -= 1;
      if (this.reps > 0) {
        this.t = 0;
        this.pendingPower = this.activity === 'party' ? 400 : 330;
      } else {
        this.start('idle', 0.8);
        this.squash = 1;
        this.recoil = 0.2;
      }
    }
  }

  private applyGravity(dt: number): void {
    if (this.h <= 0 && this.vh <= 0) {
      this.h = 0;
      this.vh = 0;
      return;
    }
    this.vh -= GRAVITY * dt;
    this.h += this.vh * dt;
    if (this.h <= 0) {
      this.h = 0;
      this.vh = 0;
    }
  }

  private updateFall(dt: number, env: BrainEnv): void {
    this.vh -= GRAVITY * dt;
    this.h += this.vh * dt;
    this.x += this.vx * dt;
    if (this.x < env.minX) {
      this.x = env.minX;
      this.vx = Math.abs(this.vx) * 0.55;
    } else if (this.x > env.maxX) {
      this.x = env.maxX;
      this.vx = -Math.abs(this.vx) * 0.55;
    }
    this.vx *= 1 - Math.min(1, dt * 0.6);
    if (this.h <= 0) {
      const impact = -this.vh;
      this.h = 0;
      if (impact > 520) {
        this.vh = impact * 0.32;
        this.vx *= 0.6;
        this.burst('dust', 6, 0);
        return;
      }
      this.vh = 0;
      this.vx = 0;
      this.landImpact = clamp(impact / 600, 0.4, 1.3);
      this.burst('dust', 5, 0);
      this.events.push('landed');
      this.start('land', 1.2);
    }
  }

  private stepToward(dt: number, env: BrainEnv, carrying: boolean): void {
    const dx = this.targetX - this.x;
    if (Math.abs(dx) < 1.5) {
      this.x = this.targetX;
      if (carrying && this.deliverFetching) this.pickUpLetter();
      else if (carrying) this.dropLetter();
      else if (this.snackNear()) this.consumeSnack();
      else this.finish(env);
      return;
    }
    this.dir = dx > 0 ? 1 : -1;
    const step = Math.min(Math.abs(dx), this.speed * dt);
    this.x += this.dir * step;
    this.phase += (step / STRIDE) * Math.PI;
    for (const p of this.props) if (p.carried) p.x = this.x;
  }

  private updateZoomies(dt: number, env: BrainEnv): void {
    const edge = this.dir > 0 ? env.maxX : env.minX;
    const step = 150 * dt;
    this.x += this.dir * step;
    this.phase += (step / STRIDE) * Math.PI;
    this.emitTimer += dt;
    if (this.emitTimer > 0.12) {
      this.emitTimer = 0;
      this.spawn('dust', this.x - this.dir * 8, 1, -this.dir * 30, 20, 0.5);
    }
    if ((this.dir > 0 && this.x >= edge) || (this.dir < 0 && this.x <= edge)) {
      this.x = edge;
      this.dir = this.dir > 0 ? -1 : 1;
      this.reps -= 1;
      if (this.reps <= 0) {
        this.reps = 1;
        this.startJump(300);
      }
    }
  }

  private updateChase(dt: number, env: BrainEnv): void {
    const ball = this.props.find((p) => p.kind === 'ball');
    if (!ball) {
      this.finish(env);
      return;
    }
    const dx = ball.x - this.x;
    if (Math.abs(dx) < 11 && ball.h < 12 && Math.abs(ball.vx) < 160) {
      this.kicks += 1;
      this.dir = dx >= 0 ? 1 : -1;
      const towardsCenter = ball.x < (env.minX + env.maxX) / 2 ? 1 : -1;
      ball.vx = (this.rand() < 0.7 ? towardsCenter : -towardsCenter) * (200 + this.rand() * 140);
      ball.vh = 180 + this.rand() * 160;
      this.events.push('kicked');
      if (this.kicks >= 3) {
        ball.ttl = 2.5;
        this.reps = 1;
        this.startJump(300);
      }
      return;
    }
    this.dir = dx > 0 ? 1 : -1;
    const step = Math.min(Math.abs(dx), 95 * dt);
    this.x += this.dir * step;
    this.phase += (step / STRIDE) * Math.PI;
  }

  private updateProps(dt: number, env: BrainEnv): void {
    const ps = env.ps;
    for (const p of this.props) {
      p.ttl -= dt;
      if (p.carried) {
        p.x = this.x;
        continue;
      }
      if (p.h > 0 || p.vh > 0) {
        p.vh -= GRAVITY * 0.8 * dt;
        p.h += p.vh * dt;
        if (p.h <= 0) {
          p.h = 0;
          p.vh = Math.abs(p.vh) > 120 ? -p.vh * 0.45 : 0;
        }
      }
      if (p.vx !== 0) {
        p.x += p.vx * dt;
        p.rot += (p.vx * dt) / (3 * ps);
        const lo = env.minX - 10;
        const hi = env.maxX + 10;
        if (p.x < lo) {
          p.x = lo;
          p.vx = Math.abs(p.vx) * 0.6;
        } else if (p.x > hi) {
          p.x = hi;
          p.vx = -Math.abs(p.vx) * 0.6;
        }
        p.vx *= 1 - Math.min(1, dt * (p.h > 0 ? 0.3 : 1.6));
        if (Math.abs(p.vx) < 4) p.vx = 0;
      }
    }
    this.props = this.props.filter((p) => p.ttl > 0);
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.h += p.vh * dt;
      p.rot += p.vr * dt;
      if (p.kind === 'confetti' || p.kind === 'crumb' || p.kind === 'popcorn') p.vh -= 520 * dt;
      if (p.kind === 'dust') {
        p.vx *= 0.92;
        p.vh *= 0.92;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private finish(env: BrainEnv): void {
    if (this.activity === 'carried' || this.activity === 'fall') return;
    if (this.activity === 'yawn') {
      this.start('sleep', 25 + this.rand() * 30 + (isNightHour(env.hour) ? 60 : 0));
      return;
    }
    if (this.activity === 'popcorn' || this.activity === 'chase') {
      this.props = this.props.filter((p) => p.kind !== 'popcorn');
    }
    const next = this.queued.shift();
    if (next) {
      this.start('idle', 0);
      this.react(next);
      return;
    }
    this.decideNext(env);
  }

  private decideNext(env: BrainEnv): void {
    const r = this.rand();
    const night = isNightHour(env.hour);
    const sleepy = env.sleepy || env.tired || night;

    if (this.snackNear(Infinity)) {
      const snack = this.props.find((p) => p.kind === 'snack');
      if (snack) {
        this.goTo(snack.x, 1.2);
        return;
      }
    }

    if (!env.roam) {
      if (sleepy && r < 0.35) this.start('yawn', 1.6);
      else if (r < 0.65) this.start('sit', 4 + this.rand() * 5);
      else if (r < 0.85) this.start('look', 2.6);
      else this.start('idle', 2 + this.rand() * 3);
      return;
    }

    if (env.hungry) {
      if (r < 0.45) this.start('beg', 4 + this.rand() * 3);
      else if (r < 0.7) this.start('sit', 3 + this.rand() * 3);
      else this.wander(env, 0.55);
      return;
    }

    if (sleepy && r < (night ? 0.5 : 0.3)) {
      this.start('yawn', 1.6);
      return;
    }

    const pace = env.sad ? 0.6 : env.sleepy ? 0.7 : env.playful ? 1.35 : 1;
    if (env.playful && r < 0.12) {
      this.spawnBall();
      return;
    }
    if (r < 0.48) this.wander(env, pace);
    else if (r < 0.66) this.start('look', 2.6);
    else if (r < 0.88) this.start('sit', 3 + this.rand() * 6);
    else this.start('idle', 1.5 + this.rand() * 2);
  }

  private wander(env: BrainEnv, pace: number): void {
    const span = env.maxX - env.minX;
    if (span < 20) {
      this.start('sit', 4);
      return;
    }
    let target = env.minX + this.rand() * span;
    if (Math.abs(target - this.x) < span * 0.18) {
      target =
        this.x < env.minX + span / 2
          ? env.maxX - this.rand() * span * 0.3
          : env.minX + this.rand() * span * 0.3;
    }
    this.goTo(target, pace);
  }

  private goTo(x: number, pace: number): void {
    this.targetX = x;
    this.speed = 34 * pace;
    this.start('walk', Infinity);
  }

  private snackNear(range = 6): boolean {
    const snack = this.props.find((p) => p.kind === 'snack');
    return !!snack && snack.h === 0 && Math.abs(snack.x - this.x) <= range;
  }

  private consumeSnack(): void {
    this.props = this.props.filter((p) => p.kind !== 'snack');
    this.events.push('fed');
    this.start('eat', 2.4);
  }

  private spawnBall(): void {
    const env = this.env;
    this.props = this.props.filter((p) => p.kind !== 'ball');
    const fromLeft = this.x > (env ? (env.minX + env.maxX) / 2 : this.x);
    const ball = this.makeProp('ball', this.x + (fromLeft ? -60 : 60), 14);
    ball.h = 40;
    ball.vx = fromLeft ? 60 : -60;
    this.props.push(ball);
    this.kicks = 0;
    this.start('chase', 10);
  }

  private deliverFetching = false;

  private startDelivery(): void {
    const env = this.env;
    if (!env) return;
    this.props = this.props.filter((p) => p.kind !== 'letter');
    // erst zum nächsten Rand laufen und den Brief holen, dann zur Mitte bringen
    this.deliverFetching = true;
    this.targetX = this.x < (env.minX + env.maxX) / 2 ? env.minX : env.maxX;
    this.speed = 52;
    this.start('deliver', Infinity);
  }

  private pickUpLetter(): void {
    const env = this.env;
    if (!env) return;
    this.deliverFetching = false;
    const letter = this.makeProp('letter', this.x, Infinity);
    letter.carried = true;
    this.props.push(letter);
    this.burst('sparkle', 4, 8);
    this.targetX = env.minX + (env.maxX - env.minX) * (0.35 + this.rand() * 0.3);
    this.speed = 40;
  }

  private dropLetter(): void {
    const letter = this.props.find((p) => p.kind === 'letter');
    if (letter) {
      letter.carried = false;
      letter.x = this.x + 14 * (this.dir > 0 ? 1 : -1);
      letter.h = 6;
      letter.ttl = 90;
    }
    this.burst('sparkle', 5, 6);
    this.start('sit', 6);
  }

  private dropCarriedProps(): void {
    for (const p of this.props) {
      if (p.carried && p.kind === 'letter') {
        p.carried = false;
        p.ttl = 90;
      }
    }
    this.props = this.props.filter((p) => !(p.carried && p.kind === 'popcorn'));
  }

  private makeProp(kind: PropKind, x: number, ttl: number): Prop {
    return { kind, x, h: 0, vx: 0, vh: 0, rot: 0, ttl, carried: false };
  }

  private spawn(
    kind: ParticleKind,
    x: number,
    h: number,
    vx: number,
    vh: number,
    life: number
  ): void {
    this.particles.push({
      kind,
      x,
      h,
      vx,
      vh,
      life,
      maxLife: life,
      rot: this.rand() * Math.PI,
      vr: (this.rand() - 0.5) * 8,
      tint: Math.floor(this.rand() * 5),
      size: 0.8 + this.rand() * 0.5,
    });
    if (this.particles.length > 120) this.particles.splice(0, this.particles.length - 120);
  }

  private burst(kind: ParticleKind, count: number, h: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.PI * (0.15 + this.rand() * 0.7);
      const speed =
        kind === 'confetti'
          ? 180 + this.rand() * 200
          : kind === 'dust'
            ? 40 + this.rand() * 40
            : 60 + this.rand() * 70;
      this.spawn(
        kind,
        this.x + (this.rand() - 0.5) * 10,
        h + (kind === 'heart' ? 26 : 10),
        Math.cos(a) * speed * (kind === 'dust' ? 1.6 : 1),
        Math.sin(a) * speed * (kind === 'dust' ? 0.3 : 1),
        kind === 'confetti' ? 1.8 + this.rand() * 0.8 : kind === 'heart' ? 1.4 : 0.7
      );
    }
  }
}
