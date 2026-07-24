import type { AccessoryRarity, PetBackgroundDefinition } from '../../../types/pet.types';
import { t } from '../../../services/i18n';

/** Wraps an inline SVG in a data URI CSS background value. */
function bgUrl(svg: string): string {
  const compact = svg.trim().replace(/>\s+</g, '><').replace(/\s+/g, ' ');
  return `url("data:image/svg+xml,${encodeURIComponent(compact)}") center/cover no-repeat`;
}

// Alle Szenen nutzen viewBox 0 0 100 100 und 'xMidYMid slice' um das quadratische
// Pet-Display passgenau zu fuellen. Attribute werden mit ' statt " geschrieben.

const SVG_CLEAR_SKY = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='a' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4da3d8'/><stop offset='0.6' stop-color='#8fcdec'/><stop offset='1' stop-color='#e6f5fd'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#a)'/>
  <circle cx='82' cy='16' r='7' fill='#fff6b8'/><circle cx='82' cy='16' r='11' fill='#fff6b8' opacity='0.3'/>
  <g fill='#fff' opacity='0.5'><ellipse cx='32' cy='50' rx='12' ry='3'/><ellipse cx='72' cy='62' rx='10' ry='2.6'/><ellipse cx='10' cy='40' rx='8' ry='2.4'/></g>
  <g fill='#fff'>
    <ellipse cx='22' cy='26' rx='13' ry='4.6'/><ellipse cx='30' cy='22' rx='8' ry='3.8'/><ellipse cx='14' cy='23' rx='6' ry='3'/>
    <ellipse cx='66' cy='38' rx='15' ry='5'/><ellipse cx='75' cy='34' rx='9' ry='4'/>
  </g>
  <ellipse cx='24' cy='28.5' rx='11' ry='2.2' fill='#cfe8f5' opacity='0.7'/>
  <ellipse cx='68' cy='41' rx='12' ry='2.4' fill='#cfe8f5' opacity='0.6'/>
  <g stroke='#3f6f8e' stroke-width='0.8' fill='none' stroke-linecap='round'><path d='M42 14 q 2.5 -2.5 5 0 q 2.5 -2.5 5 0'/><path d='M54 21 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_FLOWER_MEADOW = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#6db9e8'/><stop offset='1' stop-color='#ecf7fd'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#93d284'/><stop offset='1' stop-color='#3f9440'/></linearGradient>
  </defs>
  <rect width='100' height='62' fill='url(#s)'/>
  <circle cx='16' cy='13' r='6' fill='#fff6b0'/><circle cx='16' cy='13' r='9.5' fill='#fff6b0' opacity='0.3'/>
  <ellipse cx='62' cy='20' rx='11' ry='3' fill='#fff' opacity='0.9'/>
  <path d='M0 60 Q 30 50 60 58 T 100 54 L 100 72 L 0 72 Z' fill='#b8e0a2' opacity='0.85'/>
  <path d='M0 64 Q 25 57 50 64 T 100 62 L 100 100 L 0 100 Z' fill='url(#g)'/>
  <g stroke='#2e7d32' stroke-width='0.7' fill='none'><path d='M10 82 q 1 -6 0 -9'/><path d='M23 90 q -1 -6 0 -9'/><path d='M82 84 q 1 -6 0 -9'/><path d='M92 92 q -1 -6 0 -9'/></g>
  <g><circle cx='10' cy='71' r='2.4' fill='#ff6b9d'/><circle cx='10' cy='71' r='1' fill='#ffe082'/><circle cx='23' cy='79' r='2.4' fill='#fff'/><circle cx='23' cy='79' r='1' fill='#ffca28'/><circle cx='82' cy='73' r='2.4' fill='#a479f1'/><circle cx='82' cy='73' r='1' fill='#ffe082'/><circle cx='92' cy='81' r='2.4' fill='#ffd54f'/><circle cx='92' cy='81' r='1' fill='#ef6c00'/></g>
  <g fill='#fff275'><circle cx='50' cy='95' r='1.2'/><circle cx='74' cy='84' r='1.2'/></g>
  <g fill='#e57373'><ellipse cx='42' cy='16' rx='1.8' ry='2.4'/><ellipse cx='45.4' cy='16' rx='1.8' ry='2.4'/></g>
</svg>`;

const SVG_SUNNY_BEACH = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='k' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#5cb6e8'/><stop offset='1' stop-color='#cdeaf8'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1e6f96'/><stop offset='1' stop-color='#54a7c6'/></linearGradient>
    <linearGradient id='d' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f8dc9b'/><stop offset='1' stop-color='#e3b271'/></linearGradient>
  </defs>
  <rect width='100' height='55' fill='url(#k)'/>
  <circle cx='80' cy='16' r='6.5' fill='#fff5c2'/><circle cx='80' cy='16' r='10.5' fill='#fff5c2' opacity='0.35'/>
  <ellipse cx='22' cy='24' rx='11' ry='3.2' fill='#fff' opacity='0.9'/>
  <path d='M14 50 L 14 42 Q 20 45 14 47 Z' fill='#fff'/><path d='M13 50 L 20 50 L 18 52 L 15 52 Z' fill='#e07a5f'/>
  <rect y='53' width='100' height='29' fill='url(#w)'/>
  <path d='M0 58 Q 15 56 30 58 T 60 58 T 100 58 L 100 61 L 0 61 Z' fill='#fff' opacity='0.3'/>
  <path d='M0 68 Q 20 66 40 68 T 80 68 T 100 68 L 100 70 L 0 70 Z' fill='#fff' opacity='0.2'/>
  <path d='M0 80 Q 25 76 50 80 T 100 79 L 100 100 L 0 100 Z' fill='url(#d)'/>
  <path d='M0 80 Q 25 76 50 80 T 100 79 L 100 82 Q 50 84 0 83 Z' fill='#fff' opacity='0.5'/>
  <g fill='#f2a65a'><path d='M10 90 L 12 86 L 14 90 L 18 91 L 14 93 L 15 97 L 12 94 L 9 97 L 10 93 L 6 91 Z'/></g>
  <g fill='#e8875f'><path d='M88 92 q 3 -4 6 0 q -3 3 -6 0'/></g>
  <g stroke='#3f6f8e' stroke-width='0.7' fill='none' stroke-linecap='round'><path d='M38 16 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_ROLLING_HILLS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7bc2ea'/><stop offset='1' stop-color='#e9f5fc'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='76' cy='18' r='6.5' fill='#fff3a8'/><circle cx='76' cy='18' r='10' fill='#fff3a8' opacity='0.35'/>
  <ellipse cx='20' cy='26' rx='11' ry='3.2' fill='#fff' opacity='0.9'/><ellipse cx='52' cy='34' rx='8' ry='2.4' fill='#fff' opacity='0.75'/>
  <path d='M0 62 Q 25 50 55 60 T 100 54 L 100 76 L 0 76 Z' fill='#c4e39c'/>
  <path d='M0 72 Q 30 60 60 70 T 100 66 L 100 88 L 0 88 Z' fill='#94ce6d'/>
  <path d='M0 84 Q 25 74 55 82 T 100 80 L 100 100 L 0 100 Z' fill='#5fa945'/>
  <rect x='79' y='56' width='2' height='7' fill='#6d4c41'/><circle cx='80' cy='53' r='5.5' fill='#3e8e41'/><circle cx='77.5' cy='55' r='3.4' fill='#4ba24e'/>
  <g fill='#fdfdfd'><ellipse cx='14' cy='79' rx='2.6' ry='1.8'/><ellipse cx='22' cy='82' rx='2.6' ry='1.8'/></g>
  <g fill='#5d4037'><circle cx='12' cy='78.6' r='0.9'/><circle cx='20' cy='81.6' r='0.9'/></g>
  <path d='M0 87 Q 30 84 60 87' stroke='#e8d9a0' stroke-width='1.6' fill='none' opacity='0.7'/>
</svg>`;

const SVG_AUTUMN_FIELD = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8fb8dc'/><stop offset='1' stop-color='#f4e3c4'/></linearGradient>
    <linearGradient id='f' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#efc25a'/><stop offset='1' stop-color='#b07e1c'/></linearGradient>
  </defs>
  <rect width='100' height='56' fill='url(#s)'/>
  <circle cx='20' cy='16' r='6' fill='#fff2b0'/><circle cx='20' cy='16' r='9.5' fill='#fff2b0' opacity='0.35'/>
  <ellipse cx='64' cy='22' rx='11' ry='3' fill='#fff' opacity='0.85'/>
  <g fill='#c78e4a' opacity='0.65'><ellipse cx='10' cy='53' rx='9' ry='4'/><ellipse cx='34' cy='54' rx='12' ry='4.5'/><ellipse cx='72' cy='53' rx='14' ry='4.5'/><ellipse cx='94' cy='54' rx='8' ry='3.6'/></g>
  <rect y='55' width='100' height='45' fill='url(#f)'/>
  <g stroke='#96690f' stroke-width='0.6' opacity='0.5'><path d='M0 66 Q 50 63 100 66'/><path d='M0 76 Q 50 72 100 76'/><path d='M0 87 Q 50 82 100 87'/></g>
  <g fill='#d9a441'><ellipse cx='14' cy='72' rx='6' ry='4.6'/><path d='M8 72 A 6 4.6 0 0 1 20 72' fill='none' stroke='#b07e1c' stroke-width='0.7'/></g>
  <g fill='#d9a441'><ellipse cx='87' cy='78' rx='7' ry='5.2'/></g>
  <g stroke='#96690f' stroke-width='0.5' opacity='0.7'><line x1='81' y1='78' x2='93' y2='78'/><line x1='9' y1='72' x2='19' y2='72'/></g>
  <g fill='#c0392b'><path d='M42 12 q 2 -3 4 0 q -1 3 -4 3 Z'/></g>
  <g fill='#e67e22'><path d='M58 30 q 2 -3 4 0 q -1 3 -4 3 Z'/><path d='M30 38 q 2 -3 4 0 q -1 3 -4 3 Z'/></g>
</svg>`;

const SVG_SUNSET = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#1e1b4b'/><stop offset='0.3' stop-color='#7a2160'/><stop offset='0.6' stop-color='#e8604c'/><stop offset='0.88' stop-color='#ffb347'/><stop offset='1' stop-color='#ffd86b'/>
    </linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2a1a52'/><stop offset='1' stop-color='#120c38'/></linearGradient>
  </defs>
  <rect width='100' height='64' fill='url(#s)'/>
  <g fill='#ffd9e8' opacity='0.4'><ellipse cx='22' cy='30' rx='14' ry='2.4'/><ellipse cx='72' cy='22' rx='11' ry='2'/><ellipse cx='40' cy='42' rx='16' ry='2'/></g>
  <circle cx='50' cy='60' r='9' fill='#fff5a0'/><circle cx='50' cy='60' r='14' fill='#ffe27a' opacity='0.35'/><circle cx='50' cy='60' r='20' fill='#ff9d5c' opacity='0.18'/>
  <rect y='64' width='100' height='36' fill='url(#w)'/>
  <path d='M0 64 Q 50 62 100 64' stroke='#ffb56b' stroke-width='0.8' fill='none' opacity='0.7'/>
  <g fill='#ffdf8a'><ellipse cx='50' cy='68' rx='12' ry='1' opacity='0.65'/><ellipse cx='50' cy='74' rx='8' ry='0.9' opacity='0.45'/><ellipse cx='50' cy='82' rx='5' ry='0.7' opacity='0.3'/><ellipse cx='50' cy='90' rx='3' ry='0.6' opacity='0.2'/></g>
  <path d='M20 66 L 20 61 Q 25 63 20 64 Z' fill='#241540'/><path d='M17 66 L 24 66 L 22 68 L 18 68 Z' fill='#241540'/>
  <g stroke='#241540' stroke-width='0.8' fill='none' stroke-linecap='round'><path d='M66 18 q 2.5 -2.5 5 0 q 2.5 -2.5 5 0'/><path d='M30 12 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_MOUNTAIN_LAKE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#79b6e2'/><stop offset='1' stop-color='#ddeef8'/></linearGradient>
    <linearGradient id='l' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#5f94b5'/><stop offset='1' stop-color='#2e5f80'/></linearGradient>
  </defs>
  <rect width='100' height='62' fill='url(#s)'/>
  <circle cx='80' cy='14' r='5.5' fill='#fff3a8'/><circle cx='80' cy='14' r='9' fill='#fff3a8' opacity='0.3'/>
  <ellipse cx='24' cy='18' rx='10' ry='2.8' fill='#fff' opacity='0.85'/>
  <g fill='#a7c4dd'><path d='M-4 62 L 16 30 L 36 62 Z'/><path d='M52 62 L 70 34 L 88 62 Z'/></g>
  <g fill='#6e93b4'><path d='M10 62 L 32 24 L 54 62 Z'/><path d='M66 62 L 86 30 L 104 62 Z'/></g>
  <g fill='#fff'><path d='M32 24 L 37 32 L 27 32 Z'/><path d='M86 30 L 90 36 L 82 36 Z'/><path d='M16 30 L 20 36 L 12 36 Z'/></g>
  <rect y='62' width='100' height='38' fill='url(#l)'/>
  <g fill='#8fb4cd' opacity='0.5'><path d='M14 62 L 30 82 L 46 62 Z'/><path d='M70 62 L 84 80 L 98 62 Z'/></g>
  <g stroke='#cfe5f2' stroke-width='0.7' opacity='0.7'><line x1='8' y1='70' x2='22' y2='70'/><line x1='60' y1='76' x2='78' y2='76'/><line x1='26' y1='88' x2='42' y2='88'/></g>
  <g fill='#1c4a38'><path d='M4 66 L 7 56 L 10 66 Z'/><path d='M92 68 L 95 57 L 98 68 Z'/></g>
</svg>`;

const SVG_CHERRY_TREES = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#9fd0ee'/><stop offset='1' stop-color='#fde8ef'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a8d98a'/><stop offset='1' stop-color='#6cae57'/></linearGradient>
  </defs>
  <rect width='100' height='78' fill='url(#s)'/>
  <circle cx='52' cy='14' r='5.5' fill='#fff6c0'/><circle cx='52' cy='14' r='9' fill='#fff6c0' opacity='0.3'/>
  <path d='M0 78 Q 30 70 60 76 T 100 74 L 100 84 L 0 84 Z' fill='#c9e6b0' opacity='0.8'/>
  <path d='M0 80 Q 25 74 50 80 T 100 78 L 100 100 L 0 100 Z' fill='url(#g)'/>
  <path d='M10 84 L 12 60 Q 12 54 8 50 M12 62 Q 16 56 20 54' stroke='#6d4c41' stroke-width='2.2' fill='none'/>
  <g fill='#f8a8c4'><circle cx='8' cy='42' r='9'/><circle cx='20' cy='46' r='8'/><circle cx='14' cy='34' r='7'/><circle cx='0' cy='48' r='7'/></g>
  <g fill='#fdd0e0'><circle cx='11' cy='38' r='4.5'/><circle cx='19' cy='42' r='4'/></g>
  <path d='M90 84 L 88 58 Q 88 52 92 48 M88 60 Q 84 54 80 52' stroke='#6d4c41' stroke-width='2.2' fill='none'/>
  <g fill='#f8a8c4'><circle cx='92' cy='40' r='9'/><circle cx='80' cy='44' r='8'/><circle cx='86' cy='32' r='7'/><circle cx='100' cy='46' r='7'/></g>
  <g fill='#fdd0e0'><circle cx='89' cy='36' r='4.5'/><circle cx='82' cy='40' r='4'/></g>
  <g fill='#fbc2d4'><ellipse cx='36' cy='30' rx='1.4' ry='1'/><ellipse cx='58' cy='42' rx='1.4' ry='1'/><ellipse cx='46' cy='58' rx='1.3' ry='0.9'/></g>
</svg>`;

const SVG_DESERT_DUNES = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f2a45c'/><stop offset='0.6' stop-color='#f8ca7a'/><stop offset='1' stop-color='#fde7ae'/></linearGradient>
    <linearGradient id='d' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e8a95c'/><stop offset='1' stop-color='#c07830'/></linearGradient>
  </defs>
  <rect width='100' height='58' fill='url(#s)'/>
  <circle cx='70' cy='20' r='8' fill='#fff1b8'/><circle cx='70' cy='20' r='13' fill='#ffdf8a' opacity='0.35'/>
  <ellipse cx='24' cy='16' rx='10' ry='2' fill='#ffe6c0' opacity='0.6'/>
  <path d='M0 56 Q 30 44 62 54 T 100 50 L 100 74 L 0 74 Z' fill='#f0c078'/>
  <path d='M0 68 Q 35 56 70 68 T 100 64 L 100 100 L 0 100 Z' fill='url(#d)'/>
  <path d='M0 68 Q 35 56 70 68' stroke='#ffe0a0' stroke-width='0.9' fill='none' opacity='0.8'/>
  <path d='M0 56 Q 30 44 62 54' stroke='#ffedbe' stroke-width='0.8' fill='none' opacity='0.7'/>
  <path d='M0 88 Q 40 80 100 88 L 100 100 L 0 100 Z' fill='#a35f22'/>
  <g fill='#2f6e3e'><rect x='10' y='52' width='2.6' height='12' rx='1.3'/><rect x='6.5' y='54' width='2.2' height='5' rx='1.1'/><rect x='14' y='55' width='2.2' height='4' rx='1.1'/></g>
  <g stroke='#8a4d15' stroke-width='0.5' opacity='0.6'><path d='M74 78 q 6 -1 12 1'/><path d='M82 84 q 6 -1 11 1'/></g>
  <g stroke='#6d4318' stroke-width='0.8' fill='none' stroke-linecap='round'><path d='M34 24 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_TROPICAL_ISLAND = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#66bce8'/><stop offset='1' stop-color='#d8f0fa'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#18a2b8'/><stop offset='1' stop-color='#5fd0d8'/></linearGradient>
  </defs>
  <rect width='100' height='58' fill='url(#s)'/>
  <circle cx='84' cy='14' r='6.5' fill='#fff5c2'/><circle cx='84' cy='14' r='10.5' fill='#fff5c2' opacity='0.35'/>
  <ellipse cx='30' cy='18' rx='11' ry='3' fill='#fff' opacity='0.9'/><ellipse cx='58' cy='28' rx='8' ry='2.2' fill='#fff' opacity='0.7'/>
  <path d='M70 56 L 70 49 Q 76 51 70 53 Z' fill='#fff'/><path d='M68 56 L 74 56 L 72 58 L 69 58 Z' fill='#d95f43'/>
  <rect y='56' width='100' height='44' fill='url(#w)'/>
  <path d='M0 60 Q 20 58 40 60 T 80 60 T 100 60 L 100 62 L 0 62 Z' fill='#fff' opacity='0.3'/>
  <path d='M0 74 Q 25 72 50 74 T 100 74 L 100 76 L 0 76 Z' fill='#fff' opacity='0.18'/>
  <ellipse cx='16' cy='62' rx='20' ry='6' fill='#f4d998'/>
  <path d='M12 60 Q 10 46 16 38' stroke='#8d6e46' stroke-width='2.2' fill='none'/>
  <g fill='#2e9e4f'><path d='M16 38 Q 26 34 32 40 Q 22 40 16 38'/><path d='M16 38 Q 6 32 0 38 Q 10 41 16 38'/><path d='M16 38 Q 20 28 28 28 Q 20 34 16 38'/><path d='M16 38 Q 10 30 4 28 Q 12 34 16 38'/></g>
  <circle cx='14' cy='40' r='1.6' fill='#6d4c41'/><circle cx='18' cy='41' r='1.6' fill='#6d4c41'/>
  <g stroke='#3f6f8e' stroke-width='0.7' fill='none' stroke-linecap='round'><path d='M44 12 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_FOGGY_VALLEY = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#b9c9d6'/><stop offset='1' stop-color='#eef3f6'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='74' cy='18' r='6' fill='#fff' opacity='0.75'/>
  <path d='M0 46 L 22 26 L 44 46 L 62 30 L 82 46 L 100 34 L 100 54 L 0 54 Z' fill='#a3b6c6' opacity='0.7'/>
  <rect y='48' width='100' height='8' fill='#e8eef3' opacity='0.85'/>
  <path d='M0 64 L 26 42 L 52 64 L 74 46 L 100 64 L 100 74 L 0 74 Z' fill='#7e93a6'/>
  <ellipse cx='30' cy='66' rx='26' ry='4' fill='#eef3f6' opacity='0.8'/><ellipse cx='78' cy='70' rx='22' ry='4' fill='#eef3f6' opacity='0.75'/>
  <path d='M0 84 L 20 66 L 44 86 L 66 70 L 100 88 L 100 100 L 0 100 Z' fill='#54697c'/>
  <ellipse cx='50' cy='90' rx='40' ry='5' fill='#e2eaf0' opacity='0.55'/>
  <g fill='#3c5163'><path d='M8 84 L 10 76 L 12 84 Z'/><path d='M88 90 L 90 82 L 92 90 Z'/></g>
  <g stroke='#5d7285' stroke-width='0.8' fill='none' stroke-linecap='round'><path d='M40 20 q 2.5 -2.5 5 0 q 2.5 -2.5 5 0'/><path d='M56 14 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_CITY_NIGHT = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='n' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0c1030'/><stop offset='0.7' stop-color='#232a5c'/><stop offset='1' stop-color='#3d3566'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#n)'/>
  <g fill='#fff'><circle cx='12' cy='12' r='0.8'/><circle cx='30' cy='6' r='0.6'/><circle cx='48' cy='14' r='0.7'/><circle cx='90' cy='16' r='0.7'/><circle cx='22' cy='24' r='0.5'/></g>
  <circle cx='80' cy='16' r='6' fill='#fdf6cd'/><circle cx='78' cy='14' r='1.4' fill='#e8dfa8'/><circle cx='82.5' cy='18.5' r='1' fill='#e8dfa8'/>
  <g fill='#3a4378'><rect x='2' y='46' width='10' height='38'/><rect x='16' y='40' width='12' height='44'/><rect x='48' y='38' width='11' height='46'/><rect x='80' y='42' width='12' height='42'/></g>
  <rect y='62' width='100' height='38' fill='#141833'/>
  <g fill='#1e2447'><rect x='8' y='66' width='14' height='34'/><rect x='28' y='58' width='16' height='42'/><rect x='52' y='64' width='13' height='36'/><rect x='72' y='56' width='15' height='44'/></g>
  <g fill='#ffd87a'>
    <rect x='11' y='70' width='2' height='2.6'/><rect x='16' y='76' width='2' height='2.6'/><rect x='31' y='62' width='2' height='2.6'/><rect x='37' y='68' width='2' height='2.6'/><rect x='31' y='76' width='2' height='2.6'/><rect x='55' y='68' width='2' height='2.6'/><rect x='75' y='60' width='2' height='2.6'/><rect x='81' y='66' width='2' height='2.6'/><rect x='75' y='74' width='2' height='2.6'/>
  </g>
  <circle cx='79' cy='54' r='0.9' fill='#ff5252'/>
</svg>`;

const SVG_PINE_FOREST = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8fb4d4'/><stop offset='1' stop-color='#e6eff6'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='24' cy='16' r='6' fill='#fff' opacity='0.85'/>
  <g fill='#9db8c9'><path d='M8 70 L 15 46 L 22 70 Z'/><path d='M32 70 L 39 44 L 46 70 Z'/><path d='M56 70 L 63 46 L 70 70 Z'/><path d='M80 70 L 87 44 L 94 70 Z'/></g>
  <rect y='68' width='100' height='32' fill='#f2f7fa'/>
  <g fill='#2c5d4a'>
    <path d='M-2 78 L 8 42 L 18 78 Z'/><path d='M84 78 L 93 44 L 102 78 Z'/>
  </g>
  <g fill='#3d7a5f'><path d='M4 74 L 14 46 L 24 74 Z'/><path d='M78 76 L 87 50 L 96 76 Z'/></g>
  <g fill='#fff' opacity='0.9'><path d='M11 52 L 14 46 L 17 52 L 14 51 Z'/><path d='M84 54 L 87 50 L 90 54 L 87 53 Z'/></g>
  <ellipse cx='12' cy='79' rx='14' ry='3' fill='#fff'/><ellipse cx='88' cy='80' rx='14' ry='3' fill='#fff'/>
  <path d='M0 86 Q 30 82 55 86 T 100 85 L 100 100 L 0 100 Z' fill='#fff'/>
  <g fill='#dfe9f0'><ellipse cx='30' cy='90' rx='8' ry='1.6'/><ellipse cx='70' cy='93' rx='9' ry='1.6'/></g>
  <g fill='#fff'><circle cx='34' cy='24' r='1'/><circle cx='54' cy='14' r='0.9'/><circle cx='70' cy='30' r='1'/><circle cx='46' cy='40' r='0.8'/><circle cx='16' cy='34' r='0.8'/><circle cx='88' cy='20' r='0.9'/></g>
</svg>`;

const SVG_ALPINE_SNOW = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#6d9fcb'/><stop offset='0.65' stop-color='#b8d3e8'/><stop offset='1' stop-color='#eef4f9'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='20' cy='16' r='6' fill='#fff8d6' opacity='0.95'/><circle cx='20' cy='16' r='10' fill='#fff8d6' opacity='0.3'/>
  <g fill='#9fbdd8'><path d='M-6 72 L 20 30 L 46 72 Z'/><path d='M56 72 L 78 36 L 100 72 Z'/></g>
  <g fill='#fff'><path d='M20 30 L 28 43 L 20 40 L 12 43 Z'/><path d='M78 36 L 84 46 L 78 43 L 72 46 Z'/></g>
  <g fill='#7898bd'><path d='M20 72 L 48 26 L 76 72 Z'/></g>
  <path d='M48 26 L 57 41 L 51 37 L 48 42 L 44 37 L 39 41 Z' fill='#fff'/>
  <ellipse cx='30' cy='58' rx='16' ry='2.6' fill='#fff' opacity='0.5'/><ellipse cx='72' cy='62' rx='14' ry='2.4' fill='#fff' opacity='0.45'/>
  <path d='M0 76 Q 30 70 55 76 T 100 74 L 100 100 L 0 100 Z' fill='#f4f8fb'/>
  <g fill='#d8e5ef'><ellipse cx='24' cy='84' rx='10' ry='1.8'/><ellipse cx='74' cy='88' rx='11' ry='1.8'/></g>
  <g fill='#2c5d4a'><path d='M6 82 L 9 72 L 12 82 Z'/><path d='M90 84 L 93 74 L 96 84 Z'/></g>
  <g fill='#fff'><circle cx='40' cy='16' r='1'/><circle cx='60' cy='10' r='0.9'/><circle cx='86' cy='18' r='1'/><circle cx='50' cy='50' r='0.8'/><circle cx='10' cy='40' r='0.9'/></g>
</svg>`;

const SVG_LAVA_VALLEY = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1c0a12'/><stop offset='0.6' stop-color='#5c1418'/><stop offset='1' stop-color='#a3341c'/></linearGradient>
    <linearGradient id='r' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffd54a'/><stop offset='1' stop-color='#e84a12'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <ellipse cx='50' cy='30' rx='26' ry='8' fill='#2a1016' opacity='0.8'/>
  <ellipse cx='46' cy='22' rx='14' ry='5' fill='#3a161a' opacity='0.8'/>
  <path d='M22 68 L 44 26 L 50 34 L 56 26 L 78 68 Z' fill='#2e1215'/>
  <path d='M44 26 L 50 34 L 56 26 L 54 22 L 46 22 Z' fill='#ff9d3c'/>
  <ellipse cx='50' cy='23' rx='5' ry='2' fill='#ffe27a'/>
  <path d='M46 30 q -3 14 -8 22 l 4 0 q 5 -10 7 -20 Z' fill='url(#r)'/>
  <path d='M56 32 q 4 12 10 20 l -4 1 q -6 -9 -9 -19 Z' fill='url(#r)'/>
  <rect y='66' width='100' height='34' fill='#1b0c10'/>
  <path d='M0 74 Q 20 70 34 74 L 30 78 Q 14 76 0 79 Z' fill='url(#r)' opacity='0.9'/>
  <path d='M100 78 Q 78 72 64 76 L 70 81 Q 86 79 100 84 Z' fill='url(#r)' opacity='0.9'/>
  <g fill='#3a1a1c'><path d='M4 66 L 10 56 L 18 66 Z'/><path d='M84 66 L 90 58 L 98 66 Z'/></g>
  <g fill='#ffb84a'><circle cx='36' cy='16' r='1'/><circle cx='62' cy='12' r='0.9'/><circle cx='28' cy='40' r='0.8'/><circle cx='72' cy='44' r='0.9'/><circle cx='58' cy='6' r='0.7'/></g>
</svg>`;

const SVG_MYSTIC_FOREST = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#04141c'/><stop offset='0.6' stop-color='#0c3038'/><stop offset='1' stop-color='#14494a'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='50' cy='20' r='9' fill='#bfe8d8' opacity='0.16'/><circle cx='50' cy='20' r='5' fill='#d8f4e8' opacity='0.22'/>
  <g fill='#0a2830'><path d='M6 100 L 6 30 Q 4 24 8 18 Q 12 24 10 30 L 10 100 Z'/><path d='M90 100 L 90 26 Q 88 20 92 14 Q 96 20 94 26 L 94 100 Z'/></g>
  <g fill='#0e3540'><path d='M24 100 L 24 42 Q 22 36 26 32 Q 30 36 28 42 L 28 100 Z'/><path d='M72 100 L 72 40 Q 70 34 74 30 Q 78 34 76 40 L 76 100 Z'/></g>
  <g fill='#082028' opacity='0.9'><ellipse cx='8' cy='16' rx='14' ry='8'/><ellipse cx='50' cy='6' rx='20' ry='8'/><ellipse cx='92' cy='12' rx='14' ry='8'/></g>
  <path d='M0 92 Q 30 88 60 92 T 100 90 L 100 100 L 0 100 Z' fill='#0a2f2e'/>
  <g><rect x='14' y='84' width='1.6' height='6' fill='#cfd8dc'/><path d='M11 85 A 4 3 0 0 1 19 85 Z' fill='#63e0c0'/><circle cx='15' cy='83' r='4' fill='#63e0c0' opacity='0.25'/></g>
  <g fill='#c8f470'><circle cx='34' cy='58' r='1'/><circle cx='60' cy='48' r='1.1'/><circle cx='46' cy='70' r='0.9'/><circle cx='80' cy='62' r='1'/><circle cx='20' cy='50' r='0.9'/></g>
  <g fill='#c8f470' opacity='0.25'><circle cx='34' cy='58' r='2.6'/><circle cx='60' cy='48' r='2.8'/><circle cx='46' cy='70' r='2.4'/><circle cx='80' cy='62' r='2.6'/><circle cx='20' cy='50' r='2.4'/></g>
</svg>`;

const SVG_UNDERWATER_REEF = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2eb8d8'/><stop offset='0.6' stop-color='#0e7ca6'/><stop offset='1' stop-color='#074b70'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#w)'/>
  <g fill='#d8f6ff' opacity='0.22'><path d='M18 0 L 30 0 L 16 44 L 8 44 Z'/><path d='M52 0 L 62 0 L 52 38 L 44 38 Z'/><path d='M82 0 L 92 0 L 84 30 L 76 30 Z'/></g>
  <g fill='#ff8a5c'><path d='M6 100 L 6 84 Q 4 78 8 74 Q 12 78 10 84 L 10 100 Z'/><path d='M14 100 L 14 88 Q 12 84 16 80 Q 20 84 18 88 L 18 100 Z'/></g>
  <g fill='#f06292'><path d='M88 100 q -2 -14 4 -20 q 6 6 2 20 Z'/><path d='M96 100 q -1 -9 3 -14 q 4 5 1 14 Z'/></g>
  <path d='M80 100 q -3 -10 -8 -12 q 6 -1 9 4 Z' fill='#ba68c8'/>
  <g stroke='#2e9e6b' stroke-width='1.4' fill='none'><path d='M26 100 q -2 -8 1 -14'/><path d='M31 100 q 2 -7 0 -12'/><path d='M70 100 q -2 -7 1 -12'/></g>
  <g fill='#ffd54f'><path d='M34 34 q 5 -4 9 0 q -4 4 -9 0'/><circle cx='42' cy='34' r='0.7' fill='#333'/></g>
  <g fill='#4dd0e1'><path d='M62 50 q -5 -3 -9 0 q 4 4 9 0'/><path d='M20 58 q 5 -3 8 0 q -4 3 -8 0'/></g>
  <g stroke='#bfeff8' stroke-width='0.7' fill='none' opacity='0.8'><circle cx='24' cy='24' r='1.4'/><circle cx='28' cy='16' r='1'/><circle cx='68' cy='20' r='1.2'/><circle cx='72' cy='12' r='0.9'/><circle cx='90' cy='48' r='1.1'/></g>
</svg>`;

const SVG_COSMIC_SPACE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='n' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#12082e'/><stop offset='0.5' stop-color='#2a1050'/><stop offset='1' stop-color='#0c0524'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#n)'/>
  <g opacity='0.55'>
    <ellipse cx='34' cy='34' rx='26' ry='13' fill='#b03a78' transform='rotate(-18 34 34)'/>
    <ellipse cx='64' cy='58' rx='24' ry='11' fill='#5636a8' transform='rotate(-18 64 58)'/>
    <ellipse cx='44' cy='42' rx='14' ry='6' fill='#e86aa0' transform='rotate(-18 44 42)' opacity='0.8'/>
  </g>
  <ellipse cx='50' cy='46' rx='7' ry='3.4' fill='#ffd8ea' opacity='0.7' transform='rotate(-18 50 46)'/>
  <g fill='#fff'>
    <circle cx='10' cy='12' r='0.9'/><circle cx='26' cy='8' r='0.6'/><circle cx='58' cy='12' r='0.7'/><circle cx='84' cy='8' r='0.9'/><circle cx='92' cy='30' r='0.6'/><circle cx='14' cy='58' r='0.7'/><circle cx='8' cy='84' r='0.8'/><circle cx='36' cy='78' r='0.6'/><circle cx='68' cy='84' r='0.7'/><circle cx='90' cy='72' r='0.8'/><circle cx='74' cy='30' r='0.6'/><circle cx='24' cy='90' r='0.6'/>
  </g>
  <g stroke='#fff' stroke-width='0.5' opacity='0.9'><path d='M78 44 L 78 50 M75 47 L 81 47'/><path d='M20 32 L 20 37 M17.5 34.5 L 22.5 34.5'/></g>
  <circle cx='86' cy='58' r='4' fill='#e8945c'/><ellipse cx='86' cy='58' rx='7' ry='1.8' fill='none' stroke='#f4c890' stroke-width='0.9' transform='rotate(-22 86 58)'/>
</svg>`;

const SVG_MILKY_WAY = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='n' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#070b26'/><stop offset='0.7' stop-color='#1c1c4e'/><stop offset='1' stop-color='#2e2a60'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#n)'/>
  <g transform='rotate(-32 50 44)'>
    <ellipse cx='50' cy='44' rx='52' ry='13' fill='#8a7ac8' opacity='0.22'/>
    <ellipse cx='50' cy='44' rx='48' ry='8' fill='#b8a8e8' opacity='0.28'/>
    <ellipse cx='50' cy='44' rx='40' ry='4' fill='#efe4ff' opacity='0.4'/>
    <ellipse cx='36' cy='46' rx='8' ry='2.4' fill='#2a1c50' opacity='0.5'/>
  </g>
  <g fill='#fff'>
    <circle cx='22' cy='20' r='0.7'/><circle cx='34' cy='32' r='0.9'/><circle cx='46' cy='24' r='0.6'/><circle cx='58' cy='38' r='0.8'/><circle cx='66' cy='20' r='0.6'/><circle cx='78' cy='12' r='0.9'/><circle cx='12' cy='44' r='0.7'/><circle cx='88' cy='34' r='0.6'/><circle cx='40' cy='52' r='0.7'/><circle cx='70' cy='48' r='0.6'/><circle cx='8' cy='10' r='0.6'/><circle cx='92' cy='56' r='0.7'/>
  </g>
  <g stroke='#fff' stroke-width='0.5' opacity='0.9'><path d='M26 60 L 26 65 M23.5 62.5 L 28.5 62.5'/><path d='M82 22 L 82 27 M79.5 24.5 L 84.5 24.5'/></g>
  <path d='M0 84 L 18 68 L 34 84 L 52 66 L 72 84 L 88 72 L 100 82 L 100 100 L 0 100 Z' fill='#0a0c20'/>
  <g fill='#060818'><path d='M10 84 L 13 74 L 16 84 Z'/><path d='M80 86 L 83 77 L 86 86 Z'/></g>
</svg>`;

const SVG_GALAXY_CORE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><radialGradient id='c' cx='0.5' cy='0.5' r='0.5'><stop offset='0' stop-color='#fff3c4'/><stop offset='0.4' stop-color='#f0b060'/><stop offset='1' stop-color='#f0b060' stop-opacity='0'/></radialGradient></defs>
  <rect width='100' height='100' fill='#0a0620'/>
  <g transform='rotate(-24 50 48)' opacity='0.65'>
    <path d='M50 48 Q 88 38 96 66 Q 78 56 58 56 Z' fill='#7c5cc8' opacity='0.7'/>
    <path d='M50 48 Q 12 58 4 30 Q 22 40 42 40 Z' fill='#7c5cc8' opacity='0.7'/>
    <path d='M50 48 Q 80 62 62 82 Q 58 64 46 58 Z' fill='#a888e0' opacity='0.55'/>
    <path d='M50 48 Q 20 34 38 14 Q 42 32 54 38 Z' fill='#a888e0' opacity='0.55'/>
  </g>
  <circle cx='50' cy='48' r='22' fill='url(#c)'/>
  <circle cx='50' cy='48' r='7' fill='#fff6d8'/><circle cx='50' cy='48' r='3.4' fill='#fff'/>
  <g fill='#fff'>
    <circle cx='12' cy='14' r='0.8'/><circle cx='30' cy='8' r='0.6'/><circle cx='70' cy='10' r='0.7'/><circle cx='90' cy='18' r='0.8'/><circle cx='8' cy='52' r='0.6'/><circle cx='94' cy='50' r='0.6'/><circle cx='14' cy='86' r='0.8'/><circle cx='42' cy='92' r='0.6'/><circle cx='78' cy='90' r='0.7'/><circle cx='92' cy='76' r='0.6'/>
  </g>
  <g fill='#d8c8f8' opacity='0.9'><circle cx='34' cy='30' r='0.7'/><circle cx='68' cy='64' r='0.7'/><circle cx='64' cy='34' r='0.6'/><circle cx='36' cy='64' r='0.6'/></g>
  <g stroke='#fff' stroke-width='0.5' opacity='0.9'><path d='M22 68 L 22 73 M19.5 70.5 L 24.5 70.5'/><path d='M80 36 L 80 41 M77.5 38.5 L 82.5 38.5'/></g>
</svg>`;

const SVG_SUMMER_PARK = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#79c2ea'/><stop offset='1' stop-color='#e9f6fd'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8fd072'/><stop offset='1' stop-color='#4d9e44'/></linearGradient>
  </defs>
  <rect width='100' height='64' fill='url(#s)'/>
  <circle cx='84' cy='12' r='6' fill='#fff6b0'/><circle cx='84' cy='12' r='9.5' fill='#fff6b0' opacity='0.3'/>
  <ellipse cx='48' cy='16' rx='10' ry='2.8' fill='#fff' opacity='0.85'/>
  <path d='M0 64 Q 30 58 60 63 T 100 61 L 100 100 L 0 100 Z' fill='url(#g)'/>
  <rect x='14' y='34' width='4' height='26' fill='#6d4c41'/>
  <g fill='#3e8e41'><circle cx='16' cy='24' r='13'/><circle cx='6' cy='30' r='9'/><circle cx='27' cy='30' r='9'/></g>
  <g fill='#5cab57' opacity='0.9'><circle cx='12' cy='20' r='6'/><circle cx='22' cy='26' r='5'/></g>
  <ellipse cx='18' cy='66' rx='16' ry='3' fill='#3a7c36' opacity='0.5'/>
  <path d='M100 70 Q 80 68 70 74 Q 84 72 100 76 Z' fill='#e8d9a8'/>
  <g><rect x='76' y='56' width='16' height='2.4' rx='1' fill='#8d5524'/><rect x='76' y='60' width='16' height='2' rx='1' fill='#8d5524'/><rect x='77' y='62' width='2' height='6' fill='#5d4037'/><rect x='89' y='62' width='2' height='6' fill='#5d4037'/><rect x='76' y='52' width='16' height='2' rx='1' fill='#8d5524'/></g>
  <g fill='#ff6b9d'><circle cx='38' cy='74' r='1.2'/><circle cx='48' cy='82' r='1.2'/></g>
  <circle cx='64' cy='78' r='1.2' fill='#fff275'/>
</svg>`;

const SVG_RIVERSIDE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#82c4ea'/><stop offset='1' stop-color='#e8f5fc'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#5fa3c4'/><stop offset='1' stop-color='#357c9e'/></linearGradient>
  </defs>
  <rect width='100' height='52' fill='url(#s)'/>
  <circle cx='18' cy='14' r='5.5' fill='#fff6b0'/><circle cx='18' cy='14' r='9' fill='#fff6b0' opacity='0.3'/>
  <ellipse cx='60' cy='18' rx='10' ry='2.8' fill='#fff' opacity='0.85'/>
  <path d='M0 52 Q 30 44 60 50 T 100 48 L 100 58 L 0 58 Z' fill='#b2dc94'/>
  <path d='M0 56 Q 25 50 50 56 T 100 54 L 100 68 L 0 68 Z' fill='#7fbf62'/>
  <rect y='66' width='100' height='20' fill='url(#w)'/>
  <path d='M0 66 Q 50 64 100 66' stroke='#a8d4e8' stroke-width='1' fill='none' opacity='0.8'/>
  <g stroke='#cfe8f4' stroke-width='0.8' opacity='0.75'><path d='M10 72 q 6 -1.5 12 0'/><path d='M46 76 q 7 -1.5 14 0'/><path d='M78 71 q 6 -1.5 12 0'/></g>
  <path d='M0 86 Q 30 82 60 85 T 100 84 L 100 100 L 0 100 Z' fill='#5fa945'/>
  <g stroke='#3c7a2e' stroke-width='1' fill='none'><path d='M8 84 q -1 -8 1 -12'/><path d='M12 85 q 1 -8 -1 -11'/><path d='M90 84 q -1 -8 1 -11'/><path d='M94 85 q 1 -7 -1 -10'/></g>
  <g fill='#8d6e63'><ellipse cx='9' cy='71' rx='2.6' ry='1.6'/><ellipse cx='87' cy='70' rx='2' ry='1.3'/></g>
  <g stroke='#3f6f8e' stroke-width='0.7' fill='none' stroke-linecap='round'><path d='M76 12 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_PUFFY_CLOUDS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3d92cc'/><stop offset='0.6' stop-color='#7fc0e8'/><stop offset='1' stop-color='#d8effa'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='14' cy='12' r='6' fill='#fff8c8' opacity='0.9'/><circle cx='14' cy='12' r='10' fill='#fff8c8' opacity='0.3'/>
  <g fill='#fff' opacity='0.55'><ellipse cx='78' cy='76' rx='14' ry='3.4'/><ellipse cx='18' cy='84' rx='12' ry='3'/><ellipse cx='52' cy='66' rx='10' ry='2.6'/></g>
  <g fill='#fff'>
    <ellipse cx='30' cy='30' rx='16' ry='6'/><circle cx='24' cy='25' r='6'/><circle cx='34' cy='23' r='7.5'/><circle cx='42' cy='28' r='5'/>
  </g>
  <ellipse cx='31' cy='33' rx='13' ry='2.6' fill='#c8e2f2' opacity='0.8'/>
  <g fill='#fff'>
    <ellipse cx='74' cy='44' rx='14' ry='5'/><circle cx='69' cy='39' r='5.5'/><circle cx='78' cy='38' r='6.5'/><circle cx='84' cy='43' r='4'/>
  </g>
  <ellipse cx='75' cy='46.5' rx='11' ry='2.2' fill='#c8e2f2' opacity='0.8'/>
  <g fill='#fff' opacity='0.92'><ellipse cx='10' cy='54' rx='10' ry='3.6'/><circle cx='7' cy='51' r='4'/><circle cx='14' cy='50' r='4.6'/></g>
  <g stroke='#2e6288' stroke-width='0.8' fill='none' stroke-linecap='round'><path d='M52 50 q 2.5 -2.5 5 0 q 2.5 -2.5 5 0'/><path d='M40 58 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_SPRING_BLOSSOMS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8cc8ec'/><stop offset='0.65' stop-color='#d8ecf8'/><stop offset='1' stop-color='#fceff4'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='76' cy='18' r='6' fill='#fff6c0' opacity='0.9'/><circle cx='76' cy='18' r='10' fill='#fff6c0' opacity='0.25'/>
  <path d='M0 84 Q 30 78 55 82 Q 80 86 100 81 L 100 100 L 0 100 Z' fill='#c5e6b4'/>
  <path d='M0 90 Q 40 85 100 89 L 100 100 L 0 100 Z' fill='#aedb9a' opacity='0.8'/>
  <path d='M14 84 Q 12 62 8 52 M14 84 Q 16 66 22 58 M13 70 Q 8 64 4 62' stroke='#7a5546' stroke-width='3' fill='none' stroke-linecap='round'/>
  <g fill='#f4a0c0'><ellipse cx='6' cy='46' rx='9' ry='7'/><ellipse cx='18' cy='42' rx='10' ry='8'/><ellipse cx='28' cy='52' rx='8' ry='6.5'/><ellipse cx='12' cy='56' rx='9' ry='7'/></g>
  <g fill='#fbc6da'><ellipse cx='14' cy='42' rx='6' ry='4.5'/><ellipse cx='24' cy='49' rx='5' ry='4'/><ellipse cx='8' cy='51' rx='4.5' ry='3.5'/></g>
  <path d='M92 82 Q 93 68 96 60 M92 82 Q 90 70 86 64' stroke='#7a5546' stroke-width='2.4' fill='none' stroke-linecap='round'/>
  <g fill='#f4a0c0'><ellipse cx='95' cy='54' rx='7' ry='5.5'/><ellipse cx='86' cy='58' rx='6' ry='5'/></g>
  <ellipse cx='92' cy='52' rx='4' ry='3' fill='#fbc6da'/>
  <g fill='#f9bcd0'><ellipse cx='42' cy='30' rx='1.5' ry='1.1'/><ellipse cx='56' cy='44' rx='1.4' ry='1'/><ellipse cx='34' cy='58' rx='1.3' ry='1'/><ellipse cx='70' cy='34' rx='1.4' ry='1'/><ellipse cx='50' cy='62' rx='1.2' ry='0.9'/><ellipse cx='63' cy='56' rx='1.2' ry='0.9'/></g>
  <g fill='#ffffff'><circle cx='36' cy='88' r='1.1'/><circle cx='68' cy='90' r='1.1'/><circle cx='82' cy='87' r='1'/></g>
  <g fill='#fdd835'><circle cx='36' cy='88' r='0.45'/><circle cx='68' cy='90' r='0.45'/><circle cx='82' cy='87' r='0.4'/></g>
  <g fill='#5c8ac4'><ellipse cx='48' cy='14' rx='1.8' ry='2.3'/><ellipse cx='51.4' cy='14' rx='1.8' ry='2.3'/><circle cx='49.7' cy='14' r='0.8' fill='#37474f'/></g>
</svg>`;

const SVG_LAVENDER_FIELD = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8862b8'/><stop offset='0.55' stop-color='#e8927c'/><stop offset='1' stop-color='#ffd9a0'/></linearGradient>
    <linearGradient id='f' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a684d8'/><stop offset='1' stop-color='#5d3f96'/></linearGradient>
  </defs>
  <rect width='100' height='56' fill='url(#s)'/>
  <circle cx='50' cy='50' r='7' fill='#fff3b0'/><circle cx='50' cy='50' r='12' fill='#ffdf8a' opacity='0.35'/>
  <g fill='#f8c8d8' opacity='0.5'><ellipse cx='22' cy='24' rx='12' ry='2'/><ellipse cx='74' cy='16' rx='10' ry='1.8'/></g>
  <path d='M0 56 Q 30 50 60 55 T 100 53 L 100 62 L 0 62 Z' fill='#7c5cb0' opacity='0.75'/>
  <rect y='60' width='100' height='40' fill='url(#f)'/>
  <g fill='#8a68c4'><path d='M0 66 Q 50 62 100 66 L 100 70 Q 50 66 0 70 Z'/><path d='M0 78 Q 50 73 100 78 L 100 83 Q 50 78 0 83 Z'/><path d='M0 92 Q 50 86 100 92 L 100 98 Q 50 92 0 98 Z'/></g>
  <g stroke='#c8a8f0' stroke-width='0.9' fill='none' opacity='0.9'>
    <path d='M8 64 q 0 -5 0 -7 M8 57 l -1.6 -2 M8 57 l 1.6 -2'/><path d='M16 66 q 0 -5 0 -7 M16 59 l -1.6 -2 M16 59 l 1.6 -2'/>
    <path d='M86 65 q 0 -5 0 -7 M86 58 l -1.6 -2 M86 58 l 1.6 -2'/><path d='M94 67 q 0 -5 0 -7 M94 60 l -1.6 -2 M94 60 l 1.6 -2'/>
  </g>
  <g stroke='#4a3080' stroke-width='0.8' fill='none' stroke-linecap='round'><path d='M28 16 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_LAKE_DOCK = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4a3f7e'/><stop offset='0.5' stop-color='#c86e6a'/><stop offset='1' stop-color='#f8c07a'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8a5c74'/><stop offset='1' stop-color='#3c2e5e'/></linearGradient>
  </defs>
  <rect width='100' height='58' fill='url(#s)'/>
  <circle cx='64' cy='50' r='7' fill='#fff0a8'/><circle cx='64' cy='50' r='11.5' fill='#ffd98a' opacity='0.35'/>
  <g fill='#3c2e5e' opacity='0.8'><path d='M0 58 L 14 46 L 30 58 Z'/><path d='M76 58 L 90 48 L 104 58 Z'/></g>
  <rect y='58' width='100' height='42' fill='url(#w)'/>
  <g fill='#ffe0a0'><ellipse cx='64' cy='62' rx='9' ry='0.9' opacity='0.6'/><ellipse cx='64' cy='68' rx='6' ry='0.8' opacity='0.4'/><ellipse cx='64' cy='76' rx='4' ry='0.6' opacity='0.3'/></g>
  <path d='M0 62 L 34 62 L 34 66 L 0 66 Z' fill='#5d4037'/>
  <g fill='#4e342e'><rect x='4' y='66' width='2.4' height='10'/><rect x='16' y='66' width='2.4' height='12'/><rect x='28' y='66' width='2.4' height='14'/></g>
  <g stroke='#3e2723' stroke-width='0.5' opacity='0.7'><line x1='0' y1='64' x2='34' y2='64'/></g>
  <rect x='30' y='52' width='1.6' height='10' fill='#4e342e'/><circle cx='30.8' cy='51' r='1.8' fill='#ffcf6a'/><circle cx='30.8' cy='51' r='3.4' fill='#ffcf6a' opacity='0.3'/>
  <g stroke='#2e2248' stroke-width='0.8' fill='none' stroke-linecap='round'><path d='M52 12 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_PUMPKIN_PATCH = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e8a05c'/><stop offset='1' stop-color='#f8e0b0'/></linearGradient>
    <linearGradient id='f' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#9a7040'/><stop offset='1' stop-color='#6e4c28'/></linearGradient>
  </defs>
  <rect width='100' height='58' fill='url(#s)'/>
  <circle cx='22' cy='16' r='6.5' fill='#fff0b0'/><circle cx='22' cy='16' r='10' fill='#ffe08a' opacity='0.35'/>
  <ellipse cx='60' cy='54' rx='16' ry='4' fill='#b07838' opacity='0.6'/>
  <rect y='56' width='100' height='44' fill='url(#f)'/>
  <path d='M0 70 Q 50 66 100 70' stroke='#59391c' stroke-width='0.6' opacity='0.5'/>
  <g stroke='#4e342e' stroke-width='1.4'><line x1='6' y1='46' x2='6' y2='58'/><line x1='18' y1='46' x2='18' y2='58'/><line x1='0' y1='49' x2='24' y2='49'/><line x1='0' y1='54' x2='24' y2='54'/></g>
  <g fill='#37474f'><ellipse cx='12' cy='45' rx='2.4' ry='1.8'/><circle cx='14.5' cy='43.8' r='1.2'/></g>
  <g><ellipse cx='84' cy='72' rx='8' ry='6' fill='#e8701c'/><ellipse cx='80.5' cy='72' rx='2.8' ry='5.6' fill='#f88b34' opacity='0.85'/><rect x='83' y='64.5' width='2' height='3' rx='1' fill='#4c7a2e'/></g>
  <g><ellipse cx='68' cy='80' rx='5.5' ry='4.2' fill='#f0821f'/><ellipse cx='65.6' cy='80' rx='2' ry='3.9' fill='#f89b42' opacity='0.85'/><rect x='67.2' y='75' width='1.6' height='2.4' rx='0.8' fill='#4c7a2e'/></g>
  <path d='M46 8 q 2 -3 4 0 q -1 3 -4 3 Z' fill='#c0392b'/>
</svg>`;

const SVG_MORNING_MIST = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e8b088'/><stop offset='0.6' stop-color='#f8dcb4'/><stop offset='1' stop-color='#fdf2dc'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#d8b490'/><stop offset='1' stop-color='#b08c68'/></linearGradient>
  </defs>
  <rect width='100' height='68' fill='url(#s)'/>
  <circle cx='30' cy='38' r='8' fill='#ffe9b8'/><circle cx='30' cy='38' r='14' fill='#ffe9b8' opacity='0.4'/><circle cx='30' cy='38' r='20' fill='#ffe9b8' opacity='0.18'/>
  <g fill='#a8805c' opacity='0.8'><path d='M84 54 L 84 32 Q 82 26 86 22 Q 90 26 88 32 L 88 54 Z'/><ellipse cx='86' cy='20' rx='9' ry='7'/></g>
  <ellipse cx='50' cy='50' rx='45' ry='4.5' fill='#fdf4e4' opacity='0.85'/>
  <ellipse cx='70' cy='58' rx='38' ry='4' fill='#fdf4e4' opacity='0.7'/>
  <rect y='66' width='100' height='34' fill='url(#w)'/>
  <path d='M0 66 Q 50 64 100 66' stroke='#f8e0b8' stroke-width='1' fill='none' opacity='0.8'/>
  <ellipse cx='30' cy='70' rx='7' ry='0.9' fill='#ffe9b8' opacity='0.55'/><ellipse cx='30' cy='76' rx='5' ry='0.7' fill='#ffe9b8' opacity='0.35'/>
  <ellipse cx='24' cy='74' rx='26' ry='3' fill='#fdf4e4' opacity='0.7'/><ellipse cx='78' cy='82' rx='30' ry='3.4' fill='#fdf4e4' opacity='0.6'/>
  <g stroke='#8a6848' stroke-width='0.8' fill='none' stroke-linecap='round'><path d='M14 20 q 2 -2 4 0 q 2 -2 4 0'/><path d='M46 14 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_SNOWY_VILLAGE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='n' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1a2650'/><stop offset='0.7' stop-color='#39508c'/><stop offset='1' stop-color='#5e78ac'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#n)'/>
  <circle cx='78' cy='16' r='6' fill='#fdf6cd'/>
  <g fill='#fff'><circle cx='14' cy='10' r='0.8'/><circle cx='34' cy='16' r='0.7'/><circle cx='56' cy='8' r='0.7'/><circle cx='8' cy='30' r='0.6'/><circle cx='46' cy='26' r='0.8'/><circle cx='24' cy='42' r='0.8'/></g>
  <path d='M0 62 Q 25 52 50 60 T 100 58 L 100 100 L 0 100 Z' fill='#dfe9f4'/>
  <g><rect x='8' y='50' width='18' height='14' fill='#7a4a3a'/><path d='M5 51 L 17 40 L 29 51 Z' fill='#4e342e'/><path d='M5 51 L 17 40 L 29 51 L 29 48 L 17 37 L 5 48 Z' fill='#fff'/><rect x='12' y='54' width='4' height='4.5' fill='#ffd87a'/><rect x='20' y='54' width='4' height='4.5' fill='#ffd87a'/></g>
  <g><rect x='72' y='52' width='16' height='13' fill='#8a5a46'/><path d='M69 53 L 80 43 L 91 53 Z' fill='#4e342e'/><path d='M69 53 L 80 43 L 91 53 L 91 50 L 80 40 L 69 50 Z' fill='#fff'/><rect x='78' y='56' width='3.6' height='4' fill='#ffd87a'/></g>
  <g fill='#2c5d4a'><path d='M56 64 L 61 48 L 66 64 Z'/><path d='M59 52 L 61 48 L 63 52 L 61 51 Z' fill='#fff'/></g>
  <g fill='#fff'><circle cx='30' cy='72' r='0.9'/><circle cx='52' cy='78' r='0.8'/><circle cx='70' cy='84' r='0.9'/><circle cx='12' cy='82' r='0.8'/><circle cx='90' cy='76' r='0.8'/></g>
</svg>`;

const SVG_WATERFALL = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8ac4e4'/><stop offset='1' stop-color='#d8eef8'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#bfe6f4'/><stop offset='1' stop-color='#7ab8d8'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <g fill='#5c8a68' opacity='0.6'><ellipse cx='74' cy='24' rx='20' ry='10'/><ellipse cx='94' cy='36' rx='14' ry='8'/></g>
  <g fill='#5f7d68'><path d='M0 0 L 30 0 L 28 40 L 32 70 L 0 74 Z'/></g>
  <g fill='#4a6552'><path d='M0 0 L 12 0 L 10 44 L 14 72 L 0 74 Z'/></g>
  <path d='M22 0 L 34 0 L 33 42 Q 34 62 36 78 L 24 78 Q 24 60 23 42 Z' fill='url(#w)'/>
  <g stroke='#fff' stroke-width='1' opacity='0.7' fill='none'><path d='M26 4 Q 26 40 27 74'/><path d='M31 2 Q 31 42 32 76'/></g>
  <ellipse cx='30' cy='80' rx='16' ry='4' fill='#fff' opacity='0.7'/>
  <path d='M0 82 Q 30 78 60 82 T 100 82 L 100 100 L 0 100 Z' fill='#6db0cc'/>
  <g stroke='#dff2f8' stroke-width='0.8' opacity='0.8'><path d='M46 88 q 7 -1.5 14 0'/><path d='M70 92 q 6 -1.5 12 0'/><path d='M8 90 q 6 -1.5 12 0'/></g>
  <g fill='#fff' opacity='0.85'><circle cx='18' cy='78' r='1.2'/><circle cx='42' cy='80' r='1.1'/><circle cx='36' cy='74' r='0.9'/></g>
  <g fill='#3e8e41'><ellipse cx='90' cy='80' rx='8' ry='4'/><ellipse cx='68' cy='76' rx='6' ry='3'/></g>
  <path d='M40 26 A 22 22 0 0 1 62 48' stroke='#ffd8e8' stroke-width='1.6' fill='none' opacity='0.5'/>
</svg>`;

const SVG_CANYON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f2a35c'/><stop offset='0.6' stop-color='#f8cd86'/><stop offset='1' stop-color='#fdeab8'/></linearGradient></defs>
  <rect width='100' height='62' fill='url(#s)'/>
  <circle cx='30' cy='18' r='7' fill='#fff1b0'/><circle cx='30' cy='18' r='11' fill='#ffdf8a' opacity='0.35'/>
  <g fill='#d89060' opacity='0.75'><path d='M60 62 L 60 34 L 70 30 L 70 62 Z'/><path d='M78 62 L 78 28 L 92 24 L 92 62 Z'/></g>
  <g fill='#c06a3c'>
    <path d='M0 62 L 0 26 L 12 22 L 14 30 L 22 28 L 24 62 Z'/>
    <path d='M100 62 L 100 22 L 86 18 L 84 28 L 76 26 L 74 62 Z'/>
  </g>
  <g stroke='#9c4f28' stroke-width='0.7' opacity='0.7'><path d='M2 34 L 22 36'/><path d='M2 44 L 23 46'/><path d='M78 34 L 98 32'/><path d='M77 44 L 98 42'/></g>
  <rect y='60' width='100' height='40' fill='#b05c30'/>
  <path d='M0 60 Q 50 58 100 60' stroke='#d88850' stroke-width='1.2' fill='none'/>
  <g stroke='#8a4220' stroke-width='0.6' opacity='0.6'><path d='M10 74 q 8 -1.5 16 0'/><path d='M64 80 q 9 -1.5 18 0'/><path d='M30 90 q 8 -1.5 16 0'/></g>
  <g fill='#2f6e3e'><rect x='88' y='72' width='2.6' height='11' rx='1.3'/><rect x='84.5' y='75' width='2.2' height='4.5' rx='1.1'/><rect x='92' y='76' width='2.2' height='4' rx='1.1'/></g>
  <g stroke='#7a3e1c' stroke-width='0.8' fill='none' stroke-linecap='round'><path d='M46 24 q 2.5 -2.5 5 0 q 2.5 -2.5 5 0'/><path d='M40 34 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_GOLDEN_WHEAT = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f0a860'/><stop offset='0.6' stop-color='#f8d488'/><stop offset='1' stop-color='#fdedc0'/></linearGradient>
    <linearGradient id='f' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#eec253'/><stop offset='1' stop-color='#c28e24'/></linearGradient>
  </defs>
  <rect width='100' height='58' fill='url(#s)'/>
  <circle cx='68' cy='24' r='8' fill='#fff3ae'/><circle cx='68' cy='24' r='13' fill='#ffe38e' opacity='0.4'/>
  <g fill='#dca050' opacity='0.6'><ellipse cx='16' cy='54' rx='12' ry='3.4'/><ellipse cx='88' cy='54' rx='11' ry='3'/></g>
  <rect y='56' width='100' height='44' fill='url(#f)'/>
  <g stroke='#a87a18' stroke-width='0.6' opacity='0.55'><path d='M0 68 Q 50 64 100 68'/><path d='M0 80 Q 50 75 100 80'/><path d='M0 92 Q 50 86 100 92'/></g>
  <g stroke='#8a6210' stroke-width='0.9' fill='none'>
    <path d='M8 78 q -1 -10 1 -16'/><path d='M15 82 q 1 -10 -1 -15'/><path d='M88 80 q -1 -10 1 -15'/><path d='M95 84 q 1 -9 -1 -14'/>
  </g>
  <g fill='#f8dc84'>
    <ellipse cx='9' cy='60' rx='1.7' ry='3.6'/><ellipse cx='14' cy='65' rx='1.7' ry='3.6'/><ellipse cx='89' cy='63' rx='1.7' ry='3.6'/><ellipse cx='94' cy='68' rx='1.7' ry='3.6'/>
  </g>
  <g stroke='#f8dc84' stroke-width='0.5' opacity='0.9'><path d='M9 57 l -2 -3 M9 57 l 2 -3 M14 62 l -2 -3 M14 62 l 2 -3 M89 60 l -2 -3 M89 60 l 2 -3'/></g>
  <g stroke='#7a4e14' stroke-width='0.8' fill='none' stroke-linecap='round'><path d='M28 16 q 2 -2.5 4.5 0 q 2 -2.5 4.5 0'/></g>
</svg>`;

const SVG_ZEN_GARDEN = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f4ead2'/><stop offset='1' stop-color='#e2d0a8'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#g)'/>
  <g stroke='#cbb684' stroke-width='0.8' fill='none' opacity='0.85'>
    <path d='M0 24 Q 50 20 100 24'/><path d='M0 34 Q 50 30 100 34'/><path d='M0 86 Q 50 82 100 86'/>
  </g>
  <g stroke='#cbb684' stroke-width='0.8' fill='none' opacity='0.85'><circle cx='76' cy='58' r='9'/><circle cx='76' cy='58' r='13'/><circle cx='18' cy='64' r='8'/></g>
  <g><ellipse cx='76' cy='57' rx='5' ry='3.6' fill='#8a8f98'/><ellipse cx='74.5' cy='55.8' rx='2' ry='1.2' fill='#b8bdc6'/></g>
  <g><ellipse cx='18' cy='63' rx='4.4' ry='3.2' fill='#767b84'/><ellipse cx='16.8' cy='62' rx='1.8' ry='1' fill='#a8adb6'/></g>
  <path d='M10 12 Q 16 18 16 28 M16 20 Q 22 16 28 17' stroke='#6d5240' stroke-width='2' fill='none' stroke-linecap='round'/>
  <g fill='#f0a8c0'><circle cx='10' cy='11' r='3.4'/><circle cx='28' cy='16' r='3'/><circle cx='17' cy='6' r='2.8'/><circle cx='22' cy='11' r='2.4'/></g>
  <g fill='#f8cfdd'><circle cx='11' cy='10' r='1.5'/><circle cx='27' cy='15' r='1.3'/></g>
  <ellipse cx='40' cy='30' rx='1.3' ry='0.9' fill='#f2b8cc'/>
  <g fill='#8a8f98'><rect x='87' y='16' width='7' height='3'/><rect x='88.5' y='19' width='4' height='5'/><rect x='86' y='24' width='9' height='2.4'/><rect x='89' y='12' width='3' height='4'/></g>
  <circle cx='90.5' cy='21.5' r='1' fill='#ffcf6a'/>
</svg>`;

const SVG_NORTHERN_LIGHTS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='n' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#060d28'/><stop offset='0.75' stop-color='#122048'/><stop offset='1' stop-color='#1e3560'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#n)'/>
  <g opacity='0.6'>
    <path d='M8 4 Q 20 26 14 48 L 26 48 Q 30 24 22 2 Z' fill='#3ee8a8'/>
    <path d='M40 0 Q 50 24 44 46 L 56 46 Q 60 22 52 0 Z' fill='#52d8c8'/>
    <path d='M74 4 Q 84 24 78 44 L 88 44 Q 92 22 86 2 Z' fill='#9a6ee8'/>
  </g>
  <g opacity='0.4'><path d='M26 2 Q 34 24 30 44 L 38 44 Q 42 22 36 0 Z' fill='#7ef0c0'/><path d='M60 2 Q 68 22 64 42 L 72 42 Q 76 20 70 0 Z' fill='#68c8e8'/></g>
  <g fill='#fff'><circle cx='10' cy='58' r='0.7'/><circle cx='32' cy='54' r='0.6'/><circle cx='52' cy='56' r='0.7'/><circle cx='74' cy='52' r='0.6'/><circle cx='92' cy='58' r='0.7'/><circle cx='20' cy='12' r='0.5'/><circle cx='66' cy='10' r='0.5'/><circle cx='96' cy='16' r='0.6'/></g>
  <path d='M84 12 A 5 5 0 1 1 80 6 A 4 4 0 0 0 84 12' fill='#f4f0d8'/>
  <g fill='#7688b0'><path d='M0 78 L 22 58 L 44 78 Z'/><path d='M56 78 L 76 60 L 96 78 Z'/></g>
  <g fill='#fff' opacity='0.9'><path d='M22 58 L 27 64 L 17 64 Z'/><path d='M76 60 L 80 65 L 72 65 Z'/></g>
  <path d='M0 80 Q 30 74 55 80 T 100 78 L 100 100 L 0 100 Z' fill='#dce8f4'/>
  <g fill='#1c3a4a'><path d='M8 84 L 11 74 L 14 84 Z'/><path d='M88 86 L 91 76 L 94 86 Z'/></g>
</svg>`;

const SVG_SAVANNAH = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e85c3c'/><stop offset='0.55' stop-color='#f89a4c'/><stop offset='1' stop-color='#fdd489'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#c88a3c'/><stop offset='1' stop-color='#8a5c20'/></linearGradient>
  </defs>
  <rect width='100' height='64' fill='url(#s)'/>
  <circle cx='66' cy='40' r='11' fill='#ffd76a'/><circle cx='66' cy='40' r='16' fill='#ffce5c' opacity='0.35'/>
  <rect y='62' width='100' height='38' fill='url(#g)'/>
  <path d='M0 62 Q 50 60 100 62' stroke='#e8a85c' stroke-width='1' fill='none' opacity='0.8'/>
  <g fill='#59331c'>
    <path d='M14 64 L 15.4 46 L 12 40 L 16 44 L 17 38 L 18 44 L 22 40 L 18.6 46 L 20 64 Z'/>
    <path d='M4 40 Q 17 30 30 40 Q 17 36 4 40 Z'/><ellipse cx='17' cy='37' rx='14' ry='3.6'/>
  </g>
  <g fill='#59331c'><path d='M84 64 L 84.8 54 L 83 51 L 85.4 53 L 86 50 L 86.8 53 L 89 51 L 87.2 54 L 88 64 Z'/><ellipse cx='86' cy='49.5' rx='6.5' ry='2'/></g>
  <g stroke='#6e4222' stroke-width='0.9' fill='none'><path d='M32 66 q -1 -5 1 -8'/><path d='M36 67 q 1 -5 -1 -8'/><path d='M64 66 q -1 -5 1 -8'/><path d='M68 67 q 1 -5 -1 -8'/><path d='M96 68 q -1 -5 1 -8'/></g>
  <g fill='#4a2a14'><path d='M46 60 l 1 -6 l 1.6 0 l 0.4 -3 l 2.4 0 l 0.5 3 l 1.4 0 l 1 6 Z'/></g>
  <g stroke='#5c2e14' stroke-width='0.8' fill='none' stroke-linecap='round'><path d='M30 16 q 2 -2 4 0 q 2 -2 4 0'/><path d='M44 10 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_CRYSTAL_CAVE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='c' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#170b30'/><stop offset='0.6' stop-color='#2a1650'/><stop offset='1' stop-color='#1c0f3c'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#c)'/>
  <g fill='#120826'><path d='M0 0 L 100 0 L 100 10 L 84 6 L 66 14 L 48 6 L 30 14 L 14 6 L 0 12 Z'/><path d='M22 0 L 30 0 L 26 18 Z'/><path d='M62 0 L 70 0 L 66 22 Z'/></g>
  <g opacity='0.3'><circle cx='14' cy='62' r='14' fill='#b06ee8'/><circle cx='88' cy='58' r='13' fill='#5c8cf0'/><circle cx='50' cy='22' r='10' fill='#8cf0e0'/></g>
  <g fill='#a86ee0'><path d='M6 84 L 12 48 L 20 84 Z'/><path d='M16 86 L 22 62 L 28 86 Z'/></g>
  <g fill='#d0a8f8' opacity='0.85'><path d='M9 84 L 12 52 L 14 84 Z'/></g>
  <g fill='#5c8cf0'><path d='M80 86 L 87 52 L 95 86 Z'/><path d='M72 88 L 77 68 L 82 88 Z'/></g>
  <g fill='#a8c4fa' opacity='0.85'><path d='M84 86 L 87 56 L 89 86 Z'/></g>
  <g fill='#63e0d0'><path d='M44 12 L 48 34 L 52 12 Z'/><path d='M54 8 L 57 24 L 60 8 Z'/></g>
  <g fill='#bff4ec' opacity='0.8'><path d='M46 12 L 48 28 L 50 12 Z'/></g>
  <path d='M0 92 Q 30 88 60 92 T 100 90 L 100 100 L 0 100 Z' fill='#241244'/>
  <g stroke='#fff' stroke-width='0.5' opacity='0.9'><path d='M32 46 L 32 51 M29.5 48.5 L 34.5 48.5'/><path d='M68 40 L 68 45 M65.5 42.5 L 70.5 42.5'/><path d='M50 62 L 50 66 M48 64 L 52 64'/></g>
  <g fill='#e8d8ff' opacity='0.8'><circle cx='24' cy='34' r='0.8'/><circle cx='76' cy='28' r='0.8'/><circle cx='38' cy='70' r='0.7'/></g>
</svg>`;

const SVG_STORM_SEA = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1c2430'/><stop offset='0.7' stop-color='#3a4a5c'/><stop offset='1' stop-color='#55687a'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#26404e'/><stop offset='1' stop-color='#12222c'/></linearGradient>
  </defs>
  <rect width='100' height='66' fill='url(#s)'/>
  <g fill='#151d28'><ellipse cx='22' cy='12' rx='20' ry='7'/><ellipse cx='58' cy='8' rx='22' ry='8'/><ellipse cx='88' cy='14' rx='16' ry='6'/><ellipse cx='40' cy='18' rx='18' ry='6'/></g>
  <path d='M56 18 L 48 36 L 54 36 L 44 56 L 58 38 L 52 38 L 62 18 Z' fill='#ffe97a'/>
  <circle cx='51' cy='46' r='7' fill='#fff3a0' opacity='0.18'/>
  <g stroke='#8aa4b8' stroke-width='0.7' opacity='0.6'><line x1='12' y1='26' x2='8' y2='40'/><line x1='24' y1='30' x2='20' y2='44'/><line x1='78' y1='24' x2='74' y2='38'/><line x1='90' y1='28' x2='86' y2='42'/><line x1='68' y1='44' x2='64' y2='56'/></g>
  <rect y='64' width='100' height='36' fill='url(#w)'/>
  <path d='M0 66 Q 12 58 24 66 T 48 66 T 72 66 T 100 64 L 100 74 L 0 74 Z' fill='#3c5a6c'/>
  <g fill='#e8f2f6' opacity='0.85'><path d='M18 62 Q 24 56 30 62 Q 24 64 18 62'/><path d='M64 62 Q 70 57 76 63 Q 70 65 64 62'/></g>
  <path d='M0 78 Q 15 72 30 78 T 60 78 T 100 76 L 100 88 L 0 88 Z' fill='#2a4656' opacity='0.9'/>
  <g stroke='#c8dce6' stroke-width='0.8' opacity='0.6'><path d='M8 82 q 7 -2 14 0'/><path d='M56 84 q 8 -2 16 0'/><path d='M84 80 q 6 -2 12 0'/></g>
</svg>`;

const SVG_SATURN_VIEW = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='p' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f4d9a8'/><stop offset='0.5' stop-color='#e0aa6a'/><stop offset='1' stop-color='#b87840'/></linearGradient></defs>
  <rect width='100' height='100' fill='#0a0820'/>
  <g fill='#fff'>
    <circle cx='10' cy='14' r='0.8'/><circle cx='28' cy='6' r='0.6'/><circle cx='84' cy='10' r='0.7'/><circle cx='94' cy='28' r='0.6'/><circle cx='8' cy='50' r='0.6'/><circle cx='16' cy='80' r='0.8'/><circle cx='44' cy='90' r='0.6'/><circle cx='80' cy='86' r='0.7'/><circle cx='92' cy='66' r='0.6'/><circle cx='36' cy='24' r='0.5'/>
  </g>
  <g stroke='#fff' stroke-width='0.5' opacity='0.9'><path d='M20 34 L 20 39 M17.5 36.5 L 22.5 36.5'/></g>
  <g transform='rotate(-20 54 46)'>
    <ellipse cx='54' cy='46' rx='40' ry='11' fill='none' stroke='#c8a06a' stroke-width='2.6' opacity='0.7'/>
    <ellipse cx='54' cy='46' rx='33' ry='8.6' fill='none' stroke='#e8cfa0' stroke-width='2' opacity='0.8'/>
    <circle cx='54' cy='46' r='19' fill='url(#p)'/>
    <path d='M36 41 Q 54 36 72 41' stroke='#c88c4c' stroke-width='1.8' fill='none' opacity='0.65'/>
    <path d='M35.5 50 Q 54 54 72.5 50' stroke='#c88c4c' stroke-width='1.6' fill='none' opacity='0.55'/>
    <path d='M21 49 A 33 8.6 0 0 0 87 49' fill='none' stroke='#f0dcb4' stroke-width='2.2' opacity='0.9'/>
    <ellipse cx='47' cy='39' rx='7' ry='3.4' fill='#fbe9c8' opacity='0.6'/>
  </g>
  <circle cx='16' cy='64' r='1.8' fill='#c8ccd8'/><circle cx='88' cy='22' r='1.4' fill='#b8bcc8'/>
</svg>`;

const SVG_EARTH_FROM_MOON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='e' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#5cb8f0'/><stop offset='1' stop-color='#1a5cb0'/></linearGradient>
    <linearGradient id='m' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#bec4cc'/><stop offset='1' stop-color='#7e858f'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='#050510'/>
  <g fill='#fff'>
    <circle cx='12' cy='16' r='0.7'/><circle cx='30' cy='8' r='0.6'/><circle cx='50' cy='18' r='0.5'/><circle cx='88' cy='12' r='0.7'/><circle cx='94' cy='36' r='0.6'/><circle cx='8' cy='44' r='0.6'/><circle cx='20' cy='30' r='0.5'/>
  </g>
  <g stroke='#fff' stroke-width='0.5' opacity='0.9'><path d='M76 30 L 76 35 M73.5 32.5 L 78.5 32.5'/></g>
  <circle cx='58' cy='30' r='13' fill='url(#e)'/>
  <g fill='#4ca858'><path d='M50 24 Q 55 20 60 24 Q 57 28 52 27 Z'/><path d='M62 34 Q 67 32 68 37 Q 63 39 61 37 Z'/></g>
  <g fill='#fff' opacity='0.8'><ellipse cx='54' cy='31' rx='5' ry='1.4' transform='rotate(-16 54 31)'/><ellipse cx='60' cy='40' rx='3.6' ry='1.1' transform='rotate(-14 60 40)'/></g>
  <path d='M49 21 A 13 13 0 0 1 67 25' stroke='#dff2ff' stroke-width='1' fill='none' opacity='0.6'/>
  <path d='M0 72 Q 25 66 50 70 T 100 68 L 100 100 L 0 100 Z' fill='url(#m)'/>
  <g fill='#6b727c'>
    <ellipse cx='16' cy='80' rx='6' ry='2.4'/><ellipse cx='44' cy='88' rx='7' ry='2.8'/><ellipse cx='80' cy='78' rx='5' ry='2'/>
  </g>
  <g fill='#d6dae0' opacity='0.7'><circle cx='30' cy='76' r='0.9'/><circle cx='64' cy='82' r='0.8'/></g>
</svg>`;

const SVG_BLACK_HOLE_DISK = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <rect width='100' height='100' fill='#030308'/>
  <g fill='#fff'>
    <circle cx='10' cy='12' r='0.7'/><circle cx='26' cy='6' r='0.5'/><circle cx='58' cy='8' r='0.6'/><circle cx='86' cy='14' r='0.7'/><circle cx='94' cy='40' r='0.5'/><circle cx='6' cy='48' r='0.6'/><circle cx='12' cy='86' r='0.7'/><circle cx='46' cy='92' r='0.5'/><circle cx='84' cy='88' r='0.6'/><circle cx='92' cy='68' r='0.5'/><circle cx='34' cy='20' r='0.4'/>
  </g>
  <g transform='rotate(-14 50 50)'>
    <ellipse cx='50' cy='50' rx='36' ry='10' fill='none' stroke='#8a2c0c' stroke-width='4' opacity='0.55'/>
    <ellipse cx='50' cy='50' rx='29' ry='8' fill='none' stroke='#e85c14' stroke-width='3.4' opacity='0.8'/>
    <ellipse cx='50' cy='50' rx='23' ry='6.2' fill='none' stroke='#ffb244' stroke-width='2.8'/>
    <path d='M27 52 A 23 6.2 0 0 1 50 43.8' fill='none' stroke='#fff0b8' stroke-width='3'/>
  </g>
  <circle cx='50' cy='50' r='15' fill='#030308'/>
  <circle cx='50' cy='50' r='15.5' fill='none' stroke='#ffd88a' stroke-width='1.2' opacity='0.95'/>
  <path d='M35 44 A 16.5 16.5 0 0 1 66 45' fill='none' stroke='#ffe9b0' stroke-width='1' opacity='0.7'/>
  <g stroke='#fff' stroke-width='0.5' opacity='0.9'><path d='M22 26 L 22 31 M19.5 28.5 L 24.5 28.5'/><path d='M80 74 L 80 79 M77.5 76.5 L 82.5 76.5'/></g>
  <g fill='#ffcc7a' opacity='0.8'><circle cx='20' cy='64' r='0.8'/><circle cx='82' cy='34' r='0.8'/></g>
</svg>`;

const SVG_BAMBOO_GROVE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='b' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#dcedc0'/><stop offset='1' stop-color='#9cc873'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#b)'/>
  <path d='M30 0 L 42 0 L 24 60 L 14 60 Z' fill='#fff8d0' opacity='0.35'/>
  <g fill='#b4d494' opacity='0.8'><rect x='30' y='0' width='4' height='100'/><rect x='72' y='0' width='4' height='100'/></g>
  <g fill='#5d9e4a'><rect x='8' y='0' width='6' height='100' rx='2'/><rect x='88' y='0' width='6' height='100' rx='2'/></g>
  <g fill='#4a8a3a'><rect x='40' y='0' width='5' height='100' rx='2'/><rect x='62' y='0' width='5.4' height='100' rx='2'/></g>
  <g stroke='#3a6e2c' stroke-width='1.1'>
    <line x1='8' y1='22' x2='14' y2='22'/><line x1='8' y1='48' x2='14' y2='48'/><line x1='8' y1='74' x2='14' y2='74'/>
    <line x1='88' y1='18' x2='94' y2='18'/><line x1='88' y1='44' x2='94' y2='44'/><line x1='88' y1='72' x2='94' y2='72'/>
    <line x1='40' y1='30' x2='45' y2='30'/><line x1='40' y1='58' x2='45' y2='58'/><line x1='40' y1='84' x2='45' y2='84'/>
    <line x1='62' y1='26' x2='67.4' y2='26'/><line x1='62' y1='54' x2='67.4' y2='54'/><line x1='62' y1='80' x2='67.4' y2='80'/>
  </g>
  <g fill='#4a8a3a'>
    <ellipse cx='22' cy='16' rx='7' ry='2' transform='rotate(-24 22 16)'/><ellipse cx='80' cy='12' rx='7' ry='2' transform='rotate(22 80 12)'/><ellipse cx='34' cy='40' rx='6' ry='1.8' transform='rotate(20 34 40)'/><ellipse cx='70' cy='38' rx='6' ry='1.8' transform='rotate(-22 70 38)'/>
  </g>
</svg>`;

const SVG_DANDELION_FIELD = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7fc3ea'/><stop offset='1' stop-color='#ecf7fd'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a2d788'/><stop offset='1' stop-color='#569b43'/></linearGradient>
  </defs>
  <rect width='100' height='62' fill='url(#s)'/>
  <circle cx='82' cy='14' r='6' fill='#fff6b0'/><circle cx='82' cy='14' r='9.5' fill='#fff6b0' opacity='0.3'/>
  <ellipse cx='28' cy='20' rx='11' ry='3' fill='#fff' opacity='0.9'/>
  <path d='M0 62 Q 25 55 50 61 T 100 59 L 100 100 L 0 100 Z' fill='url(#g)'/>
  <g stroke='#3e7d30' stroke-width='0.8' fill='none'><path d='M12 82 q 1 -10 0 -14'/><path d='M88 84 q -1 -10 0 -14'/><path d='M24 92 q 1 -9 0 -12'/></g>
  <g stroke='#e8f4ec' stroke-width='0.55' opacity='0.95'>
    <path d='M12 68 l 0 -5 M12 68 l 4 -3.5 M12 68 l -4 -3.5 M12 68 l 5 0 M12 68 l -5 0 M12 68 l 3.5 3.5 M12 68 l -3.5 3.5'/>
    <path d='M88 70 l 0 -5 M88 70 l 4 -3.5 M88 70 l -4 -3.5 M88 70 l 5 0 M88 70 l -5 0 M88 70 l 3.5 3.5 M88 70 l -3.5 3.5'/>
  </g>
  <circle cx='12' cy='68' r='1.4' fill='#f4f8f0'/><circle cx='88' cy='70' r='1.4' fill='#f4f8f0'/>
  <circle cx='24' cy='80' r='2.2' fill='#ffd93c'/><circle cx='70' cy='88' r='2' fill='#ffd93c'/>
  <g stroke='#fff' stroke-width='0.5' opacity='0.9'>
    <path d='M36 44 l 2 -3 M38 41 l 2 2 M38 41 l -2 0'/><path d='M60 22 l 2 -3 M62 19 l 2 2 M62 19 l -2 0'/><path d='M74 48 l 2 -3 M76 45 l 2 2 M76 45 l -2 0'/>
  </g>
</svg>`;

const SVG_COUNTRY_ROAD = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#84c5ec'/><stop offset='1' stop-color='#eaf6fd'/></linearGradient></defs>
  <rect width='100' height='58' fill='url(#s)'/>
  <circle cx='20' cy='14' r='6' fill='#fff6b0'/><circle cx='20' cy='14' r='9.5' fill='#fff6b0' opacity='0.3'/>
  <ellipse cx='60' cy='16' rx='11' ry='3' fill='#fff' opacity='0.9'/>
  <path d='M0 58 Q 30 50 60 56 T 100 54 L 100 68 L 0 68 Z' fill='#b8dc94'/>
  <path d='M0 64 Q 30 58 60 63 T 100 61 L 100 100 L 0 100 Z' fill='#74b356'/>
  <path d='M30 58 Q 26 70 14 82 Q 6 90 2 100 L 30 100 Q 32 84 34 72 Q 35 64 33 58 Z' fill='#d8c294'/>
  <g stroke='#b89c66' stroke-width='0.7' opacity='0.8'><path d='M31.5 60 Q 28 72 18 84 Q 12 92 9 100'/></g>
  <rect x='74' y='40' width='3' height='18' fill='#6d4c41'/>
  <g fill='#3e8e41'><circle cx='75.5' cy='32' r='9'/><circle cx='68' cy='38' r='6'/><circle cx='83' cy='38' r='6'/></g>
  <circle cx='72' cy='30' r='4' fill='#5cab57'/>
  <g fill='#5d4037'><rect x='48' y='62' width='1.8' height='7'/><rect x='60' y='66' width='1.8' height='7'/><rect x='72' y='70' width='1.8' height='7'/></g>
  <g stroke='#5d4037' stroke-width='0.8'><line x1='48' y1='64' x2='74' y2='72'/><line x1='48' y1='67' x2='74' y2='75'/></g>
  <g fill='#fff275'><circle cx='66' cy='84' r='1.2'/><circle cx='86' cy='90' r='1.2'/></g>
  <g stroke='#3f6f8e' stroke-width='0.7' fill='none' stroke-linecap='round'><path d='M42 22 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_PICNIC_LAWN = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7ec2ea'/><stop offset='1' stop-color='#e9f6fd'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#93d275'/><stop offset='1' stop-color='#4f9f45'/></linearGradient>
  </defs>
  <rect width='100' height='60' fill='url(#s)'/>
  <circle cx='16' cy='12' r='6' fill='#fff6b0'/><circle cx='16' cy='12' r='9.5' fill='#fff6b0' opacity='0.3'/>
  <ellipse cx='56' cy='16' rx='11' ry='3' fill='#fff' opacity='0.9'/><ellipse cx='82' cy='26' rx='8' ry='2.4' fill='#fff' opacity='0.7'/>
  <path d='M0 60 Q 25 54 50 59 T 100 57 L 100 100 L 0 100 Z' fill='url(#g)'/>
  <rect x='84' y='34' width='3.4' height='24' fill='#6d4c41'/>
  <g fill='#3e8e41'><circle cx='86' cy='26' r='11'/><circle cx='77' cy='32' r='7'/></g>
  <circle cx='82' cy='23' r='4.6' fill='#5cab57'/>
  <g transform='rotate(-6 78 82)'>
    <rect x='62' y='72' width='32' height='20' rx='1.5' fill='#e85454'/>
    <g fill='#fff' opacity='0.85'><rect x='66' y='72' width='5' height='20'/><rect x='78' y='72' width='5' height='20'/></g>
    <rect x='62' y='80' width='32' height='4.5' fill='#e85454' opacity='0.45'/>
  </g>
  <g><path d='M64 68 L 76 68 L 74 76 L 66 76 Z' fill='#a1783c'/><path d='M66 68 A 5 5 0 0 1 74 68' fill='none' stroke='#7a5a28' stroke-width='1.4'/></g>
  <circle cx='79' cy='75' r='2' fill='#d43c3c'/>
  <g fill='#e57373'><ellipse cx='38' cy='30' rx='1.7' ry='2.2'/><ellipse cx='41.2' cy='30' rx='1.7' ry='2.2'/></g>
</svg>`;

const SVG_VINEYARD = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e88a54'/><stop offset='0.6' stop-color='#f8c078'/><stop offset='1' stop-color='#fde8b4'/></linearGradient>
    <linearGradient id='h' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8ab04c'/><stop offset='1' stop-color='#54803a'/></linearGradient>
  </defs>
  <rect width='100' height='54' fill='url(#s)'/>
  <circle cx='74' cy='20' r='7' fill='#fff0a8'/><circle cx='74' cy='20' r='11' fill='#ffdf8a' opacity='0.4'/>
  <path d='M0 54 Q 30 46 60 52 T 100 50 L 100 62 L 0 62 Z' fill='#a8bc60' opacity='0.85'/>
  <rect y='58' width='100' height='42' fill='url(#h)'/>
  <g fill='#3c6428'>
    <path d='M0 66 Q 50 62 100 66 L 100 71 Q 50 67 0 71 Z'/><path d='M0 80 Q 50 75 100 80 L 100 86 Q 50 81 0 86 Z'/>
  </g>
  <g stroke='#2c4c1c' stroke-width='0.8'><line x1='10' y1='62' x2='10' y2='70'/><line x1='90' y1='62' x2='90' y2='70'/><line x1='30' y1='75' x2='30' y2='84'/></g>
  <g fill='#6a3a8c'><circle cx='8' cy='65' r='1.1'/><circle cx='10' cy='66.5' r='1.1'/><circle cx='12' cy='65' r='1.1'/><circle cx='88' cy='65' r='1.1'/><circle cx='90' cy='66.5' r='1.1'/><circle cx='92' cy='65' r='1.1'/></g>
  <g><rect x='42' y='40' width='11' height='9' fill='#f4e0c0'/><path d='M40 40 L 47.5 33 L 55 40 Z' fill='#c05430'/><rect x='46' y='44' width='3' height='5' fill='#7a4a2c'/></g>
  <g fill='#2f5e28'><ellipse cx='36' cy='44' rx='1.8' ry='5'/><ellipse cx='60' cy='45' rx='1.8' ry='5'/></g>
</svg>`;

const SVG_APPLE_ORCHARD = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8ac8ec'/><stop offset='1' stop-color='#ecf7fd'/></linearGradient>
    <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#9ed382'/><stop offset='1' stop-color='#549b44'/></linearGradient>
  </defs>
  <rect width='100' height='62' fill='url(#s)'/>
  <circle cx='50' cy='12' r='5.5' fill='#fff6b0'/><circle cx='50' cy='12' r='9' fill='#fff6b0' opacity='0.3'/>
  <ellipse cx='30' cy='20' rx='10' ry='2.8' fill='#fff' opacity='0.85'/><ellipse cx='70' cy='24' rx='8' ry='2.4' fill='#fff' opacity='0.7'/>
  <path d='M0 62 Q 25 56 50 61 T 100 59 L 100 100 L 0 100 Z' fill='url(#g)'/>
  <rect x='12' y='42' width='3.6' height='22' fill='#6d4c41'/>
  <g fill='#3e8e41'><circle cx='14' cy='32' r='12'/><circle cx='4' cy='38' r='8'/><circle cx='25' cy='38' r='8'/></g>
  <circle cx='10' cy='28' r='5' fill='#5cab57'/>
  <g fill='#d43c3c'><circle cx='8' cy='34' r='1.8'/><circle cx='18' cy='30' r='1.8'/><circle cx='13' cy='40' r='1.6'/></g>
  <rect x='84' y='44' width='3.6' height='20' fill='#6d4c41'/>
  <g fill='#3e8e41'><circle cx='86' cy='34' r='11'/><circle cx='77' cy='40' r='7'/><circle cx='96' cy='40' r='7'/></g>
  <circle cx='82' cy='30' r='4.6' fill='#5cab57'/>
  <g fill='#d43c3c'><circle cx='81' cy='36' r='1.7'/><circle cx='91' cy='32' r='1.7'/><circle cx='95' cy='42' r='1.6'/></g>
  <ellipse cx='15' cy='65' rx='14' ry='2.4' fill='#3a7c36' opacity='0.5'/>
  <circle cx='34' cy='90' r='1.7' fill='#d43c3c'/>
</svg>`;

const SVG_WINDMILL = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7cc2ea'/><stop offset='1' stop-color='#e9f6fd'/></linearGradient></defs>
  <rect width='100' height='64' fill='url(#s)'/>
  <circle cx='16' cy='14' r='6' fill='#fff6b0'/><circle cx='16' cy='14' r='9.5' fill='#fff6b0' opacity='0.3'/>
  <ellipse cx='46' cy='14' rx='11' ry='3' fill='#fff' opacity='0.9'/><ellipse cx='78' cy='24' rx='9' ry='2.6' fill='#fff' opacity='0.75'/>
  <path d='M0 64 Q 30 56 60 62 T 100 60 L 100 78 L 0 78 Z' fill='#a8d584'/>
  <path d='M0 76 Q 30 68 60 74 T 100 72 L 100 100 L 0 100 Z' fill='#68ab4e'/>
  <path d='M64 60 L 68 30 L 78 30 L 82 60 Z' fill='#b0523a'/>
  <path d='M66 34 L 80 34 L 79 30 L 67 30 Z' fill='#8a3c2a'/>
  <path d='M64 30 L 73 22 L 82 30 Z' fill='#59352c'/>
  <rect x='71' y='50' width='4.4' height='10' fill='#59352c'/><circle cx='73' cy='27' r='1.8' fill='#f4e8d0'/>
  <g stroke='#f4ead6' stroke-width='2.6' stroke-linecap='round'><line x1='73' y1='27' x2='60' y2='14'/><line x1='73' y1='27' x2='86' y2='14'/><line x1='73' y1='27' x2='60' y2='40'/><line x1='73' y1='27' x2='86' y2='40'/></g>
  <g fill='#e84c6a'><circle cx='8' cy='82' r='1.6'/><circle cx='20' cy='88' r='1.6'/><circle cx='32' cy='82' r='1.6'/></g>
  <g fill='#f0c030'><circle cx='14' cy='92' r='1.6'/><circle cx='26' cy='95' r='1.6'/><circle cx='90' cy='88' r='1.6'/></g>
  <g stroke='#3f6f8e' stroke-width='0.7' fill='none' stroke-linecap='round'><path d='M30 30 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_OLD_BRIDGE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f2a868'/><stop offset='0.6' stop-color='#fbd39a'/><stop offset='1' stop-color='#fdeccb'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8ecfd8'/><stop offset='1' stop-color='#5ba8bc'/></linearGradient>
  </defs>
  <rect width='100' height='58' fill='url(#s)'/>
  <circle cx='22' cy='20' r='6.5' fill='#fff0a8'/><circle cx='22' cy='20' r='10.5' fill='#ffdf8a' opacity='0.4'/>
  <g fill='#b98a58' opacity='0.65'><ellipse cx='6' cy='50' rx='11' ry='9'/><ellipse cx='95' cy='48' rx='12' ry='10'/></g>
  <g fill='#8a9a5b'><ellipse cx='6' cy='46' rx='7' ry='6'/><ellipse cx='95' cy='44' rx='8' ry='7'/></g>
  <rect y='52' width='100' height='26' fill='url(#w)'/>
  <path d='M0 52 Q 50 49 100 52 L 100 55 Q 50 52 0 55 Z' fill='#bfe4e8' opacity='0.7'/>
  <path d='M8 30 Q 50 22 92 30 L 92 36 Q 50 28 8 36 Z' fill='#8a6240'/>
  <path d='M14 36 Q 50 29 86 36 L 86 74 Q 76 74 76 62 Q 76 48 50 48 Q 24 48 24 62 Q 24 74 14 74 Z' fill='#a97a50'/>
  <path d='M28 62 Q 28 51 50 51 Q 72 51 72 62 L 72 76 L 68 76 L 68 62 Q 68 54 50 54 Q 32 54 32 62 L 32 76 L 28 76 Z' fill='#7c5a3a'/>
  <g stroke='#6e4f32' stroke-width='1.1'><path d='M20 30 L 20 40 M35 27.5 L 35 37 M50 26.5 L 50 36 M65 27.5 L 65 37 M80 30 L 80 40'/></g>
  <path d='M8 31 Q 50 23 92 31' stroke='#6e4f32' stroke-width='1.2' fill='none'/>
  <rect x='16.8' y='24' width='1.4' height='8' fill='#5c4028'/><circle cx='17.5' cy='23' r='1.8' fill='#ffcf6a'/><circle cx='17.5' cy='23' r='3.2' fill='#ffcf6a' opacity='0.3'/>
  <path d='M30 64 Q 50 60 70 64 Q 50 68 30 64 Z' fill='#4f96aa' opacity='0.6'/>
  <ellipse cx='22' cy='58' rx='5' ry='0.9' fill='#ffe0a0' opacity='0.5'/><ellipse cx='78' cy='68' rx='6' ry='1' fill='#cfeef2' opacity='0.6'/>
  <path d='M0 78 Q 50 74 100 78 L 100 100 L 0 100 Z' fill='#9cbf6e'/>
  <path d='M0 88 Q 50 84 100 88 L 100 100 L 0 100 Z' fill='#88af5c'/>
  <g fill='#e8788a'><circle cx='10' cy='90' r='1.2'/><circle cx='90' cy='92' r='1.2'/></g>
</svg>`;

const SVG_HOT_AIR_BALLOON = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#6fbbe8'/><stop offset='0.7' stop-color='#c2e5f6'/><stop offset='1' stop-color='#eef8fd'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='88' cy='12' r='6' fill='#fff6b0'/><circle cx='88' cy='12' r='9.5' fill='#fff6b0' opacity='0.3'/>
  <ellipse cx='60' cy='30' rx='12' ry='3.2' fill='#fff' opacity='0.9'/>
  <g>
    <path d='M22 12 A 13 14 0 0 1 35 26 Q 35 34 28.5 40 Q 22 34 22 26 Z' fill='#e85454'/>
    <path d='M22 12 A 13 14 0 0 0 9 26 Q 9 34 15.5 40 Q 22 34 22 26 Z' fill='#f4a83c'/>
    <path d='M22 12 Q 26 20 26 27 Q 26 35 22 41 Q 18 35 18 27 Q 18 20 22 12 Z' fill='#fdf2d8'/>
    <g stroke='#8a5a28' stroke-width='0.7'><line x1='16' y1='38' x2='18' y2='45'/><line x1='28' y1='38' x2='26' y2='45'/></g>
    <rect x='18' y='45' width='8' height='6' rx='1' fill='#8d5b2c'/>
    <path d='M18 47 L 26 47' stroke='#6e4520' stroke-width='0.7'/>
  </g>
  <g opacity='0.9'><path d='M72 22 A 5 5.5 0 0 1 77 27.5 Q 77 31 74.5 33.5 Q 72 31 72 27.5 Z' fill='#7cb0e0'/><path d='M72 22 A 5 5.5 0 0 0 67 27.5 Q 67 31 69.5 33.5 Q 72 31 72 27.5 Z' fill='#f0f4f8'/><rect x='70.4' y='35.5' width='3.2' height='2.6' rx='0.6' fill='#8d5b2c'/></g>
  <path d='M0 88 Q 25 82 50 86 T 100 84 L 100 100 L 0 100 Z' fill='#8cc86a'/>
  <path d='M0 94 Q 30 90 60 93 T 100 92 L 100 100 L 0 100 Z' fill='#68a84e'/>
  <g stroke='#3f6f8e' stroke-width='0.7' fill='none' stroke-linecap='round'><path d='M52 16 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_LIGHTHOUSE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#20265c'/><stop offset='0.6' stop-color='#5c4a84'/><stop offset='1' stop-color='#c87a6a'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#3c3468'/><stop offset='1' stop-color='#1e1a44'/></linearGradient>
  </defs>
  <rect width='100' height='68' fill='url(#s)'/>
  <g fill='#fff'><circle cx='14' cy='12' r='0.8'/><circle cx='56' cy='14' r='0.7'/><circle cx='24' cy='26' r='0.5'/><circle cx='10' cy='38' r='0.6'/></g>
  <path d='M34 10 A 5 5 0 1 1 30 4 A 4 4 0 0 0 34 10' fill='#f4f0d8' opacity='0.9'/>
  <g fill='#fff6c0' opacity='0.35'><path d='M76 22 L 40 12 L 40 30 Z'/><path d='M80 22 L 100 8 L 100 30 Z'/></g>
  <path d='M64 68 L 66 44 L 90 44 L 92 68 Z' fill='#5c4048'/>
  <path d='M72 44 L 74 24 L 82 24 L 84 44 Z' fill='#f0e8dc'/>
  <g fill='#d84848'><path d='M73.2 30 L 82.8 30 L 83.4 36 L 72.6 36 Z'/><path d='M74 24 L 82 24 L 82.4 27 L 73.6 27 Z' opacity='0.9'/></g>
  <rect x='74.5' y='19' width='7' height='5' fill='#2c2438'/>
  <circle cx='78' cy='21.5' r='2' fill='#ffe97a'/>
  <path d='M72 19 L 78 14.5 L 84 19 Z' fill='#d84848'/>
  <rect y='66' width='100' height='34' fill='url(#w)'/>
  <path d='M0 68 Q 14 63 28 68 T 56 68 T 84 68 T 100 66 L 100 76 L 0 76 Z' fill='#4c4480' opacity='0.9'/>
  <ellipse cx='78' cy='70' rx='6' ry='0.9' fill='#ffe97a' opacity='0.5'/>
  <g stroke='#c8d4e8' stroke-width='0.7' opacity='0.6'><path d='M8 84 q 7 -2 14 0'/><path d='M52 88 q 8 -2 16 0'/></g>
</svg>`;

const SVG_FIREFLY_FOREST = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='f' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#03140e'/><stop offset='0.6' stop-color='#0a2c1c'/><stop offset='1' stop-color='#123a24'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#f)'/>
  <g fill='#062014' opacity='0.95'><ellipse cx='10' cy='10' rx='18' ry='10'/><ellipse cx='52' cy='4' rx='22' ry='9'/><ellipse cx='92' cy='10' rx='16' ry='9'/></g>
  <g fill='#082818'><path d='M8 100 L 8 26 Q 6 20 10 14 Q 14 20 12 26 L 12 100 Z'/><path d='M88 100 L 88 22 Q 86 16 90 10 Q 94 16 92 22 L 92 100 Z'/></g>
  <g fill='#0b3020'><path d='M26 100 L 26 40 Q 24 34 28 30 Q 32 34 30 40 L 30 100 Z'/><path d='M70 100 L 70 36 Q 68 30 72 26 Q 76 30 74 36 L 74 100 Z'/></g>
  <path d='M0 92 Q 30 88 60 92 T 100 90 L 100 100 L 0 100 Z' fill='#0a3320'/>
  <g fill='#d8f470'>
    <circle cx='22' cy='56' r='1.1'/><circle cx='38' cy='40' r='1'/><circle cx='52' cy='62' r='1.2'/><circle cx='64' cy='30' r='0.9'/><circle cx='80' cy='52' r='1.1'/><circle cx='34' cy='74' r='1'/><circle cx='60' cy='80' r='0.9'/><circle cx='14' cy='34' r='0.9'/><circle cx='92' cy='70' r='1'/><circle cx='46' cy='20' r='0.8'/>
  </g>
  <g fill='#d8f470' opacity='0.22'>
    <circle cx='22' cy='56' r='3'/><circle cx='38' cy='40' r='2.6'/><circle cx='52' cy='62' r='3.2'/><circle cx='64' cy='30' r='2.4'/><circle cx='80' cy='52' r='3'/><circle cx='34' cy='74' r='2.6'/><circle cx='92' cy='70' r='2.6'/>
  </g>
</svg>`;

const SVG_REDWOOD_FOREST = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='r' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#f0d8a0'/><stop offset='0.5' stop-color='#c8a468'/><stop offset='1' stop-color='#7c5c3c'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#r)'/>
  <g fill='#fff3c8' opacity='0.45'><path d='M34 0 L 48 0 L 30 70 L 18 70 Z'/><path d='M66 0 L 76 0 L 64 56 L 56 56 Z'/></g>
  <g fill='#9a6a48' opacity='0.75'><path d='M30 100 L 31 0 L 37 0 L 38 100 Z'/><path d='M58 100 L 59 0 L 64 0 L 65 100 Z'/></g>
  <g fill='#6e4228'><path d='M2 100 L 4 0 L 18 0 L 20 100 Z'/><path d='M80 100 L 82 0 L 96 0 L 98 100 Z'/></g>
  <g stroke='#59331e' stroke-width='0.9' opacity='0.8'><path d='M8 0 Q 9 50 8 100'/><path d='M14 0 Q 15 50 14 100'/><path d='M86 0 Q 87 50 86 100'/><path d='M92 0 Q 93 50 92 100'/></g>
  <g fill='#3e7038'><ellipse cx='24' cy='18' rx='9' ry='3' transform='rotate(-14 24 18)'/><ellipse cx='76' cy='26' rx='9' ry='3' transform='rotate(14 76 26)'/><ellipse cx='76' cy='48' rx='8' ry='2.6' transform='rotate(12 76 48)'/></g>
  <path d='M0 94 Q 30 90 60 93 T 100 92 L 100 100 L 0 100 Z' fill='#4c5e30'/>
  <g stroke='#3e5026' stroke-width='1' fill='none'><path d='M24 94 q -3 -6 -8 -7 q 6 0 9 3'/><path d='M72 95 q 3 -6 8 -7 q -6 0 -9 3'/></g>
  <g fill='#ffe9a0' opacity='0.75'><circle cx='44' cy='40' r='0.9'/><circle cx='52' cy='60' r='0.8'/><circle cx='40' cy='76' r='0.8'/><circle cx='68' cy='70' r='0.7'/></g>
</svg>`;

const SVG_TEMPLE_RUINS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='t' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1c3428'/><stop offset='0.6' stop-color='#2e5038'/><stop offset='1' stop-color='#3c6444'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#t)'/>
  <g fill='#142820' opacity='0.9'><ellipse cx='12' cy='8' rx='18' ry='9'/><ellipse cx='56' cy='4' rx='22' ry='8'/><ellipse cx='92' cy='10' rx='15' ry='8'/></g>
  <g fill='#c8bc94'>
    <rect x='8' y='30' width='10' height='58'/><rect x='5' y='26' width='16' height='5' rx='1'/><rect x='6' y='86' width='14' height='5' rx='1'/>
    <rect x='82' y='34' width='10' height='54'/><rect x='79' y='30' width='16' height='5' rx='1'/><rect x='80' y='86' width='14' height='5' rx='1'/>
  </g>
  <g stroke='#a89c74' stroke-width='0.7' opacity='0.85'><line x1='11' y1='34' x2='11' y2='84'/><line x1='15' y1='34' x2='15' y2='84'/><line x1='85' y1='38' x2='85' y2='84'/><line x1='89' y1='38' x2='89' y2='84'/></g>
  <g stroke='#3c7048' stroke-width='1.2' fill='none'><path d='M8 30 q 4 14 2 30 q 4 -4 8 -2'/><path d='M92 34 q -4 12 -2 26'/></g>
  <ellipse cx='10' cy='46' rx='2.4' ry='1.2' transform='rotate(-20 10 46)' fill='#4c8858'/>
  <path d='M0 94 Q 30 90 60 93 T 100 92 L 100 100 L 0 100 Z' fill='#2a4c32'/>
  <g fill='#ffe97a'><circle cx='30' cy='56' r='1'/><circle cx='58' cy='48' r='0.9'/><circle cx='70' cy='68' r='1'/></g>
  <g fill='#ffe97a' opacity='0.22'><circle cx='30' cy='56' r='2.8'/><circle cx='58' cy='48' r='2.5'/><circle cx='70' cy='68' r='2.8'/></g>
</svg>`;

const SVG_HOT_SPRINGS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#9db8d0'/><stop offset='1' stop-color='#e8eff5'/></linearGradient>
    <linearGradient id='p' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#6fd0d8'/><stop offset='1' stop-color='#2e8f9e'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <g fill='#8aa4bc' opacity='0.7'><path d='M0 40 L 20 18 L 42 40 Z'/><path d='M58 40 L 78 20 L 98 40 Z'/></g>
  <g fill='#fff'><path d='M20 18 L 26 25 L 14 25 Z'/></g>
  <rect y='38' width='100' height='62' fill='#eef4f8'/>
  <ellipse cx='50' cy='72' rx='40' ry='22' fill='url(#p)'/>
  <g stroke='#bfeef2' stroke-width='0.8' opacity='0.8' fill='none'><path d='M30 70 q 8 -2 16 0'/><path d='M56 78 q 8 -2 16 0'/></g>
  <g fill='#8a8f98'>
    <ellipse cx='14' cy='58' rx='7' ry='4.6'/><ellipse cx='30' cy='50' rx='6' ry='4'/><ellipse cx='52' cy='47' rx='7' ry='4.4'/><ellipse cx='74' cy='50' rx='6' ry='4'/><ellipse cx='88' cy='58' rx='7' ry='4.6'/><ellipse cx='6' cy='74' rx='6' ry='4'/>
  </g>
  <g fill='#fff'>
    <ellipse cx='14' cy='56.4' rx='6' ry='2.4'/><ellipse cx='52' cy='45.6' rx='6' ry='2.2'/><ellipse cx='88' cy='56.4' rx='6' ry='2.4'/>
  </g>
  <g stroke='#fff' stroke-width='1.6' fill='none' opacity='0.75' stroke-linecap='round'>
    <path d='M36 60 q -3 -6 1 -11 q 4 -5 1 -10'/><path d='M52 58 q -3 -6 1 -11 q 4 -5 1 -10'/>
  </g>
  <g fill='#fff'><circle cx='24' cy='16' r='1'/><circle cx='48' cy='10' r='0.9'/><circle cx='10' cy='28' r='0.8'/></g>
</svg>`;

const SVG_GLACIAL_BAY = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#a8cbe4'/><stop offset='1' stop-color='#eef6fb'/></linearGradient>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#5490b8'/><stop offset='1' stop-color='#2e6488'/></linearGradient>
  </defs>
  <rect width='100' height='56' fill='url(#s)'/>
  <circle cx='22' cy='16' r='6' fill='#fff8dc' opacity='0.95'/><circle cx='22' cy='16' r='10' fill='#fff8dc' opacity='0.3'/>
  <g fill='#c2d9ea'><path d='M40 56 L 46 34 L 54 46 L 60 30 L 68 44 L 74 34 L 80 56 Z'/></g>
  <g fill='#e4f0f8'><path d='M46 34 L 50 42 L 42 46 Z'/><path d='M60 30 L 64 38 L 56 40 Z'/></g>
  <rect y='54' width='100' height='46' fill='url(#w)'/>
  <path d='M0 54 Q 50 52 100 54' stroke='#bcdcee' stroke-width='1' fill='none' opacity='0.85'/>
  <g><path d='M4 66 L 10 52 L 18 58 L 22 66 Z' fill='#f2f8fc'/><path d='M10 52 L 14 58 L 8 60 Z' fill='#c8e0ef'/><path d='M4 66 L 22 66 L 20 72 L 7 72 Z' fill='#9cc4dc' opacity='0.7'/></g>
  <g><path d='M76 64 L 84 48 L 94 56 L 97 64 Z' fill='#f2f8fc'/><path d='M84 48 L 88 55 L 80 57 Z' fill='#c8e0ef'/><path d='M76 64 L 97 64 L 94 70 L 79 70 Z' fill='#9cc4dc' opacity='0.7'/></g>
  <g stroke='#bcdcee' stroke-width='0.7' opacity='0.7'><line x1='10' y1='80' x2='24' y2='80'/><line x1='58' y1='84' x2='74' y2='84'/></g>
  <g fill='#fff'><circle cx='40' cy='14' r='0.9'/><circle cx='60' cy='10' r='0.8'/><circle cx='50' cy='24' r='0.7'/><circle cx='8' cy='36' r='0.8'/></g>
</svg>`;

const SVG_BALLOON_FIESTA = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#7c3c74'/><stop offset='0.45' stop-color='#e86450'/><stop offset='0.8' stop-color='#f8a84c'/><stop offset='1' stop-color='#fdd88a'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#s)'/>
  <circle cx='50' cy='80' r='9' fill='#fff0a0'/>
  <g opacity='0.75'>
    <path d='M78 22 A 4.5 5 0 0 1 82.5 27 Q 82.5 30.4 80.2 32.6 Q 78 30.4 78 27 Z' fill='#b05ca8'/><path d='M78 22 A 4.5 5 0 0 0 73.5 27 Q 73.5 30.4 75.8 32.6 Q 78 30.4 78 27 Z' fill='#f0e0b0'/><rect x='76.6' y='34.4' width='2.8' height='2.2' rx='0.5' fill='#6e4520'/>
  </g>
  <g>
    <path d='M32 8 A 11 12 0 0 1 43 20 Q 43 27 37.5 32 Q 32 27 32 20 Z' fill='#e84c4c'/>
    <path d='M32 8 A 11 12 0 0 0 21 20 Q 21 27 26.5 32 Q 32 27 32 20 Z' fill='#f8b83c'/>
    <path d='M32 8 Q 35.4 15 35.4 21 Q 35.4 28 32 33 Q 28.6 28 28.6 21 Q 28.6 15 32 8 Z' fill='#fdf2d8'/>
    <rect x='29' y='35' width='6' height='4.6' rx='0.8' fill='#8d5b2c'/>
  </g>
  <g opacity='0.9'><path d='M62 40 A 6.5 7 0 0 1 68.5 47 Q 68.5 51.6 65.2 54.8 Q 62 51.6 62 47 Z' fill='#4ca86a'/><path d='M62 40 A 6.5 7 0 0 0 55.5 47 Q 55.5 51.6 58.8 54.8 Q 62 51.6 62 47 Z' fill='#fdf2d8'/><rect x='60' y='56.6' width='4' height='3.2' rx='0.6' fill='#8d5b2c'/></g>
  <path d='M0 88 Q 25 82 50 86 T 100 84 L 100 100 L 0 100 Z' fill='#5c3448'/>
  <path d='M0 95 Q 30 91 60 94 T 100 93 L 100 100 L 0 100 Z' fill='#46283c'/>
</svg>`;

const SVG_CHINESE_MOUNTAINS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='m' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#d8e4e8'/><stop offset='1' stop-color='#f4f7f8'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#m)'/>
  <circle cx='76' cy='16' r='6' fill='#f8e0c0' opacity='0.85'/>
  <g fill='#b4c6ce' opacity='0.75'>
    <path d='M14 60 Q 10 34 18 20 Q 26 34 22 60 Z'/><path d='M54 56 Q 50 30 58 14 Q 66 30 62 56 Z'/><path d='M90 58 Q 86 36 92 24 Q 99 36 96 58 Z'/>
  </g>
  <ellipse cx='50' cy='58' rx='52' ry='5' fill='#f4f7f8' opacity='0.9'/>
  <g fill='#7d95a2'>
    <path d='M32 78 Q 27 44 36 26 Q 46 44 41 78 Z'/><path d='M70 80 Q 65 48 74 32 Q 83 48 79 80 Z'/>
  </g>
  <g fill='#5d7684'><path d='M35 34 Q 38 40 37 48 L 40 44 Q 40 36 36 28 Z' opacity='0.6'/></g>
  <ellipse cx='50' cy='78' rx='52' ry='5.5' fill='#eef3f5' opacity='0.9'/>
  <g fill='#4c6472'>
    <path d='M8 96 Q 4 74 12 60 Q 20 74 16 96 Z'/><path d='M88 96 Q 84 76 92 64 Q 99 76 96 96 Z'/>
  </g>
  <path d='M0 94 Q 30 90 60 93 T 100 92 L 100 100 L 0 100 Z' fill='#dfe8ec'/>
  <g stroke='#3c5260' stroke-width='1' fill='none'><path d='M12 62 q 4 -2 8 0'/></g>
  <g fill='#2e6e4c'><path d='M12 60 q 5 -3 9 -1 q -4 -4 -8 -3 q 1 2 -1 4 Z'/></g>
  <g stroke='#5d7684' stroke-width='0.8' fill='none' stroke-linecap='round'><path d='M42 16 q 2 -2 4 0 q 2 -2 4 0'/><path d='M28 22 q 2 -2 4 0 q 2 -2 4 0'/></g>
</svg>`;

const SVG_SUPERNOVA = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><radialGradient id='c' cx='0.5' cy='0.5' r='0.5'><stop offset='0' stop-color='#fffbe0'/><stop offset='0.35' stop-color='#ffcf5c'/><stop offset='0.75' stop-color='#f0703c' stop-opacity='0.55'/><stop offset='1' stop-color='#f0703c' stop-opacity='0'/></radialGradient></defs>
  <rect width='100' height='100' fill='#0c0618'/>
  <g fill='#fff'>
    <circle cx='12' cy='12' r='0.8'/><circle cx='30' cy='6' r='0.5'/><circle cx='70' cy='8' r='0.6'/><circle cx='90' cy='16' r='0.8'/><circle cx='6' cy='42' r='0.6'/><circle cx='94' cy='48' r='0.6'/><circle cx='10' cy='84' r='0.7'/><circle cx='40' cy='92' r='0.6'/><circle cx='78' cy='88' r='0.7'/><circle cx='92' cy='72' r='0.6'/><circle cx='22' cy='30' r='0.5'/>
  </g>
  <circle cx='50' cy='44' r='31' fill='none' stroke='#c85c8a' stroke-width='1.6' opacity='0.5'/>
  <circle cx='50' cy='44' r='24' fill='url(#c)'/>
  <g fill='#ffe9a8' opacity='0.85'>
    <path d='M50 12 L 52.4 38 L 50 44 L 47.6 38 Z'/><path d='M50 76 L 52.4 50 L 50 44 L 47.6 50 Z'/><path d='M18 44 L 44 41.6 L 50 44 L 44 46.4 Z'/><path d='M82 44 L 56 41.6 L 50 44 L 56 46.4 Z'/>
  </g>
  <g fill='#ffd88a' opacity='0.6'><path d='M28 22 L 46 38 L 50 44 L 42 40 Z'/><path d='M72 66 L 54 50 L 50 44 L 58 48 Z'/></g>
  <circle cx='50' cy='44' r='7' fill='#fff6d8'/><circle cx='50' cy='44' r='3.6' fill='#fff'/>
  <g stroke='#fff' stroke-width='0.5' opacity='0.9'><path d='M20 62 L 20 67 M17.5 64.5 L 22.5 64.5'/></g>
  <g fill='#f0a8c0' opacity='0.8'><circle cx='30' cy='78' r='0.8'/><circle cx='84' cy='58' r='0.7'/></g>
</svg>`;

const SVG_DEEP_SEA_ABYSS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='d' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#03141f'/><stop offset='0.6' stop-color='#021019'/><stop offset='1' stop-color='#010a10'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#d)'/>
  <ellipse cx='20' cy='16' rx='16' ry='6' fill='#1a4a5c' opacity='0.35'/>
  <g>
    <ellipse cx='66' cy='36' rx='13' ry='8' fill='#122c38'/>
    <path d='M78 36 L 88 30 L 88 42 Z' fill='#122c38'/>
    <path d='M55 39 Q 60 44 68 43' stroke='#0a1e28' stroke-width='1.2' fill='none'/>
    <g fill='#e8f4f8'><path d='M56 40 L 58 43 L 59 40 Z'/><path d='M60 41 L 62 44 L 63 41 Z'/></g>
    <circle cx='60' cy='33' r='2' fill='#cfe8f0'/><circle cx='60.5' cy='33' r='1' fill='#0a1418'/>
    <path d='M58 28 Q 52 22 48 24' stroke='#2c5868' stroke-width='0.9' fill='none'/>
    <circle cx='48' cy='24' r='2.2' fill='#aef4ec'/><circle cx='48' cy='24' r='4.5' fill='#aef4ec' opacity='0.3'/><circle cx='48' cy='24' r='7' fill='#aef4ec' opacity='0.12'/>
  </g>
  <g fill='#63d8c8'><circle cx='16' cy='48' r='0.9'/><circle cx='22' cy='52' r='0.7'/><circle cx='12' cy='56' r='0.8'/></g>
  <g fill='#63d8c8' opacity='0.25'><circle cx='16' cy='48' r='2.4'/><circle cx='22' cy='52' r='2'/><circle cx='12' cy='56' r='2.2'/></g>
  <g fill='#8ab8c8' opacity='0.5'><circle cx='34' cy='66' r='0.7'/><circle cx='58' cy='74' r='0.6'/><circle cx='80' cy='58' r='0.7'/><circle cx='28' cy='84' r='0.6'/><circle cx='40' cy='12' r='0.6'/></g>
  <path d='M0 100 L 0 90 Q 8 92 12 86 Q 16 94 24 92 Q 20 98 26 100 Z' fill='#0a2530'/>
</svg>`;

const SVG_RAINY_WINDOW = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='o' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#2a3654'/><stop offset='0.7' stop-color='#3c4a6a'/><stop offset='1' stop-color='#4c5878'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#o)'/>
  <g opacity='0.55'>
    <circle cx='20' cy='38' r='5' fill='#ffca6a'/><circle cx='20' cy='38' r='8.5' fill='#ffca6a' opacity='0.35'/>
    <circle cx='50' cy='30' r='4' fill='#8ad4f0'/><circle cx='50' cy='30' r='7' fill='#8ad4f0' opacity='0.35'/>
    <circle cx='78' cy='42' r='4.5' fill='#f890a8'/>
    <circle cx='66' cy='60' r='3.4' fill='#b8a0f0'/><circle cx='88' cy='24' r='2.6' fill='#ffca6a'/>
  </g>
  <g stroke='#bcd4e8' stroke-width='0.7' opacity='0.65' stroke-linecap='round'>
    <path d='M14 4 L 13 30 Q 12.6 34 15 36 L 14 58'/><path d='M42 2 L 41 22'/><path d='M60 8 L 59 40 Q 58.6 44 61 46 L 60 64'/><path d='M84 4 L 83 30'/><path d='M28 40 L 27 66'/><path d='M48 52 L 47 78'/>
  </g>
  <g fill='#cfe2f0' opacity='0.85'>
    <circle cx='14' cy='60' r='1.1'/><circle cx='42' cy='24' r='1'/><circle cx='60' cy='66' r='1.1'/><circle cx='84' cy='32' r='1'/><circle cx='22' cy='16' r='0.8'/><circle cx='48' cy='80' r='0.9'/>
  </g>
  <g fill='#221a28'><rect x='0' y='0' width='4' height='100'/><rect x='96' y='0' width='4' height='100'/><rect x='0' y='0' width='100' height='4'/></g>
  <rect y='84' width='100' height='16' fill='#2e2234'/>
  <g><rect x='84' y='76' width='4' height='6' rx='1' fill='#e8c878'/><path d='M89 78 q 3 1 0 3' stroke='#e8c878' stroke-width='1' fill='none'/></g>
</svg>`;

const SVG_BIRCH_FOREST = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='a' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#dcedc8'/><stop offset='1' stop-color='#aed581'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#a)'/>
  <rect y='78' width='100' height='22' fill='#8bc34a'/>
  <g fill='#fafafa'>
    <rect x='14' y='8' width='6' height='74'/><rect x='38' y='4' width='7' height='78'/><rect x='64' y='10' width='6' height='72'/><rect x='84' y='6' width='5' height='76'/>
  </g>
  <g fill='#455a64'>
    <rect x='15' y='18' width='4' height='2'/><rect x='16' y='38' width='3' height='2'/><rect x='14' y='60' width='4' height='2'/>
    <rect x='40' y='14' width='4' height='2'/><rect x='39' y='34' width='5' height='2'/><rect x='41' y='58' width='3' height='2'/>
    <rect x='65' y='22' width='4' height='2'/><rect x='66' y='48' width='3' height='2'/><rect x='85' y='30' width='3' height='2'/>
  </g>
  <g fill='#c5e1a5' opacity='0.8'><circle cx='17' cy='6' r='9'/><circle cx='42' cy='3' r='11'/><circle cx='67' cy='7' r='9'/><circle cx='86' cy='4' r='8'/></g>
</svg>`;

const SVG_DUNE_GRASS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='s' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#b3e5fc'/><stop offset='1' stop-color='#e1f5fe'/></linearGradient>
  <linearGradient id='d' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffe9b8'/><stop offset='1' stop-color='#f2cf8a'/></linearGradient></defs>
  <rect width='100' height='60' fill='url(#s)'/>
  <ellipse cx='26' cy='20' rx='11' ry='3.4' fill='#ffffff' opacity='0.9'/>
  <ellipse cx='70' cy='14' rx='13' ry='4' fill='#ffffff' opacity='0.85'/>
  <path d='M0 62 Q 30 50 55 60 T 100 56 L 100 100 L 0 100 Z' fill='url(#d)'/>
  <path d='M0 74 Q 40 66 100 76 L 100 100 L 0 100 Z' fill='#eec27f'/>
  <g stroke='#7cb342' stroke-width='1' fill='none'>
    <path d='M18 66 q -2 -8 1 -12'/><path d='M22 66 q 2 -7 0 -12'/><path d='M60 62 q -3 -8 0 -13'/><path d='M64 62 q 2 -7 1 -12'/><path d='M88 70 q -2 -8 1 -12'/>
  </g>
</svg>`;

const SVG_STREET_CAFE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <rect width='100' height='100' fill='#ffe0b2'/>
  <rect width='100' height='58' fill='#ffcc80'/>
  <rect x='8' y='10' width='84' height='30' fill='#a1887f'/>
  <rect x='12' y='16' width='16' height='18' fill='#5d4037'/>
  <rect x='42' y='16' width='16' height='18' fill='#5d4037'/>
  <rect x='72' y='16' width='16' height='18' fill='#5d4037'/>
  <path d='M4 42 L 96 42 L 88 54 L 12 54 Z' fill='#e57373'/>
  <path d='M4 42 L 96 42 L 92 48 L 8 48 Z' fill='#ef9a9a'/>
  <rect y='82' width='100' height='18' fill='#bcaaa4'/>
  <g fill='#6d4c41'><circle cx='30' cy='74' r='7'/><rect x='29' y='74' width='2' height='12'/><circle cx='72' cy='76' r='7'/><rect x='71' y='76' width='2' height='10'/></g>
  <g fill='#fff8e1'><circle cx='30' cy='72' r='1.6'/><circle cx='72' cy='74' r='1.6'/></g>
  <circle cx='88' cy='8' r='5' fill='#fff3a8'/>
</svg>`;

const SVG_KOI_POND = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='w' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4dd0e1'/><stop offset='1' stop-color='#00838f'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#w)'/>
  <ellipse cx='22' cy='26' rx='9' ry='4' fill='#66bb6a' opacity='0.95'/>
  <ellipse cx='74' cy='18' rx='11' ry='5' fill='#4caf50' opacity='0.9'/>
  <ellipse cx='58' cy='80' rx='8' ry='3.6' fill='#66bb6a' opacity='0.9'/>
  <circle cx='76' cy='16' r='2.6' fill='#f48fb1'/>
  <g opacity='0.92'>
    <path d='M34 52 q 8 -5 14 0 q -6 5 -14 0' fill='#ff7043'/><circle cx='45' cy='52' r='1' fill='#212121'/>
    <path d='M62 44 q -7 -4 -12 0 q 5 4 12 0' fill='#fafafa'/><circle cx='52' cy='44' r='0.9' fill='#212121'/>
    <path d='M42 68 q 9 -5 15 0 q -7 5 -15 0' fill='#ffb300'/>
  </g>
  <g stroke='#ffffff' stroke-width='0.7' fill='none' opacity='0.5'><circle cx='40' cy='50' r='6'/><circle cx='58' cy='46' r='4'/><circle cx='50' cy='70' r='5'/></g>
</svg>`;

const SVG_DRIVE_IN_CINEMA = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='n' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1a237e'/><stop offset='1' stop-color='#4a148c'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#n)'/>
  <circle cx='14' cy='12' r='0.8' fill='#ffffff'/><circle cx='30' cy='7' r='0.6' fill='#ffffff'/><circle cx='88' cy='10' r='0.7' fill='#ffffff'/><circle cx='72' cy='5' r='0.5' fill='#ffffff'/>
  <rect x='18' y='16' width='64' height='38' rx='2' fill='#eceff1'/>
  <rect x='21' y='19' width='58' height='32' fill='#90caf9'/>
  <path d='M30 44 Q 45 26 62 40 T 79 38 L 79 51 L 21 51 Z' fill='#42a5f5'/>
  <circle cx='68' cy='26' r='4.5' fill='#fff59d'/>
  <rect x='46' y='54' width='8' height='6' fill='#37474f'/>
  <rect y='78' width='100' height='22' fill='#212121'/>
  <g fill='#455a64'><rect x='10' y='70' width='18' height='8' rx='3'/><rect x='42' y='72' width='18' height='8' rx='3'/><rect x='74' y='70' width='16' height='8' rx='3'/></g>
  <g fill='#263238'><circle cx='14' cy='79' r='2.4'/><circle cx='24' cy='79' r='2.4'/><circle cx='46' cy='81' r='2.4'/><circle cx='56' cy='81' r='2.4'/><circle cx='78' cy='79' r='2.2'/><circle cx='87' cy='79' r='2.2'/></g>
</svg>`;

const SVG_NEON_ARCADE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <rect width='100' height='100' fill='#12002e'/>
  <rect x='8' y='22' width='24' height='56' rx='2' fill='#311b92'/>
  <rect x='11' y='27' width='18' height='16' fill='#00e5ff'/>
  <rect x='38' y='18' width='24' height='60' rx='2' fill='#4a148c'/>
  <rect x='41' y='23' width='18' height='16' fill='#ff4081'/>
  <rect x='68' y='24' width='24' height='54' rx='2' fill='#1a237e'/>
  <rect x='71' y='29' width='18' height='16' fill='#76ff03'/>
  <g fill='#7c4dff'><circle cx='16' cy='52' r='2'/><circle cx='24' cy='52' r='2'/><circle cx='46' cy='48' r='2'/><circle cx='54' cy='48' r='2'/><circle cx='76' cy='54' r='2'/><circle cx='84' cy='54' r='2'/></g>
  <rect y='82' width='100' height='18' fill='#0a0018'/>
  <g opacity='0.5'><rect x='10' y='84' width='20' height='2' fill='#00e5ff'/><rect x='40' y='84' width='20' height='2' fill='#ff4081'/><rect x='70' y='84' width='20' height='2' fill='#76ff03'/></g>
  <rect x='20' y='6' width='60' height='9' rx='4' fill='none' stroke='#ff4081' stroke-width='1.6'/>
  <g fill='#ff80ab'><rect x='27' y='9' width='7' height='3'/><rect x='37' y='9' width='5' height='3'/><rect x='45' y='9' width='9' height='3'/><rect x='57' y='9' width='6' height='3'/><rect x='66' y='9' width='8' height='3'/></g>
</svg>`;

const SVG_TUSCAN_HILLS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='t' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ffe0b2'/><stop offset='1' stop-color='#ffcc80'/></linearGradient></defs>
  <rect width='100' height='55' fill='url(#t)'/>
  <circle cx='76' cy='16' r='7' fill='#fff3a8'/>
  <path d='M0 52 Q 28 40 55 52 T 100 48 L 100 100 L 0 100 Z' fill='#c0ca33'/>
  <path d='M0 70 Q 35 58 70 70 T 100 66 L 100 100 L 0 100 Z' fill='#9e9d24'/>
  <path d='M0 86 Q 45 76 100 86 L 100 100 L 0 100 Z' fill='#827717'/>
  <g fill='#33691e'><ellipse cx='20' cy='48' rx='2' ry='6'/><ellipse cx='26' cy='50' rx='2' ry='6'/><ellipse cx='64' cy='44' rx='2' ry='6'/><ellipse cx='70' cy='46' rx='2' ry='6'/></g>
  <rect x='42' y='38' width='12' height='9' fill='#ffab91'/>
  <path d='M40 38 L 48 31 L 56 38 Z' fill='#d84315'/>
</svg>`;

const SVG_FROZEN_LAKE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='f' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#b3e5fc'/><stop offset='1' stop-color='#e1f5fe'/></linearGradient>
  <linearGradient id='i' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#e0f7fa'/><stop offset='1' stop-color='#b2ebf2'/></linearGradient></defs>
  <rect width='100' height='58' fill='url(#f)'/>
  <circle cx='24' cy='14' r='6' fill='#ffffff' opacity='0.9'/>
  <path d='M0 44 L 18 26 L 34 44 Z' fill='#90a4ae'/>
  <path d='M14 44 L 30 30 L 46 44 Z' fill='#b0bec5'/>
  <path d='M56 44 L 74 24 L 92 44 Z' fill='#90a4ae'/>
  <path d='M18 26 L 22 30 L 14 30 Z' fill='#ffffff'/>
  <path d='M74 24 L 79 30 L 69 30 Z' fill='#ffffff'/>
  <rect y='58' width='100' height='42' fill='url(#i)'/>
  <g stroke='#ffffff' stroke-width='1' opacity='0.8'><path d='M20 70 L 34 78'/><path d='M50 64 L 42 84'/><path d='M70 68 L 84 76'/><path d='M62 88 L 74 92'/></g>
  <ellipse cx='50' cy='58' rx='50' ry='4' fill='#ffffff' opacity='0.5'/>
</svg>`;

const SVG_HOME_CINEMA = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <rect width='100' height='100' fill='#1a1112'/>
  <rect x='14' y='14' width='72' height='40' rx='2' fill='#0d0d0d' stroke='#3e2723' stroke-width='1.5'/>
  <rect x='17' y='17' width='66' height='34' fill='#4fc3f7'/>
  <path d='M28 44 Q 44 24 60 40 T 83 36 L 83 51 L 17 51 Z' fill='#0288d1'/>
  <circle cx='70' cy='26' r='4' fill='#fff59d'/>
  <g fill='#3e2723'><rect x='6' y='58' width='10' height='16' rx='2'/><rect x='84' y='58' width='10' height='16' rx='2'/></g>
  <g fill='#212121'><circle cx='11' cy='63' r='2'/><circle cx='89' cy='63' r='2'/></g>
  <rect y='76' width='100' height='24' fill='#26171a'/>
  <path d='M18 92 Q 18 78 34 78 L 66 78 Q 82 78 82 92 Z' fill='#8d3b45'/>
  <rect x='24' y='84' width='14' height='6' rx='2' fill='#a94b57'/>
  <rect x='62' y='84' width='14' height='6' rx='2' fill='#a94b57'/>
  <ellipse cx='50' cy='90' rx='8' ry='4' fill='#ffcc80'/>
  <g fill='#fff3c4'><circle cx='47' cy='88' r='1'/><circle cx='51' cy='87' r='1.1'/><circle cx='54' cy='89' r='0.9'/></g>
</svg>`;

const SVG_OBSERVATORY = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='o' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0d1b3e'/><stop offset='1' stop-color='#1a2c5b'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#o)'/>
  <g fill='#ffffff'><circle cx='12' cy='14' r='0.8'/><circle cx='28' cy='8' r='0.6'/><circle cx='44' cy='16' r='0.7'/><circle cx='84' cy='8' r='0.8'/><circle cx='92' cy='22' r='0.6'/><circle cx='68' cy='12' r='0.5'/></g>
  <circle cx='78' cy='18' r='6' fill='#fff9c4'/>
  <circle cx='76' cy='16' r='1.4' fill='#f0e9a8'/><circle cx='81' cy='20' r='1' fill='#f0e9a8'/>
  <rect y='84' width='100' height='16' fill='#0a1330'/>
  <path d='M22 84 Q 22 56 50 56 Q 78 56 78 84 Z' fill='#37474f'/>
  <path d='M30 84 Q 30 62 50 62 Q 70 62 70 84 Z' fill='#455a64'/>
  <rect x='44' y='50' width='7' height='22' rx='2' transform='rotate(-32 47 61)' fill='#78909c'/>
  <rect x='46' y='84' width='8' height='6' fill='#263238'/>
  <circle cx='50' cy='58' r='1.6' fill='#b3e5fc'/>
</svg>`;

const SVG_JELLYFISH_DEPTHS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='j' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#004d64'/><stop offset='1' stop-color='#001c2c'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#j)'/>
  <g opacity='0.95'>
    <path d='M24 30 Q 24 20 34 20 Q 44 20 44 30 Z' fill='#80deea' opacity='0.85'/>
    <g stroke='#4dd0e1' stroke-width='1.2' fill='none' opacity='0.8'><path d='M27 30 q 1 8 -1 14'/><path d='M32 30 q -1 9 1 15'/><path d='M38 30 q 1 8 -1 13'/><path d='M42 30 q -1 7 1 12'/></g>
  </g>
  <g opacity='0.8'>
    <path d='M64 54 Q 64 47 71 47 Q 78 47 78 54 Z' fill='#b39ddb' opacity='0.85'/>
    <g stroke='#9575cd' stroke-width='1' fill='none'><path d='M66 54 q 1 6 -1 10'/><path d='M71 54 q -1 6 1 11'/><path d='M76 54 q 1 5 -1 9'/></g>
  </g>
  <g opacity='0.6'><path d='M16 70 Q 16 66 20 66 Q 24 66 24 70 Z' fill='#80cbc4'/><g stroke='#4db6ac' stroke-width='0.8' fill='none'><path d='M18 70 q 0 4 -1 6'/><path d='M22 70 q 0 4 1 6'/></g></g>
  <g fill='#b2ebf2' opacity='0.7'><circle cx='52' cy='24' r='1'/><circle cx='56' cy='40' r='0.8'/><circle cx='12' cy='46' r='0.9'/><circle cx='88' cy='30' r='0.8'/><circle cx='46' cy='78' r='1'/></g>
</svg>`;

const SVG_RED_CARPET = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <rect width='100' height='100' fill='#1c1023'/>
  <g fill='#fdd835' opacity='0.85'>
    <path d='M20 0 L 32 0 L 14 46 L 8 46 Z' opacity='0.25'/>
    <path d='M80 0 L 68 0 L 86 46 L 92 46 Z' opacity='0.25'/>
  </g>
  <g fill='#eceff1'><rect x='10' y='40' width='4' height='26'/><rect x='86' y='40' width='4' height='26'/></g>
  <g fill='#ffb300'><circle cx='12' cy='38' r='3.4'/><circle cx='88' cy='38' r='3.4'/></g>
  <path d='M38 46 L 62 46 L 84 100 L 16 100 Z' fill='#c62828'/>
  <path d='M44 46 L 56 46 L 68 100 L 32 100 Z' fill='#e53935'/>
  <g stroke='#8e24aa' stroke-width='1.4'><line x1='12' y1='42' x2='36' y2='48'/><line x1='88' y1='42' x2='64' y2='48'/></g>
  <g fill='#ffffff' opacity='0.9'><circle cx='26' cy='58' r='1'/><circle cx='74' cy='62' r='1'/><circle cx='22' cy='78' r='1.2'/><circle cx='78' cy='82' r='1.2'/></g>
</svg>`;

const SVG_BONSAI_ROOM = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <rect width='100' height='100' fill='#efebe9'/>
  <rect x='8' y='10' width='38' height='52' fill='#fff8e1' stroke='#a1887f' stroke-width='2'/>
  <line x1='27' y1='10' x2='27' y2='62' stroke='#a1887f' stroke-width='2'/>
  <line x1='8' y1='36' x2='46' y2='36' stroke='#a1887f' stroke-width='2'/>
  <circle cx='72' cy='26' r='11' fill='#ffccbc'/>
  <path d='M64 30 Q 72 16 82 28' fill='none' stroke='#d84315' stroke-width='1.6'/>
  <rect y='78' width='100' height='22' fill='#8d6e63'/>
  <rect x='54' y='66' width='34' height='12' rx='1.5' fill='#6d4c41'/>
  <path d='M68 66 q -1 -8 4 -12 q -6 1 -4 -8' fill='none' stroke='#4e342e' stroke-width='2.4'/>
  <g fill='#388e3c'><ellipse cx='64' cy='46' rx='6' ry='3.4'/><ellipse cx='74' cy='42' rx='7' ry='4'/><ellipse cx='80' cy='50' rx='5' ry='3'/></g>
  <g fill='#66bb6a' opacity='0.7'><ellipse cx='68' cy='44' rx='3' ry='2'/><ellipse cx='78' cy='46' rx='3' ry='2'/></g>
</svg>`;

const SVG_FILM_SET = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <rect width='100' height='100' fill='#121212'/>
  <g fill='#fdd835' opacity='0.2'><path d='M14 8 L 26 8 L 44 60 L 26 60 Z'/><path d='M86 8 L 74 8 L 58 60 L 74 60 Z'/></g>
  <g fill='#37474f'><rect x='10' y='4' width='12' height='8' rx='2'/><rect x='78' y='4' width='12' height='8' rx='2'/></g>
  <g fill='#fff59d'><circle cx='16' cy='8' r='2.4'/><circle cx='84' cy='8' r='2.4'/></g>
  <rect y='84' width='100' height='16' fill='#1c1c1c'/>
  <g fill='#263238'>
    <rect x='30' y='60' width='3' height='26'/><rect x='45' y='52' width='3' height='34'/>
    <path d='M28 60 L 50 44 L 52 48 L 32 63 Z'/>
  </g>
  <rect x='42' y='40' width='16' height='11' rx='2' fill='#37474f'/>
  <circle cx='58' cy='45' r='4' fill='#455a64'/><circle cx='58' cy='45' r='2' fill='#90caf9'/>
  <g fill='#eceff1'>
    <rect x='64' y='64' width='16' height='13' rx='1'/>
  </g>
  <path d='M64 64 L 80 64 L 76 58 L 60 58 Z' fill='#b0bec5'/>
  <g stroke='#212121' stroke-width='1'><line x1='62' y1='60' x2='66' y2='64'/><line x1='68' y1='59' x2='72' y2='63'/><line x1='74' y1='59' x2='78' y2='63'/></g>
</svg>`;

const SVG_FLOATING_ISLANDS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#81d4fa'/><stop offset='1' stop-color='#e1bee7'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#sky)'/>
  <ellipse cx='20' cy='18' rx='10' ry='3' fill='#ffffff' opacity='0.85'/>
  <ellipse cx='80' cy='70' rx='12' ry='4' fill='#ffffff' opacity='0.7'/>
  <g>
    <ellipse cx='34' cy='36' rx='16' ry='5' fill='#66bb6a'/>
    <path d='M20 37 Q 26 50 34 52 Q 42 50 48 37 Z' fill='#8d6e63'/>
    <rect x='28' y='26' width='3' height='8' fill='#5d4037'/>
    <circle cx='29.5' cy='24' r='5' fill='#43a047'/>
  </g>
  <g>
    <ellipse cx='72' cy='48' rx='11' ry='3.6' fill='#9ccc65'/>
    <path d='M62 49 Q 67 58 72 60 Q 77 58 82 49 Z' fill='#795548'/>
  </g>
  <g>
    <ellipse cx='52' cy='76' rx='8' ry='2.8' fill='#aed581'/>
    <path d='M45 77 Q 49 83 52 84 Q 55 83 59 77 Z' fill='#8d6e63'/>
  </g>
  <path d='M40 84 Q 46 78 44 70' stroke='#4fc3f7' stroke-width='1.2' fill='none' opacity='0.8'/>
</svg>`;

const SVG_DRAGON_PEAKS = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='dp' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#4a148c'/><stop offset='1' stop-color='#880e4f'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#dp)'/>
  <circle cx='74' cy='18' r='8' fill='#ff8a65' opacity='0.95'/>
  <path d='M0 66 L 20 30 L 38 66 Z' fill='#2a0a4a'/>
  <path d='M26 66 L 48 22 L 68 66 Z' fill='#38105c'/>
  <path d='M58 66 L 80 34 L 100 66 Z' fill='#2a0a4a'/>
  <path d='M48 22 L 52 30 L 44 30 Z' fill='#f8bbd0'/>
  <rect y='66' width='100' height='34' fill='#1f0837'/>
  <path d='M56 14 q 6 -4 10 0 q 5 -6 10 -1 q -3 4 -8 3 q -4 4 -12 -2' fill='#311b52'/>
  <g fill='#ffab91' opacity='0.8'><circle cx='30' cy='58' r='1'/><circle cx='64' cy='52' r='1.1'/><circle cx='84' cy='60' r='0.9'/></g>
</svg>`;

const SVG_NEON_TOKYO = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <rect width='100' height='100' fill='#160029'/>
  <g fill='#24084a'><rect x='4' y='14' width='22' height='86'/><rect x='36' y='6' width='26' height='94'/><rect x='72' y='18' width='24' height='82'/></g>
  <g fill='#ff4081'><rect x='8' y='22' width='4' height='14'/><rect x='40' y='14' width='5' height='18'/></g>
  <g fill='#00e5ff'><rect x='16' y='40' width='4' height='10'/><rect x='52' y='30' width='4' height='16'/><rect x='78' y='26' width='4' height='12'/></g>
  <g fill='#ffea00'><rect x='46' y='52' width='6' height='4'/><rect x='84' y='46' width='6' height='4'/><rect x='10' y='62' width='6' height='4'/></g>
  <g fill='#f50057' opacity='0.85'><rect x='88' y='60' width='3' height='18'/></g>
  <path d='M28 100 L 34 74 L 66 74 L 70 100 Z' fill='#1c0836'/>
  <g stroke='#e040fb' stroke-width='1.2' opacity='0.8'><line x1='30' y1='80' x2='68' y2='80'/><line x1='29' y1='88' x2='69' y2='88'/></g>
  <g fill='#ffffff' opacity='0.7'><circle cx='32' cy='10' r='0.7'/><circle cx='68' cy='4' r='0.6'/><circle cx='30' cy='4' r='0.5'/></g>
</svg>`;

const SVG_PREMIERE_NIGHT = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <rect width='100' height='100' fill='#0d0619'/>
  <g fill='#fdd835' opacity='0.3'>
    <path d='M30 100 L 42 100 L 20 8 L 8 8 Z'/>
    <path d='M70 100 L 58 100 L 80 8 L 92 8 Z'/>
    <path d='M44 100 L 56 100 L 54 4 L 46 4 Z' opacity='0.7'/>
  </g>
  <g fill='#ffffff'><circle cx='16' cy='20' r='0.8'/><circle cx='84' cy='16' r='0.8'/><circle cx='28' cy='10' r='0.6'/><circle cx='72' cy='8' r='0.6'/><circle cx='50' cy='14' r='0.7'/></g>
  <path d='M34 58 L 66 58 L 78 100 L 22 100 Z' fill='#c62828'/>
  <path d='M40 58 L 60 58 L 66 100 L 34 100 Z' fill='#ef5350'/>
  <g fill='#ffd700'>
    <path d='M50 30 L 52.4 36.5 L 59 36.8 L 53.8 41 L 55.8 47.5 L 50 43.6 L 44.2 47.5 L 46.2 41 L 41 36.8 L 47.6 36.5 Z'/>
  </g>
  <g fill='#1c1c2e'><ellipse cx='14' cy='96' rx='8' ry='6'/><ellipse cx='86' cy='96' rx='8' ry='6'/><ellipse cx='24' cy='99' rx='7' ry='5'/><ellipse cx='76' cy='99' rx='7' ry='5'/></g>
  <g fill='#ffffff' opacity='0.9'><circle cx='13' cy='92' r='0.9'/><circle cx='87' cy='91' r='0.9'/><circle cx='24' cy='95' r='0.8'/><circle cx='77' cy='94' r='0.8'/></g>
</svg>`;

const SVG_WORLD_TREE = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs><linearGradient id='wt' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#1b5e20'/><stop offset='1' stop-color='#092e0c'/></linearGradient></defs>
  <rect width='100' height='100' fill='url(#wt)'/>
  <g fill='#a5d6a7' opacity='0.5'><circle cx='16' cy='16' r='0.9'/><circle cx='84' cy='12' r='0.8'/><circle cx='26' cy='34' r='0.7'/><circle cx='78' cy='38' r='0.8'/><circle cx='12' cy='58' r='0.7'/><circle cx='88' cy='62' r='0.8'/></g>
  <path d='M44 100 L 46 62 Q 36 54 30 40 Q 44 48 47 42 Q 42 30 46 18 Q 52 30 53 40 Q 60 34 70 36 Q 60 48 54 56 Q 55 76 56 100 Z' fill='#4e342e'/>
  <g fill='#2e7d32'>
    <circle cx='30' cy='34' r='12'/><circle cx='48' cy='16' r='14'/><circle cx='70' cy='30' r='12'/><circle cx='58' cy='44' r='9'/><circle cx='38' cy='48' r='8'/>
  </g>
  <g fill='#66bb6a' opacity='0.85'><circle cx='34' cy='30' r='6'/><circle cx='52' cy='14' r='7'/><circle cx='66' cy='26' r='6'/></g>
  <g fill='#ffee58'><circle cx='42' cy='24' r='1.2'/><circle cx='60' cy='36' r='1.2'/><circle cx='30' cy='42' r='1'/><circle cx='54' cy='52' r='1'/></g>
  <path d='M44 100 Q 30 92 20 94 M56 100 Q 70 92 80 95' stroke='#3e2723' stroke-width='3' fill='none'/>
</svg>`;

const SVG_NEBULA_OCEAN = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='xMidYMid slice'>
  <defs>
    <linearGradient id='no' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#0b0033'/><stop offset='0.55' stop-color='#2a0a5e'/><stop offset='1' stop-color='#003c6b'/></linearGradient>
  </defs>
  <rect width='100' height='100' fill='url(#no)'/>
  <g opacity='0.55'>
    <ellipse cx='30' cy='24' rx='22' ry='9' fill='#7c4dff'/>
    <ellipse cx='66' cy='34' rx='24' ry='10' fill='#e040fb' opacity='0.6'/>
    <ellipse cx='48' cy='18' rx='14' ry='6' fill='#40c4ff' opacity='0.7'/>
  </g>
  <g fill='#ffffff'><circle cx='14' cy='12' r='0.8'/><circle cx='40' cy='8' r='0.6'/><circle cx='62' cy='16' r='0.7'/><circle cx='86' cy='10' r='0.8'/><circle cx='76' cy='24' r='0.5'/><circle cx='22' cy='34' r='0.6'/></g>
  <path d='M0 62 Q 16 56 32 62 T 64 62 T 100 60 L 100 100 L 0 100 Z' fill='#26124d' opacity='0.9'/>
  <path d='M0 74 Q 20 68 40 74 T 80 74 T 100 72 L 100 100 L 0 100 Z' fill='#1b0d38'/>
  <g stroke='#b388ff' stroke-width='0.8' opacity='0.7'><path d='M10 66 q 6 -2 12 0'/><path d='M46 64 q 7 -3 14 0'/><path d='M76 70 q 6 -2 12 0'/></g>
  <g fill='#e1bee7' opacity='0.8'><circle cx='34' cy='70' r='0.8'/><circle cx='58' cy='78' r='0.7'/><circle cx='18' cy='84' r='0.8'/><circle cx='82' cy='86' r='0.7'/></g>
</svg>`;

export const PET_BACKGROUNDS: Record<string, PetBackgroundDefinition> = {
  // ── COMMON ────────────────────────────────────────────────
  clearSky: {
    id: 'clearSky',
    name: t('Klarer Himmel'),
    description: 'Blauer Himmel mit Wolken',
    rarity: 'common',
    background: bgUrl(SVG_CLEAR_SKY),
    animationClass: 'pet-bg-anim-clouds-drift',
    glowColor: 'rgba(111, 184, 224, 0.35)',
  },
  flowerMeadow: {
    id: 'flowerMeadow',
    name: t('Blumenwiese'),
    description: 'Gruene Wiese voller Blueten',
    rarity: 'common',
    background: bgUrl(SVG_FLOWER_MEADOW),
    animationClass: 'pet-bg-anim-petals pet-bg-anim-breathe pet-bg-anim-clouds-drift',
    glowColor: 'rgba(124, 197, 118, 0.4)',
  },
  sunnyBeach: {
    id: 'sunnyBeach',
    name: t('Sonniger Strand'),
    description: 'Meer, Sand und Sonnenschein',
    rarity: 'common',
    background: bgUrl(SVG_SUNNY_BEACH),
    animationClass: 'pet-bg-anim-waves pet-bg-anim-pulse-warm',
    glowColor: 'rgba(255, 220, 115, 0.45)',
  },
  rollingHills: {
    id: 'rollingHills',
    name: t('Sanfte Huegel'),
    description: 'Weites Huegelland',
    rarity: 'common',
    background: bgUrl(SVG_ROLLING_HILLS),
    animationClass: 'pet-bg-anim-clouds-drift pet-bg-anim-breathe',
    glowColor: 'rgba(168, 217, 104, 0.4)',
  },
  summerPark: {
    id: 'summerPark',
    name: t('Sommerpark'),
    description: 'Grosser Baum im Stadtpark',
    rarity: 'common',
    background: bgUrl(SVG_SUMMER_PARK),
    animationClass: 'pet-bg-anim-breathe pet-bg-anim-clouds-drift',
    glowColor: 'rgba(100, 180, 76, 0.4)',
  },
  riverside: {
    id: 'riverside',
    name: t('Flussufer'),
    description: 'Sanfter Fluss zwischen Wiesen',
    rarity: 'common',
    background: bgUrl(SVG_RIVERSIDE),
    animationClass: 'pet-bg-anim-waves pet-bg-anim-breathe',
    glowColor: 'rgba(106, 176, 206, 0.4)',
  },
  puffyClouds: {
    id: 'puffyClouds',
    name: t('Bauschige Wolken'),
    description: 'Dicke Sommerwolken am Himmel',
    rarity: 'common',
    background: bgUrl(SVG_PUFFY_CLOUDS),
    animationClass: 'pet-bg-anim-clouds-drift pet-bg-anim-breathe',
    glowColor: 'rgba(74, 168, 220, 0.4)',
  },
  springBlossoms: {
    id: 'springBlossoms',
    name: t('Fruehlingszweige'),
    description: 'Bluehende Zweige am Himmel',
    rarity: 'common',
    background: bgUrl(SVG_SPRING_BLOSSOMS),
    animationClass: 'pet-bg-anim-petals pet-bg-anim-breathe',
    glowColor: 'rgba(255, 196, 214, 0.4)',
  },
  bambooGrove: {
    id: 'bambooGrove',
    name: t('Bambushain'),
    description: 'Dichter Bambuswald',
    rarity: 'common',
    background: bgUrl(SVG_BAMBOO_GROVE),
    animationClass: 'pet-bg-anim-breathe pet-bg-anim-clouds-drift',
    glowColor: 'rgba(106, 154, 74, 0.4)',
  },
  dandelionField: {
    id: 'dandelionField',
    name: t('Loewenzahnwiese'),
    description: 'Wiese voller Pusteblumen',
    rarity: 'common',
    background: bgUrl(SVG_DANDELION_FIELD),
    animationClass: 'pet-bg-anim-breathe pet-bg-anim-clouds-drift',
    glowColor: 'rgba(255, 232, 88, 0.4)',
  },
  countryRoad: {
    id: 'countryRoad',
    name: t('Landstrasse'),
    description: 'Geschlungene Strasse durchs Land',
    rarity: 'common',
    background: bgUrl(SVG_COUNTRY_ROAD),
    animationClass: 'pet-bg-anim-clouds-drift pet-bg-anim-breathe',
    glowColor: 'rgba(144, 200, 232, 0.4)',
  },
  picnicLawn: {
    id: 'picnicLawn',
    name: t('Picknickwiese'),
    description: 'Rote Decke auf gruener Wiese',
    rarity: 'common',
    background: bgUrl(SVG_PICNIC_LAWN),
    animationClass: 'pet-bg-anim-breathe pet-bg-anim-clouds-drift',
    glowColor: 'rgba(255, 107, 107, 0.4)',
  },

  // ── UNCOMMON ──────────────────────────────────────────────
  autumnField: {
    id: 'autumnField',
    name: t('Herbstfeld'),
    description: 'Goldenes Getreidefeld',
    rarity: 'uncommon',
    background: bgUrl(SVG_AUTUMN_FIELD),
    animationClass: 'pet-bg-anim-leaves pet-bg-anim-pulse-warm pet-bg-anim-clouds-drift',
    glowColor: 'rgba(232, 184, 74, 0.45)',
  },
  sunset: {
    id: 'sunset',
    name: t('Sonnenuntergang'),
    description: 'Warmer Abendhimmel ueberm Meer',
    rarity: 'uncommon',
    background: bgUrl(SVG_SUNSET),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-waves',
    glowColor: 'rgba(255, 180, 71, 0.55)',
  },
  mountainLake: {
    id: 'mountainLake',
    name: t('Bergsee'),
    description: 'Stiller See vor Bergketten',
    rarity: 'uncommon',
    background: bgUrl(SVG_MOUNTAIN_LAKE),
    animationClass: 'pet-bg-anim-waves pet-bg-anim-breathe',
    glowColor: 'rgba(148, 197, 232, 0.4)',
  },
  cherryTrees: {
    id: 'cherryTrees',
    name: t('Kirschbluete'),
    description: 'Sakura-Baeume im Fruehling',
    rarity: 'uncommon',
    background: bgUrl(SVG_CHERRY_TREES),
    animationClass: 'pet-bg-anim-petals pet-bg-anim-breathe',
    glowColor: 'rgba(255, 158, 196, 0.45)',
  },
  lavenderField: {
    id: 'lavenderField',
    name: t('Lavendelfeld'),
    description: 'Endloses Lavendelfeld bei Sonnenuntergang',
    rarity: 'uncommon',
    background: bgUrl(SVG_LAVENDER_FIELD),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-clouds-drift',
    glowColor: 'rgba(192, 136, 224, 0.5)',
  },
  lakeDock: {
    id: 'lakeDock',
    name: t('Holzsteg'),
    description: 'Holzsteg am stillen Abendsee',
    rarity: 'uncommon',
    background: bgUrl(SVG_LAKE_DOCK),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-waves',
    glowColor: 'rgba(255, 180, 120, 0.5)',
  },
  pumpkinPatch: {
    id: 'pumpkinPatch',
    name: t('Kuerbisfeld'),
    description: 'Herbstliches Kuerbisfeld',
    rarity: 'uncommon',
    background: bgUrl(SVG_PUMPKIN_PATCH),
    animationClass: 'pet-bg-anim-leaves pet-bg-anim-pulse-warm pet-bg-anim-clouds-drift',
    glowColor: 'rgba(232, 118, 42, 0.5)',
  },
  morningMist: {
    id: 'morningMist',
    name: t('Morgennebel'),
    description: 'Nebelige Daemmerung am Fluss',
    rarity: 'uncommon',
    background: bgUrl(SVG_MORNING_MIST),
    animationClass: 'pet-bg-anim-steam pet-bg-anim-breathe',
    glowColor: 'rgba(255, 232, 168, 0.45)',
  },
  vineyard: {
    id: 'vineyard',
    name: t('Weinberg'),
    description: 'Weinreben im Abendlicht',
    rarity: 'uncommon',
    background: bgUrl(SVG_VINEYARD),
    animationClass: 'pet-bg-anim-leaves pet-bg-anim-pulse-warm pet-bg-anim-clouds-drift',
    glowColor: 'rgba(255, 220, 128, 0.45)',
  },
  appleOrchard: {
    id: 'appleOrchard',
    name: t('Apfelgarten'),
    description: 'Apfelbaeume voller Fruechte',
    rarity: 'uncommon',
    background: bgUrl(SVG_APPLE_ORCHARD),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-clouds-drift',
    glowColor: 'rgba(232, 48, 42, 0.45)',
  },
  windmill: {
    id: 'windmill',
    name: t('Windmuehle'),
    description: 'Alte Windmuehle auf gruenem Feld',
    rarity: 'uncommon',
    background: bgUrl(SVG_WINDMILL),
    animationClass: 'pet-bg-anim-clouds-drift pet-bg-anim-breathe',
    glowColor: 'rgba(240, 216, 160, 0.45)',
  },
  oldBridge: {
    id: 'oldBridge',
    name: t('Alte Holzbruecke'),
    description: 'Bogenbruecke im Abendlicht',
    rarity: 'uncommon',
    background: bgUrl(SVG_OLD_BRIDGE),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-waves',
    glowColor: 'rgba(255, 208, 160, 0.45)',
  },
  hotAirBalloon: {
    id: 'hotAirBalloon',
    name: t('Heissluftballon'),
    description: 'Ballonfahrt ueber gruene Felder',
    rarity: 'uncommon',
    background: bgUrl(SVG_HOT_AIR_BALLOON),
    animationClass: 'pet-bg-anim-clouds-drift pet-bg-anim-breathe',
    glowColor: 'rgba(255, 180, 120, 0.5)',
  },

  // ── RARE ──────────────────────────────────────────────────
  desertDunes: {
    id: 'desertDunes',
    name: t('Wuestenduenen'),
    description: 'Goldene Duenen im Abendlicht',
    rarity: 'rare',
    background: bgUrl(SVG_DESERT_DUNES),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-clouds-drift',
    glowColor: 'rgba(249, 176, 97, 0.5)',
  },
  tropicalIsland: {
    id: 'tropicalIsland',
    name: t('Tropeninsel'),
    description: 'Palme am tuerkisen Meer',
    rarity: 'rare',
    background: bgUrl(SVG_TROPICAL_ISLAND),
    animationClass: 'pet-bg-anim-waves pet-bg-anim-pulse-warm',
    glowColor: 'rgba(78, 200, 212, 0.5)',
  },
  foggyValley: {
    id: 'foggyValley',
    name: t('Nebeltal'),
    description: 'Nebelige Bergketten',
    rarity: 'rare',
    background: bgUrl(SVG_FOGGY_VALLEY),
    animationClass: 'pet-bg-anim-steam pet-bg-anim-breathe',
    glowColor: 'rgba(200, 212, 219, 0.5)',
  },
  cityNight: {
    id: 'cityNight',
    name: t('Stadt bei Nacht'),
    description: 'Skyline unter Sternenhimmel',
    rarity: 'rare',
    background: bgUrl(SVG_CITY_NIGHT),
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-breathe',
    glowColor: 'rgba(255, 216, 122, 0.45)',
  },
  pineForest: {
    id: 'pineForest',
    name: t('Kiefernwald'),
    description: 'Verschneiter Tannenwald',
    rarity: 'rare',
    background: bgUrl(SVG_PINE_FOREST),
    animationClass: 'pet-bg-anim-snow pet-bg-anim-breathe',
    glowColor: 'rgba(240, 244, 247, 0.4)',
  },
  snowyVillage: {
    id: 'snowyVillage',
    name: t('Schneedorf'),
    description: 'Verschneite Haeuser mit warmen Lichtern',
    rarity: 'rare',
    background: bgUrl(SVG_SNOWY_VILLAGE),
    animationClass: 'pet-bg-anim-snow pet-bg-anim-breathe',
    glowColor: 'rgba(255, 216, 122, 0.45)',
  },
  waterfall: {
    id: 'waterfall',
    name: t('Wasserfall'),
    description: 'Rauschender Wasserfall im Wald',
    rarity: 'rare',
    background: bgUrl(SVG_WATERFALL),
    animationClass: 'pet-bg-anim-waterfall pet-bg-anim-breathe',
    glowColor: 'rgba(188, 232, 245, 0.5)',
  },
  canyon: {
    id: 'canyon',
    name: t('Canyon'),
    description: 'Roter Canyon im Abendlicht',
    rarity: 'rare',
    background: bgUrl(SVG_CANYON),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-clouds-drift',
    glowColor: 'rgba(249, 165, 88, 0.5)',
  },
  goldenWheat: {
    id: 'goldenWheat',
    name: t('Goldenes Weizenfeld'),
    description: 'Weizenfeld zur goldenen Stunde',
    rarity: 'rare',
    background: bgUrl(SVG_GOLDEN_WHEAT),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-clouds-drift',
    glowColor: 'rgba(255, 196, 120, 0.55)',
  },
  zenGarden: {
    id: 'zenGarden',
    name: t('Zen-Garten'),
    description: 'Japanischer Garten mit Sakura',
    rarity: 'rare',
    background: bgUrl(SVG_ZEN_GARDEN),
    animationClass: 'pet-bg-anim-petals pet-bg-anim-breathe',
    glowColor: 'rgba(255, 158, 196, 0.45)',
  },
  lighthouseCliff: {
    id: 'lighthouseCliff',
    name: t('Leuchtturm'),
    description: 'Leuchtturm auf steiler Klippe',
    rarity: 'rare',
    background: bgUrl(SVG_LIGHTHOUSE),
    animationClass: 'pet-bg-anim-lighthouse pet-bg-anim-waves',
    glowColor: 'rgba(255, 245, 160, 0.55)',
  },
  fireflyForest: {
    id: 'fireflyForest',
    name: t('Gluehwuermchen-Wald'),
    description: 'Wald voller tanzender Lichter',
    rarity: 'rare',
    background: bgUrl(SVG_FIREFLY_FOREST),
    animationClass: 'pet-bg-anim-firefly pet-bg-anim-breathe',
    glowColor: 'rgba(232, 255, 160, 0.55)',
  },
  redwoodForest: {
    id: 'redwoodForest',
    name: t('Mammutbaeume'),
    description: 'Riesige Redwoods im Goldlicht',
    rarity: 'rare',
    background: bgUrl(SVG_REDWOOD_FOREST),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-clouds-drift',
    glowColor: 'rgba(232, 200, 120, 0.5)',
  },
  templeRuins: {
    id: 'templeRuins',
    name: t('Tempelruinen'),
    description: 'Antike Saeulen im Dschungel',
    rarity: 'rare',
    background: bgUrl(SVG_TEMPLE_RUINS),
    animationClass: 'pet-bg-anim-firefly pet-bg-anim-breathe',
    glowColor: 'rgba(255, 224, 136, 0.5)',
  },
  hotSprings: {
    id: 'hotSprings',
    name: t('Heisse Quellen'),
    description: 'Dampfende Onsen im Schnee',
    rarity: 'rare',
    background: bgUrl(SVG_HOT_SPRINGS),
    animationClass: 'pet-bg-anim-steam pet-bg-anim-snow',
    glowColor: 'rgba(128, 200, 216, 0.5)',
  },
  rainyWindow: {
    id: 'rainyWindow',
    name: t('Regen am Fenster'),
    description: 'Regentropfen am Fensterglas',
    rarity: 'rare',
    background: bgUrl(SVG_RAINY_WINDOW),
    animationClass: 'pet-bg-anim-rain',
    glowColor: 'rgba(200, 216, 232, 0.4)',
  },

  // ── EPIC ──────────────────────────────────────────────────
  alpineSnow: {
    id: 'alpineSnow',
    name: t('Alpengipfel'),
    description: 'Schneebedeckte Berggipfel',
    rarity: 'epic',
    background: bgUrl(SVG_ALPINE_SNOW),
    animationClass: 'pet-bg-anim-snow pet-bg-anim-clouds-drift',
    glowColor: 'rgba(197, 216, 232, 0.55)',
  },
  lavaValley: {
    id: 'lavaValley',
    name: t('Vulkantal'),
    description: 'Ausbrechender Vulkan ueber Lavafluss',
    rarity: 'epic',
    background: bgUrl(SVG_LAVA_VALLEY),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-steam',
    glowColor: 'rgba(255, 106, 42, 0.6)',
  },
  mysticForest: {
    id: 'mysticForest',
    name: t('Mystischer Wald'),
    description: 'Leuchtende Gluehwuermchen im Dunkel',
    rarity: 'epic',
    background: bgUrl(SVG_MYSTIC_FOREST),
    animationClass: 'pet-bg-anim-firefly pet-bg-anim-breathe',
    glowColor: 'rgba(168, 255, 224, 0.55)',
  },
  underwaterReef: {
    id: 'underwaterReef',
    name: t('Korallenriff'),
    description: 'Unterwasserwelt mit Lichtstrahlen',
    rarity: 'epic',
    background: bgUrl(SVG_UNDERWATER_REEF),
    animationClass: 'pet-bg-anim-bubbles pet-bg-anim-breathe',
    glowColor: 'rgba(34, 168, 194, 0.55)',
  },
  northernLights: {
    id: 'northernLights',
    name: t('Polarlichter'),
    description: 'Nordlichter ueber verschneiten Bergen',
    rarity: 'epic',
    background: bgUrl(SVG_NORTHERN_LIGHTS),
    animationClass: 'pet-bg-anim-aurora',
    glowColor: 'rgba(100, 255, 200, 0.6)',
  },
  savannah: {
    id: 'savannah',
    name: t('Savanne'),
    description: 'Akazie vor orangenem Horizont',
    rarity: 'epic',
    background: bgUrl(SVG_SAVANNAH),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-clouds-drift pet-bg-anim-breathe',
    glowColor: 'rgba(255, 160, 64, 0.55)',
  },
  crystalCave: {
    id: 'crystalCave',
    name: t('Kristallhoehle'),
    description: 'Leuchtende Kristalle im Untergrund',
    rarity: 'epic',
    background: bgUrl(SVG_CRYSTAL_CAVE),
    animationClass: 'pet-bg-anim-twinkle',
    glowColor: 'rgba(176, 136, 232, 0.6)',
  },
  stormSea: {
    id: 'stormSea',
    name: t('Sturmsee'),
    description: 'Gewitter ueber aufgewuehltem Meer',
    rarity: 'epic',
    background: bgUrl(SVG_STORM_SEA),
    animationClass: 'pet-bg-anim-rain pet-bg-anim-clouds-drift',
    glowColor: 'rgba(255, 245, 160, 0.5)',
  },
  glacialBay: {
    id: 'glacialBay',
    name: t('Gletscherbucht'),
    description: 'Eisberge treiben in stiller Bucht',
    rarity: 'epic',
    background: bgUrl(SVG_GLACIAL_BAY),
    animationClass: 'pet-bg-anim-snow pet-bg-anim-breathe',
    glowColor: 'rgba(232, 244, 250, 0.55)',
  },
  balloonFiesta: {
    id: 'balloonFiesta',
    name: t('Ballon-Festival'),
    description: 'Heissluftballone bei Sonnenaufgang',
    rarity: 'epic',
    background: bgUrl(SVG_BALLOON_FIESTA),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-clouds-drift',
    glowColor: 'rgba(255, 120, 72, 0.55)',
  },
  chineseMountains: {
    id: 'chineseMountains',
    name: t('Nebelberge'),
    description: 'Chinesische Berggipfel im Nebel',
    rarity: 'epic',
    background: bgUrl(SVG_CHINESE_MOUNTAINS),
    animationClass: 'pet-bg-anim-clouds-drift pet-bg-anim-breathe',
    glowColor: 'rgba(200, 212, 222, 0.5)',
  },

  // ── LEGENDARY ─────────────────────────────────────────────
  cosmicSpace: {
    id: 'cosmicSpace',
    name: t('Kosmischer Nebel'),
    description: 'Farbenpraechtiger Weltraumnebel',
    rarity: 'legendary',
    background: bgUrl(SVG_COSMIC_SPACE),
    animationClass: 'pet-bg-anim-twinkle',
    glowColor: 'rgba(196, 74, 122, 0.6)',
  },
  milkyWay: {
    id: 'milkyWay',
    name: t('Milchstrasse'),
    description: 'Milchstrasse ueber dem Horizont',
    rarity: 'legendary',
    background: bgUrl(SVG_MILKY_WAY),
    animationClass: 'pet-bg-anim-twinkle',
    glowColor: 'rgba(140, 90, 175, 0.55)',
  },
  galaxyCore: {
    id: 'galaxyCore',
    name: t('Galaxienkern'),
    description: 'Leuchtendes Zentrum einer Spiralgalaxie',
    rarity: 'legendary',
    background: bgUrl(SVG_GALAXY_CORE),
    animationClass: 'pet-bg-anim-twinkle',
    glowColor: 'rgba(255, 224, 136, 0.6)',
  },
  saturnView: {
    id: 'saturnView',
    name: t('Saturn'),
    description: 'Saturn mit seinen majestaetischen Ringen',
    rarity: 'legendary',
    background: bgUrl(SVG_SATURN_VIEW),
    animationClass: 'pet-bg-anim-twinkle',
    glowColor: 'rgba(232, 176, 104, 0.6)',
  },
  earthFromMoon: {
    id: 'earthFromMoon',
    name: t('Erdaufgang'),
    description: 'Erde ueber der Mondoberflaeche',
    rarity: 'legendary',
    background: bgUrl(SVG_EARTH_FROM_MOON),
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-breathe',
    glowColor: 'rgba(106, 184, 232, 0.6)',
  },
  blackHoleDisk: {
    id: 'blackHoleDisk',
    name: t('Schwarzes Loch'),
    description: 'Akkretionsscheibe um den Ereignishorizont',
    rarity: 'legendary',
    background: bgUrl(SVG_BLACK_HOLE_DISK),
    animationClass: 'pet-bg-anim-twinkle',
    glowColor: 'rgba(255, 138, 42, 0.7)',
  },
  supernova: {
    id: 'supernova',
    name: t('Supernova'),
    description: 'Explodierender Stern im All',
    rarity: 'legendary',
    background: bgUrl(SVG_SUPERNOVA),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-twinkle',
    glowColor: 'rgba(255, 216, 120, 0.7)',
  },
  deepSeaAbyss: {
    id: 'deepSeaAbyss',
    name: t('Tiefsee-Abgrund'),
    description: 'Anglerfisch im schwarzen Abgrund',
    rarity: 'legendary',
    background: bgUrl(SVG_DEEP_SEA_ABYSS),
    animationClass: 'pet-bg-anim-firefly pet-bg-anim-breathe',
    glowColor: 'rgba(100, 200, 224, 0.6)',
  },

  // ── ERWEITERUNG JULI 2026 (20 neue) ──────────────────────
  birchForest: {
    id: 'birchForest',
    name: t('Birkenwald'),
    description: 'Helle Birkenstämme im Sommerlicht',
    rarity: 'common',
    background: bgUrl(SVG_BIRCH_FOREST),
    animationClass: 'pet-bg-anim-leaves pet-bg-anim-breathe',
    glowColor: 'rgba(174, 213, 129, 0.4)',
  },
  duneGrass: {
    id: 'duneGrass',
    name: t('Dünengras'),
    description: 'Sanfte Sanddünen mit wehendem Gras',
    rarity: 'common',
    background: bgUrl(SVG_DUNE_GRASS),
    animationClass: 'pet-bg-anim-clouds-drift pet-bg-anim-breathe',
    glowColor: 'rgba(238, 194, 127, 0.45)',
  },
  streetCafe: {
    id: 'streetCafe',
    name: t('Straßencafé'),
    description: 'Markise, Bistrotische und Nachmittagssonne',
    rarity: 'common',
    background: bgUrl(SVG_STREET_CAFE),
    animationClass: 'pet-bg-anim-pulse-warm',
    glowColor: 'rgba(229, 115, 115, 0.4)',
  },
  koiPond: {
    id: 'koiPond',
    name: t('Koi-Teich'),
    description: 'Seerosen und bunte Kois',
    rarity: 'common',
    background: bgUrl(SVG_KOI_POND),
    animationClass: 'pet-bg-anim-waves pet-bg-anim-bubbles',
    glowColor: 'rgba(77, 208, 225, 0.45)',
  },
  driveInCinema: {
    id: 'driveInCinema',
    name: t('Autokino'),
    description: 'Leinwand unterm Sternenhimmel',
    rarity: 'uncommon',
    background: bgUrl(SVG_DRIVE_IN_CINEMA),
    animationClass: 'pet-bg-anim-twinkle',
    glowColor: 'rgba(144, 202, 249, 0.5)',
  },
  neonArcade: {
    id: 'neonArcade',
    name: t('Neon-Arcade'),
    description: 'Spielautomaten in Neonlicht',
    rarity: 'uncommon',
    background: bgUrl(SVG_NEON_ARCADE),
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-breathe',
    glowColor: 'rgba(255, 64, 129, 0.5)',
  },
  tuscanHills: {
    id: 'tuscanHills',
    name: t('Toskana-Hügel'),
    description: 'Zypressen und goldene Abendsonne',
    rarity: 'uncommon',
    background: bgUrl(SVG_TUSCAN_HILLS),
    animationClass: 'pet-bg-anim-pulse-warm pet-bg-anim-breathe',
    glowColor: 'rgba(255, 204, 128, 0.5)',
  },
  frozenLake: {
    id: 'frozenLake',
    name: t('Zugefrorener See'),
    description: 'Spiegelglattes Eis vor Berggipfeln',
    rarity: 'uncommon',
    background: bgUrl(SVG_FROZEN_LAKE),
    animationClass: 'pet-bg-anim-snow',
    glowColor: 'rgba(178, 235, 242, 0.5)',
  },
  homeCinema: {
    id: 'homeCinema',
    name: t('Heimkino'),
    description: 'Sofa, Popcorn und Leinwand',
    rarity: 'rare',
    background: bgUrl(SVG_HOME_CINEMA),
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-breathe',
    glowColor: 'rgba(79, 195, 247, 0.5)',
  },
  observatory: {
    id: 'observatory',
    name: t('Sternwarte'),
    description: 'Teleskopkuppel unter dem Nachthimmel',
    rarity: 'rare',
    background: bgUrl(SVG_OBSERVATORY),
    animationClass: 'pet-bg-anim-twinkle',
    glowColor: 'rgba(179, 229, 252, 0.5)',
  },
  jellyfishDepths: {
    id: 'jellyfishDepths',
    name: t('Quallen-Tiefe'),
    description: 'Leuchtende Quallen im dunklen Wasser',
    rarity: 'rare',
    background: bgUrl(SVG_JELLYFISH_DEPTHS),
    animationClass: 'pet-bg-anim-bubbles pet-bg-anim-breathe',
    glowColor: 'rgba(128, 222, 234, 0.55)',
  },
  redCarpet: {
    id: 'redCarpet',
    name: t('Roter Teppich'),
    description: 'Premieren-Glamour mit Blitzlichtern',
    rarity: 'rare',
    background: bgUrl(SVG_RED_CARPET),
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-pulse-warm',
    glowColor: 'rgba(229, 57, 53, 0.5)',
  },
  bonsaiRoom: {
    id: 'bonsaiRoom',
    name: t('Bonsai-Zimmer'),
    description: 'Shoji-Wand, Bonsai und Abendrot',
    rarity: 'rare',
    background: bgUrl(SVG_BONSAI_ROOM),
    animationClass: 'pet-bg-anim-breathe',
    glowColor: 'rgba(255, 204, 188, 0.45)',
  },
  filmSet: {
    id: 'filmSet',
    name: t('Filmset'),
    description: 'Scheinwerfer, Kamera und Klappe',
    rarity: 'epic',
    background: bgUrl(SVG_FILM_SET),
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-pulse-warm',
    glowColor: 'rgba(253, 216, 53, 0.5)',
  },
  floatingIslands: {
    id: 'floatingIslands',
    name: t('Schwebende Inseln'),
    description: 'Inseln mit Wasserfällen im Himmel',
    rarity: 'epic',
    background: bgUrl(SVG_FLOATING_ISLANDS),
    animationClass: 'pet-bg-anim-clouds-drift pet-bg-anim-waterfall',
    glowColor: 'rgba(129, 212, 250, 0.5)',
  },
  dragonPeaks: {
    id: 'dragonPeaks',
    name: t('Drachengipfel'),
    description: 'Zerklüftete Gipfel im Abendglühen',
    rarity: 'epic',
    background: bgUrl(SVG_DRAGON_PEAKS),
    animationClass: 'pet-bg-anim-firefly pet-bg-anim-breathe',
    glowColor: 'rgba(255, 138, 101, 0.5)',
  },
  neonTokyo: {
    id: 'neonTokyo',
    name: t('Neon-Gasse'),
    description: 'Leuchtreklamen in der Großstadtnacht',
    rarity: 'epic',
    background: bgUrl(SVG_NEON_TOKYO),
    animationClass: 'pet-bg-anim-twinkle pet-bg-anim-breathe',
    glowColor: 'rgba(224, 64, 251, 0.55)',
  },
  premiereNight: {
    id: 'premiereNight',
    name: t('Premierennacht'),
    description: 'Suchscheinwerfer, Stern und roter Teppich',
    rarity: 'legendary',
    background: bgUrl(SVG_PREMIERE_NIGHT),
    animationClass: 'pet-bg-anim-lighthouse pet-bg-anim-twinkle',
    glowColor: 'rgba(255, 215, 0, 0.55)',
  },
  worldTree: {
    id: 'worldTree',
    name: t('Weltenbaum'),
    description: 'Uralter Baum voller Glühlichter',
    rarity: 'legendary',
    background: bgUrl(SVG_WORLD_TREE),
    animationClass: 'pet-bg-anim-firefly pet-bg-anim-leaves',
    glowColor: 'rgba(255, 238, 88, 0.5)',
  },
  nebulaOcean: {
    id: 'nebulaOcean',
    name: t('Nebel-Ozean'),
    description: 'Sternenmeer trifft Kosmos-Wellen',
    rarity: 'legendary',
    background: bgUrl(SVG_NEBULA_OCEAN),
    animationClass: 'pet-bg-anim-aurora pet-bg-anim-waves',
    glowColor: 'rgba(179, 136, 255, 0.55)',
  },
};

export const PET_BACKGROUND_IDS = Object.keys(PET_BACKGROUNDS);

export function getBackgroundRarity(id: string): AccessoryRarity {
  return PET_BACKGROUNDS[id]?.rarity ?? 'common';
}
