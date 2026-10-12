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
  | 'trick'
  | 'hunt'
  | 'dead';

export type Trick = 'flip' | 'spin' | 'dance' | 'moonwalk' | 'sit' | 'jump' | 'signature';

export type Species =
  'cat' | 'dog' | 'bird' | 'dragon' | 'fox' | 'rabbit' | 'panda' | 'owl' | 'penguin' | 'axolotl';

/** Arteigene Spezialbewegung. */
export type Signature =
  'fly' | 'soar' | 'pounce' | 'tailchase' | 'mousejump' | 'binky' | 'roll' | 'slide' | 'float';

export const SIGNATURE_OF: Record<Species, Signature> = {
  dragon: 'fly',
  bird: 'soar',
  owl: 'soar',
  cat: 'pounce',
  dog: 'tailchase',
  fox: 'mousejump',
  rabbit: 'binky',
  panda: 'roll',
  penguin: 'slide',
  axolotl: 'float',
};

/** Purzelbaum: Rollphase in Sekunden. */
const ROLL_START = 0.35;
const ROLL_END = 1.6;

const SIGNATURE_SECONDS: Record<Signature, number> = {
  fly: 3.4,
  soar: 3.6,
  pounce: 2.4,
  tailchase: 2.6,
  mousejump: 2.3,
  binky: 2.0,
  roll: 3.1,
  slide: 2.6,
  float: 3.2,
};

export type Reaction =
  'cheer' | 'party' | 'binge' | 'love' | 'movie' | 'rated' | 'levelup' | 'feed' | 'letter' | 'play';

export type ParticleKind =
  | 'heart'
  | 'z'
  | 'confetti'
  | 'sparkle'
  | 'crumb'
  | 'dust'
  | 'popcorn'
  | 'note'
  | 'fire'
  | 'bubble';

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

export type PropKind = 'ball' | 'letter' | 'snack' | 'popcorn' | 'butterfly';

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
  /** Tierart für die Spezialbewegung. */
  species?: Species;
}

export type BrainEvent = 'fed' | 'kicked' | 'landed' | 'woke';

export interface PetView {
  x: number;
  h: number;
  /** -1 = gespiegelt (schaut nach rechts), 1 = normal. */
  flip: 1 | -1;
  /** Drehung um die Hochachse (Pirouette): skaliert die Breite, negativ = Rückseite. */
  turn: number;
  /** Drehung um die Körpermitte (Salto), Bogenmaß. */
  roll: number;
  tilt: number;
  bob: number;
  squashX: number;
  squashY: number;
  pose: PetPose;
  activity: Activity;
}

const GRAVITY = 1900;
/** Sekunden für das Umdrehen beim Richtungswechsel. */
const TURN_TIME = 0.26;
/** Sekunden Ruhe zwischen zwei Aktionen, die das Pet von selbst startet. */
const ACTION_REST = 25;
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
  private shownFlip: 1 | -1 = 1;
  private turnFrom: 1 | -1 = 1;
  private turnT = 1;
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
  private scripted = false;
  private trickKind: Trick = 'jump';
  private takeoffAt = -1;
  private airTime = 0.5;
  private flipping = false;
  private sig: Signature = 'pounce';
  private sigFlag = 0;

  constructor(
    x: number,
    private readonly rand: Rand = Math.random
  ) {
    this.x = x;
    this.targetX = x;
    this.lastActionAt = -ACTION_REST + 10;
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

  /** Szenen steuern das Pet selbst; es wartet dann zwischen den Befehlen. */
  setScripted(on: boolean): void {
    this.scripted = on;
  }

  walkTo(x: number, pace = 1): void {
    if (this.activity === 'dead' || this.activity === 'carried' || this.activity === 'fall') return;
    this.goTo(x, pace);
  }

  /** Führt einen Trick vor (Kommando von der Pet-Seite oder aus einer Gruppenszene). */
  trick(kind: Trick, seconds?: number): void {
    if (this.activity === 'dead' || this.activity === 'carried' || this.activity === 'fall') return;
    this.trickKind = kind;
    switch (kind) {
      case 'jump':
        this.reps = 1;
        this.startJump(380);
        break;
      case 'flip':
        this.reps = 1;
        this.flipping = true;
        this.startJump(470);
        break;
      case 'sit':
        this.sigFlag = 0;
        this.start('trick', seconds ?? 3.4);
        break;
      case 'spin':
        this.start('trick', seconds ?? 1.3);
        this.burst('sparkle', 4, 8);
        break;
      case 'dance':
        this.start('trick', seconds ?? 3.2);
        break;
      case 'moonwalk':
        this.start('trick', seconds ?? 2.6);
        break;
      case 'signature': {
        const env = this.env;
        this.sig = SIGNATURE_OF[env?.species ?? 'cat'];
        this.sigFlag = 0;
        if (env) {
          // Richtung so wählen, dass genug Platz nach vorn ist
          const mid = (env.minX + env.maxX) / 2;
          this.dir = this.x < mid ? 1 : -1;
        }
        this.start('trick', SIGNATURE_SECONDS[this.sig]);
        break;
      }
    }
  }

  /** Kurzes Schütteln, z. B. nach einem gefangenen Brokkoli. */
  flinch(): void {
    if (!this.canAct) return;
    this.landImpact = 0.6;
    this.start('land', 0.75);
  }

  /** Schuss in einer Gruppenszene: nach vorn lehnen, kurz federn, Staub. */
  kick(dir: 1 | -1): void {
    if (!this.canAct) return;
    this.start('idle', 0.5);
    this.face(dir);
    this.recoil = 0.2;
    this.tiltShake = dir * 0.14;
    this.burst('dust', 3, 0);
  }

  /** Funkeln an der aktuellen Position (Spiel-Effekte). */
  sparkle(count = 5): void {
    this.burst('sparkle', count, 14);
  }

  /** Nach einer gemeinsamen Szene: erst einmal keine eigene Aktion. */
  rest(): void {
    this.lastActionAt = this.elapsed;
  }

  get canAct(): boolean {
    return this.activity !== 'dead' && this.activity !== 'carried' && this.activity !== 'fall';
  }

  face(dir: 1 | -1): void {
    this.dir = dir;
    this.lookX = dir;
  }

  sitFor(seconds: number, lookX = 0): void {
    if (this.activity === 'dead') return;
    this.start('sit', seconds);
    this.lookX = lookX;
  }

  get busy(): boolean {
    return this.activity !== 'idle' && this.activity !== 'sit' && this.activity !== 'look';
  }

  /** Läuft gerade etwas, das nicht unterbrochen werden soll (Futter, Brief, Hochheben)? */
  get engaged(): boolean {
    return (
      this.activity === 'carried' ||
      this.activity === 'fall' ||
      this.activity === 'land' ||
      this.activity === 'eat' ||
      this.activity === 'deliver' ||
      this.activity === 'dead' ||
      this.props.some((p) => p.kind === 'snack' || (p.kind === 'letter' && p.carried))
    );
  }

  // ── Takt ─────────────────────────────────────────────────────────

  private elapsed = 0;
  private lastActionAt = 0;

  update(rawDt: number, env: BrainEnv): void {
    const dt = Math.min(rawDt, 0.05);
    this.env = env;
    this.t += dt;
    this.elapsed += dt;
    if (this.turnT < 1) this.turnT = Math.min(1, this.turnT + dt / TURN_TIME);

    if (!env.alive) {
      if (this.activity !== 'dead') this.start('dead', Infinity);
    } else if (this.activity === 'dead') {
      this.start('idle', 1);
    }

    if (this.activity !== 'carried') this.x = clamp(this.x, env.minX, env.maxX);

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
      case 'trick':
        this.updateTrick(dt, env);
        break;
      case 'hunt':
        this.updateHunt(dt, env);
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
    /** Wie stark die Figur beim Stauchen in die Breite geht; beim Sitzen kaum. */
    let widen = 0.6;
    let tilt = 0;
    let turn = 1;
    let roll = 0;

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
        squashY = 0.93;
        widen = 0.15;
        eyes = this.activity === 'popcorn' && this.t % 2.2 > 1.6 ? 'happy' : 'auto';
        break;
      case 'beg':
        squashY = 0.95;
        widen = 0.15;
        break;
      case 'trick':
        if (this.trickKind === 'dance') {
          const beat = this.t * Math.PI * 4;
          motion = walkCycle(beat, 1.2);
          tilt = Math.sin(beat) * 0.2;
          eyes = 'happy';
        } else if (this.trickKind === 'spin') {
          turn = Math.cos((this.t / this.duration) * Math.PI * 4);
          eyes = 'happy';
          motion = { pawLift: [0.5, 0.5], tilt: 0, bob: 1.2 };
        } else if (this.trickKind === 'moonwalk') {
          motion = walkCycle(this.phase, 0.9);
          tilt = -this.dir * 0.08;
        } else if (this.trickKind === 'sit') {
          // hinplumpsen, Pfötchen geben, wieder aufstehen
          const t = this.t;
          const rise = this.duration - 0.3;
          if (t < 0.22) squashY = 1 - 0.16 * (t / 0.22);
          else if (t < rise) {
            squashY = 0.91 + squashSpring(t - 0.22, 0.05) - 1;
            widen = 0.15;
          } else {
            squashY = 0.91 + 0.09 * ((t - rise) / 0.3);
            widen = 0.15;
          }
          if (t > 0.9 && t < rise - 0.3) {
            const wave = Math.sin((t - 0.9) * 9);
            motion = { pawLift: [1.3 + wave * 0.35, 0], tilt: 0, bob: 0 };
            tilt = this.dir * 0.06;
          }
          eyes = t > 0.3 && t < rise ? 'happy' : 'auto';
        } else if (this.trickKind === 'signature') {
          const v = this.signatureView();
          motion = v.motion;
          tilt = v.tilt;
          turn = v.turn;
          roll = v.roll;
          squashY = v.squashY;
          eyes = v.eyes;
        }
        break;
      case 'hunt':
        motion = walkCycle(this.phase, 1.3);
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
        if (this.flipping && this.takeoffAt >= 0 && this.h > 0) {
          const airT = this.elapsed - this.takeoffAt;
          roll = -this.dir * Math.PI * 2 * clamp(airT / this.airTime, 0, 1);
        }
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
      this.activity === 'deliver' ||
      this.activity === 'hunt'
        ? this.dir
        : this.activity === 'trick' && this.trickKind === 'moonwalk'
          ? -this.dir
          : this.lookX;

    const ps = env?.ps ?? 2;
    const facing: 1 | -1 =
      this.activity === 'trick' && this.trickKind === 'moonwalk'
        ? this.dir > 0
          ? 1
          : -1
        : this.flipSign();
    // Richtungswechsel als kurzer Dreh mit Hüpfer statt hartem Spiegeln
    if (facing !== this.shownFlip && this.turnT >= 1 && this.activity !== 'carried') {
      this.turnFrom = this.shownFlip;
      this.shownFlip = facing;
      this.turnT = 0;
    } else if (this.activity === 'carried') {
      this.shownFlip = facing;
    }
    const turning = this.turnT < 1 ? Math.sin(this.turnT * Math.PI) : 0;
    const flip = this.turnT < 0.5 ? this.turnFrom : this.shownFlip;

    return {
      x: this.x,
      h: this.h,
      flip,
      turn: turn * (1 - 0.5 * turning),
      roll,
      tilt: motion.tilt + tilt + this.tiltShake,
      bob: motion.bob * ps + turning * 2.4 * ps,
      squashX: 1 + (1 - squashY) * widen,
      squashY,
      pose: { pawLift: motion.pawLift, eyes, lookX },
      activity: this.activity,
    };
  }

  // ── Intern ───────────────────────────────────────────────────────

  private signatureView(): {
    motion: MotionFrame;
    tilt: number;
    turn: number;
    roll: number;
    squashY: number;
    eyes: PetPose['eyes'];
  } {
    const t = this.t;
    const out = {
      motion: STILL as MotionFrame,
      tilt: 0,
      turn: 1,
      roll: 0,
      squashY: 1,
      eyes: 'auto' as PetPose['eyes'],
    };
    const air: MotionFrame = { pawLift: [1, 1], tilt: 0, bob: 0 };
    switch (this.sig) {
      case 'fly':
        if (t < 0.8) {
          out.squashY = 0.9 + Math.abs(Math.sin(t * 12)) * 0.16;
          out.eyes = 'happy';
        } else if (t < 2.2) {
          out.motion = air;
          out.tilt = Math.sin(t * 9) * 0.14;
          out.squashY = 1 + Math.sin(t * 24) * 0.05;
          out.eyes = 'happy';
        } else if (t < 2.6) {
          out.motion = air;
          out.eyes = 'closed';
          out.tilt = Math.sin(t * 30) * 0.2;
        } else {
          out.squashY = squashSpring(t - 2.6, 0.3);
          out.eyes = t < 2.9 ? 'closed' : 'auto';
          out.tilt = Math.sin((t - 2.6) * 22) * 0.1 * Math.max(0, 1 - (t - 2.6) * 1.5);
        }
        break;
      case 'soar':
        if (t < 0.4) out.squashY = 0.85;
        else {
          out.motion = air;
          out.tilt = this.dir * 0.16 + Math.sin(t * 3) * 0.05;
          out.squashY = 1 + Math.sin(t * 18) * 0.04;
          out.eyes = 'happy';
        }
        break;
      case 'pounce':
        if (t < 1.3) {
          out.squashY = 0.78;
          out.tilt = Math.sin(t * 22) * 0.05;
        } else if (t < 1.9) {
          out.motion = air;
          out.tilt = this.dir * 0.25;
          out.squashY = 1.1;
          out.eyes = 'happy';
        } else out.squashY = squashSpring(t - 1.9, 0.25);
        break;
      case 'tailchase':
        out.turn = t < 2 ? Math.cos(t * Math.PI * 4.5) : 1;
        out.motion = walkCycle(t * 20, 1.3);
        out.eyes = t < 2 ? 'happy' : 'closed';
        if (t >= 2) out.tilt = Math.sin(t * 14) * 0.14;
        break;
      case 'mousejump':
        if (t < 0.7) {
          out.squashY = 0.8;
          out.tilt = this.dir * 0.1;
        } else if (t < 1.6) {
          const u = (t - 0.7) / 0.9;
          out.motion = air;
          // Nase hoch beim Absprung, dann kopfüber in den Schnee
          out.roll =
            u > 0.45 ? this.dir * ((u - 0.45) / 0.55) * (Math.PI / 2) : -this.dir * u * 0.5;
          out.eyes = 'happy';
        } else {
          const stuck = t < 1.9 ? 1 : Math.max(0, 1 - (t - 1.9) / 0.25);
          out.roll = this.dir * (Math.PI / 2) * stuck;
          out.squashY = t < 1.9 ? 0.9 : squashSpring(t - 1.9, 0.25);
          out.eyes = t < 1.9 ? 'closed' : 'happy';
        }
        break;
      case 'binky': {
        const u = (t % 0.66) / 0.66;
        if (this.h > 2) {
          out.motion = air;
          out.turn = Math.cos(u * Math.PI * 2);
        } else out.squashY = 0.88;
        out.eyes = 'happy';
        break;
      }
      case 'roll':
        if (t < ROLL_START) {
          // abducken und Kopf einziehen
          const k = t / ROLL_START;
          out.squashY = 1 - 0.16 * k;
          out.tilt = this.dir * 0.3 * k;
          out.eyes = 'closed';
        } else if (t < ROLL_END) {
          // zwei Vorwärtsrollen, sanft an- und auslaufend
          const u = (t - ROLL_START) / (ROLL_END - ROLL_START);
          const eased = u < 0.5 ? 2 * u * u : 1 - (-2 * u + 2) ** 2 / 2;
          out.roll = this.dir * eased * Math.PI * 4;
          out.squashY = 0.86;
          out.eyes = 'closed';
        } else if (t < ROLL_END + 0.4) {
          out.squashY = squashSpring(t - ROLL_END, 0.3);
          out.eyes = 'happy';
        } else {
          // kurz schwindelig
          const fade = Math.max(0, 1 - (t - ROLL_END - 0.4) / 0.9);
          out.tilt = Math.sin(t * 11) * 0.2 * fade;
          out.eyes = 'happy';
        }
        break;
      case 'slide': {
        const lie = t < 0.3 ? t / 0.3 : t < 2.0 ? 1 : Math.max(0, 1 - (t - 2.0) / 0.5);
        out.roll = this.dir * (Math.PI / 2) * lie;
        out.eyes = lie > 0.5 ? 'happy' : 'auto';
        break;
      }
      case 'float':
        out.motion = { pawLift: [0.6, 0.6], tilt: 0, bob: 0 };
        out.tilt = Math.sin(t * 2.4) * 0.12;
        out.eyes = this.h > 25 ? 'happy' : 'auto';
        break;
    }
    return out;
  }

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
    if (this.h <= 0 && this.vh === 0 && this.pendingPower > 0) {
      this.squash = Math.min(1, this.squash);
      if (this.t > 0.12) {
        this.vh = this.pendingPower;
        this.takeoffAt = this.elapsed;
        this.airTime = (2 * this.pendingPower) / GRAVITY;
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
      if (this.flipping) {
        this.flipping = false;
        this.burst('sparkle', 7, 6);
      }
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
    this.targetX = clamp(this.targetX, env.minX, env.maxX);
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
      if (p.kind === 'butterfly') {
        if (p.ttl < 2) p.h += p.vh * dt;
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
      if (p.kind === 'note') p.vx = Math.sin((p.maxLife - p.life) * 6) * 20;
      if (p.kind === 'bubble') p.vx = Math.sin((p.maxLife - p.life) * 5 + p.rot) * 14;
      if (p.kind === 'fire') {
        p.vx *= 0.94;
        p.vh += 40 * dt;
      }
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  private finish(env: BrainEnv): void {
    if (this.activity === 'carried' || this.activity === 'fall') return;
    if (this.activity === 'yawn') {
      this.start('sleep', 9 + this.rand() * 8);
      return;
    }
    if (this.activity === 'hunt') {
      const fly = this.props.find((p) => p.kind === 'butterfly');
      if (fly) {
        fly.vh = 120;
        fly.ttl = 2;
      }
    }
    if (this.activity === 'popcorn' || this.activity === 'chase') {
      this.props = this.props.filter((p) => p.kind !== 'popcorn');
    }
    if (this.activity === 'trick') {
      this.h = 0;
      this.vh = 0;
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
    const sleepy = env.sleepy || env.tired;

    if (this.scripted) {
      this.start('idle', 0.5);
      return;
    }

    if (this.snackNear(Infinity)) {
      const snack = this.props.find((p) => p.kind === 'snack');
      if (snack) {
        this.goTo(snack.x, 1.2);
        return;
      }
    }

    if (!env.roam) {
      if (sleepy && r < 0.15) this.start('yawn', 1.6);
      else if (r < 0.35) this.trick(this.pickTrick(['spin', 'dance', 'jump']));
      else if (r < 0.65) this.start('sit', 3 + this.rand() * 3);
      else if (r < 0.85) this.start('look', 2.6);
      else this.start('idle', 1.5 + this.rand() * 2);
      return;
    }

    if (env.hungry) {
      if (r < 0.4) this.start('beg', 3 + this.rand() * 2);
      else if (r < 0.6) this.start('sit', 2 + this.rand() * 2);
      else this.wander(env, 0.6);
      return;
    }

    // Nickerchen nur, wenn das Pet wirklich müde ist; nachts selten
    if ((sleepy && r < 0.16) || (night && r < 0.05)) {
      this.start('yawn', 1.6);
      return;
    }

    const pace = env.sad ? 0.7 : env.playful ? 1.1 : 0.95;
    // Ruhiger Grundtakt; Aktionen frühestens nach einer Pause
    const restSeconds = this.elapsed - this.lastActionAt;
    const actionChance = restSeconds < ACTION_REST ? 0 : env.playful ? 0.4 : 0.3;
    if (r < actionChance) {
      this.lastActionAt = this.elapsed;
      const a = this.rand();
      if (a < 0.3)
        this.trick(this.pickTrick(['spin', 'dance', 'dance', 'jump', 'flip', 'moonwalk']));
      else if (a < 0.55) this.trick('signature');
      else if (a < 0.75) this.startHunt();
      else if (a < 0.92) this.spawnBall();
      else {
        this.reps = 1;
        this.dir = this.x < (env.minX + env.maxX) / 2 ? 1 : -1;
        this.start('zoomies', 6);
      }
      return;
    }
    const c = this.rand();
    if (c < 0.42) this.wander(env, pace);
    else if (c < 0.62) this.start('look', 2.6 + this.rand());
    else if (c < 0.9) this.start('sit', 4 + this.rand() * 5);
    else this.start('idle', 2 + this.rand() * 2);
  }

  private pickTrick(options: Trick[]): Trick {
    return options[Math.floor(this.rand() * options.length)];
  }

  private updateTrick(dt: number, env: BrainEnv): void {
    if (this.trickKind === 'sit' && this.t > 0.3 && this.sigFlag === 0) {
      this.sigFlag = 1;
      this.burst('sparkle', 4, 6);
      this.burst('dust', 4, 0);
    }
    if (this.trickKind === 'signature') {
      this.updateSignature(dt, env);
      return;
    }
    if (this.trickKind === 'dance') {
      this.emitTimer += dt;
      if (this.emitTimer > 0.45) {
        this.emitTimer = 0;
        this.spawn(
          'note',
          this.x + (this.rand() - 0.5) * 30,
          22 * env.ps * 0.9,
          (this.rand() - 0.5) * 30,
          38,
          1.4
        );
      }
    } else if (this.trickKind === 'moonwalk') {
      // gleitet rückwärts, Blick nach vorn
      const step = 30 * dt;
      const next = this.x - this.dir * step;
      if (next < env.minX || next > env.maxX) this.dir = this.dir > 0 ? -1 : 1;
      this.x -= this.dir * step;
      this.phase += (step / STRIDE) * Math.PI;
    }
  }

  private updateSignature(dt: number, env: BrainEnv): void {
    const t = this.t;
    const ps = env.ps;
    const every = (sec: number) => Math.floor(t / sec) !== Math.floor((t - dt) / sec);
    const mouth = () => this.x + this.dir * 4 * ps;
    switch (this.sig) {
      case 'fly': {
        if (t < 0.8) {
          this.h = Math.abs(Math.sin(t * 12)) * 6;
          if (every(0.2)) this.spawn('dust', this.x, 1, (this.rand() - 0.5) * 60, 10, 0.5);
        } else if (t < 2.2) {
          this.h = 10 + ((t - 0.8) / 1.4) * 48 + Math.sin(t * 14) * 4;
          this.x += Math.sin(t * 2.4) * 18 * dt;
          if (every(0.22)) this.spawn('fire', mouth(), this.h + 14 * ps, this.dir * 70, 20, 0.55);
        } else if (t < 2.6) {
          const u = (t - 2.2) / 0.4;
          this.h = Math.max(0, 58 * (1 - u * u));
          if (every(0.1))
            this.spawn('dust', this.x, this.h + 16 * ps, (this.rand() - 0.5) * 30, 30, 0.7);
        } else {
          this.h = 0;
          if (this.sigFlag === 0) {
            this.sigFlag = 1;
            this.burst('dust', 7, 0);
          }
        }
        break;
      }
      case 'soar': {
        if (t < 0.4) this.h = 0;
        else if (t < 1.2) this.h = ((t - 0.4) / 0.8) * 56;
        else if (t < 2.8) this.h = 56 + Math.sin(t * 3) * 6;
        else this.h = Math.max(0, 56 * (1 - (t - 2.8) / 0.8));
        if (t > 0.4) {
          const next = this.x + this.dir * 62 * dt;
          if (next < env.minX || next > env.maxX) this.dir = this.dir > 0 ? -1 : 1;
          this.x += this.dir * 62 * dt;
          if (every(0.35) && this.h > 10)
            this.spawn(
              'sparkle',
              this.x - this.dir * 6 * ps,
              this.h + 8 * ps,
              -this.dir * 20,
              -10,
              0.6
            );
        }
        break;
      }
      case 'pounce': {
        if (t >= 1.3 && t < 1.9) {
          const u = (t - 1.3) / 0.6;
          this.h = Math.sin(Math.PI * u) * 30;
          this.x += this.dir * 95 * dt;
        } else {
          this.h = 0;
          if (t >= 1.9 && this.sigFlag === 0) {
            this.sigFlag = 1;
            this.burst('sparkle', 6, 4);
          }
        }
        break;
      }
      case 'tailchase': {
        this.x += Math.sin(t * 10) * 26 * dt;
        if (every(0.15) && t < 2)
          this.spawn(
            'dust',
            this.x + (this.rand() - 0.5) * 20,
            1,
            (this.rand() - 0.5) * 50,
            14,
            0.5
          );
        break;
      }
      case 'mousejump': {
        if (t >= 0.7 && t < 1.6) {
          const u = (t - 0.7) / 0.9;
          this.h = Math.sin(Math.PI * u) * 78;
          this.x += this.dir * 28 * dt;
        } else {
          this.h = 0;
          if (t >= 1.6 && this.sigFlag === 0) {
            this.sigFlag = 1;
            for (let i = 0; i < 9; i++) {
              this.spawn(
                'sparkle',
                this.x + (this.rand() - 0.5) * 20,
                4,
                (this.rand() - 0.5) * 120,
                60 + this.rand() * 80,
                0.8
              );
            }
          }
        }
        break;
      }
      case 'binky': {
        const u = (t % 0.66) / 0.66;
        this.h = t < 1.98 ? Math.sin(Math.PI * u) * 34 : 0;
        this.x += this.dir * 22 * dt;
        if (every(0.66)) this.spawn('heart', this.x, 18 * ps, 0, 30, 0.9);
        break;
      }
      case 'roll': {
        if (t >= ROLL_START && t < ROLL_END) {
          const u = (t - ROLL_START) / (ROLL_END - ROLL_START);
          const speed = 70 * Math.sin(Math.PI * u) * (Math.PI / 2);
          this.x = clamp(this.x + this.dir * speed * dt, env.minX, env.maxX);
          // bei jeder Rolle kurz über den runden Rücken
          this.h = Math.abs(Math.sin(u * Math.PI * 2)) * 5;
        } else {
          this.h = 0;
        }
        if (t >= ROLL_END && this.sigFlag === 0) {
          this.sigFlag = 1;
          this.burst('dust', 7, 0);
        }
        if (t >= ROLL_END + 0.45 && this.sigFlag === 1) {
          this.sigFlag = 2;
          for (let i = 0; i < 3; i++) {
            const a = (i / 3) * Math.PI * 2;
            this.spawn(
              'sparkle',
              this.x + Math.cos(a) * 14,
              24 * ps,
              Math.cos(a + Math.PI / 2) * 26,
              8,
              0.9
            );
          }
        }
        break;
      }
      case 'slide': {
        if (t >= 0.3 && t < 2.0) {
          const speed = 140 * (1 - (t - 0.3) / 1.7);
          const next = this.x + this.dir * speed * dt;
          if (next < env.minX || next > env.maxX) this.dir = this.dir > 0 ? -1 : 1;
          this.x += this.dir * speed * dt;
          if (every(0.08))
            this.spawn('sparkle', this.x - this.dir * 6 * ps, 2, -this.dir * 40, 30, 0.5);
        }
        break;
      }
      case 'float': {
        const u = Math.min(1, t / this.duration);
        this.h = Math.max(0, Math.sin(Math.PI * u) * 38);
        this.x += Math.sin(t * 2) * 10 * dt;
        if (every(0.18))
          this.spawn(
            'bubble',
            this.x + (this.rand() - 0.5) * 24,
            this.h + 10 * ps,
            (this.rand() - 0.5) * 10,
            34,
            1.6
          );
        break;
      }
    }
  }

  private startHunt(): void {
    const env = this.env;
    if (!env) return;
    this.props = this.props.filter((p) => p.kind !== 'butterfly');
    const fromLeft = this.rand() < 0.5;
    const fly = this.makeProp('butterfly', fromLeft ? env.minX - 20 : env.maxX + 20, 12);
    fly.h = 50 + this.rand() * 30;
    fly.vx = fromLeft ? 40 : -40;
    this.props.push(fly);
    this.reps = 0;
    this.start('hunt', 9);
  }

  private updateHunt(dt: number, env: BrainEnv): void {
    const fly = this.props.find((p) => p.kind === 'butterfly');
    if (!fly) {
      this.finish(env);
      return;
    }
    // Schmetterling flattert in Bögen und weicht knapp aus
    fly.rot += dt;
    const wobble = Math.sin(this.elapsed * 3.1) * 40 + Math.sin(this.elapsed * 1.7) * 30;
    fly.vx += (wobble - fly.vx) * dt * 2;
    fly.h = clamp(fly.h + Math.sin(this.elapsed * 2.3) * 40 * dt, 26, 110);
    if (Math.abs(fly.x - this.x) < 30 && fly.h < 70) fly.h += 60 * dt;
    fly.x = clamp(fly.x + fly.vx * dt, env.minX - 10, env.maxX + 10);

    const dx = fly.x - this.x;
    this.dir = dx > 0 ? 1 : -1;
    if (Math.abs(dx) > 16) {
      const step = Math.min(Math.abs(dx), 70 * dt);
      this.x += this.dir * step;
      this.phase += (step / STRIDE) * Math.PI;
    } else if (this.reps < 3) {
      this.reps += 1;
      this.trickKind = 'jump';
      this.startJump(360);
      this.reps = 1;
      fly.h += 30;
    }
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
      // bleibt liegen, bis er geöffnet wird
      letter.ttl = Infinity;
    }
    this.burst('sparkle', 5, 6);
    this.start('sit', 6);
  }

  private dropCarriedProps(): void {
    for (const p of this.props) {
      if (p.carried && p.kind === 'letter') {
        p.carried = false;
        p.ttl = Infinity;
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
