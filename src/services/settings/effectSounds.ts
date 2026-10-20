/** Effekt-Töne (Kisten, Glücksrad) an/aus — gerätelokal, Standard: an. */

const KEY = 'effectSounds';
export const EFFECT_SOUNDS_EVENT = 'effect-sounds-changed';

let cached: boolean | null = null;
const activeAudio = new Set<HTMLAudioElement>();

export function readEffectSounds(): boolean {
  if (cached !== null) return cached;
  try {
    cached = localStorage.getItem(KEY) !== '0';
  } catch {
    cached = true;
  }
  return cached;
}

export function setEffectSounds(on: boolean): void {
  cached = on;
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    // ohne Storage gilt die Wahl nur für diese Sitzung
  }
  if (!on) {
    activeAudio.forEach((audio) => audio.pause());
    activeAudio.clear();
  }
  window.dispatchEvent(new Event(EFFECT_SOUNDS_EVENT));
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) cached = null;
  });
}

interface AudioSessionLike {
  type: string;
}

/** Ambient-Session: iOS hält sich dann an den Stummschalter (Safari/WKWebView ab 16.4). */
export function applyAmbientAudioSession(): void {
  const session = (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession;
  if (!session) return;
  try {
    session.type = 'ambient';
  } catch {
    // ältere WebKit-Versionen kennen den Typ nicht
  }
}

/** Für Inhalte, die bewusst auch bei Stummschalter hörbar sein sollen (Vorlesen). */
export function applyPlaybackAudioSession(): void {
  const session = (navigator as Navigator & { audioSession?: AudioSessionLike }).audioSession;
  if (!session) return;
  try {
    session.type = 'playback';
  } catch {
    // ältere WebKit-Versionen kennen den Typ nicht
  }
}

export function playRevealSound(volume: number, durationMs: number): void {
  if (!readEffectSounds()) return;
  try {
    applyAmbientAudioSession();
    const audio = new Audio('/sounds/reveal.mp3');
    audio.volume = volume;
    audio.playbackRate = 2.0;
    activeAudio.add(audio);
    // bewusst still: Autoplay kann vom Browser blockiert werden
    audio.play().catch(() => {});
    setTimeout(() => {
      audio.pause();
      activeAudio.delete(audio);
    }, durationMs);
  } catch {
    // ignore
  }
}
