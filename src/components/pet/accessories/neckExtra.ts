import { onTorso, type AccessoryDrawer, type PathPen } from './pen';

const TAU = Math.PI * 2;

const bibNapkin: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const w = a.neckHalfWidth * 0.82;
  const bib = (s: PathPen) => {
    s.move(cx - w, ny - 0.3);
    s.quad(cx, ny + 0.9, cx + w, ny - 0.3);
    s.quad(cx + w + 0.5, ny + 3.6, cx, ny + 4);
    s.quad(cx - w - 0.5, ny + 3.6, cx - w, ny - 0.3);
    s.close();
  };
  p.shape(bib, '#EF5350');
  p.shape((s) => {
    s.move(cx - w + 0.35, ny + 0.15);
    s.quad(cx, ny + 1.2, cx + w - 0.35, ny + 0.15);
    s.quad(cx + w, ny + 3.3, cx, ny + 3.6);
    s.quad(cx - w, ny + 3.3, cx - w + 0.35, ny + 0.15);
    s.close();
  }, '#FFFFFF');
  p.heart(cx, ny + 2.3, 0.75, '#EF5350');
};

const nameTag: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const w = a.neckHalfWidth;
  p.rect(
    cx - w,
    ny - 0.4,
    w * 2,
    1,
    p.linear(cx, ny - 0.4, cx, ny + 0.6, '#64B5F6', '#1E88E5'),
    0.4
  );
  p.rect(cx - w, ny - 0.2, w * 2, 0.2, 'rgba(255,255,255,0.35)');
  p.circle(cx, ny + 0.75, 0.3, '#B0BEC5');
  const ty = ny + 2;
  p.circle(cx - 0.9, ty - 0.35, 0.55, '#FFC107');
  p.circle(cx - 0.9, ty + 0.35, 0.55, '#FFC107');
  p.circle(cx + 0.9, ty - 0.35, 0.55, '#FFC107');
  p.circle(cx + 0.9, ty + 0.35, 0.55, '#FFC107');
  p.rect(cx - 0.95, ty - 0.45, 1.9, 0.9, '#FFC107');
  p.rect(cx - 0.7, ty - 0.12, 1.4, 0.2, '#B37400');
  p.circle(cx - 1.05, ty - 0.5, 0.18, '#FFF3C4');
};

const beadNecklace: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const w = a.neckHalfWidth;
  const colors = ['#EF5350', '#FFCA28', '#66BB6A', '#42A5F5', '#AB47BC'];
  p.curve([cx - w, ny - 0.3], [cx, ny + 3.1], [cx + w, ny - 0.3], 0.14, '#6D4C41');
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const x = cx - w + t * w * 2;
    const y = ny - 0.3 + 4 * t * (1 - t) * 1.7;
    p.circle(x, y, 0.58, colors[i % 5]);
    p.circle(x - 0.17, y - 0.17, 0.18, 'rgba(255,255,255,0.55)');
  }
};

const balloon: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const bx = cx + a.headHalfWidth + 3.4;
  const by = a.headTopY + 2.2;
  p.curve(
    [cx + a.neckHalfWidth * 0.7, a.neckY + 0.4],
    [bx - 2.6, a.neckY - 1.5],
    [bx, by + 3.1],
    0.2,
    '#F5F5F5'
  );
  p.rect(cx - a.neckHalfWidth, a.neckY - 0.3, a.neckHalfWidth * 2, 0.65, '#F5F5F5', 0.3);
  p.circle(cx + a.neckHalfWidth * 0.7, a.neckY + 0.2, 0.4, '#E53935');
  p.poly(
    [
      [bx - 0.42, by + 3.3],
      [bx + 0.42, by + 3.3],
      [bx, by + 2.6],
    ],
    '#C62828'
  );
  p.ellipse(bx, by, 2.35, 2.85, p.radial(bx - 0.7, by - 0.9, 3.4, '#FF8A80', '#E53935'));
  p.ellipse(bx - 0.85, by - 1.1, 0.5, 0.85, 'rgba(255,255,255,0.6)', 0.5);
};

const stripedSweater: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  onTorso(p, a, () => {
    p.rect(0, ny - 1, 32, 12, '#E53935');
    for (let y = ny + 0.7; y < ny + 9; y += 1.5) p.rect(0, y, 32, 0.65, '#FFF8E1');
    p.ellipse(
      cx + a.cloak.bodyRx * 0.5,
      a.cloak.bodyCY,
      a.cloak.bodyRx * 0.5,
      a.cloak.bodyRy,
      'rgba(0,0,0,0.1)'
    );
  });
  p.rect(cx - a.neckHalfWidth * 0.95, ny - 0.5, a.neckHalfWidth * 1.9, 0.95, '#B71C1C', 0.45);
  for (let i = -3; i <= 3; i++) {
    p.rect(cx + i * a.neckHalfWidth * 0.26 - 0.06, ny - 0.4, 0.12, 0.75, 'rgba(255,255,255,0.25)');
  }
};

const fannyPack: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const { y, hw } = a.waist;
  p.rect(cx - hw, y - 0.4, hw * 2, 0.8, '#37474F', 0.3);
  p.rect(
    cx - 2.2,
    y - 1.1,
    4.4,
    2.5,
    p.linear(cx, y - 1.1, cx, y + 1.4, '#4DB6AC', '#00897B'),
    0.95
  );
  p.rect(cx - 1.7, y - 0.35, 3.4, 0.2, '#004D40');
  p.rect(cx + 1.1, y - 0.5, 0.5, 0.5, '#FFC107', 0.1);
  p.ellipse(cx - 0.9, y - 0.75, 0.9, 0.22, 'rgba(255,255,255,0.35)');
};

const hawaiiShirt: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  onTorso(p, a, () => {
    p.rect(0, ny - 1, 32, 12, '#29B6F6');
    const blooms: [number, number, string][] = [
      [-3.2, 1.6, '#FFFFFF'],
      [2.6, 1.2, '#FFEB3B'],
      [-1, 3.6, '#FF7043'],
      [3.7, 3.8, '#FFFFFF'],
      [-3.8, 4.8, '#FFEB3B'],
      [1.4, 5.6, '#FFFFFF'],
    ];
    for (const [dx, dy, c] of blooms) {
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * TAU;
        p.circle(cx + dx + Math.cos(ang) * 0.5, ny + dy + Math.sin(ang) * 0.5, 0.42, c);
      }
      p.circle(cx + dx, ny + dy, 0.26, '#E65100');
    }
    p.ellipse(cx + 0.9, ny + 2.6, 0.75, 0.3, '#2E7D32', 0.7);
    p.ellipse(cx - 2.3, ny + 2.9, 0.75, 0.3, '#2E7D32', -0.6);
    p.rect(cx - 0.08, ny, 0.16, 9, 'rgba(1,87,155,0.5)');
    for (let i = 0; i < 3; i++) p.circle(cx, ny + 1.9 + i * 1.5, 0.22, '#FFF8E1');
  });
  for (const side of [-1, 1]) {
    p.poly(
      [
        [cx, ny + 1.2],
        [cx + side * a.neckHalfWidth * 0.92, ny - 0.55],
        [cx + side * a.neckHalfWidth * 0.5, ny + 1.9],
      ],
      '#4FC3F7'
    );
  }
};

const lifeVest: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  onTorso(p, a, () => {
    p.rect(0, ny - 1, 32, 12, p.linear(cx - 5, ny, cx + 5, ny, '#FF8A65', '#F4511E'));
    p.rect(cx - 0.35, ny - 1, 0.7, 12, '#BF360C');
    for (const dy of [1.9, 4.1]) {
      p.rect(0, ny + dy, 32, 0.75, '#ECEFF1');
      p.rect(cx - 0.75, ny + dy - 0.2, 1.5, 1.15, '#263238', 0.2);
    }
  });
  p.curve(
    [cx - a.neckHalfWidth * 0.95, ny - 0.1],
    [cx, ny + 1.6],
    [cx + a.neckHalfWidth * 0.95, ny - 0.1],
    1.1,
    '#FF7043'
  );
  p.curve(
    [cx - a.neckHalfWidth * 0.8, ny - 0.25],
    [cx, ny + 1.2],
    [cx + a.neckHalfWidth * 0.8, ny - 0.25],
    0.25,
    'rgba(255,255,255,0.4)'
  );
};

const cameraStrap: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const w = a.neckHalfWidth;
  const cy = ny + 2.9;
  p.line(
    [
      [cx - w * 0.9, ny - 0.3],
      [cx - 1.4, cy - 0.9],
    ],
    0.42,
    '#5D4037'
  );
  p.line(
    [
      [cx + w * 0.9, ny - 0.3],
      [cx + 1.4, cy - 0.9],
    ],
    0.42,
    '#5D4037'
  );
  p.rect(cx - 0.9, cy - 1.75, 1.5, 0.7, '#263238', 0.2);
  p.rect(
    cx - 2.1,
    cy - 1.25,
    4.2,
    2.6,
    p.linear(cx, cy - 1.25, cx, cy + 1.35, '#546E7A', '#37474F'),
    0.5
  );
  p.rect(cx - 2.1, cy - 0.55, 4.2, 0.3, '#263238');
  p.circle(cx, cy + 0.2, 1.05, '#ECEFF1');
  p.circle(cx, cy + 0.2, 0.8, p.radial(cx - 0.25, cy - 0.05, 0.9, '#81D4FA', '#0D47A1'));
  p.circle(cx - 0.28, cy - 0.08, 0.2, 'rgba(255,255,255,0.8)');
  p.circle(cx + 1.5, cy - 0.85, 0.2, '#FF1744');
};

const ticketNecklace: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const w = a.neckHalfWidth;
  p.curve([cx - w * 0.92, ny - 0.3], [cx, ny + 2.6], [cx + w * 0.92, ny - 0.3], 0.18, '#FFD54F');
  const y = ny + 2.5;
  p.box(cx, y, 4, 1.9, -0.12, '#F9A825');
  p.box(cx, y, 3.6, 1.5, -0.12, '#FFE082');
  p.box(cx - 0.95, y + 0.12, 0.1, 1.5, -0.12, '#F9A825');
  p.star(cx + 0.55, y - 0.08, 0.6, '#EF5350');
  p.circle(cx - 1.95, y + 0.24, 0.3, '#F9A825');
  p.circle(cx + 1.95, y - 0.24, 0.3, '#F9A825');
};

const spikedCollar: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const w = a.neckHalfWidth;
  p.rect(cx - w, ny - 0.5, w * 2, 1.25, '#212121', 0.45);
  p.rect(cx - w, ny - 0.3, w * 2, 0.2, 'rgba(255,255,255,0.15)');
  for (let i = -2; i <= 2; i++) {
    const x = cx + (i * w * 0.82) / 2;
    p.poly(
      [
        [x - 0.62, ny + 0.35],
        [x + 0.62, ny + 0.35],
        [x, ny + 2.3],
      ],
      p.linear(x - 0.6, ny, x + 0.6, ny, '#FFFFFF', '#90A4AE')
    );
    p.circle(x, ny + 0.1, 0.36, '#ECEFF1');
  }
};

const tuxedo: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const w = a.neckHalfWidth;
  onTorso(p, a, () => {
    p.rect(0, ny - 1, 32, 12, '#1B1B1F');
    p.poly(
      [
        [cx - w * 0.62, ny - 0.5],
        [cx + w * 0.62, ny - 0.5],
        [cx, ny + 6.4],
      ],
      '#FAFAFA'
    );
    for (const side of [-1, 1]) {
      p.poly(
        [
          [cx + side * w * 0.62, ny - 0.5],
          [cx + side * w * 1.05, ny - 0.5],
          [cx + side * 0.25, ny + 5.6],
        ],
        '#3A3A42'
      );
    }
    for (let i = 0; i < 3; i++) p.circle(cx, ny + 2.4 + i * 1.15, 0.2, '#212121');
    p.ellipse(
      cx + a.cloak.bodyRx * 0.55,
      a.cloak.bodyCY,
      a.cloak.bodyRx * 0.4,
      a.cloak.bodyRy,
      'rgba(255,255,255,0.05)'
    );
  });
  for (const side of [-1, 1]) {
    p.poly(
      [
        [cx, ny + 0.45],
        [cx + side * 1.75, ny - 0.5],
        [cx + side * 1.75, ny + 1.4],
      ],
      '#C62828'
    );
  }
  p.circle(cx, ny + 0.45, 0.48, '#8E0000');
};

const featherBoa: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const w = a.neckHalfWidth * 1.08;
  const tones = ['#F48FB1', '#F06292', '#FCE4EC', '#EC407A'];
  const puffs: [number, number, number][] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    puffs.push([cx - w + t * w * 2, ny - 0.1 + 4 * t * (1 - t) * 1.25, 0.95 + (i % 2) * 0.18]);
  }
  for (let i = 0; i < 5; i++)
    puffs.push([cx + w * 0.72 + (i % 2) * 0.35, ny + 1 + i * 0.85, 0.9 - i * 0.07]);
  puffs.forEach(([x, y, r], i) => p.circle(x, y, r, tones[i % 4]));
  puffs.forEach(([x, y, r], i) => {
    if (i % 2 === 0) p.circle(x - r * 0.3, y - r * 0.3, r * 0.4, 'rgba(255,255,255,0.45)');
  });
};

const butterflyWingsBack: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const { bodyRx } = a.cloak;
  const y = a.neckY + 1.6;
  for (const side of [-1, 1]) {
    const x = cx + side * (bodyRx + 2.6);
    p.ellipse(x - side * 0.4, y + 3, 2.7, 2.3, '#4A148C', side * 0.5);
    p.ellipse(
      x - side * 0.4,
      y + 3,
      2.1,
      1.75,
      p.radial(x, y + 3, 2.6, '#FFCC80', '#FF7043'),
      side * 0.5
    );
    p.ellipse(x + side * 0.5, y - 1.2, 4, 3.3, '#4A148C', side * -0.5);
    p.ellipse(
      x + side * 0.5,
      y - 1.2,
      3.35,
      2.7,
      p.radial(x - side * 1.4, y - 0.6, 4.4, '#FFE082', '#FF8A65', '#EC407A'),
      side * -0.5
    );
    p.circle(x + side * 2, y - 2.6, 0.45, '#FFFFFF');
    p.circle(x + side * 2.9, y - 1.3, 0.3, '#FFFFFF');
    p.circle(x + side * 0.3, y + 3.6, 0.32, '#FFFFFF');
    p.line(
      [
        [cx + side * bodyRx * 0.5, y],
        [x + side * 2.2, y - 2.2],
      ],
      0.14,
      'rgba(74,20,140,0.55)'
    );
  }
};

const butterflyWings: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  p.curve(
    [cx - a.neckHalfWidth * 0.9, ny - 0.2],
    [cx, ny + 1.1],
    [cx + a.neckHalfWidth * 0.9, ny - 0.2],
    0.3,
    '#7B1FA2'
  );
  p.circle(cx, ny + 0.55, 0.42, '#FFD54F');
};

const duckFloatBack: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const { y, hw } = a.waist;
  p.ellipse(cx, y, hw + 2.2, 2.7, '#F9A825');
};

const duckFloat: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const { y, hw } = a.waist;
  const r = hw + 2.2;
  const band = (s: PathPen) => {
    s.move(cx - r, y);
    s.bezier(cx - r, y + 4.3, cx + r, y + 4.3, cx + r, y);
    s.bezier(cx + r * 0.8, y + 1.1, cx - r * 0.8, y + 1.1, cx - r, y);
    s.close();
  };
  p.shape(band, p.linear(cx, y, cx, y + 3.3, '#FFF176', '#FBC02D'));
  p.clip(band, () => {
    for (const i of [-1, 1]) p.box(cx + i * r * 0.5, y + 2, 1.3, 4, i * -0.3, '#FF8A65');
    p.box(cx, y + 2, 1.3, 4, 0, '#FF8A65');
    p.curve(
      [cx - r * 0.8, y + 1.5],
      [cx, y + 2.9],
      [cx + r * 0.8, y + 1.5],
      0.3,
      'rgba(255,255,255,0.55)'
    );
  });
  const dx = cx - r * 0.8;
  const dy = y - 1.2;
  p.ellipse(dx + 0.2, dy + 1.2, 1.1, 1.2, '#FFEE58');
  p.circle(dx, dy, 1.4, p.radial(dx - 0.4, dy - 0.4, 1.8, '#FFF59D', '#FDD835'));
  p.ellipse(dx - 1.45, dy + 0.3, 0.85, 0.42, '#FB8C00');
  p.circle(dx - 0.35, dy - 0.3, 0.26, '#212121');
  p.circle(dx - 0.42, dy - 0.38, 0.09, '#FFFFFF');
};

const angelWingsBack: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const { bodyRx } = a.cloak;
  const y = a.neckY + 1.4;
  for (const side of [-1, 1]) {
    const x = cx + side * bodyRx * 0.75;
    for (let i = 0; i < 5; i++) {
      p.ellipse(
        x + side * (3.5 - i * 0.35),
        y - 2.7 + i * 1.45,
        4.2 - i * 0.6,
        1.15,
        i % 2 === 0 ? '#FFFFFF' : '#E8F1FF',
        side * (-0.75 + i * 0.3)
      );
    }
    p.ellipse(x + side * 1.5, y - 0.6, 1.9, 2.5, '#FFFFFF', side * -0.35);
    p.ellipse(x + side * 1.2, y, 1.1, 1.6, '#DCE8FA', side * -0.35);
  }
};

const angelWings: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  p.curve(
    [cx - a.neckHalfWidth * 0.9, ny - 0.2],
    [cx, ny + 1.1],
    [cx + a.neckHalfWidth * 0.9, ny - 0.2],
    0.28,
    '#FFD54F'
  );
  p.sparkle(cx, ny + 0.9, 0.75, '#FFF59D');
};

const knightArmor: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const w = a.neckHalfWidth;
  onTorso(p, a, () => {
    p.rect(0, ny - 1, 32, 12, p.linear(cx - 5, ny, cx + 5, ny, '#ECEFF1', '#B0BEC5', '#78909C'));
    p.curve([cx - 5.5, ny + 4.6], [cx, ny + 6.6], [cx + 5.5, ny + 4.6], 0.3, '#607D8B');
    p.line(
      [
        [cx, ny],
        [cx, ny + 8],
      ],
      0.18,
      'rgba(69,90,100,0.6)'
    );
    p.ellipse(cx - 2.2, ny + 1.6, 1.3, 0.55, 'rgba(255,255,255,0.55)', -0.4);
  });
  p.shape((s) => {
    s.move(cx - 1.35, ny + 1.3);
    s.to(cx + 1.35, ny + 1.3);
    s.quad(cx + 1.4, ny + 3.6, cx, ny + 4.4);
    s.quad(cx - 1.4, ny + 3.6, cx - 1.35, ny + 1.3);
    s.close();
  }, '#1E5AA8');
  p.star(cx, ny + 2.6, 0.78, '#FFD54F');
  for (const side of [-1, 1]) {
    p.ellipse(
      cx + side * (w + 0.5),
      ny + 0.7,
      1.75,
      1.35,
      p.linear(cx + side * w, ny - 0.6, cx + side * w, ny + 2, '#ECEFF1', '#90A4AE')
    );
    p.arc(
      cx + side * (w + 0.5),
      ny + 0.7,
      1.55,
      side < 0 ? Math.PI * 0.6 : Math.PI * 0.05,
      side < 0 ? Math.PI * 0.95 : Math.PI * 0.4,
      0.22,
      '#FFC107'
    );
  }
  p.rect(cx - w * 0.92, ny - 0.5, w * 1.84, 0.95, '#90A4AE', 0.4);
  p.rect(cx - w * 0.92, ny - 0.5, w * 1.84, 0.26, '#FFC107', 0.13);
};

const lanternNecklace: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const w = a.neckHalfWidth;
  const cy = ny + 2.9;
  p.line(
    [
      [cx - w * 0.9, ny - 0.3],
      [cx, cy - 1.7],
      [cx + w * 0.9, ny - 0.3],
    ],
    0.16,
    '#5D4037'
  );
  p.glow(cx, cy, 3.6, '255, 202, 40', 0.55);
  p.arc(cx, cy - 1.5, 0.5, Math.PI, TAU, 0.18, '#3E2723');
  p.rect(cx - 1.2, cy - 1.45, 2.4, 0.5, '#3E2723', 0.15);
  p.rect(cx - 1, cy - 1, 2, 2, p.radial(cx, cy, 1.5, '#FFFDE7', '#FFCA28', '#FB8C00'), 0.3);
  p.rect(cx - 1.2, cy + 0.95, 2.4, 0.5, '#3E2723', 0.15);
  p.rect(cx - 0.07, cy - 1, 0.14, 2, '#3E2723');
  p.ellipse(cx, cy + 0.1, 0.34, 0.55, '#FFFFFF');
};

const jetpackBack: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const { bodyRx, bodyCY } = a.cloak;
  const top = a.neckY - 0.8;
  const h = bodyCY + 1.4 - top;
  for (const side of [-1, 1]) {
    const x = cx + side * (bodyRx + 0.9);
    p.glow(x, top + h + 2.2, 2.6, '255, 152, 0', 0.6);
    p.shape((s) => {
      s.move(x - 0.95, top + h + 0.5);
      s.quad(x - 1.2, top + h + 2.6, x, top + h + 4.4);
      s.quad(x + 1.2, top + h + 2.6, x + 0.95, top + h + 0.5);
      s.close();
    }, '#FF7043');
    p.shape((s) => {
      s.move(x - 0.55, top + h + 0.5);
      s.quad(x - 0.7, top + h + 1.9, x, top + h + 3.1);
      s.quad(x + 0.7, top + h + 1.9, x + 0.55, top + h + 0.5);
      s.close();
    }, '#FFEB3B');
    p.poly(
      [
        [x - 0.85, top + h - 0.2],
        [x + 0.85, top + h - 0.2],
        [x + 1.15, top + h + 0.7],
        [x - 1.15, top + h + 0.7],
      ],
      '#455A64'
    );
    p.dome(x, top + 0.9, 1.25, 1.7, '#E53935');
    p.rect(
      x - 1.25,
      top + 0.8,
      2.5,
      h - 0.9,
      p.linear(x - 1.25, top, x + 1.25, top, '#ECEFF1', '#90A4AE'),
      0.3
    );
    p.rect(x - 1.25, top + 1.9, 2.5, 0.45, '#E53935');
    p.rect(x - 0.75, top + 1, 0.3, h - 1.6, 'rgba(255,255,255,0.6)', 0.15);
  }
};

const jetpack: AccessoryDrawer = (p, a) => {
  const cx = a.headCenterX;
  const ny = a.neckY;
  const w = a.neckHalfWidth;
  for (const side of [-1, 1]) {
    p.line(
      [
        [cx + side * w * 0.95, ny - 0.3],
        [cx + side * 0.6, ny + 2.6],
      ],
      0.5,
      '#37474F'
    );
  }
  p.rect(cx - 0.95, ny + 2, 1.9, 1.3, '#E53935', 0.3);
  p.circle(cx, ny + 2.65, 0.32, '#FFEB3B');
};

const orbit = (a: Parameters<AccessoryDrawer>[1]) => ({
  cx: a.headCenterX,
  cy: a.cloak.bodyCY - 0.9,
  rx: a.cloak.bodyRx + 3.6,
  ry: 2,
  rot: -0.2,
});

const starOrbitBack: AccessoryDrawer = (p, a) => {
  const o = orbit(a);
  p.ring(o.cx, o.cy, o.rx, o.ry, o.rot, Math.PI, TAU, 0.28, 'rgba(255, 224, 130, 0.75)');
};

const starOrbit: AccessoryDrawer = (p, a) => {
  const o = orbit(a);
  p.ring(o.cx, o.cy, o.rx, o.ry, o.rot, 0, Math.PI, 0.28, 'rgba(255, 224, 130, 0.9)');
  const at = (ang: number): [number, number] => {
    const x = Math.cos(ang) * o.rx;
    const y = Math.sin(ang) * o.ry;
    return [
      o.cx + x * Math.cos(o.rot) - y * Math.sin(o.rot),
      o.cy + x * Math.sin(o.rot) + y * Math.cos(o.rot),
    ];
  };
  const stars: [number, number, string][] = [
    [0.12, 1.25, '#FFD54F'],
    [Math.PI * 0.62, 0.95, '#FFF59D'],
    [Math.PI * 0.98, 1.1, '#FFB74D'],
  ];
  for (const [ang, r, c] of stars) {
    const [x, y] = at(ang);
    p.glow(x, y, r * 2.2, '255, 236, 179', 0.6);
    p.star(x, y, r, c);
    p.star(x, y, r * 0.45, '#FFFFFF');
  }
  const [sx, sy] = at(Math.PI * 0.35);
  p.sparkle(sx, sy + 0.2, 0.5, '#FFFFFF');
};

export const NECK_EXTRA: Record<string, AccessoryDrawer> = {
  bibNapkin,
  nameTag,
  beadNecklace,
  balloon,
  stripedSweater,
  fannyPack,
  hawaiiShirt,
  lifeVest,
  cameraStrap,
  ticketNecklace,
  spikedCollar,
  tuxedo,
  featherBoa,
  butterflyWings,
  duckFloat,
  angelWings,
  knightArmor,
  lanternNecklace,
  jetpack,
  starOrbit,
};

export const NECK_EXTRA_BACK: Record<string, AccessoryDrawer> = {
  butterflyWings: butterflyWingsBack,
  duckFloat: duckFloatBack,
  angelWings: angelWingsBack,
  jetpack: jetpackBack,
  starOrbit: starOrbitBack,
};
