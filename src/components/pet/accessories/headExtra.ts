import { eyes, foreheadHalfWidth, type AccessoryDrawer, type PathPen } from './pen';

const TAU = Math.PI * 2;

const bucketHat: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const w = a.headHalfWidth;
  p.ellipse(cx, ty + 0.9, w * 1.3, 1.15, '#5E8F5B');
  p.shape(
    (s) => {
      s.move(cx - w * 0.86, ty + 0.9);
      s.quad(cx - w * 0.8, ty - 2.9, cx - w * 0.5, ty - 3.1);
      s.to(cx + w * 0.5, ty - 3.1);
      s.quad(cx + w * 0.8, ty - 2.9, cx + w * 0.86, ty + 0.9);
      s.close();
    },
    p.linear(cx, ty - 3.1, cx, ty + 0.9, '#A5CFA0', '#7DAE79')
  );
  p.rect(cx - w * 0.84, ty - 0.5, w * 1.68, 0.8, '#F6E7BD');
  p.ellipse(cx, ty + 1.15, w * 1.3, 0.85, '#7DAE79');
  p.ellipse(cx - w * 0.4, ty - 2.2, 1, 0.4, 'rgba(255,255,255,0.3)', -0.2);
};

const bowHeadband: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const w = foreheadHalfWidth(a, 1.3);
  p.curve([cx - w, ty + 1.3], [cx, ty - 0.5], [cx + w, ty + 1.3], 0.6, '#D81B60');
  const by = ty - 0.7;
  for (const side of [-1, 1]) {
    p.ellipse(cx + side * 2, by, 2.2, 1.45, '#F06292', side * -0.4);
    p.ellipse(cx + side * 2.1, by + 0.1, 1.2, 0.7, '#EC407A', side * -0.4);
    p.ellipse(cx + side * 1.6, by - 0.6, 0.7, 0.3, 'rgba(255,255,255,0.45)', side * -0.4);
  }
  p.circle(cx, by + 0.1, 0.85, '#D81B60');
  p.circle(cx - 0.25, by - 0.15, 0.25, 'rgba(255,255,255,0.5)');
};

const earmuffs: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const w = a.headHalfWidth;
  const ey = a.eyeY + 0.4;
  p.arc(cx, ey, w * 1.02, Math.PI * 1.04, Math.PI * 1.96, 0.6, '#6D4C41');
  for (const side of [-1, 1]) {
    const x = cx + side * w * 1.02;
    for (let i = 0; i < 7; i++) {
      const ang = (i / 7) * TAU;
      p.circle(x + Math.cos(ang) * 1.15, ey + Math.sin(ang) * 1.3, 0.75, '#FFF8EC');
    }
    p.ellipse(x, ey, 1.35, 1.55, '#FFE0B2');
    p.ellipse(x - 0.3, ey - 0.5, 0.5, 0.6, 'rgba(255,255,255,0.6)');
  }
};

const paperCrown: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const w = a.headHalfWidth * 0.74;
  const base = ty + 0.6;
  const pts: [number, number][] = [[cx - w, base]];
  for (let i = 0; i <= 4; i++) {
    const x = cx - w + (i * w * 2) / 4;
    pts.push([x, base - 2.9 + (i % 2) * 0.35]);
    if (i < 4) pts.push([x + w / 4, base - 1.5]);
  }
  pts.push([cx + w, base]);
  p.poly(pts, p.linear(cx, base - 3, cx, base, '#FFE57F', '#FFC107'));
  p.rect(cx - w, base - 0.75, w * 2, 0.75, '#FFB300');
  const gems = ['#EF5350', '#42A5F5', '#66BB6A', '#AB47BC', '#EF5350'];
  gems.forEach((c, i) => p.circle(cx - w + (i * w * 2) / 4, base - 1.75, 0.34, c));
  p.line(
    [
      [cx - w * 0.5, base - 2.2],
      [cx - w * 0.5, base - 0.9],
    ],
    0.1,
    'rgba(160,110,0,0.35)'
  );
};

const daisyClip: AccessoryDrawer = (p, a) => {
  const x = a.headCenterX + a.headHalfWidth * 0.62;
  const y = a.headTopY + 1.3;
  p.ellipse(x - 1.6, y + 0.7, 1.1, 0.5, '#66BB6A', 0.5);
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU;
    p.ellipse(x + Math.cos(ang) * 1.15, y + Math.sin(ang) * 1.15, 0.85, 0.48, '#FFFFFF', ang);
  }
  p.circle(x, y, 0.75, '#FFCA28');
  p.circle(x - 0.2, y - 0.2, 0.25, '#FFE082');
};

const fez: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  p.poly(
    [
      [cx - 2.1, ty + 0.6],
      [cx + 2.1, ty + 0.6],
      [cx + 1.6, ty - 3.1],
      [cx - 1.6, ty - 3.1],
    ],
    p.linear(cx - 2, ty, cx + 2, ty, '#E53935', '#B71C1C')
  );
  p.ellipse(cx, ty - 3.1, 1.6, 0.45, '#D32F2F');
  p.ellipse(cx, ty + 0.6, 2.1, 0.5, '#9A1B1B');
  p.curve([cx, ty - 3.2], [cx + 2.6, ty - 3.6], [cx + 2.7, ty - 1.3], 0.2, '#212121');
  p.rect(cx + 2.4, ty - 1.4, 0.6, 1.5, '#212121', 0.2);
  p.circle(cx, ty - 3.2, 0.3, '#212121');
};

const sombrero: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const w = a.headHalfWidth * 1.55;
  p.ellipse(cx, ty + 0.8, w, 1.5, '#D9A441');
  p.ellipse(cx, ty + 0.55, w * 0.93, 1.15, '#F2D089');
  p.dome(cx, ty + 0.6, 2.7, 4.1, p.linear(cx - 2.7, ty, cx + 2.7, ty, '#F7DFA4', '#E0B45C'));
  p.rect(cx - 2.6, ty - 0.5, 5.2, 0.9, '#E53935');
  for (let i = 0; i < 5; i++) p.circle(cx - 2.1 + i * 1.05, ty - 0.05, 0.25, '#FFF59D');
  const trim = ['#EF5350', '#66BB6A', '#42A5F5'];
  for (let i = -3; i <= 3; i++) {
    p.circle(
      cx + (i * w * 0.9) / 3,
      ty + 1.6 + (1 - Math.abs(i) / 3) * 0.55,
      0.38,
      trim[(i + 3) % 3]
    );
  }
};

const bobbleHat: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const w = a.headHalfWidth;
  for (const side of [-1, 1]) {
    p.ellipse(cx + side * w * 0.95, ty + 2.2, 1.35, 2.3, '#2E6DA4');
    p.line(
      [
        [cx + side * w * 0.98, ty + 4.2],
        [cx + side * w * 1.02, ty + 6],
      ],
      0.22,
      '#FFFFFF'
    );
    p.circle(cx + side * w * 1.02, ty + 6.3, 0.6, '#FFFFFF');
  }
  p.dome(cx, ty + 0.9, w * 0.99, 3.6, p.linear(cx, ty - 2.7, cx, ty + 0.9, '#4A90D0', '#2E6DA4'));
  p.clip(
    (s) => s.ellipse(cx, ty + 0.9, w * 0.99, 3.6),
    () => {
      p.rect(cx - w, ty - 1.25, w * 2, 1.3, '#F5F5F5');
      for (let i = -6; i <= 6; i++) {
        p.box(cx + i * 0.95, ty - 0.6, 0.5, 0.5, Math.PI / 4, '#E53935');
      }
      p.rect(cx - w, ty - 2, w * 2, 0.28, '#BBDEFB');
    }
  );
  p.rect(cx - w * 0.99, ty + 0.3, w * 1.98, 0.75, '#1F5587');
  p.circle(cx, ty - 3.3, 1.35, '#FFFFFF');
  p.circle(cx + 0.35, ty - 3, 0.85, 'rgba(0,0,0,0.07)');
};

const sailorCap: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const w = a.headHalfWidth;
  p.line(
    [
      [cx + w * 0.55, ty + 0.3],
      [cx + w * 0.95, ty + 2.1],
    ],
    0.5,
    '#1A3A6E'
  );
  p.ellipse(cx, ty - 1.3, w * 0.98, 1.7, p.linear(cx, ty - 3, cx, ty + 0.4, '#FFFFFF', '#E3EAF2'));
  p.rect(cx - w * 0.74, ty - 0.5, w * 1.48, 1.15, '#1A3A6E', 0.3);
  p.rect(cx - w * 0.74, ty - 0.05, w * 1.48, 0.22, '#FFFFFF');
  p.circle(cx, ty - 1.6, 0.75, '#FFC107');
  p.line(
    [
      [cx, ty - 2],
      [cx, ty - 1.2],
    ],
    0.16,
    '#1A3A6E'
  );
  p.arc(cx, ty - 1.55, 0.38, 0.1 * Math.PI, 0.9 * Math.PI, 0.14, '#1A3A6E');
};

const flatCap: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const w = a.headHalfWidth;
  p.ellipse(cx - w * 0.78, ty + 0.9, 2.5, 0.65, '#5D4037', -0.1);
  p.shape(
    (s) => {
      s.move(cx - w * 1.02, ty + 1);
      s.quad(cx - w * 0.9, ty - 1.9, cx + w * 0.2, ty - 2.3);
      s.quad(cx + w * 1.05, ty - 2, cx + w * 1.02, ty + 1);
      s.close();
    },
    p.linear(cx, ty - 2.3, cx, ty + 1, '#A1887F', '#795548')
  );
  p.clip(
    (s) => {
      s.move(cx - w * 1.02, ty + 1);
      s.quad(cx - w * 0.9, ty - 1.9, cx + w * 0.2, ty - 2.3);
      s.quad(cx + w * 1.05, ty - 2, cx + w * 1.02, ty + 1);
      s.close();
    },
    () => {
      for (let i = -6; i <= 6; i++) {
        p.line(
          [
            [cx + i * 1.2 - 2, ty + 1.2],
            [cx + i * 1.2 + 2, ty - 2.6],
          ],
          0.12,
          'rgba(62,39,35,0.35)'
        );
        p.line(
          [
            [cx + i * 1.2 + 2, ty + 1.2],
            [cx + i * 1.2 - 2, ty - 2.6],
          ],
          0.12,
          'rgba(255,255,255,0.14)'
        );
      }
    }
  );
  p.circle(cx + 0.3, ty - 2.2, 0.4, '#5D4037');
};

const clapperHat: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  p.rect(cx - 3, ty - 2.5, 6, 3.1, '#263238', 0.3);
  p.rect(cx - 2.6, ty - 1.5, 5.2, 0.14, '#ECEFF1');
  p.rect(cx - 2.6, ty - 0.6, 5.2, 0.14, '#ECEFF1');
  p.rect(cx - 0.9, ty - 1.5, 0.14, 1.9, '#ECEFF1');
  const ang = -0.28;
  const px = cx - 3;
  const py = ty - 2.6;
  const at = (d: number, h: number): [number, number] => [
    px + d * Math.cos(ang) - h * Math.sin(ang),
    py + d * Math.sin(ang) + h * Math.cos(ang),
  ];
  p.poly([at(0, 0), at(6.2, 0), at(6.2, -1.15), at(0, -1.15)], '#263238');
  for (let i = 0; i < 4; i++) {
    p.poly(
      [
        at(0.5 + i * 1.5, 0),
        at(1.2 + i * 1.5, 0),
        at(1.8 + i * 1.5, -1.15),
        at(1.1 + i * 1.5, -1.15),
      ],
      '#ECEFF1'
    );
  }
  p.circle(px + 0.1, py, 0.35, '#FFC107');
};

const pineappleHat: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const cy = ty - 1.7;
  for (let i = -2; i <= 2; i++) {
    p.poly(
      [
        [cx + i * 0.55 - 0.55, cy - 2.4],
        [cx + i * 0.55 + 0.55, cy - 2.4],
        [cx + i * 1.25, cy - 5.2 + Math.abs(i) * 0.7],
      ],
      i % 2 === 0 ? '#43A047' : '#66BB6A'
    );
  }
  p.ellipse(cx, cy, 2.7, 3, p.radial(cx - 0.8, cy - 1, 3.4, '#FFE082', '#FFB300'));
  p.clip(
    (s) => s.ellipse(cx, cy, 2.7, 3),
    () => {
      for (let i = -4; i <= 4; i++) {
        p.line(
          [
            [cx + i * 1.1 - 3, cy + 3],
            [cx + i * 1.1 + 3, cy - 3],
          ],
          0.14,
          'rgba(191,107,0,0.6)'
        );
        p.line(
          [
            [cx + i * 1.1 + 3, cy + 3],
            [cx + i * 1.1 - 3, cy - 3],
          ],
          0.14,
          'rgba(191,107,0,0.6)'
        );
      }
    }
  );
};

const gamerHeadset: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const w = a.headHalfWidth;
  const ey = a.eyeY + 0.5;
  p.arc(cx, ey, w * 1.02, Math.PI * 1.03, Math.PI * 1.97, 0.75, '#263238');
  p.arc(cx, ey, w * 1.02, Math.PI * 1.35, Math.PI * 1.65, 0.3, '#00E5FF');
  for (const side of [-1, 1]) {
    const x = cx + side * w * 1.02;
    p.rect(x - 0.95, ey - 1.5, 1.9, 3, '#263238', 0.7);
    p.rect(x - 0.55, ey - 1.05, 1.1, 2.1, side < 0 ? '#00E5FF' : '#FF4081', 0.45);
    p.rect(x - 0.25, ey - 0.7, 0.5, 1.4, '#263238', 0.2);
  }
  p.curve(
    [cx - w * 1.02, ey + 1.2],
    [cx - w * 1.05, a.mouthY + 0.6],
    [cx - 2.4, a.mouthY + 0.1],
    0.26,
    '#37474F'
  );
  p.circle(cx - 2.3, a.mouthY + 0.1, 0.5, '#111');
  p.circle(cx - 2.45, a.mouthY - 0.05, 0.16, '#00E5FF');
};

const sakuraBranch: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const w = a.headHalfWidth;
  p.curve([cx - 1.2, ty + 0.9], [cx + 1.6, ty - 0.2], [cx + w * 0.98, ty - 2], 0.42, '#6D4C41');
  p.curve([cx + 1.6, ty + 0.05], [cx + 2, ty - 1.4], [cx + 1.3, ty - 2.3], 0.26, '#6D4C41');
  const bloom = (x: number, y: number, r: number) => {
    for (let i = 0; i < 5; i++) {
      const ang = (i / 5) * TAU - Math.PI / 2;
      p.circle(x + Math.cos(ang) * r * 0.62, y + Math.sin(ang) * r * 0.62, r * 0.52, '#F8BBD0');
    }
    p.circle(x, y, r * 0.34, '#EC407A');
  };
  bloom(cx - 0.4, ty + 0.3, 1.45);
  bloom(cx + 1.3, ty - 2.4, 1.15);
  bloom(cx + w * 0.92, ty - 1.9, 1.3);
  p.ellipse(cx + 2.9, ty - 0.2, 0.75, 0.35, '#81C784', -0.5);
  p.ellipse(cx - 2.6, ty + 1.9, 0.42, 0.26, '#F8BBD0', 0.6);
};

const knightHelmet: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const w = a.headHalfWidth * 1.05;
  const e = eyes(a);
  const steel = p.linear(cx - w, ty, cx + w, ty, '#ECEFF1', '#B0BEC5', '#78909C');
  for (let i = 0; i < 5; i++) {
    p.ellipse(cx + 0.6 + i * 0.75, ty - 3.6 + i * 0.55, 1.2, 1.5 - i * 0.12, '#E53935', 0.5);
  }
  for (const side of [-1, 1]) {
    p.poly(
      [
        [cx + side * w, ty + 1.6],
        [cx + side * (w - 1.5), ty + 1.6],
        [cx + side * (w - 1.2), e.y + 1.6],
        [cx + side * (w - 0.2), e.y + 2.6],
        [cx + side * (w + 0.1), e.y + 1],
      ],
      steel
    );
  }
  p.dome(cx, ty + 2, w, 4.6, steel);
  p.rect(cx - w, ty + 1.5, w * 2, 0.7, '#FFC107', 0.2);
  p.rect(cx - 0.3, ty - 2.3, 0.6, 3.9, '#90A4AE');
  p.poly(
    [
      [cx - 0.4, ty + 2.1],
      [cx + 0.4, ty + 2.1],
      [cx + 0.25, e.y - 0.7],
      [cx - 0.25, e.y - 0.7],
    ],
    '#B0BEC5'
  );
  p.ellipse(cx - w * 0.45, ty - 0.8, 0.9, 0.45, 'rgba(255,255,255,0.55)', -0.4);
  for (const side of [-1, 1]) p.circle(cx + side * (w - 0.75), ty + 1.85, 0.2, '#8D6E00');
};

const pharaohCrown: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const w = a.headHalfWidth;
  const bottom = a.neckY + 0.4;
  const outline = (s: PathPen) => {
    s.move(cx - w * 1.02, ty + 1.9);
    s.quad(cx - w * 0.9, ty - 1.9, cx, ty - 2.1);
    s.quad(cx + w * 0.9, ty - 1.9, cx + w * 1.02, ty + 1.9);
    s.to(cx + w * 1.5, bottom);
    s.to(cx + w * 0.82, bottom);
    s.to(cx + w * 0.9, ty + 2.7);
    s.quad(cx, ty + 0.6, cx - w * 0.9, ty + 2.7);
    s.to(cx - w * 0.82, bottom);
    s.to(cx - w * 1.5, bottom);
    s.close();
  };
  p.shape(outline, '#FFC107');
  p.clip(outline, () => {
    for (let y = ty - 2.2; y < bottom + 1; y += 1.25)
      p.rect(cx - w * 1.6, y, w * 3.2, 0.6, '#1E5AA8');
  });
  p.curve([cx - w * 0.92, ty + 2.6], [cx, ty + 0.5], [cx + w * 0.92, ty + 2.6], 0.5, '#FFD54F');
  p.ellipse(cx, ty + 0.6, 0.6, 1.2, '#FFD54F');
  p.circle(cx, ty - 0.3, 0.55, '#FFD54F');
  p.circle(cx, ty - 0.35, 0.22, '#E53935');
};

const ufoHat: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const sy = ty - 3.2;
  p.poly(
    [
      [cx - 1.6, sy + 0.5],
      [cx + 1.6, sy + 0.5],
      [cx + 3.3, ty + 1.4],
      [cx - 3.3, ty + 1.4],
    ],
    p.linear(cx, sy, cx, ty + 1.4, 'rgba(178,255,89,0.6)', 'rgba(178,255,89,0)')
  );
  p.dome(cx, sy - 0.2, 2, 1.9, p.linear(cx, sy - 2.1, cx, sy, '#B3E5FC', '#4FC3F7'));
  p.ellipse(cx - 0.7, sy - 1.2, 0.5, 0.3, 'rgba(255,255,255,0.7)', -0.5);
  p.ellipse(cx, sy, 4.3, 1.15, p.linear(cx, sy - 1.2, cx, sy + 1.2, '#ECEFF1', '#78909C'));
  p.ellipse(cx, sy - 0.25, 3.2, 0.55, 'rgba(255,255,255,0.35)');
  const lights = ['#FFEB3B', '#FF4081', '#00E5FF', '#FF4081', '#FFEB3B'];
  lights.forEach((c, i) => p.circle(cx - 3 + i * 1.5, sy + 0.4 - Math.abs(i - 2) * 0.16, 0.3, c));
};

const stormCloud: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const cy = ty - 2.6;
  p.poly(
    [
      [cx + 0.6, cy + 0.9],
      [cx - 0.9, cy + 2.7],
      [cx + 0.1, cy + 2.7],
      [cx - 0.7, cy + 4.6],
      [cx + 1.5, cy + 2.1],
      [cx + 0.5, cy + 2.1],
      [cx + 1.3, cy + 0.9],
    ],
    '#FFEB3B'
  );
  for (const [dx, dy] of [
    [-2.6, 2.1],
    [2.9, 2.3],
    [-3.6, 3.3],
  ]) {
    p.ellipse(cx + dx, cy + dy, 0.25, 0.5, '#64B5F6', 0.25);
  }
  const puffs: [number, number, number][] = [
    [-2.7, 0.5, 1.5],
    [-1, -0.5, 1.9],
    [1.1, -0.7, 2],
    [2.8, 0.4, 1.5],
    [0, 0.7, 1.7],
  ];
  for (const [dx, dy, r] of puffs) p.circle(cx + dx, cy + dy, r, '#607D8B');
  for (const [dx, dy, r] of puffs) p.circle(cx + dx - 0.2, cy + dy - 0.35, r * 0.78, '#90A4AE');
  p.ellipse(cx - 1.2, cy - 1.2, 1.1, 0.5, 'rgba(255,255,255,0.3)', -0.2);
};

const sunCrown: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ty = a.headTopY;
  const cy = ty - 2.1;
  p.glow(cx, cy, 6.2, '255, 213, 79', 0.5);
  for (let i = 0; i < 12; i++) {
    const ang = (i / 12) * TAU;
    const len = i % 2 === 0 ? 4.5 : 3.6;
    p.poly(
      [
        [cx + Math.cos(ang - 0.17) * 2.3, cy + Math.sin(ang - 0.17) * 2.3],
        [cx + Math.cos(ang + 0.17) * 2.3, cy + Math.sin(ang + 0.17) * 2.3],
        [cx + Math.cos(ang) * len, cy + Math.sin(ang) * len],
      ],
      i % 2 === 0 ? '#FFB300' : '#FFD54F'
    );
  }
  p.circle(cx, cy, 2.5, p.radial(cx - 0.7, cy - 0.8, 3, '#FFF9C4', '#FFC107'));
  p.arc(cx, cy, 1.6, Math.PI * 1.1, Math.PI * 1.6, 0.22, 'rgba(255,255,255,0.7)');
  p.rect(cx - 2.6, ty + 0.2, 5.2, 0.7, '#FF8F00', 0.3);
  p.circle(cx, ty + 0.55, 0.42, '#E53935');
};

const saturnRingBack: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const y = a.headTopY + 1.5;
  const rx = a.headHalfWidth * 1.5;
  p.ring(cx, y, rx, 1.9, -0.2, Math.PI, TAU, 1.35, '#C9A66B');
  p.ring(cx, y, rx, 1.9, -0.2, Math.PI, TAU, 0.4, '#8D6E63');
};

const saturnRing: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const y = a.headTopY + 1.5;
  const rx = a.headHalfWidth * 1.5;
  p.ring(cx, y, rx, 1.9, -0.2, 0, Math.PI, 1.35, '#F0CF9A');
  p.ring(cx, y, rx, 1.9, -0.2, 0, Math.PI, 0.4, '#B98A5E');
  p.ring(cx, y - 0.35, rx, 1.9, -0.2, 0.3, Math.PI - 0.3, 0.18, 'rgba(255,255,255,0.7)');
  const mx = cx + Math.cos(-0.2) * rx;
  const my = y + Math.sin(-0.2) * rx;
  p.glow(mx, my, 2.6, '179, 229, 252', 0.6);
  p.circle(mx, my, 1.25, p.radial(mx - 0.4, my - 0.4, 1.6, '#E1F5FE', '#4FC3F7'));
  p.sparkle(cx - rx * 0.8, y - 1.6, 0.7, '#FFF59D');
  p.sparkle(cx + rx * 0.35, y - 3, 0.5, '#FFFFFF');
};

export const HEAD_EXTRA: Record<string, AccessoryDrawer> = {
  bucketHat,
  bowHeadband,
  earmuffs,
  paperCrown,
  daisyClip,
  fez,
  sombrero,
  bobbleHat,
  sailorCap,
  flatCap,
  clapperHat,
  pineappleHat,
  gamerHeadset,
  sakuraBranch,
  knightHelmet,
  pharaohCrown,
  ufoHat,
  stormCloud,
  sunCrown,
  saturnRing,
};

export const HEAD_EXTRA_BACK: Record<string, AccessoryDrawer> = {
  saturnRing: saturnRingBack,
};
