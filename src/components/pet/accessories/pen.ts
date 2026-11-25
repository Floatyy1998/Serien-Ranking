import type { PetAnchors } from './shared';

type Paint = string | CanvasGradient;
type Pt = [number, number];

/** Zeichenstift im 32er-Raster: rechnet Rasterwerte in Pixel um und hält die Aufrufe kurz. */
export interface Pen {
  ctx: CanvasRenderingContext2D;
  ps: number;
  X(x: number): number;
  Y(y: number): number;
  circle(x: number, y: number, r: number, paint: Paint): void;
  ellipse(x: number, y: number, rx: number, ry: number, paint: Paint, rot?: number): void;
  /** Obere Ellipsenhälfte mit gerader Unterkante auf Höhe y. */
  dome(x: number, y: number, rx: number, ry: number, paint: Paint): void;
  rect(x: number, y: number, w: number, h: number, paint: Paint, radius?: number): void;
  poly(points: Pt[], paint: Paint): void;
  line(points: Pt[], width: number, paint: Paint): void;
  arc(x: number, y: number, r: number, from: number, to: number, width: number, paint: Paint): void;
  /** Quadratische Kurve als Linie. */
  curve(from: Pt, control: Pt, to: Pt, width: number, paint: Paint): void;
  /** Freie Fläche: `build` bekommt Pfad-Befehle in Rasterwerten. */
  shape(build: (path: PathPen) => void, paint: Paint, rule?: CanvasFillRule): void;
  /** Teilbogen einer (gedrehten) Ellipse als Linie. */
  ring(
    x: number,
    y: number,
    rx: number,
    ry: number,
    rot: number,
    from: number,
    to: number,
    width: number,
    paint: Paint
  ): void;
  /** Gedrehtes Rechteck um seinen Mittelpunkt. */
  box(x: number, y: number, w: number, h: number, angle: number, paint: Paint): void;
  star(x: number, y: number, r: number, paint: Paint, points?: number, inner?: number): void;
  sparkle(x: number, y: number, r: number, paint: Paint): void;
  heart(x: number, y: number, size: number, paint: Paint): void;
  glow(x: number, y: number, r: number, rgb: string, alpha: number): void;
  linear(x1: number, y1: number, x2: number, y2: number, ...stops: string[]): CanvasGradient;
  radial(x: number, y: number, r: number, ...stops: string[]): CanvasGradient;
  /** Beschneidet auf die Fläche, die `build` beschreibt, solange `draw` läuft. */
  clip(build: (path: PathPen) => void, draw: () => void): void;
}

export interface PathPen {
  move(x: number, y: number): void;
  to(x: number, y: number): void;
  quad(cx: number, cy: number, x: number, y: number): void;
  bezier(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): void;
  ellipse(x: number, y: number, rx: number, ry: number, rot?: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  close(): void;
}

export function pen(ctx: CanvasRenderingContext2D, ps: number, off: number): Pen {
  const X = (x: number) => x * ps;
  const Y = (y: number) => y * ps + off;
  const path: PathPen = {
    move: (x, y) => ctx.moveTo(X(x), Y(y)),
    to: (x, y) => ctx.lineTo(X(x), Y(y)),
    quad: (cx, cy, x, y) => ctx.quadraticCurveTo(X(cx), Y(cy), X(x), Y(y)),
    bezier: (c1x, c1y, c2x, c2y, x, y) =>
      ctx.bezierCurveTo(X(c1x), Y(c1y), X(c2x), Y(c2y), X(x), Y(y)),
    ellipse: (x, y, rx, ry, rot = 0) => {
      ctx.moveTo(X(x) + rx * ps * Math.cos(rot), Y(y) + rx * ps * Math.sin(rot));
      ctx.ellipse(X(x), Y(y), rx * ps, ry * ps, rot, 0, Math.PI * 2);
    },
    rect: (x, y, w, h) => ctx.rect(X(x), Y(y), w * ps, h * ps),
    close: () => ctx.closePath(),
  };
  const stroke = (width: number, paint: Paint) => {
    ctx.strokeStyle = paint;
    ctx.lineWidth = width * ps;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.lineCap = 'butt';
    ctx.lineJoin = 'miter';
  };
  const gradient = (g: CanvasGradient, stops: string[]) => {
    stops.forEach((c, i) => g.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), c));
    return g;
  };

  const p: Pen = {
    ctx,
    ps,
    X,
    Y,
    circle(x, y, r, paint) {
      ctx.fillStyle = paint;
      ctx.beginPath();
      ctx.arc(X(x), Y(y), r * ps, 0, Math.PI * 2);
      ctx.fill();
    },
    ellipse(x, y, rx, ry, paint, rot = 0) {
      ctx.fillStyle = paint;
      ctx.beginPath();
      ctx.ellipse(X(x), Y(y), rx * ps, ry * ps, rot, 0, Math.PI * 2);
      ctx.fill();
    },
    dome(x, y, rx, ry, paint) {
      ctx.fillStyle = paint;
      ctx.beginPath();
      ctx.ellipse(X(x), Y(y), rx * ps, ry * ps, 0, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
    },
    rect(x, y, w, h, paint, radius = 0) {
      ctx.fillStyle = paint;
      ctx.beginPath();
      if (radius > 0 && ctx.roundRect) ctx.roundRect(X(x), Y(y), w * ps, h * ps, radius * ps);
      else ctx.rect(X(x), Y(y), w * ps, h * ps);
      ctx.fill();
    },
    poly(points, paint) {
      ctx.fillStyle = paint;
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
      ctx.closePath();
      ctx.fill();
    },
    line(points, width, paint) {
      ctx.beginPath();
      points.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
      stroke(width, paint);
    },
    arc(x, y, r, from, to, width, paint) {
      ctx.beginPath();
      ctx.arc(X(x), Y(y), r * ps, from, to);
      stroke(width, paint);
    },
    curve(from, control, to, width, paint) {
      ctx.beginPath();
      ctx.moveTo(X(from[0]), Y(from[1]));
      ctx.quadraticCurveTo(X(control[0]), Y(control[1]), X(to[0]), Y(to[1]));
      stroke(width, paint);
    },
    shape(build, paint, rule = 'nonzero') {
      ctx.fillStyle = paint;
      ctx.beginPath();
      build(path);
      ctx.fill(rule);
    },
    ring(x, y, rx, ry, rot, from, to, width, paint) {
      ctx.beginPath();
      ctx.ellipse(X(x), Y(y), rx * ps, ry * ps, rot, from, to);
      stroke(width, paint);
    },
    box(x, y, w, h, angle, paint) {
      const c = Math.cos(angle);
      const s = Math.sin(angle);
      const corner = (dx: number, dy: number): Pt => [x + dx * c - dy * s, y + dx * s + dy * c];
      p.poly(
        [
          corner(-w / 2, -h / 2),
          corner(w / 2, -h / 2),
          corner(w / 2, h / 2),
          corner(-w / 2, h / 2),
        ],
        paint
      );
    },
    star(x, y, r, paint, points = 5, inner = 0.45) {
      ctx.fillStyle = paint;
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / points;
        const rad = i % 2 === 0 ? r : r * inner;
        const px = X(x) + Math.cos(a) * rad * ps;
        const py = Y(y) + Math.sin(a) * rad * ps;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    },
    sparkle(x, y, r, paint) {
      p.star(x, y, r, paint, 4, 0.3);
    },
    heart(x, y, size, paint) {
      ctx.fillStyle = paint;
      ctx.beginPath();
      ctx.moveTo(X(x), Y(y + size * 0.9));
      ctx.bezierCurveTo(
        X(x - size * 1.5),
        Y(y - size * 0.1),
        X(x - size * 0.7),
        Y(y - size * 1.1),
        X(x),
        Y(y - size * 0.3)
      );
      ctx.bezierCurveTo(
        X(x + size * 0.7),
        Y(y - size * 1.1),
        X(x + size * 1.5),
        Y(y - size * 0.1),
        X(x),
        Y(y + size * 0.9)
      );
      ctx.fill();
    },
    glow(x, y, r, rgb, alpha) {
      const g = ctx.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r * ps);
      g.addColorStop(0, `rgba(${rgb}, ${alpha})`);
      g.addColorStop(1, `rgba(${rgb}, 0)`);
      p.circle(x, y, r, g);
    },
    linear(x1, y1, x2, y2, ...stops) {
      return gradient(ctx.createLinearGradient(X(x1), Y(y1), X(x2), Y(y2)), stops);
    },
    radial(x, y, r, ...stops) {
      return gradient(ctx.createRadialGradient(X(x), Y(y), 0, X(x), Y(y), r * ps), stops);
    },
    clip(build, draw) {
      ctx.save();
      ctx.beginPath();
      build(path);
      ctx.clip();
      draw();
      ctx.restore();
    },
  };
  return p;
}

export type AccessoryDrawer = (p: Pen, a: PetAnchors) => void;

/** Mittelpunkte der Augen. */
export function eyes(a: PetAnchors): { l: number; r: number; y: number; half: number } {
  return {
    l: a.headCenterX + a.eyeLeftX + a.eyeWidth / 2,
    r: a.headCenterX + a.eyeRightX + a.eyeWidth / 2,
    y: a.eyeY + 0.3,
    half: a.eyeWidth / 2,
  };
}

/** Halbe Kopfbreite in Stirnhöhe (depth unter dem Scheitel), damit Bänder anliegen statt zu schweben. */
export function foreheadHalfWidth(a: PetAnchors, depth: number): number {
  const r = a.headHalfWidth * 1.1;
  return r * Math.sqrt(Math.max(0, 1 - ((r - depth) / r) ** 2));
}

/** Rumpf unterhalb des Halses; Kleidung wird darauf beschnitten und lässt die Füße frei. */
export function onTorso(p: Pen, a: PetAnchors, draw: () => void): void {
  const { bodyCY, bodyRx, bodyRy } = a.cloak;
  const top = a.neckY - 0.35;
  const hem = Math.min(bodyCY + bodyRy * 0.7, a.waist.y + 2.2);
  p.clip(
    (path) => path.ellipse(a.headCenterX, bodyCY, bodyRx + 0.12, bodyRy + 0.12),
    () => p.clip((path) => path.rect(0, top, 32, hem - top), draw)
  );
}
