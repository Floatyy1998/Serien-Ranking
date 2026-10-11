/** Mini-Spiel „Snack-Regen": Snacks fallen, das Pet fängt sie. Reine Logik ohne Zeichnen. */

export type DropKind = 'bone' | 'fish' | 'cookie' | 'star' | 'broccoli';

export interface Drop {
  id: number;
  kind: DropKind;
  x: number;
  /** Höhe über dem Boden in px. */
  h: number;
  speed: number;
  spin: number;
}

export interface CatchResult {
  kind: DropKind;
  points: number;
  x: number;
  h: number;
}

export const GAME_SECONDS = 30;

const POINTS: Record<DropKind, number> = { bone: 1, fish: 1, cookie: 1, star: 3, broccoli: -2 };

export class SnackRain {
  drops: Drop[] = [];
  score = 0;
  caught = 0;
  combo = 0;
  bestCombo = 0;
  timeLeft = GAME_SECONDS;
  private spawnIn = 0.6;
  private nextId = 1;

  constructor(
    private readonly width: number,
    private readonly top: number,
    private readonly rand: () => number = Math.random
  ) {}

  get over(): boolean {
    return this.timeLeft <= 0;
  }

  /** Bewegt alles weiter und meldet, was das Pet bei petX (Breite catchW, Fanghöhe catchH) gefangen hat. */
  update(dt: number, petX: number, catchW: number, catchH: number): CatchResult[] {
    if (this.over) return [];
    this.timeLeft = Math.max(0, this.timeLeft - dt);
    const progress = 1 - this.timeLeft / GAME_SECONDS;

    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawn(progress);
      this.spawnIn = 0.85 - progress * 0.45 + this.rand() * 0.25;
    }

    const results: CatchResult[] = [];
    for (const d of this.drops) {
      d.h -= d.speed * dt;
      d.spin += dt * 3;
      if (d.h <= catchH && d.h > 0 && Math.abs(d.x - petX) < catchW) {
        const points = POINTS[d.kind];
        results.push({ kind: d.kind, points, x: d.x, h: d.h });
        d.h = -999;
      }
    }
    for (const r of results) {
      if (r.points > 0) {
        this.combo += 1;
        this.bestCombo = Math.max(this.bestCombo, this.combo);
        this.caught += 1;
        this.score += r.points + (this.combo >= 5 ? 1 : 0);
      } else {
        this.combo = 0;
        this.score = Math.max(0, this.score + r.points);
      }
    }
    // verpasste Snacks brechen die Serie
    for (const d of this.drops) {
      if (d.h <= 0 && d.h > -999 && d.kind !== 'broccoli') this.combo = 0;
    }
    this.drops = this.drops.filter((d) => d.h > 0);
    return results;
  }

  private spawn(progress: number): void {
    const r = this.rand();
    const kind: DropKind =
      r < 0.06 ? 'star' : r < 0.24 ? 'broccoli' : r < 0.5 ? 'bone' : r < 0.75 ? 'fish' : 'cookie';
    const margin = 24;
    this.drops.push({
      id: this.nextId++,
      kind,
      x: margin + this.rand() * (this.width - margin * 2),
      h: this.top,
      speed: 95 + progress * 85 + this.rand() * 30 + (kind === 'star' ? 40 : 0),
      spin: this.rand() * Math.PI,
    });
  }
}
