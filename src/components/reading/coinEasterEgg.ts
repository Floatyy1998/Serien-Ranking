import './coinEasterEgg.css';

/** Flo hat die Bücher angeregt — wechselt er im Dock zu „Lesen" oder zurück, dreht sich kurz die Münze. */
const FLO_UID = 'rhHKewOeoLdM35NFic2O4TNc1NJ2';

const LINE = '#33363a';
const RIM = '#3f7482';

const faceBase = (clipId: string, inner: string) => `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs><clipPath id="${clipId}"><circle cx="50" cy="50" r="37"/></clipPath></defs>
  <circle cx="50" cy="50" r="47" fill="${RIM}" stroke="${LINE}" stroke-width="3"/>
  <circle cx="50" cy="50" r="42" fill="none" stroke="#5f97a3" stroke-width="2" stroke-dasharray="3 4"/>
  <g clip-path="url(#${clipId})">
    <rect width="100" height="100" fill="#fac84e"/>
    <path d="M0 0H60L40 100H0Z" fill="#f4795a"/>
    <circle cx="50" cy="50" r="37" fill="none" stroke="#8ad6c0" stroke-width="8"
      stroke-dasharray="52 400" transform="rotate(-48 50 50)"/>
  </g>
  <circle cx="50" cy="50" r="37" fill="none" stroke="${LINE}" stroke-width="3"/>
  ${inner}
</svg>`;

const SMILEY = faceBase(
  'coin-egg-a',
  `<ellipse cx="40" cy="42" rx="3.4" ry="5.4" fill="${LINE}"/>
   <ellipse cx="60" cy="42" rx="3.4" ry="5.4" fill="${LINE}"/>
   <path d="M33 55Q50 75 67 55" fill="none" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>`
);

const ETHER = faceBase(
  'coin-egg-b',
  `<g stroke="${LINE}" stroke-width="2.6" stroke-linejoin="round">
     <path d="M50 21L36 50L50 58Z" fill="#d8c79c"/>
     <path d="M50 21L64 50L50 58Z" fill="#f7f0dc"/>
     <path d="M36 54L50 62L50 79Z" fill="#d8c79c"/>
     <path d="M64 54L50 62L50 79Z" fill="#f7f0dc"/>
   </g>`
);

const EDGE_LAYERS = 14;

let shown: HTMLDivElement | null = null;

export function showCoinEgg(onDone?: () => void): void {
  if (shown) return;
  const edge = Array.from(
    { length: EDGE_LAYERS },
    (_, i) =>
      `<span class="coin-egg__edge" style="transform:translateZ(${i - (EDGE_LAYERS - 1) / 2}px)"></span>`
  ).join('');
  const el = document.createElement('div');
  el.className = 'coin-egg';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="coin-egg__stage">
      <div class="coin-egg__float">
        <div class="coin-egg__coin">
          ${edge}
          <div class="coin-egg__face coin-egg__face--front">${SMILEY}</div>
          <div class="coin-egg__face coin-egg__face--back">${ETHER}</div>
        </div>
      </div>
      <div class="coin-egg__shadow"></div>
    </div>`;
  document.body.appendChild(el);
  shown = el;
  window.setTimeout(() => {
    el.remove();
    shown = null;
    onDone?.();
  }, 2800);
}

/** Dock-Wechsel nach „Lesen" oder zurück: für Flo erst die Münze, dann der Wechsel. */
export function withCoinEgg(uid: string | null | undefined, proceed: () => void): void {
  if (uid !== FLO_UID) {
    proceed();
    return;
  }
  if (!shown) showCoinEgg(proceed);
}
