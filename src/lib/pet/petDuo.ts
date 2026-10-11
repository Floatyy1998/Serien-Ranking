import type { PetBrain } from './petBrain';

/** Regie für zwei Pets, die sich besuchen: begrüßen, fangen, hüpfen, kuscheln. */

export type DuoScene = 'enter' | 'greet' | 'sit' | 'chase' | 'hop';

const ORDER: DuoScene[] = ['enter', 'greet', 'sit', 'chase', 'hop', 'sit', 'greet', 'chase'];

export class DuoDirector {
  scene: DuoScene = 'enter';
  private step = 0;
  private t = 0;
  private sub = 0;
  private started = false;

  constructor(
    private readonly guest: PetBrain,
    private readonly host: PetBrain
  ) {
    guest.setScripted(true);
    host.setScripted(true);
  }

  update(dt: number, width: number): void {
    this.t += dt;
    const g = this.guest;
    const h = this.host;
    const mid = width / 2;

    if (!this.started) {
      this.started = true;
      g.walkTo(mid - 30, 1.1);
      h.walkTo(mid + 30, 0.9);
    }

    switch (this.scene) {
      case 'enter':
        if (!g.busy && !h.busy) {
          g.face(1);
          h.face(-1);
          this.next();
        }
        break;
      case 'greet':
        if (this.sub === 0) {
          g.face(1);
          h.face(-1);
          g.react('love');
          this.sub = 1;
        } else if (this.sub === 1 && this.t > 0.45) {
          h.react('love');
          this.sub = 2;
        } else if (this.sub === 2 && this.t > 2.4 && !g.busy && !h.busy) {
          this.next();
        }
        break;
      case 'sit':
        if (this.sub === 0) {
          g.walkTo(mid - 22, 0.8);
          h.walkTo(mid + 22, 0.8);
          this.sub = 1;
        } else if (this.sub === 1 && !g.busy && !h.busy) {
          g.sitFor(6, 1);
          h.sitFor(6, -1);
          this.sub = 2;
          this.t = 0;
        } else if (this.sub === 2 && this.t > 3.2 && this.t < 3.3) {
          g.face(1);
        } else if (this.sub === 2 && this.t > 6.2) {
          this.next();
        }
        break;
      case 'chase': {
        // Gast flieht, Gastgeber jagt; nach der Hälfte wird getauscht
        const runner = this.t < 4 ? g : h;
        const chaser = this.t < 4 ? h : g;
        if (this.sub === 0 || (this.t >= 4 && this.sub === 1)) {
          const toLeft = runner.x > mid;
          runner.walkTo(toLeft ? width * 0.1 : width * 0.9, 1.9);
          this.sub += 1;
        }
        if (Math.floor(this.t / 0.5) !== Math.floor((this.t - dt) / 0.5)) {
          chaser.walkTo(runner.x + (runner.x > chaser.x ? -26 : 26), 1.7);
        }
        if (this.t > 8) this.next();
        break;
      }
      case 'hop':
        if (this.sub < 6 && this.t > this.sub * 0.7) {
          (this.sub % 2 === 0 ? g : h).react('cheer');
          this.sub += 1;
        }
        if (this.sub >= 6 && this.t > 5 && !g.busy && !h.busy) this.next();
        break;
    }
  }

  private next(): void {
    this.step = (this.step + 1) % ORDER.length;
    if (this.step === 0) this.step = 1;
    this.scene = ORDER[this.step];
    this.t = 0;
    this.sub = 0;
  }
}
