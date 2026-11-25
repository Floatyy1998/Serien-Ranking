import type { AccessoryRarity } from '../../../types/pet.types';

/**
 * Szenen ab dem Winter-Update 2026, viewBox 0 0 100 100.
 * Der Boden beginnt bei y=60 und reicht über die ganze Breite bis unten: je nach Ansicht stehen
 * die Füße des Pets zwischen 62 % (breites Fenster) und 86 % (Handy) der Bildhöhe.
 */
export interface ExtraScene {
  id: string;
  name: string;
  description: string;
  rarity: AccessoryRarity;
  svg: string;
  animationClass?: string;
  glowColor: string;
}

const scene = (body: string): string =>
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>${body}</svg>`;

/** Senkrechter Verlauf mit gleichmäßig verteilten Stufen. */
const grad = (id: string, ...stops: string[]): string =>
  `<linearGradient id='${id}' x1='0' y1='0' x2='0' y2='1'>${stops
    .map((c, i) => `<stop offset='${(i / (stops.length - 1)).toFixed(2)}' stop-color='${c}'/>`)
    .join('')}</linearGradient>`;

const radial = (id: string, ...stops: string[]): string =>
  `<radialGradient id='${id}'>${stops
    .map((c, i) => `<stop offset='${(i / (stops.length - 1)).toFixed(2)}' stop-color='${c}'/>`)
    .join('')}</radialGradient>`;

const dots = (fill: string, list: [number, number, number][], opacity = 1): string =>
  `<g fill='${fill}' opacity='${opacity}'>${list
    .map(([x, y, r]) => `<circle cx='${x}' cy='${y}' r='${r}'/>`)
    .join('')}</g>`;

const STARS: [number, number, number][] = [
  [8, 9, 0.6],
  [19, 22, 0.4],
  [31, 7, 0.5],
  [44, 16, 0.4],
  [57, 6, 0.6],
  [68, 20, 0.4],
  [79, 9, 0.5],
  [91, 17, 0.6],
  [13, 34, 0.35],
  [86, 33, 0.4],
  [38, 28, 0.3],
  [62, 31, 0.35],
];

const sun = (x: number, y: number, r: number, fill = '#fff3a8'): string =>
  `<circle cx='${x}' cy='${y}' r='${r * 1.7}' fill='${fill}' opacity='0.3'/><circle cx='${x}' cy='${y}' r='${r}' fill='${fill}'/>`;

const cloud = (x: number, y: number, s: number, fill = '#fff', opacity = 0.9): string =>
  `<g fill='${fill}' opacity='${opacity}'><ellipse cx='${x}' cy='${y}' rx='${11 * s}' ry='${3.4 * s}'/><ellipse cx='${x + 5 * s}' cy='${y - 2.6 * s}' rx='${6 * s}' ry='${3 * s}'/><ellipse cx='${x - 5 * s}' cy='${y - 1.6 * s}' rx='${5 * s}' ry='${2.4 * s}'/></g>`;

const SUNFLOWER_FIELD = scene(`
  <defs>${grad('s', '#5fb4ea', '#d6eefb')}${grad('g', '#8ccf5e', '#3f8f33')}</defs>
  <rect width='100' height='64' fill='url(#s)'/>${sun(82, 15, 6)}${cloud(24, 20, 1)}${cloud(58, 30, 0.7, '#fff', 0.7)}
  <path d='M0 60 Q 30 52 60 59 T 100 56 L 100 70 L 0 70 Z' fill='#b9e08d'/>
  <rect y='60' width='100' height='40' fill='url(#g)'/>
  <g stroke='#2e7d32' stroke-width='1.1'><path d='M9 100 L 9 70'/><path d='M22 100 L 22 76'/><path d='M80 100 L 80 73'/><path d='M93 100 L 93 68'/></g>
  <g fill='#43a047'><ellipse cx='12' cy='86' rx='4' ry='1.6' transform='rotate(-25 12 86)'/><ellipse cx='19' cy='90' rx='4' ry='1.6' transform='rotate(25 19 90)'/><ellipse cx='83' cy='88' rx='4' ry='1.6' transform='rotate(-25 83 88)'/><ellipse cx='90' cy='84' rx='4' ry='1.6' transform='rotate(25 90 84)'/></g>
  ${[
    [9, 68, 6],
    [22, 74, 5],
    [80, 71, 5.5],
    [93, 66, 6],
  ]
    .map(
      ([x, y, r]) =>
        `<g>${Array.from({ length: 12 }, (_, i) => `<ellipse cx='${x}' cy='${y - r * 0.8}' rx='${r * 0.24}' ry='${r * 0.5}' fill='#ffca28' transform='rotate(${i * 30} ${x} ${y})'/>`).join('')}<circle cx='${x}' cy='${y}' r='${r * 0.48}' fill='#6d4c41'/><circle cx='${x - r * 0.12}' cy='${y - r * 0.12}' r='${r * 0.2}' fill='#8d6e63'/></g>`
    )
    .join('')}
  ${dots(
    '#ffe082',
    [
      [38, 70, 1.6],
      [52, 67, 1.3],
      [64, 71, 1.5],
      [46, 74, 1.1],
    ],
    0.9
  )}
`);

const RAINBOW_MEADOW = scene(`
  <defs>${grad('s', '#7cc4f0', '#e9f7ff')}${grad('g', '#9bdc7a', '#4ba046')}</defs>
  <rect width='100' height='74' fill='url(#s)'/>
  <g fill='none' stroke-width='3.2' opacity='0.85'><path d='M4 62 A 46 46 0 0 1 96 62' stroke='#ef5350'/><path d='M7.2 62 A 42.8 42.8 0 0 1 92.8 62' stroke='#ffa726'/><path d='M10.4 62 A 39.6 39.6 0 0 1 89.6 62' stroke='#ffee58'/><path d='M13.6 62 A 36.4 36.4 0 0 1 86.4 62' stroke='#66bb6a'/><path d='M16.8 62 A 33.2 33.2 0 0 1 83.2 62' stroke='#42a5f5'/><path d='M20 62 A 30 30 0 0 1 80 62' stroke='#ab47bc'/></g>
  ${cloud(12, 57, 1.1)}${cloud(88, 57, 1.1)}${cloud(48, 12, 0.8, '#fff', 0.8)}
  <path d='M0 60 Q 25 56 50 60 T 100 59 L 100 100 L 0 100 Z' fill='url(#g)'/>
  ${dots('#fff', [
    [10, 80, 1.3],
    [26, 90, 1.3],
    [78, 84, 1.3],
    [92, 93, 1.3],
  ])}${dots('#ffca28', [
    [10, 80, 0.55],
    [26, 90, 0.55],
    [78, 84, 0.55],
    [92, 93, 0.55],
  ])}
  ${dots('#f06292', [
    [18, 74, 1.1],
    [86, 76, 1.1],
    [68, 94, 1.1],
  ])}
  <g stroke='#2e7d32' stroke-width='0.6' fill='none'><path d='M34 96 q 1 -5 0 -8'/><path d='M60 90 q -1 -5 0 -8'/><path d='M5 94 q 1 -5 0 -8'/></g>
`);

const COZY_LIVING_ROOM = scene(`
  <defs>${grad('w', '#f3d9b8', '#e7c49b')}${grad('f', '#a97450', '#7d5236')}</defs>
  <rect width='100' height='70' fill='url(#w)'/>
  <g stroke='#e0b98c' stroke-width='0.5' opacity='0.6'><line x1='0' y1='18' x2='100' y2='18'/><line x1='0' y1='36' x2='100' y2='36'/><line x1='0' y1='54' x2='100' y2='54'/></g>
  <rect x='8' y='14' width='22' height='26' rx='1.5' fill='#fff8ec'/><rect x='10' y='16' width='18' height='22' fill='#8fd0f2'/><path d='M10 30 Q 19 24 28 30 L 28 38 L 10 38 Z' fill='#8bcf7d'/><circle cx='23' cy='21' r='2.4' fill='#fff3a8'/><line x1='19' y1='16' x2='19' y2='38' stroke='#fff8ec' stroke-width='1.2'/>
  <rect x='66' y='20' width='24' height='15' rx='1.2' fill='#3a2a22'/><rect x='67.5' y='21.5' width='21' height='12' fill='#4fc3f7'/><path d='M67.5 30 L 75 25 L 80 29 L 84 26 L 88.5 30 L 88.5 33.5 L 67.5 33.5 Z' fill='#2f8f5c'/>
  <rect y='60' width='100' height='40' fill='url(#f)'/>
  <g stroke='#6b452d' stroke-width='0.4' opacity='0.6'><line x1='0' y1='78' x2='100' y2='78'/><line x1='0' y1='89' x2='100' y2='89'/><line x1='30' y1='60' x2='24' y2='100'/><line x1='70' y1='60' x2='76' y2='100'/></g>
  <ellipse cx='50' cy='88' rx='32' ry='8' fill='#c8553d' opacity='0.85'/><ellipse cx='50' cy='88' rx='25' ry='5.6' fill='none' stroke='#f4d9a8' stroke-width='0.8'/>
  <rect x='-4' y='42' width='20' height='22' rx='5' fill='#5c8f7a'/><rect x='-4' y='52' width='24' height='14' rx='4' fill='#6fa58e'/>
  <rect x='88' y='34' width='2' height='30' fill='#5d4037'/><path d='M82 34 L 96 34 L 93 24 L 85 24 Z' fill='#ffe0a3'/><ellipse cx='89' cy='36' rx='12' ry='5' fill='#fff3c4' opacity='0.35'/>
`);

const PLAYGROUND = scene(`
  <defs>${grad('s', '#70bdf0', '#e2f3fd')}${grad('g', '#9ad672', '#5aa848')}</defs>
  <rect width='100' height='66' fill='url(#s)'/>${sun(16, 14, 5.5)}${cloud(62, 18, 1)}
  <g fill='#4c9a4a'><circle cx='6' cy='56' r='9'/><circle cx='95' cy='54' r='10'/><circle cx='84' cy='58' r='7'/></g>
  <rect y='60' width='100' height='40' fill='url(#g)'/>
  <ellipse cx='50' cy='90' rx='30' ry='7' fill='#ecd9a6' opacity='0.9'/>
  <g stroke='#e53935' stroke-width='1.6' fill='none' stroke-linecap='round'><path d='M10 82 L 16 50 L 22 82'/><path d='M26 82 L 32 50 L 38 82'/><line x1='16' y1='50' x2='32' y2='50'/></g>
  <g stroke='#546e7a' stroke-width='0.5'><line x1='21' y1='50' x2='20' y2='70'/><line x1='27' y1='50' x2='28' y2='70'/></g><rect x='19' y='70' width='10' height='1.6' rx='0.8' fill='#ffca28'/>
  <rect x='80' y='46' width='2' height='34' fill='#8d6e63'/><rect x='90' y='46' width='2' height='34' fill='#8d6e63'/><rect x='78' y='44' width='16' height='3' rx='1' fill='#42a5f5'/>
  <path d='M80 58 Q 70 66 62 80 L 66 81 Q 73 68 82 61 Z' fill='#ffca28'/>
  <g stroke='#8d6e63' stroke-width='0.7'><line x1='82' y1='52' x2='90' y2='52'/><line x1='82' y1='60' x2='90' y2='60'/><line x1='82' y1='68' x2='90' y2='68'/></g>
`);

const VEGETABLE_PATCH = scene(`
  <defs>${grad('s', '#7ac0ec', '#e6f5fd')}${grad('e', '#8a5a3a', '#5f3b25')}</defs>
  <rect width='100' height='60' fill='url(#s)'/>${sun(80, 14, 5.5)}${cloud(28, 20, 1)}
  <path d='M0 58 Q 30 50 60 57 T 100 54 L 100 66 L 0 66 Z' fill='#a9d98a'/>
  <g fill='#c9a36b'><rect x='0' y='52' width='100' height='1.4'/><rect x='0' y='57' width='100' height='1.4'/></g>
  <g fill='#b88f58'>${[4, 18, 32, 46, 60, 74, 88].map((x) => `<path d='M${x} 62 L ${x} 49 L ${x + 2} 46.5 L ${x + 4} 49 L ${x + 4} 62 Z'/>`).join('')}</g>
  <rect y='60' width='100' height='40' fill='url(#e)'/>
  <g fill='#6b4127' opacity='0.7'><ellipse cx='50' cy='72' rx='60' ry='2.2'/><ellipse cx='50' cy='84' rx='60' ry='2.6'/><ellipse cx='50' cy='96' rx='60' ry='3'/></g>
  ${[8, 20, 80, 92].map((x) => `<g><path d='M${x - 2} 70 q 2 -7 2 -1 q 0 -8 2 1 z' fill='#43a047'/><path d='M${x - 1.6} 70 L ${x + 1.6} 70 L ${x} 75 Z' fill='#fb8c00'/></g>`).join('')}
  ${[10, 26, 76, 90].map((x) => `<g><ellipse cx='${x}' cy='84' rx='3.4' ry='2.6' fill='#7cb342'/><ellipse cx='${x - 1}' cy='83.4' rx='1.6' ry='1.4' fill='#9ccc65'/></g>`).join('')}
  ${dots('#e53935', [
    [6, 95, 1.4],
    [16, 96, 1.4],
    [86, 95, 1.4],
    [95, 96, 1.4],
  ])}
  <g fill='#2e7d32'><path d='M5 94 l 1 -1.6 l 1 1.6 z'/><path d='M15 95 l 1 -1.6 l 1 1.6 z'/><path d='M85 94 l 1 -1.6 l 1 1.6 z'/><path d='M94 95 l 1 -1.6 l 1 1.6 z'/></g>
`);

const LAUNDRY_DAY = scene(`
  <defs>${grad('s', '#6fbdf0', '#e4f4fd')}${grad('g', '#95d574', '#58a646')}</defs>
  <rect width='100' height='66' fill='url(#s)'/>${sun(86, 13, 5)}${cloud(22, 14, 1)}${cloud(60, 48, 0.8, '#fff', 0.6)}
  <path d='M0 60 Q 30 55 60 59 T 100 58 L 100 100 L 0 100 Z' fill='url(#g)'/>
  <rect x='5' y='22' width='1.6' height='48' fill='#8d6e63'/><rect x='93.4' y='22' width='1.6' height='48' fill='#8d6e63'/>
  <path d='M6 25 Q 50 34 94 25' stroke='#f5f5f5' stroke-width='0.5' fill='none'/>
  <path d='M12 27 L 24 28.6 L 23 42 L 13 41 Z' fill='#ef5350'/><path d='M12 27 L 8 31 L 10 33 L 13 31 Z M24 28.6 L 28 33 L 26 35 L 23.4 32 Z' fill='#e53935'/>
  <rect x='30' y='29.6' width='9' height='15' fill='#fff' transform='rotate(2 34 37)'/><g stroke='#90caf9' stroke-width='0.9'><line x1='30.2' y1='33' x2='39' y2='33.4'/><line x1='30' y1='37' x2='39' y2='37.4'/><line x1='30' y1='41' x2='39' y2='41.4'/></g>
  <path d='M62 30.4 L 67 30 L 67.4 44 L 64.6 44 L 64.4 36 L 63.4 44 L 60.6 44 Z' fill='#42a5f5'/>
  <path d='M72 29.4 L 80 28.4 L 81 37 L 73 37.6 Z' fill='#ffca28'/><path d='M83 28 L 89 27 L 89.6 38 Q 86 40 83.6 38 Z' fill='#ab47bc'/>
  ${dots('#8d6e63', [
    [13, 27, 0.5],
    [23, 28.5, 0.5],
    [31, 29.6, 0.5],
    [38, 30, 0.5],
    [62, 30.3, 0.5],
    [67, 30, 0.5],
    [73, 29.3, 0.5],
    [80, 28.4, 0.5],
    [84, 27.9, 0.5],
    [88.6, 27.1, 0.5],
  ])}
  <ellipse cx='16' cy='88' rx='7' ry='2' fill='#8d6e63'/><path d='M9.4 80 L 22.6 80 L 21.6 88 L 10.4 88 Z' fill='#c8a074'/><ellipse cx='16' cy='80' rx='6.6' ry='1.8' fill='#fafafa'/>
  ${dots('#fff', [
    [82, 86, 1.1],
    [90, 92, 1.1],
    [72, 94, 1.1],
  ])}${dots('#ffca28', [
    [82, 86, 0.45],
    [90, 92, 0.45],
    [72, 94, 0.45],
  ])}
`);

const HARBOR_DOCK = scene(`
  <defs>${grad('s', '#8cc9ef', '#fde9c9')}${grad('w', '#3f8fb8', '#1f5f86')}</defs>
  <g transform='translate(0 -22)'><rect y='-4' width='100' height='60' fill='url(#s)'/>${sun(74, 40, 6, '#fff1b8')}${cloud(24, 16, 1)}
  <g fill='#7aa3b9' opacity='0.8'><path d='M0 56 L 0 46 L 12 42 L 26 48 L 40 44 L 40 56 Z'/><path d='M70 56 L 78 47 L 92 44 L 100 48 L 100 56 Z'/></g>
  <rect y='55' width='100' height='45' fill='url(#w)'/>
  <g fill='#fff' opacity='0.3'><path d='M0 62 Q 12 60 25 62 T 50 62 T 75 62 T 100 62 L 100 63.4 L 0 63.4 Z'/><path d='M0 72 Q 12 70 25 72 T 50 72 T 75 72 T 100 72 L 100 73.2 L 0 73.2 Z'/></g>
  <path d='M10 60 L 28 60 L 25 65 L 13 65 Z' fill='#e53935'/><rect x='18.4' y='44' width='0.8' height='16' fill='#5d4037'/><path d='M19.4 45 L 27 58 L 19.4 58 Z' fill='#fff'/><path d='M18.2 47 L 12 58 L 18.2 58 Z' fill='#fff3e0'/>
  <path d='M76 64 L 92 64 L 90 68 L 78 68 Z' fill='#1565c0'/><rect x='80' y='59.4' width='7' height='4.6' fill='#fff'/><rect x='82' y='56' width='1.4' height='3.4' fill='#ef5350'/></g>
  <path d='M0 60 L 100 59 L 100 100 L 0 100 Z' fill='#9c7350'/><rect y='59.4' width='100' height='1.6' fill='#b88a63'/>
  <g stroke='#7a563a' stroke-width='0.6'><line x1='0' y1='70' x2='100' y2='69'/><line x1='0' y1='82' x2='100' y2='81.4'/><line x1='0' y1='94' x2='100' y2='93.6'/><line x1='20' y1='60' x2='14' y2='100'/><line x1='50' y1='60' x2='50' y2='100'/><line x1='80' y1='60' x2='86' y2='100'/></g>
  <rect x='4' y='49' width='4' height='14' rx='1.4' fill='#6d4c41'/><rect x='92' y='48' width='4' height='14' rx='1.4' fill='#6d4c41'/>
  <path d='M8 53 Q 50 61 92 52' stroke='#d7c29a' stroke-width='0.9' fill='none'/>
  <g stroke='#35607a' stroke-width='0.7' fill='none' stroke-linecap='round'><path d='M40 22 q 2.4 -2.4 4.8 0 q 2.4 -2.4 4.8 0'/><path d='M56 30 q 2 -2 4 0 q 2 -2 4 0'/></g>
`);

const FARM_BARN = scene(`
  <defs>${grad('s', '#74bff0', '#e8f6fe')}${grad('g', '#a2d977', '#5aa646')}</defs>
  <rect width='100' height='64' fill='url(#s)'/>${sun(18, 14, 5.5)}${cloud(56, 16, 1)}
  <path d='M0 60 Q 30 52 60 59 T 100 56 L 100 68 L 0 68 Z' fill='#c1e59c'/>
  <path d='M64 62 L 64 40 L 70 32 L 84 30 L 96 36 L 96 62 Z' fill='#c62828'/><path d='M62 41 L 70 30.6 L 84.4 28.4 L 98 35.6 L 97 38 L 84 31.4 L 71 33.4 L 64 42.6 Z' fill='#5d4037'/>
  <rect x='75' y='46' width='11' height='16' fill='#8e1b1b'/><g stroke='#fff' stroke-width='0.9' fill='none'><rect x='75' y='46' width='11' height='16'/><path d='M75 46 L 86 62 M86 46 L 75 62'/></g><rect x='78' y='35' width='5' height='5' fill='#fff' /><path d='M78 35 L 83 40 M83 35 L 78 40' stroke='#c62828' stroke-width='0.6'/>
  <rect x='52' y='40' width='8' height='22' rx='3.4' fill='#cfd8dc'/><path d='M52 43 Q 56 36 60 43 Z' fill='#90a4ae'/>
  <rect y='60' width='100' height='40' fill='url(#g)'/>
  <g stroke='#f5f5f5' stroke-width='1' fill='none'><path d='M0 70 L 34 70 M0 76 L 34 76'/><path d='M4 66 L 4 80 M14 66 L 14 80 M24 66 L 24 80 M34 66 L 34 80'/></g>
  <ellipse cx='12' cy='90' rx='7' ry='5' fill='#e8c05a'/><path d='M5.4 90 A 6.6 4.6 0 0 1 18.6 90' fill='none' stroke='#b88c1c' stroke-width='0.7'/><ellipse cx='12' cy='90' rx='2.6' ry='2' fill='none' stroke='#b88c1c' stroke-width='0.6'/>
  <g><ellipse cx='88' cy='86' rx='4' ry='3' fill='#fff'/><circle cx='91.6' cy='83' r='1.9' fill='#fff'/><path d='M93.2 83 l 1.8 0.6 l -1.8 0.6 z' fill='#ffa000'/><path d='M91 81.2 q 0.6 -1.6 1.6 0 z' fill='#e53935'/><circle cx='92' cy='82.6' r='0.3' fill='#212121'/></g>
`);

const FOREST_PATH = scene(`
  <defs>${grad('s', '#bfe6c4', '#eaf7d8')}${grad('g', '#6fae4f', '#3d7a34')}</defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <g fill='#9fd29a' opacity='0.8'><circle cx='20' cy='30' r='16'/><circle cx='50' cy='22' r='18'/><circle cx='80' cy='30' r='16'/></g>
  <g fill='#fff8d6' opacity='0.35'><path d='M40 0 L 52 0 L 66 70 L 44 70 Z'/><path d='M62 0 L 68 0 L 86 66 L 74 66 Z'/></g>
  <rect y='60' width='100' height='40' fill='url(#g)'/>
  <path d='M42 60 Q 46 78 26 100 L 76 100 Q 56 78 58 60 Z' fill='#d8b98a'/><path d='M46 64 Q 49 80 38 100 L 43 100 Q 52 80 50 64 Z' fill='#c9a673' opacity='0.6'/>
  <g fill='#5d4037'><rect x='4' y='10' width='7' height='66'/><rect x='88' y='4' width='8' height='74'/><rect x='22' y='24' width='4.4' height='44'/><rect x='74' y='22' width='4.6' height='46'/></g>
  <g fill='#2e7d32'><circle cx='7' cy='10' r='14'/><circle cx='93' cy='6' r='15'/><circle cx='24' cy='24' r='9'/><circle cx='76' cy='22' r='9.6'/></g>
  <g fill='#43a047'><circle cx='2' cy='18' r='8'/><circle cx='98' cy='16' r='8'/><circle cx='20' cy='20' r='5'/><circle cx='80' cy='18' r='5.4'/></g>
  <g fill='#388e3c'><ellipse cx='10' cy='78' rx='9' ry='4'/><ellipse cx='90' cy='80' rx='10' ry='4.4'/></g>
  ${dots('#ef5350', [
    [14, 88, 1.6],
    [86, 92, 1.6],
  ])}${dots('#fff', [
    [13.4, 87.6, 0.4],
    [14.8, 88.4, 0.35],
    [85.4, 91.6, 0.4],
    [86.8, 92.4, 0.35],
  ])}
  <g fill='#f5f0e1'><rect x='13.4' y='89' width='1.2' height='2.4'/><rect x='85.4' y='93' width='1.2' height='2.4'/></g>
`);

const SNACK_BAR = scene(`
  <defs>${grad('w', '#5b1f2c', '#2e0f18')}${grad('c', '#f7e3b8', '#e0bf82')}${grad('f', '#7a1f2e', '#4a111c')}</defs>
  <rect width='100' height='62' fill='url(#w)'/>
  <g fill='#ffca28'>${Array.from({ length: 12 }, (_, i) => `<circle cx='${6 + i * 8}' cy='4' r='1.2'/>`).join('')}</g>
  <rect x='22' y='8' width='56' height='14' rx='2' fill='#1b0a10'/><rect x='24' y='10' width='52' height='10' rx='1.2' fill='#ffecb3'/>
  <g fill='#c62828'><rect x='29' y='12.4' width='10' height='1.8'/><rect x='29' y='16' width='16' height='1.5'/><rect x='52' y='12.4' width='18' height='1.8'/><rect x='52' y='16' width='12' height='1.5'/></g>
  <rect x='4' y='24' width='22' height='26' rx='2' fill='#c62828'/><rect x='6' y='26' width='18' height='16' rx='1' fill='#fff8e1' opacity='0.92'/>
  ${dots('#ffe082', [
    [10, 38, 2.2],
    [14, 36, 2.4],
    [18, 38, 2.2],
    [12, 34, 2],
    [16, 33, 2.1],
    [20, 35, 1.8],
    [9, 34.6, 1.6],
  ])}
  <rect x='6' y='44' width='18' height='3.4' fill='#ffca28'/>
  <rect x='74' y='24' width='7' height='26' rx='1.4' fill='#1e88e5'/><rect x='83' y='24' width='7' height='26' rx='1.4' fill='#e53935'/><rect x='92' y='24' width='7' height='26' rx='1.4' fill='#43a047'/>
  <g fill='#fff' opacity='0.85'><circle cx='77.5' cy='32' r='2'/><circle cx='86.5' cy='32' r='2'/><circle cx='95.5' cy='32' r='2'/></g>
  <path d='M36 50 L 38.2 39 L 47.8 39 L 50 50 Z' fill='#fff'/><g fill='#e53935'><path d='M38.8 39 L 40.5 39 L 39.6 50 L 37.7 50 Z'/><path d='M42.2 39 L 43.8 39 L 43.8 50 L 42.2 50 Z'/><path d='M45.5 39 L 47.1 39 L 48.3 50 L 46.5 50 Z'/></g>
  ${dots('#fff3c4', [
    [40, 38, 2],
    [43, 36.6, 2.2],
    [46, 38, 2],
  ])}
  <path d='M58 50 L 59 41 L 65 41 L 66 50 Z' fill='#1e88e5'/><rect x='58.6' y='39.6' width='6.8' height='1.6' fill='#fff'/><rect x='62.4' y='33' width='0.9' height='7' fill='#e53935' transform='rotate(12 62.8 36)'/>
  <rect y='49.4' width='100' height='4' fill='url(#c)'/><rect y='49.4' width='100' height='1' fill='#fff3d6'/>
  <rect y='53.4' width='100' height='7' fill='#3b1620'/><g fill='#4d1e2a'>${Array.from({ length: 5 }, (_, i) => `<rect x='${i * 20 + 2}' y='54.4' width='16' height='5' rx='0.8'/>`).join('')}</g>
  <rect y='60' width='100' height='40' fill='url(#f)'/>
  <g fill='#ffca28' opacity='0.5'>${Array.from({ length: 24 }, (_, i) => `<path d='M${(i % 8) * 13 + (Math.floor(i / 8) % 2) * 6.5 + 4} ${66 + Math.floor(i / 8) * 13} l 1.6 2.4 l -1.6 2.4 l -1.6 -2.4 z'/>`).join('')}</g>
  <rect y='60' width='100' height='1.4' fill='#2a0a12' opacity='0.5'/>
`);

const CAMPFIRE = scene(`
  <defs>${grad('s', '#0d1b3d', '#2a3f73', '#5a5f8f')}${radial('f', '#ffe082', '#ff9800', '#ff980000')}</defs>
  <rect width='100' height='100' fill='url(#s)'/>${dots('#fff', STARS, 0.9)}
  <circle cx='82' cy='16' r='5.5' fill='#fff8e1'/><circle cx='84.4' cy='14.6' r='4.6' fill='#16264d'/>
  <g fill='#12203f'><path d='M0 66 L 6 44 L 12 66 Z'/><path d='M8 66 L 16 38 L 24 66 Z'/><path d='M78 66 L 86 40 L 94 66 Z'/><path d='M90 66 L 96 46 L 102 66 Z'/><path d='M22 66 L 28 50 L 34 66 Z'/></g>
  <rect y='60' width='100' height='40' fill='#1c2b23'/><ellipse cx='50' cy='80' rx='46' ry='12' fill='#2b4030'/>
  <circle cx='18' cy='80' r='22' fill='url(#f)' opacity='0.75'/>
  <path d='M62 78 L 78 50 L 94 78 Z' fill='#ef6c00'/><path d='M78 50 L 94 78 L 86 78 Z' fill='#e65100'/><path d='M73 78 L 78 64 L 83 78 Z' fill='#3e2723'/>
  <g stroke='#6d4c41' stroke-width='2.2' stroke-linecap='round'><line x1='10' y1='86' x2='26' y2='82'/><line x1='10' y1='82' x2='26' y2='86'/></g>
  <path d='M18 84 Q 11 76 15 70 Q 16 75 18 72 Q 17 66 21 62 Q 21 70 24 72 Q 27 78 18 84 Z' fill='#ff7043'/><path d='M18 84 Q 14 78 17 74 Q 18 77 19 75 Q 20 71 21 69 Q 22 75 23 77 Q 23 82 18 84 Z' fill='#ffca28'/>
  ${dots('#9e9e9e', [
    [9, 86, 1.8],
    [13, 88.4, 1.8],
    [23, 88.4, 1.8],
    [27, 86, 1.8],
  ])}
  ${dots(
    '#ffcc80',
    [
      [12, 60, 0.5],
      [25, 56, 0.4],
      [20, 50, 0.4],
      [9, 66, 0.35],
    ],
    0.9
  )}
`);

const LIBRARY = scene(`
  <defs>${grad('w', '#3b2a22', '#241812')}${grad('f', '#8a5a3c', '#5f3c27')}</defs>
  <rect width='100' height='62' fill='url(#w)'/>
  <rect x='40' y='4' width='20' height='40' rx='10' fill='#1f3b63'/><rect x='42' y='6' width='16' height='36' rx='8' fill='#5c93c9'/><circle cx='54' cy='14' r='3' fill='#fff8e1'/><line x1='50' y1='6' x2='50' y2='42' stroke='#3b2a22' stroke-width='1'/><line x1='42' y1='24' x2='58' y2='24' stroke='#3b2a22' stroke-width='1'/>
  <path d='M40 44 L 60 44 L 70 60 L 30 60 Z' fill='#ffe9b8' opacity='0.14'/>
  ${[0, 66]
    .map(
      (x0) =>
        `<rect x='${x0}' y='2' width='34' height='58' fill='#5d3d2a'/>${[5, 19, 33, 47]
          .map(
            (y, r) =>
              `<rect x='${x0 + 2}' y='${y}' width='30' height='11' fill='#2c1d15'/>${[
                '#c62828',
                '#1565c0',
                '#2e7d32',
                '#f9a825',
                '#6a1b9a',
                '#00838f',
                '#d84315',
                '#455a64',
              ]
                .map(
                  (c, i) =>
                    `<rect x='${x0 + 3 + i * 3.5}' y='${y + 2 + ((i + r) % 3)}' width='2.8' height='${9 - ((i + r) % 3)}' fill='${c}'/>`
                )
                .join(
                  ''
                )}<rect x='${x0 + 2}' y='${y + 11}' width='30' height='1.4' fill='#7a5238'/>`
          )
          .join('')}`
    )
    .join('')}
  <rect y='60' width='100' height='40' fill='url(#f)'/>
  <g stroke='#4f3220' stroke-width='0.4' opacity='0.7'><line x1='0' y1='72' x2='100' y2='72'/><line x1='0' y1='86' x2='100' y2='86'/><line x1='30' y1='60' x2='22' y2='100'/><line x1='70' y1='60' x2='78' y2='100'/></g>
  <ellipse cx='50' cy='82' rx='40' ry='13' fill='#7b1f2c' opacity='0.9'/><ellipse cx='50' cy='82' rx='33' ry='10' fill='none' stroke='#e2b96a' stroke-width='0.7'/>
`);

const BAKERY = scene(`
  <defs>${grad('w', '#fbe7c6', '#f1cf9f')}${grad('c', '#b9825a', '#8a5b3c')}</defs>
  <rect width='100' height='62' fill='url(#w)'/>
  <g fill='#f6d9ac'>${Array.from({ length: 10 }, (_, i) => `<rect x='${i * 10 + 4}' y='0' width='2' height='62'/>`).join('')}</g>
  <path d='M0 0 L 100 0 L 100 10 Q 95 15 90 10 Q 85 15 80 10 Q 75 15 70 10 Q 65 15 60 10 Q 55 15 50 10 Q 45 15 40 10 Q 35 15 30 10 Q 25 15 20 10 Q 15 15 10 10 Q 5 15 0 10 Z' fill='#e57373'/>
  <g fill='#fff' opacity='0.85'>${Array.from({ length: 5 }, (_, i) => `<rect x='${i * 20 + 10}' y='0' width='10' height='10.6'/>`).join('')}</g>
  <rect x='6' y='20' width='34' height='2' fill='#8d6e63'/><rect x='6' y='38' width='34' height='2' fill='#8d6e63'/><rect x='60' y='20' width='34' height='2' fill='#8d6e63'/><rect x='60' y='38' width='34' height='2' fill='#8d6e63'/>
  <g fill='#d9963f'><ellipse cx='13' cy='17' rx='5' ry='3'/><ellipse cx='27' cy='17' rx='6' ry='3.2'/><ellipse cx='68' cy='35' rx='6' ry='3.2'/><ellipse cx='84' cy='35' rx='5' ry='3'/></g>
  <g stroke='#a96a1f' stroke-width='0.6'><path d='M11 15.6 l 1.6 2.4 M14 15.6 l 1.6 2.4 M24 15.6 l 2 2.6 M28 15.6 l 2 2.6 M66 33.6 l 2 2.6 M70 33.6 l 2 2.6'/></g>
  <g><path d='M10 36 Q 14 28 18 36 Z' fill='#f8bbd0'/><rect x='10' y='36' width='8' height='2' fill='#fff8e1'/><circle cx='14' cy='30.6' r='1' fill='#e53935'/><path d='M24 36 Q 29 26 34 36 Z' fill='#fff3e0'/><rect x='24' y='36' width='10' height='2' fill='#8d6e63'/><circle cx='29' cy='29.6' r='1' fill='#e53935'/></g>
  <g fill='#c98b3c'><path d='M64 19 q 3 -8 6 0 q -3 2 -6 0 z'/><path d='M74 19 q 3 -8 6 0 q -3 2 -6 0 z'/><path d='M84 19 q 3 -8 6 0 q -3 2 -6 0 z'/></g>
  <rect y='49' width='100' height='11' fill='url(#c)'/><rect y='49' width='100' height='1.8' fill='#d9a877'/>
  <rect y='60' width='100' height='40' fill='#f3e3c8'/>
  <g fill='#e9d3ae'>${Array.from({ length: 30 }, (_, i) => `<rect x='${(i % 10) * 10}' y='${60 + Math.floor(i / 10) * 14}' width='10' height='14' opacity='${(i + Math.floor(i / 10)) % 2}'/>`).join('')}</g>
  <ellipse cx='14' cy='48.4' rx='7' ry='1.8' fill='#fafafa'/>${dots('#d7893a', [
    [10, 46.4, 2.4],
    [14.5, 45.4, 2.6],
    [18.6, 46.8, 2.2],
  ])}
  <rect x='80' y='40' width='12' height='9' rx='1.2' fill='#fff'/><rect x='82' y='42' width='8' height='1.8' fill='#e57373'/><rect x='82' y='45.4' width='6' height='1.2' fill='#bdbdbd'/>
`);

const FERRIS_WHEEL = scene(`
  <defs>${grad('s', '#2b1e5c', '#8a3c7a', '#f28a5c', '#ffd27a')}</defs>
  <rect width='100' height='72' fill='url(#s)'/>${dots('#fff', STARS.slice(0, 6), 0.8)}
  <g stroke='#f5f5f5' stroke-width='0.7' fill='none'><circle cx='24' cy='34' r='22'/><circle cx='24' cy='34' r='15' opacity='0.5'/>${Array.from({ length: 8 }, (_, i) => `<line x1='24' y1='34' x2='${(24 + Math.cos((i * Math.PI) / 4) * 22).toFixed(1)}' y2='${(34 + Math.sin((i * Math.PI) / 4) * 22).toFixed(1)}'/>`).join('')}</g>
  ${Array.from({ length: 8 }, (_, i) => {
    const x = 24 + Math.cos((i * Math.PI) / 4) * 22;
    const y = 34 + Math.sin((i * Math.PI) / 4) * 22;
    return `<rect x='${(x - 2.4).toFixed(1)}' y='${y.toFixed(1)}' width='4.8' height='4' rx='1.2' fill='${['#ef5350', '#ffca28', '#42a5f5', '#66bb6a'][i % 4]}'/>`;
  }).join('')}
  <path d='M24 34 L 14 72 M24 34 L 34 72' stroke='#e0e0e0' stroke-width='1.2'/><circle cx='24' cy='34' r='2.2' fill='#ffca28'/>
  <g transform='translate(0 -11)'><path d='M66 72 L 66 50 L 80 42 L 94 50 L 94 72 Z' fill='#c62828'/><path d='M63 51 L 80 40 L 97 51 L 97 54 L 80 44 L 63 54 Z' fill='#fff'/>
  <g fill='#fff'><rect x='70' y='54' width='4' height='18'/><rect x='78' y='54' width='4' height='18'/><rect x='86' y='54' width='4' height='18'/></g>
  <path d='M80 40 L 80 32 L 86 34.4 L 80 36.6' fill='#ffca28' stroke='#f5f5f5' stroke-width='0.5'/></g>
  <path d='M40 30 Q 62 22 96 30' stroke='#3b2a5a' stroke-width='0.4' fill='none'/>${dots(
    '#ffe082',
    [
      [46, 28.2, 1.1],
      [56, 26.6, 1.1],
      [66, 26, 1.1],
      [76, 26.6, 1.1],
      [86, 28, 1.1],
    ]
  )}
  <rect y='60' width='100' height='40' fill='#3a2a4a'/><ellipse cx='50' cy='82' rx='52' ry='16' fill='#4b3760'/>
  ${dots(
    '#ffe082',
    [
      [10, 78, 0.6],
      [44, 76, 0.5],
      [58, 80, 0.5],
      [90, 78, 0.6],
    ],
    0.7
  )}
`);

const ROOFTOP_SUNSET = scene(`
  <defs>${grad('s', '#3a2a6b', '#b0477a', '#f58a5c', '#ffd98a')}</defs>
  <rect width='100' height='70' fill='url(#s)'/>
  <circle cx='50' cy='46' r='11' fill='#fff1a8'/><circle cx='50' cy='46' r='17' fill='#ffd27a' opacity='0.3'/>
  <g fill='#ffd9e8' opacity='0.4'><ellipse cx='22' cy='24' rx='16' ry='2.4'/><ellipse cx='76' cy='32' rx='14' ry='2'/></g>
  <g fill='#3b2452'><rect x='0' y='44' width='10' height='26'/><rect x='10' y='36' width='9' height='34'/><rect x='19' y='48' width='11' height='22'/><rect x='30' y='40' width='8' height='30'/><rect x='62' y='42' width='9' height='28'/><rect x='71' y='34' width='10' height='36'/><rect x='81' y='46' width='9' height='24'/><rect x='90' y='38' width='10' height='32'/></g>
  ${dots(
    '#ffd98a',
    [
      [13, 42, 0.7],
      [16, 50, 0.7],
      [33, 46, 0.7],
      [35, 56, 0.7],
      [74, 40, 0.7],
      [77, 52, 0.7],
      [93, 44, 0.7],
      [96, 56, 0.7],
      [4, 52, 0.7],
      [66, 50, 0.7],
    ],
    0.9
  )}
  <rect y='60' width='100' height='40' fill='#5a4a5e'/><rect y='60' width='100' height='3' fill='#7b6880'/>
  <g stroke='#4a3b4e' stroke-width='0.4'><line x1='0' y1='80' x2='100' y2='80'/><line x1='0' y1='91' x2='100' y2='91'/><line x1='25' y1='63' x2='18' y2='100'/><line x1='75' y1='63' x2='82' y2='100'/></g>
  <path d='M0 30 Q 50 40 100 30' stroke='#2b1b3a' stroke-width='0.4' fill='none'/>${dots(
    '#fff3c4',
    [
      [10, 31.6, 1.2],
      [24, 34.2, 1.2],
      [38, 35.6, 1.2],
      [62, 35.6, 1.2],
      [76, 34.2, 1.2],
      [90, 31.6, 1.2],
    ]
  )}
  <rect x='4' y='78' width='12' height='10' rx='1.4' fill='#8d6e63'/><g fill='#43a047'><circle cx='7' cy='76' r='3.6'/><circle cx='12' cy='74.6' r='4'/><circle cx='10' cy='78' r='3'/></g>
  <rect x='82' y='84' width='14' height='2' fill='#d7b98a'/><rect x='84' y='86' width='1.4' height='8' fill='#8d6e63'/><rect x='92.6' y='86' width='1.4' height='8' fill='#8d6e63'/><rect x='86' y='79' width='3' height='5' rx='0.8' fill='#ef5350'/>
`);

const MUSHROOM_GLADE = scene(`
  <defs>${grad('s', '#274b3c', '#3f7a58', '#8fc48a')}${grad('g', '#4f9a55', '#2c6238')}</defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <g fill='#1d3a2e'><rect x='2' y='0' width='9' height='70'/><rect x='88' y='0' width='10' height='72'/><rect x='24' y='0' width='5' height='62'/><rect x='70' y='0' width='5' height='62'/></g>
  <g fill='#fff8d6' opacity='0.18'><path d='M38 0 L 50 0 L 64 72 L 42 72 Z'/><path d='M56 0 L 62 0 L 82 68 L 70 68 Z'/></g>
  <rect y='60' width='100' height='40' fill='url(#g)'/>
  ${[
    [14, 78, 9, '#e53935'],
    [86, 76, 10, '#e53935'],
    [28, 90, 5, '#ff7043'],
    [74, 92, 5, '#ab47bc'],
    [6, 94, 4, '#ab47bc'],
    [94, 94, 4, '#ff7043'],
  ]
    .map(
      ([x, y, r, c]) =>
        `<g><rect x='${(x as number) - (r as number) * 0.22}' y='${y}' width='${(r as number) * 0.44}' height='${(r as number) * 1.1}' rx='${(r as number) * 0.2}' fill='#fff3e0'/><path d='M${(x as number) - (r as number)} ${y} Q ${x} ${(y as number) - (r as number) * 1.5} ${(x as number) + (r as number)} ${y} Z' fill='${c}'/><circle cx='${(x as number) - (r as number) * 0.4}' cy='${(y as number) - (r as number) * 0.4}' r='${(r as number) * 0.16}' fill='#fff'/><circle cx='${(x as number) + (r as number) * 0.3}' cy='${(y as number) - (r as number) * 0.55}' r='${(r as number) * 0.13}' fill='#fff'/><circle cx='${(x as number) + (r as number) * 0.55}' cy='${(y as number) - (r as number) * 0.2}' r='${(r as number) * 0.1}' fill='#fff'/></g>`
    )
    .join('')}
  ${dots(
    '#e6ff8a',
    [
      [34, 54, 0.8],
      [62, 48, 0.7],
      [46, 62, 0.6],
      [18, 60, 0.7],
      [80, 56, 0.8],
      [54, 70, 0.5],
    ],
    0.9
  )}
  <g fill='#3d8b47'><ellipse cx='42' cy='96' rx='8' ry='2.4'/><ellipse cx='60' cy='98' rx='7' ry='2'/></g>
`);

const AUTUMN_ALLEY = scene(`
  <defs>${grad('s', '#f6d7a0', '#fbeed1')}${grad('g', '#c98a3c', '#8a5a25')}</defs>
  <rect width='100' height='62' fill='url(#s)'/><circle cx='50' cy='40' r='14' fill='#fff6d6' opacity='0.7'/>
  <path d='M40 60 L 60 60 L 86 100 L 14 100 Z' fill='#d9b383'/><path d='M0 60 L 40 60 L 14 100 L 0 100 Z' fill='url(#g)'/><path d='M60 60 L 100 60 L 100 100 L 86 100 Z' fill='url(#g)'/>
  ${[
    [6, 8, 18],
    [24, 5, 12],
    [34, 3.4, 8],
    [94, 8, 18],
    [76, 5, 12],
    [66, 3.4, 8],
  ]
    .map(
      ([x, w, r], i) =>
        `<rect x='${x - w / 2}' y='${62 - r * 2.4}' width='${w * 0.6}' height='${r * 2.6 + (i % 3 === 0 ? 30 : i % 3 === 1 ? 14 : 4)}' fill='#5d4037'/><circle cx='${x}' cy='${62 - r * 2.3}' r='${r}' fill='${['#e65100', '#f9a825', '#d84315'][i % 3]}'/><circle cx='${x - r * 0.5}' cy='${62 - r * 2}' r='${r * 0.66}' fill='${['#ff8f00', '#ffca28', '#f4511e'][i % 3]}'/>`
    )
    .join('')}
  <g fill='#e65100'><path d='M30 78 q 2 -3 4 0 q -1 3 -4 3 Z'/><path d='M66 86 q 2 -3 4 0 q -1 3 -4 3 Z'/><path d='M12 90 q 2 -3 4 0 q -1 3 -4 3 Z'/></g>
  <g fill='#f9a825'><path d='M84 82 q 2 -3 4 0 q -1 3 -4 3 Z'/><path d='M22 96 q 2 -3 4 0 q -1 3 -4 3 Z'/><path d='M46 30 q 2 -3 4 0 q -1 3 -4 3 Z'/><path d='M58 46 q 2 -3 4 0 q -1 3 -4 3 Z'/></g>
  <g fill='#c62828'><path d='M74 94 q 2 -3 4 0 q -1 3 -4 3 Z'/><path d='M40 20 q 2 -3 4 0 q -1 3 -4 3 Z'/></g>
`);

const ICE_RINK = scene(`
  <defs>${grad('s', '#243b6b', '#5a78b0', '#c9dcf2')}${grad('i', '#e8f6ff', '#b9dcf2')}</defs>
  <rect width='100' height='66' fill='url(#s)'/>${dots('#fff', STARS.slice(0, 8), 0.85)}
  <g fill='#1e3157'><path d='M0 64 L 8 40 L 16 64 Z'/><path d='M12 64 L 22 34 L 32 64 Z'/><path d='M70 64 L 80 36 L 90 64 Z'/><path d='M86 64 L 94 42 L 102 64 Z'/></g>
  <g fill='#fff' opacity='0.9'><path d='M22 34 L 26 46 L 18 46 Z'/><path d='M80 36 L 84 48 L 76 48 Z'/><path d='M8 40 L 11 49 L 5 49 Z'/><path d='M94 42 L 97 51 L 91 51 Z'/></g>
  <path d='M0 28 Q 50 40 100 28' stroke='#17264a' stroke-width='0.4' fill='none'/>${dots(
    '#ffe082',
    [
      [8, 29.6, 1.2],
      [20, 32.2, 1.2],
      [32, 33.8, 1.2],
      [44, 34.6, 1.2],
      [56, 34.6, 1.2],
      [68, 33.8, 1.2],
      [80, 32.2, 1.2],
      [92, 29.6, 1.2],
    ]
  )}
  <rect y='59' width='100' height='41' fill='#fafdff'/><ellipse cx='50' cy='84' rx='56' ry='21' fill='url(#i)'/>
  <g stroke='#fff' stroke-width='0.5' fill='none' opacity='0.9'><path d='M14 80 Q 30 72 44 82 T 70 78'/><path d='M30 92 Q 50 84 86 90'/><path d='M60 74 q 8 4 16 0'/></g>
  <rect x='0' y='60' width='100' height='2.4' fill='#b71c1c'/><g fill='#fff'>${Array.from({ length: 10 }, (_, i) => `<rect x='${i * 10 + 5}' y='60' width='5' height='2.4'/>`).join('')}</g>
  ${dots(
    '#fff',
    [
      [12, 14, 0.7],
      [36, 44, 0.6],
      [64, 18, 0.7],
      [88, 50, 0.6],
      [50, 54, 0.5],
    ],
    0.9
  )}
`);

const RAINY_STREET = scene(`
  <defs>${grad('s', '#2b3a55', '#55667f')}${grad('g', '#3c4a60', '#232d3d')}</defs>
  <rect width='100' height='70' fill='url(#s)'/>
  <g fill='#1f2a3d'><rect x='0' y='14' width='24' height='56'/><rect x='24' y='26' width='16' height='44'/><rect x='62' y='20' width='18' height='50'/><rect x='80' y='10' width='20' height='60'/></g>
  <g fill='#ffd98a' opacity='0.9'><rect x='4' y='22' width='5' height='6'/><rect x='14' y='22' width='5' height='6'/><rect x='4' y='36' width='5' height='6'/><rect x='28' y='34' width='4' height='5'/><rect x='66' y='28' width='4' height='5'/><rect x='84' y='18' width='5' height='6'/><rect x='92' y='32' width='5' height='6'/><rect x='84' y='46' width='5' height='6'/></g>
  <rect x='0' y='42' width='24' height='20' fill='#b53a3a'/><path d='M-2 42 L 26 42 L 24 36 L 0 36 Z' fill='#e57373'/><rect x='6' y='47' width='12' height='13' fill='#ffe9b8' opacity='0.85'/>
  <rect x='44' y='24' width='1.6' height='46' fill='#1a2230'/><path d='M44.8 24 Q 44.8 18 52 18' stroke='#1a2230' stroke-width='1.4' fill='none'/><circle cx='53' cy='20' r='2.6' fill='#fff3c4'/><circle cx='53' cy='20' r='9' fill='#fff3c4' opacity='0.18'/>
  <rect y='60' width='100' height='40' fill='url(#g)'/>
  <g fill='#ffe9b8' opacity='0.1'><ellipse cx='53' cy='66' rx='9' ry='3'/><ellipse cx='12' cy='65' rx='10' ry='2.6'/></g>
  <g fill='#9fb3cc' opacity='0.35'><ellipse cx='26' cy='93' rx='12' ry='1.8'/><ellipse cx='78' cy='87' rx='14' ry='2'/></g>
  <g stroke='#c5d6ea' stroke-width='0.4' fill='none' opacity='0.5'><ellipse cx='26' cy='93' rx='5' ry='0.8'/><ellipse cx='80' cy='87' rx='6' ry='0.9'/></g>
  <g stroke='#c5d6ea' stroke-width='0.4' opacity='0.55'>${Array.from({ length: 18 }, (_, i) => `<line x1='${(i * 17) % 100}' y1='${(i * 23) % 62}' x2='${((i * 17) % 100) - 2}' y2='${((i * 23) % 62) + 7}'/>`).join('')}</g>
`);

const SURF_BEACH = scene(`
  <defs>${grad('s', '#49b0e8', '#c9ecfb')}${grad('w', '#12a3c9', '#1570a8')}${grad('d', '#fbe2a3', '#e9bd76')}</defs>
  <g transform='translate(0 -14)'><rect y='-4' width='100' height='54' fill='url(#s)'/>${sun(20, 14, 6)}${cloud(66, 16, 1)}
  <rect y='48' width='100' height='28' fill='url(#w)'/>
  <path d='M0 56 Q 14 46 30 54 Q 40 58 48 52 Q 60 44 76 54 Q 88 60 100 52 L 100 62 L 0 62 Z' fill='#4fc3f7'/><path d='M0 56 Q 14 46 30 54 Q 40 58 48 52 Q 60 44 76 54 Q 88 60 100 52' stroke='#fff' stroke-width='1.4' fill='none'/>
  <path d='M0 70 Q 25 66 50 70 T 100 69 L 100 72 L 0 72 Z' fill='#fff' opacity='0.5'/></g>
  <path d='M0 60 Q 25 57 50 60 T 100 59 L 100 100 L 0 100 Z' fill='url(#d)'/>
  <path d='M86 80 Q 84 52 90 34' stroke='#8d6e63' stroke-width='2.6' fill='none'/>
  <g fill='#2e7d32'><path d='M90 34 Q 78 28 70 34 Q 80 32 90 34 Z'/><path d='M90 34 Q 86 22 76 20 Q 84 26 90 34 Z'/><path d='M90 34 Q 98 24 108 28 Q 98 28 90 34 Z'/><path d='M90 34 Q 100 34 104 44 Q 98 36 90 34 Z'/><path d='M90 34 Q 84 38 82 48 Q 84 40 90 34 Z'/></g>
  <path d='M8 96 Q 4 76 10 60 Q 16 76 12 96 Z' fill='#ef5350'/><path d='M10 62 L 10 95' stroke='#fff' stroke-width='0.9'/>
  <path d='M18 98 Q 15 82 20 68 Q 25 82 22 98 Z' fill='#ffca28'/><path d='M20 70 L 20 97' stroke='#00acc1' stroke-width='0.9'/>
  <g fill='#f2a65a'><path d='M70 92 L 71.6 88.6 L 73.2 92 L 76.6 92.6 L 73.6 94.4 L 74.4 98 L 71.6 95.6 L 68.8 98 L 69.6 94.4 L 66.6 92.6 Z'/></g>
`);

const CINEMA_HALL = scene(`
  <defs>${grad('w', '#2a0d14', '#140609')}${grad('sc', '#e9f1ff', '#b9cdf2')}${grad('f', '#5a1420', '#2a070e')}</defs>
  <rect width='100' height='62' fill='url(#w)'/>
  <rect x='14' y='6' width='72' height='38' rx='1.4' fill='#0b0b10'/><rect x='16' y='8' width='68' height='34' fill='url(#sc)'/>
  <path d='M16 33 L 34 20 L 46 30 L 58 18 L 84 35 L 84 42 L 16 42 Z' fill='#5d7bb5' opacity='0.8'/><circle cx='70' cy='16' r='4' fill='#fff8e1'/>
  <path d='M0 0 L 14 0 L 14 52 Q 8 56 0 54 Z' fill='#8e1b2a'/><path d='M100 0 L 86 0 L 86 52 Q 92 56 100 54 Z' fill='#8e1b2a'/>
  <g stroke='#6d1320' stroke-width='0.7'><line x1='4' y1='0' x2='4' y2='54'/><line x1='9' y1='0' x2='9' y2='53'/><line x1='91' y1='0' x2='91' y2='53'/><line x1='96' y1='0' x2='96' y2='54'/></g>
  <g>${Array.from({ length: 9 }, (_, i) => `<rect x='${(i * 11.2 + 0.6).toFixed(1)}' y='48' width='9.6' height='13' rx='3' fill='#98182a'/><rect x='${(i * 11.2 + 0.6).toFixed(1)}' y='48' width='9.6' height='2.4' rx='1.2' fill='#d9485a' opacity='0.6'/>`).join('')}</g>
  <rect y='60' width='100' height='40' fill='url(#f)'/>
  <path d='M30 100 L 40 60 L 60 60 L 70 100 Z' fill='#e9f1ff' opacity='0.07'/>
  <g fill='#7a1c2b' opacity='0.8'>${Array.from({ length: 21 }, (_, i) => `<path d='M${(i % 7) * 15 + (Math.floor(i / 7) % 2) * 7.5 + 3} ${67 + Math.floor(i / 7) * 13} l 2 3 l -2 3 l -2 -3 z'/>`).join('')}</g>
  ${dots(
    '#ffca28',
    [
      [3, 64, 0.7],
      [3, 78, 0.8],
      [3, 93, 0.9],
      [97, 64, 0.7],
      [97, 78, 0.8],
      [97, 93, 0.9],
    ],
    0.9
  )}
`);

const GAMING_ROOM = scene(`
  <defs>${grad('w', '#1a1436', '#0e0a20')}${grad('n', '#7c4dff', '#00e5ff')}</defs>
  <rect width='100' height='62' fill='url(#w)'/>
  <rect x='0' y='7' width='100' height='1.6' fill='url(#n)'/>
  <g fill='none' stroke-width='1.2'><path d='M8 20 L 14 14 L 20 20 L 14 26 Z' stroke='#00e5ff'/><path d='M82 14 L 92 14 L 92 24 L 82 24 Z' stroke='#ff4081'/><circle cx='70' cy='18' r='4.6' stroke='#ffea00'/><path d='M30 14 L 35 23 L 25 23 Z' stroke='#69f0ae'/></g>
  <rect x='28' y='26' width='44' height='24' rx='1.6' fill='#05050a'/><rect x='30' y='28' width='40' height='20' fill='#221a4d'/>
  <path d='M30 43 L 41 36 L 48 41 L 57 32 L 70 43 L 70 48 L 30 48 Z' fill='#7c4dff' opacity='0.8'/><circle cx='61' cy='34' r='2.2' fill='#ffea00'/>${dots(
    '#fff',
    [
      [34, 32, 0.5],
      [44, 31, 0.4],
      [52, 34, 0.4],
      [66, 37, 0.4],
    ]
  )}
  <rect x='47' y='50' width='6' height='3' fill='#05050a'/>
  <rect x='8' y='36' width='10' height='18' rx='1.2' fill='#0c0a18'/>${dots('#00e5ff', [[13, 41, 2.2]])}${dots('#ff4081', [[13, 49, 2.2]])}${dots(
    '#0c0a18',
    [
      [13, 41, 1.2],
      [13, 49, 1.2],
    ]
  )}
  <rect x='82' y='42' width='10' height='12' rx='1.2' fill='#0c0a18'/><rect x='83.4' y='44' width='7.2' height='1.2' fill='#69f0ae'/><rect x='83.4' y='47' width='7.2' height='1.2' fill='#ffea00'/><rect x='83.4' y='50' width='7.2' height='1.2' fill='#ff4081'/>
  <rect y='53' width='100' height='7' fill='#2b2350'/><rect y='53' width='100' height='1' fill='#00e5ff' opacity='0.7'/>
  <rect y='60' width='100' height='40' fill='#120e26'/><rect y='60' width='100' height='1.4' fill='#ff4081' opacity='0.8'/>
  <g stroke='#2b2350' stroke-width='0.5'><line x1='0' y1='72' x2='100' y2='72'/><line x1='0' y1='86' x2='100' y2='86'/><line x1='30' y1='61' x2='20' y2='100'/><line x1='70' y1='61' x2='80' y2='100'/></g>
  <ellipse cx='50' cy='82' rx='40' ry='12' fill='#7c4dff' opacity='0.16'/>
`);

const GREENHOUSE = scene(`
  <defs>${grad('s', '#bfe9f5', '#f0fbf4')}${grad('f', '#c8a47a', '#a07c55')}</defs>
  <rect width='100' height='74' fill='url(#s)'/>${sun(74, 16, 5, '#fffbe0')}
  <g stroke='#fff' stroke-width='1.2' fill='none' opacity='0.95'><path d='M0 30 L 50 2 L 100 30'/><line x1='50' y1='2' x2='50' y2='74'/><line x1='25' y1='16' x2='25' y2='74'/><line x1='75' y1='16' x2='75' y2='74'/><line x1='0' y1='30' x2='100' y2='30'/><line x1='0' y1='52' x2='100' y2='52'/></g>
  <g fill='#fff' opacity='0.14'><path d='M0 30 L 25 16 L 25 52 L 0 52 Z'/><path d='M75 16 L 100 30 L 100 52 L 75 52 Z'/></g>
  <rect y='60' width='100' height='40' fill='url(#f)'/>
  <g stroke='#8a6a47' stroke-width='0.4'><line x1='0' y1='73' x2='100' y2='73'/><line x1='0' y1='87' x2='100' y2='87'/></g>
  <g transform='translate(0 -13)'><rect x='0' y='56' width='30' height='3' fill='#8d6e63'/><rect x='70' y='56' width='30' height='3' fill='#8d6e63'/><rect x='2' y='59' width='2' height='16' fill='#6d4c41'/><rect x='26' y='59' width='2' height='16' fill='#6d4c41'/><rect x='72' y='59' width='2' height='16' fill='#6d4c41'/><rect x='96' y='59' width='2' height='16' fill='#6d4c41'/>
  ${[5, 15, 25]
    .map(
      (x, i) =>
        `<path d='M${x - 3} 56 L ${x - 3.6} 50 L ${x + 3.6} 50 L ${x + 3} 56 Z' fill='#d2734a'/><g fill='${['#43a047', '#66bb6a', '#2e7d32'][i]}'><ellipse cx='${x - 2}' cy='46' rx='2.4' ry='4.4' transform='rotate(-25 ${x - 2} 46)'/><ellipse cx='${x + 2}' cy='46' rx='2.4' ry='4.4' transform='rotate(25 ${x + 2} 46)'/><ellipse cx='${x}' cy='44' rx='2.2' ry='5'/></g>`
    )
    .join('')}
  <path d='M72 56 L 71.4 49 L 80.6 49 L 80 56 Z' fill='#d2734a'/><g fill='#f06292'><circle cx='73' cy='44' r='2.4'/><circle cx='79' cy='44' r='2.4'/><circle cx='76' cy='40.6' r='2.6'/></g><g stroke='#2e7d32' stroke-width='0.7'><line x1='73' y1='46' x2='74.6' y2='49'/><line x1='79' y1='46' x2='77.4' y2='49'/><line x1='76' y1='43' x2='76' y2='49'/></g>
  <path d='M88 56 L 87.4 50 L 96.6 50 L 96 56 Z' fill='#d2734a'/><path d='M92 50 Q 84 40 90 30 Q 92 40 92 50 Z M92 50 Q 100 42 96 32 Q 92 42 92 50 Z' fill='#2e7d32'/></g>
  <path d='M30 14 q 4 8 0 14 q -5 6 -1 12' stroke='#43a047' stroke-width='0.9' fill='none'/>${dots(
    '#66bb6a',
    [
      [31.6, 20, 1.6],
      [28, 30, 1.6],
      [30.6, 38, 1.4],
    ]
  )}
`);

const PIRATE_COVE = scene(`
  <defs>${grad('s', '#f7b267', '#fbe3b0')}${grad('w', '#1f9bb5', '#12627c')}${grad('d', '#f7dc9c', '#e2b56c')}</defs>
  <g transform='translate(0 -16)'><rect y='-4' width='100' height='62' fill='url(#s)'/>${sun(50, 46, 8, '#fff3c4')}
  <path d='M0 58 L 0 20 Q 10 14 16 26 Q 24 30 22 44 Q 30 50 28 58 Z' fill='#6d5a4a'/><path d='M100 58 L 100 14 Q 88 12 84 26 Q 76 32 78 46 Q 70 52 72 58 Z' fill='#5f4e40'/>
  <g fill='#2e7d32'><circle cx='6' cy='18' r='7'/><circle cx='95' cy='12' r='8'/><circle cx='86' cy='22' r='5'/></g>
  <rect y='56' width='100' height='22' fill='url(#w)'/>
  <path d='M0 62 Q 12 60 25 62 T 50 62 T 75 62 T 100 62 L 100 63.6 L 0 63.6 Z' fill='#fff' opacity='0.3'/>
  <path d='M40 58 L 62 58 L 58 64 L 43 64 Z' fill='#4e342e'/><rect x='50.4' y='36' width='1' height='22' fill='#3e2723'/><path d='M51.6 38 L 60 46 L 51.6 54 Z' fill='#212121'/><path d='M50 40 L 43 48 L 50 54 Z' fill='#37474f'/><circle cx='55' cy='46' r='1.3' fill='#fff'/><path d='M50.6 36 l 4 1.4 l -4 1.4 z' fill='#c62828'/></g>
  <path d='M0 60 Q 25 57 50 60 T 100 59 L 100 100 L 0 100 Z' fill='url(#d)'/><path d='M0 60 Q 25 57 50 60 T 100 59 L 100 61.6 Q 50 63 0 62.4 Z' fill='#fff' opacity='0.45'/>
  <rect x='6' y='84' width='16' height='10' rx='1' fill='#6d4c41'/><path d='M6 84 Q 14 76 22 84 Z' fill='#8d6e63'/><rect x='6' y='87' width='16' height='1.4' fill='#ffca28'/><rect x='13' y='86' width='2' height='3.4' fill='#ffca28'/>
  ${dots('#ffd54f', [
    [10, 82.6, 1.3],
    [14, 81.6, 1.3],
    [18, 82.6, 1.3],
    [26, 94, 1.3],
    [30, 96, 1.1],
  ])}
  <path d='M84 86 l 6 8 m 0 -8 l -6 8' stroke='#c62828' stroke-width='1.4' stroke-linecap='round'/>
  <g stroke='#6d5a4a' stroke-width='0.5' stroke-dasharray='1.2 1.6' fill='none'><path d='M26 90 Q 50 98 82 90'/></g>
`);

const MEDIEVAL_CASTLE = scene(`
  <defs>${grad('s', '#6cb6ea', '#e6f4fd')}${grad('g', '#93d06f', '#4f9a42')}</defs>
  <rect width='100' height='66' fill='url(#s)'/>${cloud(20, 16, 1)}${cloud(84, 26, 0.8, '#fff', 0.8)}
  <path d='M0 62 Q 30 52 60 60 T 100 56 L 100 70 L 0 70 Z' fill='#b6df90'/>
  <g fill='#b0bec5'><rect x='26' y='30' width='48' height='34'/><rect x='18' y='20' width='14' height='44'/><rect x='68' y='20' width='14' height='44'/><rect x='42' y='14' width='16' height='50'/></g>
  <g fill='#90a4ae'><rect x='18' y='20' width='14' height='3'/><rect x='68' y='20' width='14' height='3'/><rect x='42' y='14' width='16' height='3'/><rect x='26' y='30' width='48' height='3'/></g>
  <g fill='#b0bec5'>${[18, 23.4, 28.8, 68, 73.4, 78.8, 42, 48, 54].map((x, i) => `<rect x='${x}' y='${i < 6 ? 16.6 : 10.6}' width='3.2' height='3.6'/>`).join('')}${[28, 35, 62, 69].map((x) => `<rect x='${x}' y='26.6' width='3.2' height='3.6'/>`).join('')}</g>
  <path d='M45 64 L 45 50 Q 50 43 55 50 L 55 64 Z' fill='#5d4037'/><g stroke='#3e2723' stroke-width='0.5'><line x1='47.5' y1='47.4' x2='47.5' y2='64'/><line x1='50' y1='46' x2='50' y2='64'/><line x1='52.5' y1='47.4' x2='52.5' y2='64'/></g>
  <g fill='#37474f'><rect x='23.6' y='30' width='2.8' height='6' rx='1.4'/><rect x='73.6' y='30' width='2.8' height='6' rx='1.4'/><rect x='48.6' y='24' width='2.8' height='6' rx='1.4'/><rect x='34' y='42' width='2.8' height='6' rx='1.4'/><rect x='63' y='42' width='2.8' height='6' rx='1.4'/></g>
  <g><rect x='49.6' y='2' width='0.8' height='10' fill='#5d4037'/><path d='M50.4 2.4 L 58 4.4 L 50.4 6.6 Z' fill='#e53935'/><rect x='24.6' y='9' width='0.8' height='9' fill='#5d4037'/><path d='M25.4 9.4 L 31 11 L 25.4 12.8 Z' fill='#1e88e5'/><rect x='74.6' y='9' width='0.8' height='9' fill='#5d4037'/><path d='M75.4 9.4 L 81 11 L 75.4 12.8 Z' fill='#1e88e5'/></g>
  <rect y='60' width='100' height='40' fill='url(#g)'/>
  <path d='M44 60 L 56 60 L 72 100 L 28 100 Z' fill='#d9c39a'/>
  <g fill='#2e7d32'><circle cx='8' cy='70' r='7'/><circle cx='93' cy='72' r='8'/></g><g fill='#43a047'><circle cx='5' cy='72' r='4'/><circle cx='96' cy='74' r='4.6'/></g>
`);

const DESERT_OASIS = scene(`
  <defs>${grad('s', '#ffb46b', '#ffe3a8')}${grad('d', '#f3cf8a', '#d99f55')}${grad('w', '#4fc3d9', '#1f8aa8')}</defs>
  <rect width='100' height='60' fill='url(#s)'/>${sun(78, 18, 7, '#fff6c9')}
  <path d='M0 56 Q 22 40 44 54 Q 62 44 80 52 Q 92 46 100 52 L 100 66 L 0 66 Z' fill='#e9b869'/>
  <path d='M12 52 L 20 40 L 28 52 Z' fill='#d79a4c' opacity='0.8'/><path d='M20 40 L 28 52 L 22 52 Z' fill='#c4863b' opacity='0.8'/>
  <rect y='59' width='100' height='41' fill='url(#d)'/><path d='M0 59 Q 25 55 50 59 T 100 58 L 100 62 L 0 62 Z' fill='#f3cf8a'/>
  <ellipse cx='50' cy='56.5' rx='26' ry='3.6' fill='url(#w)'/><ellipse cx='44' cy='55.8' rx='10' ry='0.9' fill='#fff' opacity='0.35'/>
  <g fill='#5aa646'><ellipse cx='25' cy='57' rx='5' ry='1.8'/><ellipse cx='75' cy='57.4' rx='6' ry='2'/></g>
  ${[
    [14, 70, 30],
    [88, 72, 34],
  ]
    .map(
      ([x, y, h]) =>
        `<path d='M${x} ${y} Q ${x - 3} ${y - h / 2} ${x + 2} ${y - h}' stroke='#8d6e63' stroke-width='2.4' fill='none'/><g fill='#2e7d32'><path d='M${x + 2} ${y - h} q -12 -6 -18 2 q 9 -3 18 -2 z'/><path d='M${x + 2} ${y - h} q -4 -12 -14 -12 q 8 5 14 12 z'/><path d='M${x + 2} ${y - h} q 8 -10 18 -6 q -10 0 -18 6 z'/><path d='M${x + 2} ${y - h} q 12 0 16 10 q -7 -8 -16 -10 z'/></g><circle cx='${x + 1}' cy='${y - h + 2}' r='1.5' fill='#6d4c41'/>`
    )
    .join('')}
  <g fill='#43a047'><path d='M6 96 Q 4 84 8 80 Q 12 84 10 96 Z'/><path d='M2 92 q -3 -4 0 -7 l 2 1 z'/><path d='M12 90 q 3 -4 0 -7 l -2 1 z'/></g>
  ${dots(
    '#c98f47',
    [
      [30, 90, 1.2],
      [70, 94, 1.4],
      [84, 88, 1],
      [44, 96, 1],
    ],
    0.7
  )}
`);

const SHRINE_GATE = scene(`
  <defs>${grad('s', '#f8c9a0', '#fdecd6')}${grad('g', '#a8c97a', '#6b9a4c')}</defs>
  <rect width='100' height='66' fill='url(#s)'/><circle cx='50' cy='34' r='15' fill='#fff' opacity='0.55'/>
  <path d='M0 60 L 18 38 L 34 56 L 50 34 L 68 56 L 84 40 L 100 60 L 100 66 L 0 66 Z' fill='#c9a8b9' opacity='0.7'/>
  <rect y='60' width='100' height='40' fill='url(#g)'/>
  <path d='M38 60 L 62 60 L 82 100 L 18 100 Z' fill='#e6dccb'/><g stroke='#cbbfa9' stroke-width='0.5'><line x1='34' y1='74' x2='66' y2='74'/><line x1='29' y1='86' x2='71' y2='86'/></g>
  <g fill='#d32f2f'><rect x='22' y='24' width='5' height='48'/><rect x='73' y='24' width='5' height='48'/><rect x='18' y='30' width='64' height='4'/></g>
  <path d='M10 22 Q 50 14 90 22 L 88 16 Q 50 8 12 16 Z' fill='#212121'/><path d='M12 22 Q 50 15 88 22 L 88 25 Q 50 18 12 25 Z' fill='#d32f2f'/>
  <rect x='46' y='22' width='8' height='8' fill='#212121'/><rect x='47.6' y='23.4' width='4.8' height='5.2' fill='#ffca28'/>
  <g fill='#212121'><rect x='21' y='68' width='7' height='4'/><rect x='72' y='68' width='7' height='4'/></g>
  ${[6, 94].map((x) => `<rect x='${x - 1}' y='62' width='2' height='14' fill='#9e9e9e'/><rect x='${x - 3.4}' y='54' width='6.8' height='8' fill='#bdbdbd'/><rect x='${x - 2}' y='56' width='4' height='4.4' fill='#ffe082'/><path d='M${x - 5} 54 L ${x + 5} 54 L ${x} 49 Z' fill='#757575'/>`).join('')}
  <g fill='#e65100'><circle cx='4' cy='30' r='10'/><circle cx='97' cy='26' r='11'/></g><g fill='#ff8f00'><circle cx='1' cy='36' r='6'/><circle cx='99' cy='34' r='6.6'/></g>
  <g fill='#e65100'><path d='M30 50 q 2 -3 4 0 q -1 3 -4 3 Z'/><path d='M64 44 q 2 -3 4 0 q -1 3 -4 3 Z'/><path d='M14 84 q 2 -3 4 0 q -1 3 -4 3 Z'/><path d='M84 90 q 2 -3 4 0 q -1 3 -4 3 Z'/></g>
`);

const TREEHOUSE = scene(`
  <defs>${grad('s', '#84c9f1', '#e7f6fe')}${grad('g', '#94d370', '#56a244')}</defs>
  <rect width='100' height='68' fill='url(#s)'/>${sun(14, 14, 5)}${cloud(48, 14, 0.9)}
  <rect y='60' width='100' height='40' fill='url(#g)'/>
  <path d='M74 100 Q 70 70 76 40 L 90 40 Q 94 70 92 100 Z' fill='#6d4c41'/><path d='M82 100 Q 80 70 84 44 L 88 44 Q 90 70 88 100 Z' fill='#5d4037' opacity='0.7'/>
  <g fill='#2e7d32'><circle cx='84' cy='14' r='20'/><circle cx='66' cy='22' r='13'/><circle cx='99' cy='26' r='12'/></g><g fill='#43a047'><circle cx='78' cy='10' r='12'/><circle cx='64' cy='18' r='7'/></g>
  <rect x='58' y='44' width='40' height='3' fill='#8d6e63'/><rect x='62' y='26' width='30' height='18' fill='#c8a074'/><g stroke='#a57f55' stroke-width='0.5'><line x1='62' y1='32' x2='92' y2='32'/><line x1='62' y1='38' x2='92' y2='38'/></g>
  <path d='M58 28 L 77 14 L 96 28 Z' fill='#c62828'/><rect x='66' y='31' width='7' height='7' fill='#81d4fa'/><path d='M69.5 31 L 69.5 38 M66 34.5 L 73 34.5' stroke='#fff' stroke-width='0.6'/><rect x='80' y='32' width='7' height='12' rx='1' fill='#6d4c41'/>
  <g stroke='#d7b98a' stroke-width='0.9'><line x1='62' y1='47' x2='60' y2='84'/><line x1='70' y1='47' x2='68' y2='84'/>${[52, 59, 66, 73, 80].map((y) => `<line x1='${61.7 - (y - 47) * 0.054}' y1='${y}' x2='${69.7 - (y - 47) * 0.054}' y2='${y}'/>`).join('')}</g>
  <path d='M96 47 L 96 64' stroke='#d7b98a' stroke-width='0.6'/><circle cx='96' cy='67' r='3.6' fill='none' stroke='#37474f' stroke-width='1.6'/>
  <g fill='#fff'>${[
    [12, 80],
    [24, 92],
    [40, 78],
  ]
    .map(([x, y]) => `<circle cx='${x}' cy='${y}' r='1.3'/>`)
    .join('')}</g>${dots('#ffca28', [
    [12, 80, 0.5],
    [24, 92, 0.5],
    [40, 78, 0.5],
  ])}
`);

const NIGHT_MARKET = scene(`
  <defs>${grad('s', '#1a1238', '#3a1f5c')}</defs>
  <rect width='100' height='72' fill='url(#s)'/>${dots('#fff', STARS.slice(0, 6), 0.7)}
  <path d='M0 16 Q 50 30 100 16' stroke='#0e0920' stroke-width='0.5' fill='none'/><path d='M0 30 Q 50 42 100 30' stroke='#0e0920' stroke-width='0.5' fill='none'/>
  ${[
    [8, 19.4],
    [22, 23],
    [36, 25.4],
    [50, 26.4],
    [64, 25.4],
    [78, 23],
    [92, 19.4],
  ]
    .map(
      ([x, y], i) =>
        `<circle cx='${x}' cy='${y + 3}' r='7' fill='${['#ff7043', '#ffca28', '#ef5350'][i % 3]}' opacity='0.16'/><ellipse cx='${x}' cy='${y + 3}' rx='2.6' ry='3.2' fill='${['#ff7043', '#ffca28', '#ef5350'][i % 3]}'/><rect x='${x - 1.2}' y='${y - 0.6}' width='2.4' height='0.9' fill='#3e2723'/><rect x='${x - 1.2}' y='${y + 5.8}' width='2.4' height='0.9' fill='#3e2723'/>`
    )
    .join('')}
  <g transform='translate(0 -11)'>${[
    [0, '#c62828', '#fff'],
    [70, '#1565c0', '#fff'],
  ]
    .map(
      ([x, c, w]) =>
        `<rect x='${x}' y='46' width='30' height='26' fill='#2a1a14'/><path d='M${(x as number) - 2} 46 L ${(x as number) + 32} 46 L ${(x as number) + 30} 38 L ${x} 38 Z' fill='${c}'/><g fill='${w}' opacity='0.9'>${[2, 12, 22].map((d) => `<path d='M${(x as number) + d} 38 L ${(x as number) + d + 5} 38 L ${(x as number) + d + 5.4} 46 L ${(x as number) + d - 0.4} 46 Z'/>`).join('')}</g><rect x='${(x as number) + 2}' y='56' width='26' height='3' fill='#8d6e63'/><rect x='${(x as number) + 4}' y='48' width='22' height='8' fill='#ffe0a3' opacity='0.85'/>`
    )
    .join('')}
  ${dots('#ef5350', [
    [8, 54, 1.6],
    [13, 54, 1.6],
    [18, 54, 1.6],
  ])}${dots('#ffca28', [
    [78, 54, 1.6],
    [83, 54, 1.6],
    [88, 54, 1.6],
  ])}${dots('#66bb6a', [
    [23, 54, 1.6],
    [93, 54, 1.6],
  ])}</g>
  <rect y='60' width='100' height='40' fill='#2b2238'/>
  <g fill='#3a2f4a'>${Array.from({ length: 12 }, (_, i) => `<rect x='${(i % 6) * 17 + (i > 5 ? 8 : 0)}' y='${63 + (i > 5 ? 18 : 0)}' width='15' height='16' rx='1'/>`).join('')}</g>
  <g fill='#ffd98a' opacity='0.1'><path d='M2 61 L 28 61 L 36 100 L 0 100 Z'/><path d='M72 61 L 98 61 L 100 100 L 64 100 Z'/></g>
`);

const SPACE_STATION = scene(`
  <defs>${grad('w', '#2b3140', '#151923')}${radial('e', '#6ec6ff', '#1e88e5', '#0d47a1')}</defs>
  <rect width='100' height='100' fill='url(#w)'/>
  <g transform='translate(0 -7)'><rect x='10' y='8' width='80' height='52' rx='26' fill='#05070d'/>
  <clipPath id='c'><rect x='13' y='11' width='74' height='46' rx='23'/></clipPath>
  <g clip-path='url(#c)'><rect x='13' y='11' width='74' height='46' fill='#070b18'/>${dots('#fff', [
    [20, 18, 0.6],
    [34, 14, 0.4],
    [44, 24, 0.5],
    [58, 15, 0.4],
    [70, 20, 0.6],
    [80, 30, 0.4],
    [26, 30, 0.4],
    [50, 34, 0.35],
  ])}
  <circle cx='50' cy='84' r='40' fill='url(#e)'/><path d='M22 62 Q 36 52 50 56 Q 44 62 48 70 L 20 74 Z' fill='#66bb6a' opacity='0.85'/><path d='M60 52 Q 74 54 82 64 L 68 62 Z' fill='#66bb6a' opacity='0.85'/><ellipse cx='40' cy='50' rx='14' ry='2' fill='#fff' opacity='0.5'/><ellipse cx='66' cy='56' rx='10' ry='1.6' fill='#fff' opacity='0.45'/>
  <circle cx='50' cy='84' r='40' fill='none' stroke='#b3e5fc' stroke-width='1.6' opacity='0.5'/>
  <circle cx='76' cy='22' r='4' fill='#eceff1'/><circle cx='74.6' cy='21' r='0.9' fill='#b0bec5'/><circle cx='77.4' cy='23.4' r='0.7' fill='#b0bec5'/></g>
  <rect x='10' y='8' width='80' height='52' rx='26' fill='none' stroke='#78909c' stroke-width='2.4'/>
  <g fill='#90a4ae'>${[
    [50, 8],
    [50, 60],
    [12, 34],
    [88, 34],
    [24, 14],
    [76, 14],
    [24, 54],
    [76, 54],
  ]
    .map(([x, y]) => `<circle cx='${x}' cy='${y}' r='1.2'/>`)
    .join('')}</g></g>
  <rect y='60' width='100' height='40' fill='#3a4254'/><rect y='60' width='100' height='2.4' fill='#5b667c'/>
  <g stroke='#2b3140' stroke-width='0.6'><line x1='0' y1='80' x2='100' y2='80'/><line x1='0' y1='92' x2='100' y2='92'/><line x1='25' y1='62' x2='18' y2='100'/><line x1='50' y1='62' x2='50' y2='100'/><line x1='75' y1='62' x2='82' y2='100'/></g>
  <rect x='2' y='48' width='14' height='12' rx='1.2' fill='#1e2533'/><rect x='3.6' y='49.6' width='10.8' height='5' fill='#00e5ff' opacity='0.7'/>${dots('#ff5252', [[5, 57, 0.7]])}${dots('#69f0ae', [[8, 57, 0.7]])}${dots('#ffea00', [[11, 57, 0.7]])}
  <rect x='84' y='48' width='14' height='12' rx='1.2' fill='#1e2533'/><path d='M85.6 56 L 88 52 L 90 55 L 92.4 51 L 96 56' stroke='#69f0ae' stroke-width='0.7' fill='none'/>
`);

const DINO_VALLEY = scene(`
  <defs>${grad('s', '#f6a65b', '#fbd9a0', '#f7efc8')}${grad('g', '#7fb65a', '#3f7a35')}</defs>
  <rect width='100' height='66' fill='url(#s)'/>${sun(18, 20, 7, '#fff3c4')}
  <path d='M56 64 L 72 24 L 78 24 L 96 64 Z' fill='#6d5a52'/><path d='M72 24 L 78 24 L 84 38 L 75 34 L 68 40 Z' fill='#ff7043'/><path d='M72 24 L 74 14 Q 78 18 77 24 Z' fill='#ffca28' opacity='0.9'/>
  <g fill='#9e9e9e' opacity='0.6'><circle cx='76' cy='12' r='4'/><circle cx='81' cy='7' r='5'/><circle cx='88' cy='4' r='4'/></g>
  <path d='M0 62 Q 20 50 40 60 Q 52 54 60 62 L 60 68 L 0 68 Z' fill='#a7c77a'/>
  <path d='M10 60 Q 12 44 22 42 Q 26 36 30 40 Q 28 44 24 46 Q 22 54 30 58 L 40 60 Q 30 62 26 62 L 26 66 L 23 66 L 23 62 L 16 62 L 16 66 L 13 66 L 13 62 Z' fill='#4f7a5a' opacity='0.85'/>
  <rect y='60' width='100' height='40' fill='url(#g)'/>
  ${[
    [6, 82],
    [94, 80],
    [16, 96],
    [86, 96],
  ]
    .map(
      ([x, y]) =>
        `<g stroke='#2e7d32' stroke-width='1.4' fill='none' stroke-linecap='round'><path d='M${x} ${y} q -8 -8 -10 -2'/><path d='M${x} ${y} q -4 -12 -8 -10'/><path d='M${x} ${y} q 0 -14 0 -13'/><path d='M${x} ${y} q 4 -12 8 -10'/><path d='M${x} ${y} q 8 -8 10 -2'/></g>`
    )
    .join('')}
  <g fill='#fff8e1'><ellipse cx='28' cy='90' rx='3' ry='3.8'/><ellipse cx='34' cy='92' rx='2.6' ry='3.4'/></g>${dots(
    '#a5d6a7',
    [
      [27, 89, 0.6],
      [29, 91.4, 0.5],
      [34, 91, 0.5],
    ]
  )}
  <path d='M64 86 l 2 -3 l 2 3 l 2 -3 l 2 3' stroke='#5d4037' stroke-width='0.9' fill='none'/>
  <g stroke='#3b3b3b' stroke-width='0.7' fill='none'><path d='M40 16 q 3 -3 6 0 q 3 -3 6 0'/></g>
`);

const WIZARD_TOWER = scene(`
  <defs>${grad('s', '#1b1446', '#4a2a7a', '#9c5fb5')}${radial('m', '#fff8e1', '#fff8e100')}</defs>
  <rect width='100' height='100' fill='url(#s)'/>${dots('#fff', STARS, 0.9)}
  <circle cx='22' cy='20' r='14' fill='url(#m)' opacity='0.5'/><circle cx='22' cy='20' r='7' fill='#fff8e1'/>
  <g transform='translate(0 -14)'><path d='M0 70 L 16 50 L 30 66 L 46 52 L 60 68 L 100 56 L 100 76 L 0 76 Z' fill='#2a1c52'/>
  <path d='M70 76 L 72 34 L 88 34 L 90 76 Z' fill='#5e4a8a'/><path d='M80 34 L 88 34 L 90 76 L 82 76 Z' fill='#4c3a75'/>
  <path d='M66 36 L 80 20 L 94 36 Z' fill='#7e57c2'/><path d='M80 20 L 94 36 L 84 36 Z' fill='#673ab7'/><circle cx='80' cy='20' r='1.6' fill='#ffd54f'/>
  <g fill='#ffd54f'><rect x='77' y='42' width='6' height='8' rx='3'/><rect x='77' y='58' width='6' height='8' rx='3'/></g><rect x='77' y='42' width='6' height='8' rx='3' fill='#ffd54f' opacity='0.3' transform='translate(-6 -6) scale(1.08)'/>
  <path d='M64 44 L 72 42 L 72 48 L 64 48 Z' fill='#5e4a8a'/><path d='M62 44 L 68 36 L 74 44 Z' fill='#7e57c2'/></g>
  <rect y='60' width='100' height='40' fill='#1f1640'/><ellipse cx='50' cy='82' rx='52' ry='16' fill='#2b2056'/>
  <g fill='none' stroke='#b388ff' stroke-width='0.6' opacity='0.8'><ellipse cx='26' cy='88' rx='14' ry='4'/><ellipse cx='26' cy='88' rx='9' ry='2.4'/></g>
  <path d='M26 84.6 L 27.4 87.4 L 30.4 87.6 L 28 89.4 L 28.8 92.2 L 26 90.6 L 23.2 92.2 L 24 89.4 L 21.6 87.6 L 24.6 87.4 Z' fill='#b388ff' opacity='0.8'/>
  ${dots(
    '#b388ff',
    [
      [40, 44, 0.7],
      [52, 34, 0.6],
      [58, 48, 0.5],
      [46, 60, 0.6],
      [34, 54, 0.5],
    ],
    0.9
  )}${dots(
    '#80deea',
    [
      [44, 26, 0.6],
      [60, 40, 0.5],
      [50, 52, 0.5],
    ],
    0.9
  )}
`);

const CANDY_LAND = scene(`
  <defs>${grad('s', '#ffc6e2', '#fff0f7')}${grad('g', '#b9f1c9', '#7fd9a0')}</defs>
  <rect width='100' height='66' fill='url(#s)'/>
  <g fill='#fff' opacity='0.95'><ellipse cx='22' cy='18' rx='12' ry='5'/><ellipse cx='30' cy='14' rx='8' ry='5'/><ellipse cx='74' cy='26' rx='13' ry='5'/><ellipse cx='66' cy='22' rx='7' ry='4.4'/></g>
  <g fill='#f8bbd0' opacity='0.8'><ellipse cx='22' cy='20' rx='10' ry='2'/><ellipse cx='74' cy='28' rx='11' ry='2'/></g>
  <path d='M0 62 Q 20 46 40 60 Q 60 46 80 58 Q 92 50 100 56 L 100 70 L 0 70 Z' fill='#ffab91'/><path d='M12 54 Q 20 46 28 54 Q 24 57 20 54 Q 16 57 12 54 Z' fill='#fff'/><path d='M52 53 Q 60 46 68 53 Q 64 56 60 53 Q 56 56 52 53 Z' fill='#fff'/>
  <rect y='60' width='100' height='40' fill='url(#g)'/>
  <path d='M42 60 Q 50 80 34 100 L 70 100 Q 54 80 58 60 Z' fill='#fff3c4'/>${dots('#f06292', [
    [46, 72, 1.1],
    [52, 84, 1.1],
    [48, 94, 1.1],
  ])}${dots('#4fc3f7', [
    [54, 70, 1.1],
    [46, 80, 1.1],
    [58, 92, 1.1],
  ])}
  ${[
    [10, 60, 7, '#ef5350'],
    [90, 58, 8, '#42a5f5'],
    [24, 74, 5, '#ab47bc'],
    [78, 76, 5, '#66bb6a'],
  ]
    .map(
      ([x, y, r, c]) =>
        `<rect x='${(x as number) - 0.7}' y='${y}' width='1.4' height='${(r as number) * 3}' fill='#fff'/><circle cx='${x}' cy='${y}' r='${r}' fill='${c}'/><path d='M${x} ${y} m 0 -${(r as number) * 0.7} a ${(r as number) * 0.7} ${(r as number) * 0.7} 0 1 1 -${(r as number) * 0.7} ${(r as number) * 0.7} a ${(r as number) * 0.4} ${(r as number) * 0.4} 0 1 1 ${(r as number) * 0.4} -${(r as number) * 0.4}' fill='none' stroke='#fff' stroke-width='${(r as number) * 0.22}' stroke-linecap='round'/>`
    )
    .join('')}
  <g><path d='M6 100 L 6 86 Q 6 80 11 80 Q 16 80 16 85' stroke='#fff' stroke-width='3' fill='none' stroke-linecap='round'/><path d='M6 100 L 6 86 Q 6 80 11 80 Q 16 80 16 85' stroke='#e53935' stroke-width='3' fill='none' stroke-dasharray='2.4 2.4' stroke-linecap='butt'/></g>
  ${dots(
    '#fff',
    [
      [36, 40, 0.7],
      [58, 34, 0.6],
      [46, 48, 0.5],
    ],
    0.9
  )}
`);

const ATLANTIS = scene(`
  <defs>${grad('s', '#0a4a7a', '#0b6a96', '#0e86a8')}${grad('f', '#2a8f9e', '#12586b')}</defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <g fill='#b3e5fc' opacity='0.14'><path d='M20 0 L 32 0 L 52 80 L 30 80 Z'/><path d='M50 0 L 58 0 L 86 76 L 70 76 Z'/><path d='M76 0 L 82 0 L 100 50 L 96 60 Z'/></g>
  <g fill='#0c5878' opacity='0.9'><rect x='8' y='34' width='8' height='36'/><rect x='84' y='30' width='9' height='40'/><path d='M4 34 L 12 22 L 20 34 Z'/><path d='M80 30 L 88.5 16 L 97 30 Z'/></g>
  <g fill='#1c7f9c'><rect x='30' y='40' width='40' height='30'/><rect x='24' y='46' width='10' height='24'/><rect x='66' y='46' width='10' height='24'/></g>
  <path d='M26 42 L 50 22 L 74 42 Z' fill='#26a0b8'/><circle cx='50' cy='34' r='3' fill='#ffe082'/>
  <g fill='#0a4a66'>${[34, 42, 50, 58, 66].map((x) => `<rect x='${x - 1.6}' y='44' width='3.2' height='26'/>`).join('')}</g>
  <path d='M45 70 L 45 58 Q 50 52 55 58 L 55 70 Z' fill='#06344a'/><path d='M45 70 L 45 58 Q 50 52 55 58 L 55 70 Z' fill='#80deea' opacity='0.25'/>
  <rect y='60' width='100' height='40' fill='url(#f)'/><ellipse cx='50' cy='86' rx='44' ry='9' fill='#3aa3b0' opacity='0.5'/>
  <g fill='#ef5350'><path d='M6 100 Q 4 86 8 80 Q 10 88 12 82 Q 14 90 12 100 Z'/><path d='M90 100 Q 88 84 92 78 Q 94 86 96 80 Q 98 90 96 100 Z'/></g>
  <g stroke='#66bb6a' stroke-width='1.4' fill='none' stroke-linecap='round'><path d='M20 100 q -3 -8 0 -14 q 3 -6 0 -12'/><path d='M80 100 q 3 -8 0 -14 q -3 -6 0 -10'/></g>
  ${dots(
    '#e0f7fa',
    [
      [22, 52, 1],
      [24, 40, 0.7],
      [78, 54, 1],
      [76, 44, 0.6],
      [60, 16, 0.8],
      [40, 10, 0.6],
    ],
    0.6
  )}
  <g fill='#ffca28'><path d='M62 84 q 3 -3 6 0 q -3 3 -6 0 z'/><path d='M68 84 l 2.4 -1.8 l 0 3.6 z'/><path d='M30 78 q 2.4 -2.4 4.8 0 q -2.4 2.4 -4.8 0 z'/><path d='M34.8 78 l 2 -1.5 l 0 3 z'/></g>
`);

const CYBER_CITY = scene(`
  <defs>${grad('s', '#12052e', '#3a0f5c', '#b0206f')}</defs>
  <rect width='100' height='72' fill='url(#s)'/>
  <circle cx='50' cy='44' r='20' fill='#ff4081' opacity='0.35'/><circle cx='50' cy='44' r='14' fill='#ffab40' opacity='0.5'/>
  <g fill='#12052e' opacity='0.9'><rect x='36' y='41' width='28' height='1.4'/><rect x='36' y='46' width='28' height='1.8'/><rect x='36' y='52' width='28' height='2.2'/></g>
  <g fill='#0b0420'><rect x='0' y='24' width='14' height='48'/><rect x='14' y='38' width='10' height='34'/><rect x='24' y='14' width='12' height='58'/><rect x='64' y='20' width='12' height='52'/><rect x='76' y='34' width='10' height='38'/><rect x='86' y='10' width='14' height='62'/></g>
  <g fill='#00e5ff'>${[
    [3, 30],
    [8, 38],
    [3, 46],
    [27, 20],
    [31, 30],
    [27, 40],
    [67, 26],
    [71, 36],
    [67, 46],
    [89, 16],
    [94, 26],
    [89, 36],
    [94, 46],
  ]
    .map(([x, y]) => `<rect x='${x}' y='${y}' width='2.4' height='3.4'/>`)
    .join('')}</g>
  <g fill='#ff4081'>${[
    [17, 44],
    [20, 54],
    [79, 40],
    [82, 50],
    [8, 56],
    [31, 52],
    [71, 56],
    [94, 58],
  ]
    .map(([x, y]) => `<rect x='${x}' y='${y}' width='2.4' height='3.4'/>`)
    .join('')}</g>
  <rect x='24' y='12' width='12' height='1.4' fill='#ffea00'/><rect x='86' y='8' width='14' height='1.4' fill='#00e5ff'/><rect x='29.6' y='4' width='0.8' height='8' fill='#ff4081'/>
  <g><path d='M40 22 l 10 0 l 2 2 l -14 0 z' fill='#eceff1'/><rect x='42' y='24' width='8' height='0.8' fill='#00e5ff'/><path d='M58 32 l 8 0 l 1.6 1.6 l -11.2 0 z' fill='#eceff1'/><rect x='59.4' y='33.6' width='6.4' height='0.7' fill='#ff4081'/></g>
  <rect y='60' width='100' height='40' fill='#0b0420'/>
  <g stroke='#ff4081' stroke-width='0.5' opacity='0.8'>${[65, 72, 82, 94].map((y) => `<line x1='0' y1='${y}' x2='100' y2='${y}'/>`).join('')}${[-30, -10, 10, 30, 50, 70, 90, 110, 130].map((x) => `<line x1='${50 + (x - 50) * 0.5}' y1='60' x2='${x}' y2='100'/>`).join('')}</g>
  <rect y='60' width='100' height='1.2' fill='#00e5ff'/>
`);

const HAUNTED_MANSION = scene(`
  <defs>${grad('s', '#161a33', '#2f2a52', '#5a4a70')}${radial('m', '#f5f3d7', '#f5f3d700')}</defs>
  <rect width='100' height='62' fill='url(#s)'/>
  <circle cx='22' cy='20' r='18' fill='url(#m)' opacity='0.5'/><circle cx='22' cy='20' r='9' fill='#f5f3d7'/>${dots(
    '#d9d6b4',
    [
      [19, 17, 1.6],
      [25, 23, 1.2],
      [24, 15, 0.8],
    ]
  )}
  <g transform='translate(0 -9)'><g fill='#0e1022'><path d='M48 70 L 48 40 L 60 28 L 72 40 L 72 70 Z'/><rect x='72' y='46' width='20' height='24'/><path d='M70 47 L 82 36 L 94 47 Z'/><rect x='34' y='50' width='14' height='20'/><path d='M32 51 L 41 42 L 50 51 Z'/><rect x='56' y='14' width='8' height='20'/><path d='M54 16 L 60 4 L 66 16 Z'/></g>
  <g fill='#ffca28' opacity='0.9'><rect x='57' y='44' width='6' height='8' rx='3'/><rect x='78' y='52' width='4' height='6'/><rect x='86' y='52' width='4' height='6'/><rect x='38' y='56' width='4' height='6'/><rect x='58.6' y='20' width='2.8' height='5' rx='1.4'/></g>
  <rect x='57' y='60' width='6' height='10' rx='3' fill='#2a1a14'/></g>
  <g fill='#0e1022'><path d='M4 70 L 5 44 L 3 36 M5 44' /><rect x='4' y='38' width='2' height='32'/><path d='M5 50 L 0 42 M5 46 L 11 38 M5 56 L 12 50' stroke='#0e1022' stroke-width='1.2'/></g>
  <g stroke='#0e1022' stroke-width='0.8' fill='none'><path d='M38 18 q 2.6 -2.6 5.2 0 q 2.6 -2.6 5.2 0'/><path d='M76 12 q 2 -2 4 0 q 2 -2 4 0'/><path d='M84 24 q 2 -2 4 0 q 2 -2 4 0'/></g>
  <rect y='60' width='100' height='40' fill='#1a1d30'/><ellipse cx='50' cy='62' rx='60' ry='5' fill='#8f8aa8' opacity='0.25'/><ellipse cx='30' cy='82' rx='40' ry='5' fill='#8f8aa8' opacity='0.16'/>
  ${[10, 26, 86].map((x, i) => `<path d='M${x - 3.4} ${88 + i * 3} L ${x - 3.4} ${80 + i * 3} Q ${x} ${75 + i * 3} ${x + 3.4} ${80 + i * 3} L ${x + 3.4} ${88 + i * 3} Z' fill='#6b6f85'/><path d='M${x} ${79 + i * 3} L ${x} ${84 + i * 3} M${x - 1.6} ${80.6 + i * 3} L ${x + 1.6} ${80.6 + i * 3}' stroke='#454960' stroke-width='0.6'/>`).join('')}
  <g stroke='#0e1022' stroke-width='1'><line x1='0' y1='62' x2='100' y2='62'/>${Array.from({ length: 11 }, (_, i) => `<path d='M${i * 10} 66 L ${i * 10} 56 l 1.4 -2.4' fill='none'/>`).join('')}</g>
  <g fill='#fff' opacity='0.75'><path d='M70 86 Q 70 78 75 78 Q 80 78 80 86 L 80 94 l -1.7 -1.6 l -1.6 1.6 l -1.7 -1.6 l -1.6 1.6 l -1.7 -1.6 l -1.7 1.6 Z'/></g>${dots(
    '#161a33',
    [
      [73.4, 83, 0.8],
      [76.6, 83, 0.8],
    ]
  )}
`);

const CLOUD_CASTLE = scene(`
  <defs>${grad('s', '#7fb8f5', '#c9b8f5', '#ffd6e8')}${radial('h', '#fffde7', '#fffde700')}</defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='50' cy='30' r='34' fill='url(#h)' opacity='0.8'/>
  <g fill='none' stroke-width='2' opacity='0.5'><path d='M10 70 A 44 44 0 0 1 90 70' stroke='#ff8a80'/><path d='M12.4 70 A 41.6 41.6 0 0 1 87.6 70' stroke='#ffd54f'/><path d='M14.8 70 A 39.2 39.2 0 0 1 85.2 70' stroke='#80deea'/></g>
  <g fill='#fff'><rect x='36' y='36' width='28' height='26'/><rect x='30' y='28' width='10' height='34'/><rect x='60' y='28' width='10' height='34'/><rect x='45' y='20' width='10' height='42'/></g>
  <g fill='#ffd54f'><path d='M28 29 L 35 12 L 42 29 Z'/><path d='M58 29 L 65 12 L 72 29 Z'/><path d='M43 21 L 50 2 L 57 21 Z'/></g>
  <g fill='#f8bbd0'><path d='M35 12 L 42 29 L 37 29 Z'/><path d='M65 12 L 72 29 L 67 29 Z'/><path d='M50 2 L 57 21 L 52 21 Z'/></g>
  <path d='M46 62 L 46 50 Q 50 44 54 50 L 54 62 Z' fill='#b39ddb'/><g fill='#90caf9'><rect x='33.6' y='36' width='2.8' height='6' rx='1.4'/><rect x='63.6' y='36' width='2.8' height='6' rx='1.4'/><rect x='48.6' y='28' width='2.8' height='6' rx='1.4'/></g>
  <g fill='#fff'><ellipse cx='50' cy='66' rx='34' ry='7'/><ellipse cx='28' cy='62' rx='14' ry='6'/><ellipse cx='72' cy='62' rx='14' ry='6'/><ellipse cx='12' cy='74' rx='16' ry='6'/><ellipse cx='88' cy='74' rx='16' ry='6'/></g>
  <g fill='#fff'><ellipse cx='50' cy='84' rx='74' ry='24'/><ellipse cx='50' cy='90' rx='60' ry='14'/><ellipse cx='16' cy='84' rx='20' ry='8'/><ellipse cx='84' cy='84' rx='20' ry='8'/></g>
  <g fill='#e1d5ff' opacity='0.55'><ellipse cx='50' cy='98' rx='50' ry='5'/><ellipse cx='18' cy='76' rx='12' ry='2.2'/><ellipse cx='82' cy='78' rx='12' ry='2.2'/><ellipse cx='50' cy='70' rx='16' ry='1.8'/></g>
  ${dots(
    '#fff',
    [
      [12, 16, 0.8],
      [88, 20, 0.8],
      [20, 40, 0.6],
      [82, 44, 0.6],
      [8, 54, 0.5],
      [94, 56, 0.5],
    ],
    0.95
  )}
`);

const DRAGON_HOARD = scene(`
  <defs>${grad('w', '#1a0d0a', '#3a1a10')}${radial('g', '#ffe082', '#ff8f00', '#ff8f0000')}${grad('h', '#ffe082', '#f9a825')}</defs>
  <rect width='100' height='100' fill='url(#w)'/>
  <ellipse cx='50' cy='66' rx='62' ry='34' fill='url(#g)' opacity='0.55'/>
  <g fill='#120806'><path d='M0 0 L 100 0 L 100 16 L 90 30 L 84 14 L 76 26 L 68 10 L 58 22 L 50 8 L 42 24 L 32 10 L 24 28 L 16 12 L 8 30 L 0 18 Z'/><path d='M0 100 L 0 40 Q 10 50 8 70 Q 14 84 6 100 Z'/><path d='M100 100 L 100 36 Q 88 48 92 68 Q 86 84 94 100 Z'/></g>
  <path d='M0 100 L 0 66 Q 10 56 22 61 Q 34 53 50 58 Q 66 52 78 60 Q 90 56 100 64 L 100 100 Z' fill='url(#h)'/>
  <path d='M0 100 L 0 84 Q 20 74 40 80 Q 60 74 80 82 Q 92 80 100 86 L 100 100 Z' fill='#f57f17' opacity='0.4'/>
  <g transform='translate(0 -13)'>${dots(
    '#fff8e1',
    [
      [12, 80, 0.7],
      [30, 72, 0.8],
      [48, 70, 0.7],
      [66, 68, 0.8],
      [84, 76, 0.7],
      [56, 78, 0.5],
      [22, 86, 0.5],
    ],
    0.95
  )}
  ${dots('#ffd54f', [
    [8, 88, 1.6],
    [18, 92, 1.6],
    [86, 90, 1.6],
    [94, 94, 1.6],
    [74, 84, 1.4],
  ])}${dots('#f9a825', [
    [8, 88, 0.9],
    [18, 92, 0.9],
    [86, 90, 0.9],
    [94, 94, 0.9],
    [74, 84, 0.8],
  ])}
  <path d='M12 78 L 15 72 L 18 78 L 15 82 Z' fill='#e53935'/><path d='M84 72 L 87 66 L 90 72 L 87 76 Z' fill='#29b6f6'/><path d='M36 70 L 38.4 65 L 40.8 70 L 38.4 73.4 Z' fill='#66bb6a'/>
  <path d='M24 74 L 22 66 L 25 69 L 27 64 L 29 69 L 32 66 L 30 74 Z' fill='#fff59d'/>${dots('#e53935', [[27, 71, 0.7]])}
  <rect x='62' y='60' width='10' height='8' rx='1' fill='#6d4c41'/><path d='M62 60 Q 67 54 72 60 Z' fill='#8d6e63'/><rect x='62' y='62.6' width='10' height='1.2' fill='#ffca28'/></g>
  ${[
    [14, 46],
    [86, 42],
  ]
    .map(
      ([x, y]) =>
        `<rect x='${x - 0.6}' y='${y}' width='1.2' height='6' fill='#4e342e'/><path d='M${x - 1.6} ${y} Q ${x - 2.2} ${y - 3} ${x} ${y - 5.4} Q ${x + 2.2} ${y - 3} ${x + 1.6} ${y} Z' fill='#ff7043'/><path d='M${x - 0.8} ${y} Q ${x - 1} ${y - 1.6} ${x} ${y - 3} Q ${x + 1} ${y - 1.6} ${x + 0.8} ${y} Z' fill='#ffe082'/>`
    )
    .join('')}
`);

const TIME_VORTEX = scene(`
  <defs>${radial('v', '#fff8e1', '#b388ff', '#4527a0', '#0d0628')}</defs>
  <rect width='100' height='100' fill='#0d0628'/><circle cx='50' cy='46' r='70' fill='url(#v)'/>
  <g fill='none' stroke='#fff' opacity='0.28'>${[10, 18, 27, 37, 48, 60].map((r, i) => `<circle cx='50' cy='46' r='${r}' stroke-width='${0.5 + i * 0.12}' stroke-dasharray='${4 + i * 3} ${3 + i * 2}'/>`).join('')}</g>
  <g fill='none' stroke='#ffd54f' stroke-width='0.9' opacity='0.7'><path d='M50 46 Q 62 30 82 34 Q 96 40 92 60'/><path d='M50 46 Q 38 62 18 58 Q 4 52 8 32'/><path d='M50 46 Q 66 58 62 78'/><path d='M50 46 Q 34 34 38 14'/></g>
  ${[
    [16, 20, 7],
    [84, 22, 6],
    [10, 70, 5],
    [90, 72, 6],
  ]
    .map(
      ([x, y, r]) =>
        `<circle cx='${x}' cy='${y}' r='${r}' fill='#fff8e1' stroke='#ffd54f' stroke-width='1'/><line x1='${x}' y1='${y}' x2='${x}' y2='${y - r * 0.62}' stroke='#3e2723' stroke-width='0.8' stroke-linecap='round'/><line x1='${x}' y1='${y}' x2='${x + r * 0.45}' y2='${y + r * 0.2}' stroke='#3e2723' stroke-width='0.8' stroke-linecap='round'/><circle cx='${x}' cy='${y}' r='0.7' fill='#e53935'/>`
    )
    .join('')}
  <g fill='#ffd54f' opacity='0.85'>${['XII', 'III', 'VI', 'IX'].map((_, i) => `<rect x='${[49, 73, 49, 25][i]}' y='${[14, 45, 76, 45][i]}' width='${i % 2 ? 4 : 2}' height='${i % 2 ? 2 : 4}'/>`).join('')}</g>
  ${dots(
    '#fff',
    [
      [30, 26, 0.7],
      [70, 30, 0.6],
      [26, 60, 0.6],
      [74, 64, 0.7],
      [44, 10, 0.5],
      [58, 84, 0.5],
      [36, 44, 0.4],
      [66, 48, 0.4],
    ],
    0.95
  )}
  <ellipse cx='50' cy='90' rx='70' ry='30' fill='#1c1140'/><ellipse cx='50' cy='90' rx='70' ry='30' fill='none' stroke='#ffd54f' stroke-width='1.2'/><ellipse cx='50' cy='91' rx='58' ry='24' fill='#2a1a5c'/>
  <g stroke='#ffd54f' stroke-width='1' stroke-linecap='round'>${Array.from(
    { length: 7 },
    (_, i) => {
      const a = Math.PI + ((i + 0.5) * Math.PI) / 7;
      return `<line x1='${(50 + Math.cos(a) * 52).toFixed(1)}' y1='${(91 + Math.sin(a) * 21).toFixed(1)}' x2='${(50 + Math.cos(a) * 57).toFixed(1)}' y2='${(91 + Math.sin(a) * 23.4).toFixed(1)}'/>`;
    }
  ).join('')}</g>
  <g stroke='#b388ff' stroke-width='0.8' opacity='0.7'><line x1='50' y1='91' x2='24' y2='80'/><line x1='50' y1='91' x2='70' y2='74'/></g>
`);

const GOLDEN_STAGE = scene(`
  <defs>${grad('w', '#3a0a14', '#12040a')}${grad('f', '#c99a3c', '#7a5718')}${grad('b', '#fff3c4', '#fff3c400')}</defs>
  <rect width='100' height='74' fill='url(#w)'/>
  <path d='M10 0 L 26 0 L 44 74 L 6 74 Z' fill='url(#b)' opacity='0.3'/><path d='M74 0 L 90 0 L 94 74 L 56 74 Z' fill='url(#b)' opacity='0.3'/><path d='M44 0 L 56 0 L 70 74 L 30 74 Z' fill='url(#b)' opacity='0.22'/>
  <path d='M0 0 L 100 0 L 100 8 Q 90 16 80 8 Q 70 16 60 8 Q 50 16 40 8 Q 30 16 20 8 Q 10 16 0 8 Z' fill='#b71c1c'/><path d='M0 0 L 12 0 L 10 70 Q 4 74 0 72 Z' fill='#c62828'/><path d='M100 0 L 88 0 L 90 70 Q 96 74 100 72 Z' fill='#c62828'/>
  <g stroke='#8e1b1b' stroke-width='0.7'><line x1='4' y1='8' x2='3' y2='72'/><line x1='8' y1='8' x2='7.6' y2='71'/><line x1='96' y1='8' x2='97' y2='72'/><line x1='92' y1='8' x2='92.4' y2='71'/></g>
  <g fill='#ffd54f'>${Array.from({ length: 9 }, (_, i) => `<circle cx='${10 + i * 10}' cy='${9.6 + (i % 2) * 5.4}' r='1'/>`).join('')}</g>
  <g><rect x='78' y='56' width='10' height='3' fill='#3e2723'/><rect x='80' y='52' width='6' height='4' fill='#5d4037'/><path d='M83 52 L 81 46 Q 79 40 81 36 L 85 36 Q 87 40 85 46 Z' fill='#ffd54f'/><circle cx='83' cy='33.6' r='2.4' fill='#ffd54f'/><path d='M80.4 38 L 78 42 M85.6 38 L 88 42' stroke='#ffd54f' stroke-width='1.2' stroke-linecap='round'/><path d='M82.2 36 L 82.6 46' stroke='#fff8e1' stroke-width='0.5' opacity='0.8'/></g>
  <g><path d='M12 59 L 22 59 L 20 44 L 14 44 Z' fill='#ffd54f'/><path d='M14 44 L 20 44 L 20 40 Q 17 37 14 40 Z' fill='#ffca28'/><path d='M14 46 Q 9 46 10 52 Q 11 55 14.6 54' stroke='#ffd54f' stroke-width='1.1' fill='none'/><path d='M20 46 Q 25 46 24 52 Q 23 55 19.4 54' stroke='#ffd54f' stroke-width='1.1' fill='none'/><rect x='10' y='59' width='14' height='3' fill='#3e2723'/></g>
  <rect y='60' width='100' height='40' fill='url(#f)'/><rect y='60' width='100' height='2' fill='#ffe082'/>
  <g stroke='#6a4a12' stroke-width='0.4' opacity='0.8'><line x1='0' y1='72' x2='100' y2='72'/><line x1='0' y1='86' x2='100' y2='86'/><line x1='26' y1='62' x2='18' y2='100'/><line x1='50' y1='62' x2='50' y2='100'/><line x1='74' y1='62' x2='82' y2='100'/></g>
  <ellipse cx='50' cy='88' rx='28' ry='7' fill='#fff8e1' opacity='0.22'/>
  ${dots(
    '#fff8e1',
    [
      [30, 30, 0.7],
      [66, 24, 0.6],
      [48, 40, 0.5],
      [58, 52, 0.6],
      [36, 56, 0.5],
    ],
    0.9
  )}
`);

export const EXTRA_SCENES: ExtraScene[] = [
  {
    id: 'sunflowerField',
    name: 'Sonnenblumenfeld',
    description: 'Riesige Blüten unter blauem Himmel',
    rarity: 'common',
    svg: SUNFLOWER_FIELD,
    animationClass: 'pet-bg-anim-clouds-drift',
    glowColor: 'rgba(255, 213, 79, 0.45)',
  },
  {
    id: 'rainbowMeadow',
    name: 'Regenbogenwiese',
    description: 'Ein Regenbogen spannt sich über die Wiese',
    rarity: 'common',
    svg: RAINBOW_MEADOW,
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 245, 157, 0.45)',
  },
  {
    id: 'cozyLivingRoom',
    name: 'Wohnzimmer',
    description: 'Sessel, Teppich und Stehlampe',
    rarity: 'common',
    svg: COZY_LIVING_ROOM,
    animationClass: 'pet-bg-anim-pulse-warm',
    glowColor: 'rgba(255, 224, 163, 0.45)',
  },
  {
    id: 'playground',
    name: 'Spielplatz',
    description: 'Schaukel, Rutsche und Sandkasten',
    rarity: 'common',
    svg: PLAYGROUND,
    animationClass: 'pet-bg-anim-clouds-drift',
    glowColor: 'rgba(255, 241, 168, 0.45)',
  },
  {
    id: 'vegetablePatch',
    name: 'Gemüsebeet',
    description: 'Karotten, Salat und Erdbeeren am Zaun',
    rarity: 'common',
    svg: VEGETABLE_PATCH,
    animationClass: 'pet-bg-anim-clouds-drift',
    glowColor: 'rgba(197, 225, 165, 0.45)',
  },
  {
    id: 'laundryDay',
    name: 'Waschtag',
    description: 'Bunte Wäsche flattert auf der Leine',
    rarity: 'common',
    svg: LAUNDRY_DAY,
    animationClass: 'pet-bg-anim-clouds-drift',
    glowColor: 'rgba(225, 245, 254, 0.5)',
  },
  {
    id: 'harborDock',
    name: 'Kleiner Hafen',
    description: 'Segelboot und Kutter am Holzsteg',
    rarity: 'common',
    svg: HARBOR_DOCK,
    animationClass: 'pet-bg-anim-waves',
    glowColor: 'rgba(255, 224, 178, 0.45)',
  },
  {
    id: 'farmBarn',
    name: 'Bauernhof',
    description: 'Rote Scheune, Silo und ein Huhn',
    rarity: 'common',
    svg: FARM_BARN,
    animationClass: 'pet-bg-anim-clouds-drift',
    glowColor: 'rgba(255, 241, 168, 0.45)',
  },
  {
    id: 'forestPath',
    name: 'Waldweg',
    description: 'Sonnenstrahlen fallen durchs Blätterdach',
    rarity: 'common',
    svg: FOREST_PATH,
    animationClass: 'pet-bg-anim-leaves',
    glowColor: 'rgba(220, 237, 200, 0.5)',
  },
  {
    id: 'snackBar',
    name: 'Snackbar',
    description: 'Popcornmaschine und Getränke im Kinofoyer',
    rarity: 'common',
    svg: SNACK_BAR,
    animationClass: 'pet-bg-anim-twinkle',
    glowColor: 'rgba(255, 202, 40, 0.45)',
  },

  {
    id: 'campfire',
    name: 'Lagerfeuer',
    description: 'Zelt und knisterndes Feuer unter Sternen',
    rarity: 'uncommon',
    svg: CAMPFIRE,
    animationClass: 'pet-bg-anim-firefly pet-bg-anim-pulse-warm',
    glowColor: 'rgba(255, 167, 38, 0.5)',
  },
  {
    id: 'library',
    name: 'Bibliothek',
    description: 'Regale bis zur Decke und ein Bogenfenster',
    rarity: 'uncommon',
    svg: LIBRARY,
    animationClass: 'pet-bg-anim-pulse-warm',
    glowColor: 'rgba(255, 224, 163, 0.45)',
  },
  {
    id: 'bakery',
    name: 'Bäckerei',
    description: 'Frisches Brot, Croissants und Törtchen',
    rarity: 'uncommon',
    svg: BAKERY,
    animationClass: 'pet-bg-anim-steam',
    glowColor: 'rgba(255, 224, 178, 0.5)',
  },
  {
    id: 'ferrisWheel',
    name: 'Riesenrad',
    description: 'Rummelplatz in der Abenddämmerung',
    rarity: 'uncommon',
    svg: FERRIS_WHEEL,
    animationClass: 'pet-bg-anim-twinkle',
    glowColor: 'rgba(255, 171, 145, 0.5)',
  },
  {
    id: 'rooftopSunset',
    name: 'Dachterrasse',
    description: 'Lichterkette über den Dächern der Stadt',
    rarity: 'uncommon',
    svg: ROOFTOP_SUNSET,
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-pulse-warm',
    glowColor: 'rgba(255, 183, 77, 0.5)',
  },
  {
    id: 'mushroomGlade',
    name: 'Pilzlichtung',
    description: 'Fliegenpilze im dämmrigen Wald',
    rarity: 'uncommon',
    svg: MUSHROOM_GLADE,
    animationClass: 'pet-bg-anim-firefly',
    glowColor: 'rgba(230, 255, 138, 0.45)',
  },
  {
    id: 'autumnAlley',
    name: 'Herbstallee',
    description: 'Goldene Bäume säumen den Weg',
    rarity: 'uncommon',
    svg: AUTUMN_ALLEY,
    animationClass: 'pet-bg-anim-leaves',
    glowColor: 'rgba(255, 204, 128, 0.5)',
  },
  {
    id: 'iceRink',
    name: 'Eisbahn',
    description: 'Glattes Eis unter Lichterketten',
    rarity: 'uncommon',
    svg: ICE_RINK,
    animationClass: 'pet-bg-anim-snow',
    glowColor: 'rgba(187, 222, 251, 0.5)',
  },
  {
    id: 'rainyStreet',
    name: 'Regenstraße',
    description: 'Laternenlicht spiegelt sich in Pfützen',
    rarity: 'uncommon',
    svg: RAINY_STREET,
    animationClass: 'pet-bg-anim-rain',
    glowColor: 'rgba(255, 224, 130, 0.4)',
  },
  {
    id: 'surfBeach',
    name: 'Surfstrand',
    description: 'Große Wellen, Palme und Surfbretter',
    rarity: 'uncommon',
    svg: SURF_BEACH,
    animationClass: 'pet-bg-anim-waves',
    glowColor: 'rgba(128, 222, 234, 0.5)',
  },

  {
    id: 'cinemaHall',
    name: 'Kinosaal',
    description: 'Rote Sessel vor der großen Leinwand',
    rarity: 'rare',
    svg: CINEMA_HALL,
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(187, 222, 251, 0.5)',
  },
  {
    id: 'gamingRoom',
    name: 'Gaming-Zimmer',
    description: 'Neonlicht, Monitor und Controller',
    rarity: 'rare',
    svg: GAMING_ROOM,
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-breathe',
    glowColor: 'rgba(124, 77, 255, 0.5)',
  },
  {
    id: 'greenhouse',
    name: 'Gewächshaus',
    description: 'Pflanzen hinter sonnigen Glasscheiben',
    rarity: 'rare',
    svg: GREENHOUSE,
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(200, 230, 201, 0.5)',
  },
  {
    id: 'pirateCove',
    name: 'Piratenbucht',
    description: 'Schatztruhe am Strand, Schiff vor Anker',
    rarity: 'rare',
    svg: PIRATE_COVE,
    animationClass: 'pet-bg-anim-waves',
    glowColor: 'rgba(255, 213, 79, 0.5)',
  },
  {
    id: 'medievalCastle',
    name: 'Burg',
    description: 'Türme, Zinnen und wehende Fahnen',
    rarity: 'rare',
    svg: MEDIEVAL_CASTLE,
    animationClass: 'pet-bg-anim-clouds-drift',
    glowColor: 'rgba(207, 216, 220, 0.5)',
  },
  {
    id: 'desertOasis',
    name: 'Oase',
    description: 'Palmen am Wasser zwischen Dünen',
    rarity: 'rare',
    svg: DESERT_OASIS,
    animationClass: 'pet-bg-anim-pulse-warm',
    glowColor: 'rgba(255, 224, 130, 0.5)',
  },
  {
    id: 'shrineGate',
    name: 'Schrein-Tor',
    description: 'Rotes Tor im Herbstlaub',
    rarity: 'rare',
    svg: SHRINE_GATE,
    animationClass: 'pet-bg-anim-leaves',
    glowColor: 'rgba(255, 171, 145, 0.5)',
  },
  {
    id: 'treehouse',
    name: 'Baumhaus',
    description: 'Strickleiter, Reifenschaukel und rotes Dach',
    rarity: 'rare',
    svg: TREEHOUSE,
    animationClass: 'pet-bg-anim-leaves',
    glowColor: 'rgba(220, 237, 200, 0.5)',
  },
  {
    id: 'nightMarket',
    name: 'Nachtmarkt',
    description: 'Laternen und Stände in der Gasse',
    rarity: 'rare',
    svg: NIGHT_MARKET,
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-pulse-warm',
    glowColor: 'rgba(255, 112, 67, 0.5)',
  },

  {
    id: 'spaceStation',
    name: 'Raumstation',
    description: 'Panoramafenster mit Blick auf die Erde',
    rarity: 'epic',
    svg: SPACE_STATION,
    animationClass: 'pet-bg-anim-twinkle',
    glowColor: 'rgba(110, 198, 255, 0.5)',
  },
  {
    id: 'dinoValley',
    name: 'Dino-Tal',
    description: 'Vulkan, Farne und ein Langhals am Horizont',
    rarity: 'epic',
    svg: DINO_VALLEY,
    animationClass: 'pet-bg-anim-pulse-warm',
    glowColor: 'rgba(255, 183, 77, 0.5)',
  },
  {
    id: 'wizardTower',
    name: 'Zauberturm',
    description: 'Leuchtende Fenster und ein Bannkreis',
    rarity: 'epic',
    svg: WIZARD_TOWER,
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-firefly',
    glowColor: 'rgba(179, 136, 255, 0.55)',
  },
  {
    id: 'candyLand',
    name: 'Zuckerland',
    description: 'Lollis, Zuckerstangen und Sahneberge',
    rarity: 'epic',
    svg: CANDY_LAND,
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(248, 187, 208, 0.55)',
  },
  {
    id: 'atlantis',
    name: 'Atlantis',
    description: 'Versunkener Tempel im Lichtschein',
    rarity: 'epic',
    svg: ATLANTIS,
    animationClass: 'pet-bg-anim-bubbles',
    glowColor: 'rgba(128, 222, 234, 0.55)',
  },
  {
    id: 'cyberCity',
    name: 'Cyber-Stadt',
    description: 'Neon-Skyline mit fliegenden Autos',
    rarity: 'epic',
    svg: CYBER_CITY,
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-breathe',
    glowColor: 'rgba(255, 64, 129, 0.55)',
  },
  {
    id: 'hauntedMansion',
    name: 'Spukhaus',
    description: 'Vollmond, Nebel und ein kleiner Geist',
    rarity: 'epic',
    svg: HAUNTED_MANSION,
    animationClass: 'pet-bg-anim-firefly pet-bg-anim-breathe',
    glowColor: 'rgba(245, 243, 215, 0.45)',
  },

  {
    id: 'cloudCastle',
    name: 'Wolkenschloss',
    description: 'Goldene Türme hoch über den Wolken',
    rarity: 'legendary',
    svg: CLOUD_CASTLE,
    animationClass: 'pet-bg-anim-clouds-drift pet-bg-anim-twinkle',
    glowColor: 'rgba(255, 253, 231, 0.6)',
  },
  {
    id: 'dragonHoard',
    name: 'Drachenhort',
    description: 'Berge aus Gold in der Glutgrotte',
    rarity: 'legendary',
    svg: DRAGON_HOARD,
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-pulse-warm',
    glowColor: 'rgba(255, 193, 7, 0.6)',
  },
  {
    id: 'timeVortex',
    name: 'Zeitstrudel',
    description: 'Uhren treiben durch den Wirbel der Zeit',
    rarity: 'legendary',
    svg: TIME_VORTEX,
    animationClass: 'pet-bg-anim-aurora pet-bg-anim-twinkle',
    glowColor: 'rgba(179, 136, 255, 0.6)',
  },
  {
    id: 'goldenStage',
    name: 'Goldene Bühne',
    description: 'Scheinwerfer, Pokale und roter Vorhang',
    rarity: 'legendary',
    svg: GOLDEN_STAGE,
    animationClass: 'pet-bg-anim-lighthouse pet-bg-anim-twinkle',
    glowColor: 'rgba(255, 215, 0, 0.6)',
  },
];
