export const WEB_SIZE = 240;

const SPOKE_ANGLES = [2, 16, 31, 45, 59, 74, 88];
const RING_RADII = [20, 37, 56, 77, 100, 125, 152, 181, 212];

function jitter(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

const fmt = (n: number) => n.toFixed(1);

export interface CobwebGeometry {
  spokes: string;
  rings: string;
  strands: string;
  drops: { x: number; y: number; r: number }[];
}

export function buildCobweb(seed: number): CobwebGeometry {
  const spokeLength = SPOKE_ANGLES.map((_, i) => 200 + jitter(seed + i) * 40);
  const point = (spoke: number, ring: number) => {
    const angle = (SPOKE_ANGLES[spoke] * Math.PI) / 180;
    const r = RING_RADII[ring] * (0.94 + jitter(seed * 7 + spoke * 13 + ring) * 0.12);
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  };

  const spokes = SPOKE_ANGLES.map((deg, i) => {
    const angle = (deg * Math.PI) / 180;
    const len = spokeLength[i];
    return `M0 0L${fmt(Math.cos(angle) * len)} ${fmt(Math.sin(angle) * len)}`;
  }).join('');

  const broken = new Set([`${(seed % 4) + 1}:7`, `${(seed % 3) + 3}:8`, `${seed % 2}:5`]);
  let rings = '';
  RING_RADII.forEach((radius, ring) => {
    for (let i = 0; i < SPOKE_ANGLES.length - 1; i++) {
      if (radius > Math.min(spokeLength[i], spokeLength[i + 1]) - 6) continue;
      if (broken.has(`${i}:${ring}`)) continue;
      const a = point(i, ring);
      const b = point(i + 1, ring);
      const sag = 0.84 + jitter(seed + ring * 3 + i) * 0.06;
      const cx = ((a.x + b.x) / 2) * sag;
      const cy = ((a.y + b.y) / 2) * sag;
      rings += `M${fmt(a.x)} ${fmt(a.y)}Q${fmt(cx)} ${fmt(cy)} ${fmt(b.x)} ${fmt(b.y)}`;
    }
  });

  const hangFrom = point(4, 5);
  const loose = point(2, 7);
  const strands =
    `M${fmt(hangFrom.x)} ${fmt(hangFrom.y)}q-3 18 1 ${fmt(30 + jitter(seed) * 18)}` +
    `M${fmt(loose.x)} ${fmt(loose.y)}q10 6 14 22`;

  const drops = [
    { ...point(1, 3), r: 1.6 },
    { ...point(3, 5), r: 1.3 },
    { ...point(5, 2), r: 1.1 },
    { ...point(2, 6), r: 1.4 },
    { x: hangFrom.x + 1, y: hangFrom.y + 30 + jitter(seed) * 18, r: 1.9 },
  ];

  return { spokes, rings, strands, drops };
}

export function webPoint(spoke: number, ring: number): { x: number; y: number } {
  const angle = (SPOKE_ANGLES[spoke] * Math.PI) / 180;
  const r = RING_RADII[ring];
  return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
}
