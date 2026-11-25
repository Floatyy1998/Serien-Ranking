import { eyes, type AccessoryDrawer, type PathPen } from './pen';

const TAU = Math.PI * 2;

const freckles: AccessoryDrawer = (p, a) => {
  const e = eyes(a);
  const dots: [number, number][] = [
    [-0.9, 1.5],
    [0, 1.9],
    [0.9, 1.5],
    [-0.4, 2.5],
    [0.5, 2.6],
  ];
  for (const x of [e.l - 0.5, e.r + 0.5]) {
    for (const [dx, dy] of dots) p.circle(x + dx, e.y + dy, 0.2, 'rgba(141, 85, 36, 0.8)');
  }
};

const bandaid: AccessoryDrawer = (p, a) => {
  const e = eyes(a);
  const x = e.r + 0.9;
  const y = e.y + 2.1;
  p.box(x, y, 3, 1.15, -0.5, '#F2C29B');
  p.box(x, y, 1.05, 1.15, -0.5, '#FBE0C8');
  for (const d of [-1.05, 1.05]) {
    p.circle(x + Math.cos(-0.5) * d, y + Math.sin(-0.5) * d, 0.13, '#D9A27C');
  }
};

const catWhiskers: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const y = a.mouthY - 0.9;
  for (const side of [-1, 1]) {
    for (let i = -1; i <= 1; i++) {
      p.line(
        [
          [cx + side * 2.9, y + i * 0.55],
          [cx + side * (a.headHalfWidth + 1.3), y + i * 1.15 - 0.2],
        ],
        0.17,
        '#3E2723'
      );
    }
    p.circle(cx + side * 2.3, y - 0.35, 0.16, '#3E2723');
    p.circle(cx + side * 2.3, y + 0.35, 0.16, '#3E2723');
  }
};

const sleepMask: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const e = eyes(a);
  const w = a.headHalfWidth;
  p.line(
    [
      [cx - w * 1.02, e.y - 0.3],
      [cx + w * 1.02, e.y - 0.3],
    ],
    0.3,
    '#3949AB'
  );
  const lobe = (s: PathPen) => {
    s.move(cx, e.y - 0.9);
    s.quad(e.r + 0.1, e.y - 2.1, e.r + 1.75, e.y - 0.7);
    s.quad(e.r + 1.9, e.y + 1.5, e.r, e.y + 1.5);
    s.quad(cx + 0.5, e.y + 1.4, cx, e.y + 0.5);
    s.quad(cx - 0.5, e.y + 1.4, e.l, e.y + 1.5);
    s.quad(e.l - 1.9, e.y + 1.5, e.l - 1.75, e.y - 0.7);
    s.quad(e.l - 0.1, e.y - 2.1, cx, e.y - 0.9);
    s.close();
  };
  p.shape(lobe, p.linear(cx, e.y - 1.8, cx, e.y + 1.5, '#7986CB', '#3F51B5'));
  for (const x of [e.l, e.r]) {
    p.arc(x, e.y - 0.25, 0.85, 0.15 * Math.PI, 0.85 * Math.PI, 0.2, '#E8EAF6');
    for (const d of [-0.6, 0, 0.6]) {
      p.line(
        [
          [x + d, e.y + 0.55 - Math.abs(d) * 0.25],
          [x + d * 1.3, e.y + 0.95 - Math.abs(d) * 0.25],
        ],
        0.14,
        '#E8EAF6'
      );
    }
  }
};

const pacifier: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const y = a.mouthY - 0.15;
  p.arc(cx, y + 1, 0.85, 0, Math.PI, 0.3, '#FFF176');
  p.ellipse(cx, y, 1.75, 1.1, '#81D4FA');
  p.ellipse(cx, y - 0.15, 1.3, 0.6, 'rgba(255,255,255,0.35)');
  p.circle(cx, y, 0.6, '#29B6F6');
  p.circle(cx - 0.18, y - 0.18, 0.2, '#E1F5FE');
};

const swirlGlasses: AccessoryDrawer = (p, a) => {
  const e = eyes(a);
  const r = e.half + 0.75;
  p.line(
    [
      [e.l + r, e.y],
      [e.r - r, e.y],
    ],
    0.3,
    '#263238'
  );
  for (const x of [e.l, e.r]) {
    p.circle(x, e.y, r, '#263238');
    p.circle(x, e.y, r - 0.28, '#FAFAFA');
    for (let i = 0; i < 3; i++) {
      p.arc(x, e.y, r - 0.6 - i * 0.38, i * 1.9, i * 1.9 + Math.PI * 1.35, 0.17, '#37474F');
    }
  }
};

const cinemaGlasses: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const e = eyes(a);
  const w = a.headHalfWidth;
  p.line(
    [
      [cx - w * 1.02, e.y - 0.4],
      [cx + w * 1.02, e.y - 0.4],
    ],
    0.32,
    '#FAFAFA'
  );
  p.rect(e.l - 1.75, e.y - 1.25, e.r - e.l + 3.5, 2.5, '#FAFAFA', 0.5);
  p.rect(e.l - 1.35, e.y - 0.85, 2.7, 1.7, 'rgba(229, 57, 53, 0.82)', 0.3);
  p.rect(e.r - 1.35, e.y - 0.85, 2.7, 1.7, 'rgba(0, 188, 212, 0.82)', 0.3);
  p.box(e.l - 0.5, e.y - 0.25, 0.3, 1.1, 0.6, 'rgba(255,255,255,0.45)');
  p.box(e.r - 0.5, e.y - 0.25, 0.3, 1.1, 0.6, 'rgba(255,255,255,0.45)');
};

const catEyeGlasses: AccessoryDrawer = (p, a) => {
  const e = eyes(a);
  p.curve(
    [e.l + 1.1, e.y - 0.2],
    [(e.l + e.r) / 2, e.y - 0.75],
    [e.r - 1.1, e.y - 0.2],
    0.28,
    '#C2185B'
  );
  for (const side of [-1, 1]) {
    const x = side < 0 ? e.l : e.r;
    const frame = (grow: number) => (s: PathPen) => {
      s.move(x - side * (1.25 + grow), e.y - 0.2);
      s.quad(x - side * (1.2 + grow), e.y + 1.25 + grow, x, e.y + 1.2 + grow);
      s.quad(x + side * (1.5 + grow), e.y + 1.1 + grow, x + side * (1.6 + grow), e.y - 0.4);
      s.to(x + side * (2.5 + grow * 1.6), e.y - 1.75 - grow);
      s.quad(x, e.y - 1.25 - grow, x - side * (1.25 + grow), e.y - 0.2);
      s.close();
    };
    p.shape(frame(0.32), '#D81B60');
    p.shape(frame(0), 'rgba(252, 228, 236, 0.5)');
    p.circle(x + side * 2.25, e.y - 1.45, 0.24, '#FFF59D');
  }
};

const starFacePaint: AccessoryDrawer = (p, a) => {
  const e = eyes(a);
  p.star(e.l - 0.7, e.y + 2, 1.05, '#FFD54F');
  p.star(e.l - 0.7, e.y + 2, 0.5, '#FFF9C4');
  p.circle(e.l + 0.7, e.y + 2.7, 0.22, '#4FC3F7');
  p.circle(e.l - 2, e.y + 1, 0.2, '#F06292');
  p.star(e.r + 1.1, e.y + 1.6, 0.6, '#4FC3F7');
  p.circle(e.r + 0.1, e.y + 2.5, 0.2, '#FFD54F');
};

const bubbleGum: AccessoryDrawer = (p, a) => {
  const x = a.headCenterX + 0.5;
  const y = a.mouthY + 1.2;
  p.circle(
    x,
    y,
    2.05,
    p.radial(x - 0.6, y - 0.7, 2.6, 'rgba(252,228,236,0.95)', 'rgba(240,98,146,0.88)')
  );
  p.arc(x, y, 2.05, 0, TAU, 0.12, 'rgba(194,24,91,0.5)');
  p.ellipse(x - 0.75, y - 0.85, 0.6, 0.35, 'rgba(255,255,255,0.85)', -0.6);
  p.circle(x + 0.9, y + 0.9, 0.2, 'rgba(255,255,255,0.5)');
};

const tigerStripes: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const e = eyes(a);
  const w = a.headHalfWidth;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const y = e.y + 0.5 + i * 1.15;
      const reach = 2.3 - i * 0.35;
      p.poly(
        [
          [cx + side * (w * 1.04 - i * 0.2), y - 0.42],
          [cx + side * (w * 1.04 - i * 0.2), y + 0.42],
          [cx + side * (w * 1.04 - reach), y + 0.1],
        ],
        '#3E2723'
      );
    }
  }
};

const roseBite: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const y = a.mouthY - 0.15;
  p.line(
    [
      [cx - 2.4, y + 0.35],
      [cx + 3, y - 0.3],
    ],
    0.26,
    '#388E3C'
  );
  p.ellipse(cx + 1.6, y + 0.55, 0.9, 0.4, '#66BB6A', 0.5);
  const rx = cx - 3;
  p.circle(rx, y + 0.3, 1.35, '#C62828');
  p.circle(rx + 0.15, y + 0.15, 0.95, '#E53935');
  p.arc(rx, y + 0.3, 0.55, 0.4, Math.PI * 1.5, 0.18, '#8E0000');
  p.circle(rx - 0.45, y - 0.3, 0.22, 'rgba(255,255,255,0.4)');
};

const sparkleEyes: AccessoryDrawer = (p, a) => {
  const e = eyes(a);
  for (const side of [-1, 1]) {
    const x = side < 0 ? e.l : e.r;
    p.glow(x + side * 1.5, e.y - 1.2, 1.8, '255, 245, 157', 0.55);
    p.sparkle(x + side * 1.5, e.y - 1.2, 1.15, '#FFF59D');
    p.sparkle(x + side * 1.5, e.y - 1.2, 0.55, '#FFFFFF');
    p.sparkle(x + side * 2.1, e.y + 0.9, 0.55, '#FFFFFF');
    p.sparkle(x - side * 0.2, e.y - 2, 0.4, '#FFE082');
  }
};

const cyberMonocle: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const e = eyes(a);
  const r = e.half + 0.75;
  p.line(
    [
      [e.r + r, e.y - 0.3],
      [cx + a.headHalfWidth * 1.02, e.y - 0.6],
    ],
    0.34,
    '#263238'
  );
  p.rect(cx + a.headHalfWidth * 0.9, e.y - 1.3, 0.9, 1.5, '#37474F', 0.25);
  p.glow(e.r, e.y, r + 1, '0, 229, 255', 0.4);
  p.circle(e.r, e.y, r, '#263238');
  p.circle(e.r, e.y, r - 0.3, 'rgba(0, 229, 255, 0.32)');
  p.arc(e.r, e.y, r - 0.7, 0, TAU, 0.1, '#00E5FF');
  p.line(
    [
      [e.r - r + 0.4, e.y],
      [e.r + r - 0.4, e.y],
    ],
    0.09,
    '#00E5FF'
  );
  p.line(
    [
      [e.r, e.y - r + 0.4],
      [e.r, e.y + r - 0.4],
    ],
    0.09,
    '#00E5FF'
  );
  p.circle(cx + a.headHalfWidth * 0.9 + 0.45, e.y - 0.9, 0.18, '#FF1744');
};

const masqueradeMask: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const e = eyes(a);
  const outer = (s: PathPen) => {
    s.move(cx, e.y - 0.6);
    s.quad(e.r, e.y - 2.4, e.r + 2.9, e.y - 1.9);
    s.quad(e.r + 2.5, e.y + 1.7, e.r, e.y + 1.5);
    s.quad(cx + 0.6, e.y + 1.4, cx, e.y + 0.4);
    s.quad(cx - 0.6, e.y + 1.4, e.l, e.y + 1.5);
    s.quad(e.l - 2.5, e.y + 1.7, e.l - 2.9, e.y - 1.9);
    s.quad(e.l, e.y - 2.4, cx, e.y - 0.6);
    s.close();
  };
  for (let i = 0; i < 3; i++) {
    p.ellipse(
      e.r + 2.4 + i * 0.5,
      e.y - 3 - i * 0.5,
      0.55,
      1.7 - i * 0.2,
      ['#7E57C2', '#26C6DA', '#F06292'][i],
      0.5 + i * 0.25
    );
  }
  p.shape(
    (s) => {
      outer(s);
      s.ellipse(e.l, e.y, 1.05, 0.85);
      s.ellipse(e.r, e.y, 1.05, 0.85);
    },
    p.linear(e.l - 3, e.y, e.r + 3, e.y, '#6A1B9A', '#AB47BC', '#6A1B9A'),
    'evenodd'
  );
  for (const x of [e.l, e.r]) p.ring(x, e.y, 1.05, 0.85, 0, 0, TAU, 0.2, '#FFD54F');
  p.curve([e.l - 2.6, e.y - 1.7], [e.l, e.y - 2.2], [cx, e.y - 0.55], 0.18, '#FFD54F');
  p.curve([e.r + 2.6, e.y - 1.7], [e.r, e.y - 2.2], [cx, e.y - 0.55], 0.18, '#FFD54F');
  p.circle(cx, e.y - 0.5, 0.32, '#FFD54F');
};

const rainbowCheeks: AccessoryDrawer = (p, a) => {
  const e = eyes(a);
  for (const x of [e.l - 0.9, e.r + 0.9]) {
    const y = e.y + 2.6;
    ['#EF5350', '#FFCA28', '#66BB6A', '#42A5F5'].forEach((c, i) =>
      p.arc(x, y, 1.25 - i * 0.28, Math.PI, TAU, 0.26, c)
    );
    p.circle(x - 1.2, y + 0.05, 0.36, '#FFFFFF');
    p.circle(x + 1.2, y + 0.05, 0.36, '#FFFFFF');
  }
};

const ledVisor: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const e = eyes(a);
  const half = Math.max(a.headHalfWidth * 0.98, e.r - cx + 2);
  p.rect(cx - half, e.y - 1.45, half * 2, 2.9, '#10151B', 1.2);
  p.rect(cx - half + 0.5, e.y - 1.15, half * 2 - 1, 0.5, 'rgba(255,255,255,0.12)', 0.25);
  for (const x of [e.l, e.r]) {
    p.line(
      [
        [x - 0.85, e.y + 0.45],
        [x, e.y - 0.55],
        [x + 0.85, e.y + 0.45],
      ],
      0.34,
      '#00E5FF'
    );
  }
  p.rect(cx - half + 0.8, e.y + 1.05, half * 2 - 1.6, 0.16, 'rgba(0, 229, 255, 0.7)', 0.08);
  p.circle(cx, e.y + 0.55, 0.16, '#FF4081');
};

const phantomMask: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const e = eyes(a);
  const edge = cx + a.headHalfWidth * 0.98;
  p.shape(
    (s) => {
      s.move(cx - 0.2, e.y - 2.6);
      s.quad(edge - 0.6, e.y - 2.9, edge, e.y - 0.6);
      s.quad(edge + 0.1, e.y + 1.6, e.r + 0.6, e.y + 2.6);
      s.quad(cx + 0.9, e.y + 2.5, cx + 0.5, e.y + 1.2);
      s.quad(cx - 0.5, e.y + 0.3, cx - 0.2, e.y - 2.6);
      s.close();
      s.ellipse(e.r, e.y, 1.1, 0.95);
    },
    p.linear(cx, e.y - 2.6, edge, e.y + 2.4, '#FFFFFF', '#E0E0E0'),
    'evenodd'
  );
  p.ring(e.r, e.y, 1.1, 0.95, 0, 0, TAU, 0.14, '#BDBDBD');
  p.curve([cx + 0.6, e.y - 2.2], [e.r, e.y - 2.4], [edge - 0.7, e.y - 1.2], 0.14, '#EEEEEE');
};

const fireBreath: AccessoryDrawer = (p, a) => {
  const x = a.headCenterX + 0.2;
  const y = a.mouthY - 0.1;
  p.glow(x + 4.2, y + 0.8, 5.6, '255, 152, 0', 0.45);
  const flame = (len: number, wide: number, paint: string) =>
    p.shape((s) => {
      s.move(x, y - 0.25 * wide);
      s.quad(x + len * 0.45, y - 1.5 * wide, x + len * 0.72, y - 0.7 * wide);
      s.quad(x + len * 0.85, y - 1.1 * wide, x + len, y + 0.5);
      s.quad(x + len * 0.86, y + 0.9, x + len * 0.74, y + 1.9 * wide);
      s.quad(x + len * 0.6, y + 1.1 * wide, x + len * 0.42, y + 1.7 * wide);
      s.quad(x + len * 0.2, y + 1.2 * wide, x, y + 0.45 * wide);
      s.close();
    }, paint);
  flame(8.4, 1.35, '#E53935');
  flame(6.8, 1.05, '#FB8C00');
  flame(4.8, 0.72, '#FFEB3B');
  flame(2.6, 0.4, '#FFFDE7');
  p.circle(x + 8.9, y - 1.3, 0.3, '#FFB74D');
  p.circle(x + 8.2, y + 3, 0.24, '#FF7043');
};

const galaxyGlasses: AccessoryDrawer = (p, a) => {
  const e = eyes(a);
  const r = e.half + 0.85;
  p.curve(
    [e.l + r - 0.2, e.y - 0.2],
    [(e.l + e.r) / 2, e.y - 0.8],
    [e.r - r + 0.2, e.y - 0.2],
    0.3,
    '#FFD54F'
  );
  for (const x of [e.l, e.r]) {
    p.glow(x, e.y, r + 1.1, '179, 136, 255', 0.45);
    p.circle(x, e.y, r, '#FFD54F');
    p.circle(
      x,
      e.y,
      r - 0.28,
      p.linear(x - r, e.y - r, x + r, e.y + r, '#311B92', '#3949AB', '#EC407A')
    );
    p.clip(
      (s) => s.ellipse(x, e.y, r - 0.28, r - 0.28),
      () => {
        p.ellipse(x + 0.2, e.y + 0.2, r * 1.05, 0.38, 'rgba(255,255,255,0.22)', -0.6);
        p.circle(x - 0.55, e.y - 0.55, 0.16, '#FFFFFF');
        p.circle(x + 0.6, e.y + 0.35, 0.12, '#FFFFFF');
        p.circle(x + 0.1, e.y + 0.8, 0.1, '#FFF59D');
        p.sparkle(x + 0.5, e.y - 0.65, 0.42, '#FFFFFF');
      }
    );
  }
  p.sparkle(e.r + r + 0.6, e.y - r - 0.3, 0.6, '#FFF59D');
};

export const FACE_EXTRA: Record<string, AccessoryDrawer> = {
  freckles,
  bandaid,
  catWhiskers,
  sleepMask,
  pacifier,
  swirlGlasses,
  cinemaGlasses,
  catEyeGlasses,
  starFacePaint,
  bubbleGum,
  tigerStripes,
  roseBite,
  sparkleEyes,
  cyberMonocle,
  masqueradeMask,
  rainbowCheeks,
  ledVisor,
  phantomMask,
  fireBreath,
  galaxyGlasses,
};
