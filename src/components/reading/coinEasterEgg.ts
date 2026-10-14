import { getOwnPhotoURL } from '../../services/profile/ownProfilePhoto';
import './coinEasterEgg.css';

/** Flo hat die Bücher angeregt — wechselt er im Dock zu „Lesen" oder zurück, dreht sich kurz die Münze. */
const FLO_UID = 'rhHKewOeoLdM35NFic2O4TNc1NJ2';
const PHOTO_CHANCE = 0.25;
const EDGE_LAYERS = 20;

/** Dunkle Scheibe mit Neon-Ringen; Farben kommen per CSS aus dem Theme. */
const neonFace = (id: string, icon = '') => `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="${id}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2.2" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <radialGradient id="${id}-bg" cx="50%" cy="40%" r="62%">
      <stop offset="0" stop-color="#1e1729"/><stop offset="1" stop-color="#08060d"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="48" fill="url(#${id}-bg)"/>
  <g filter="url(#${id})" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <circle class="coin-neon-a" cx="50" cy="50" r="45" stroke-width="2.6"/>
    <circle class="coin-neon-b coin-neon-dim" cx="50" cy="50" r="39.5" stroke-width="1.2" stroke-dasharray="2 4.2"/>
    ${icon}
  </g>
</svg>`;

const TV = `
  <rect class="coin-neon-b" x="27" y="37" width="46" height="31" rx="6" stroke-width="3"/>
  <rect class="coin-neon-a" x="33" y="43" width="34" height="19" rx="2.5" stroke-width="1.6"/>
  <path class="coin-neon-b" d="M41 25L50 35.5L59 25" stroke-width="3"/>
  <path class="coin-neon-b" d="M39 75H61" stroke-width="3"/>`;

const BOOK = `
  <path class="coin-neon-b" d="M50 38C43 33 34 32 25 34V68C34 66 43 67 50 72C57 67 66 66 75 68V34C66 32 57 33 50 38Z" stroke-width="3"/>
  <path class="coin-neon-b" d="M50 38V72" stroke-width="2.4"/>
  <path class="coin-neon-a" d="M56 44C61 42 65 42 69 42.5M56 51C61 49 65 49 69 49.5M56 58C61 56 65 56 69 56.5" stroke-width="1.6"/>`;

let shown: HTMLDivElement | null = null;

interface CoinEggOptions {
  /** Profilbild für die seltene Variante (beide Seiten Bild). */
  photoURL?: string | null;
  photoChance?: number;
  onDone?: () => void;
}

/** Nur ein schon geladenes Bild — sonst stünde eine leere Seite da. Der Versuch lädt es fürs nächste Mal. */
function readyPhoto(url: string | null | undefined, chance: number): string | null {
  if (!url) return null;
  const probe = new Image();
  probe.src = url;
  return probe.complete && probe.naturalWidth > 0 && Math.random() < chance ? url : null;
}

export function showCoinEgg({
  photoURL,
  photoChance = PHOTO_CHANCE,
  onDone,
}: CoinEggOptions = {}): void {
  if (shown) return;
  const photo = readyPhoto(photoURL, photoChance);
  const edge = Array.from(
    { length: EDGE_LAYERS },
    (_, i) =>
      `<span class="coin-egg__edge" style="transform:translateZ(${i - (EDGE_LAYERS - 1) / 2}px)"></span>`
  ).join('');
  const face = (side: 'front' | 'back') =>
    photo
      ? `<div class="coin-egg__face coin-egg__face--${side}">${neonFace(`coin-egg-${side}`)}<img class="coin-egg__photo" alt=""></div>`
      : `<div class="coin-egg__face coin-egg__face--${side}">${neonFace(`coin-egg-${side}`, side === 'front' ? TV : BOOK)}</div>`;
  const el = document.createElement('div');
  el.className = 'coin-egg';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `
    <div class="coin-egg__stage">
      <div class="coin-egg__float">
        <div class="coin-egg__halo"></div>
        <div class="coin-egg__coin">
          ${edge}
          ${face('front')}
          ${face('back')}
        </div>
      </div>
      <div class="coin-egg__shadow"></div>
    </div>`;
  if (photo) {
    el.querySelectorAll<HTMLImageElement>('.coin-egg__photo').forEach((img) => {
      img.src = photo;
    });
  }
  document.body.appendChild(el);
  shown = el;
  window.setTimeout(() => {
    el.remove();
    shown = null;
    onDone?.();
  }, 2800);
}

/** Dock-Wechsel nach „Lesen" oder zurück: für Flo erst die Münze, dann der Wechsel. */
export function withCoinEgg(
  uid: string | null | undefined,
  proceed: () => void,
  photoFallback?: string | null
): void {
  if (uid !== FLO_UID) {
    proceed();
    return;
  }
  if (!shown) showCoinEgg({ photoURL: getOwnPhotoURL() || photoFallback, onDone: proceed });
}
