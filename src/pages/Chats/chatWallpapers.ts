/**
 * Wallpaper-Galerie für den Chat: ruhige Gradients + alle Pet-Hintergrund-Szenen
 * (dieselben SVG-Daten wie im Pet-System, abgedunkelt über .ch-wallpaper).
 * Bubble-Presets für den Design-Editor liegen ebenfalls hier.
 */
import { PET_BACKGROUNDS } from '../../components/pet/data/petBackgrounds';
import { t } from '../../services/i18n';
import { getContrastRatio } from '../../theme/colorUtils';

export interface ChatWallpaper {
  id: string;
  name: string;
  css: string;
  /** Gesetzt bei Pet-Szenen: nur nutzbar, wenn im Pet-System freigeschaltet. */
  petBackgroundId?: string;
}

const GRADIENTS: ChatWallpaper[] = [
  { id: 'grad:emerald', name: t('Smaragd'), css: 'linear-gradient(160deg, #04140a, #0a3d1f)' },
  { id: 'grad:midnight', name: t('Mitternacht'), css: 'linear-gradient(160deg, #050810, #122142)' },
  { id: 'grad:plum', name: t('Pflaume'), css: 'linear-gradient(160deg, #12061a, #3a1054)' },
  { id: 'grad:ember', name: t('Glut'), css: 'linear-gradient(160deg, #170905, #4a1d0e)' },
  { id: 'grad:slate', name: t('Schiefer'), css: 'linear-gradient(160deg, #0a0d10, #232c33)' },
];

const PET_SCENES: ChatWallpaper[] = Object.values(PET_BACKGROUNDS).map((bg) => ({
  id: `pet:${bg.id}`,
  name: bg.name,
  css: bg.background,
  petBackgroundId: bg.id,
}));

export const CHAT_WALLPAPERS: ChatWallpaper[] = [...GRADIENTS, ...PET_SCENES];

export function resolveWallpaper(id: string | null): ChatWallpaper | null {
  if (!id) return null;
  return CHAT_WALLPAPERS.find((w) => w.id === id) || null;
}

export const RADIUS_PX: Record<'round' | 'soft' | 'sharp', number> = {
  round: 20,
  soft: 14,
  sharp: 8,
};

/** Textfarbe mit dem besten Worst-Case-Kontrast über beide Verlaufs-Enden. */
export function bubbleTextColor(c1: string, c2: string): string {
  const white = Math.min(getContrastRatio(c1, '#ffffff'), getContrastRatio(c2, '#ffffff'));
  const black = Math.min(getContrastRatio(c1, '#000000'), getContrastRatio(c2, '#000000'));
  return black >= white ? '#000000' : '#ffffff';
}

/** Preset-Verläufe für den Bubble-Editor. */
export const BUBBLE_PRESETS: Array<{ c1: string; c2: string }> = [
  { c1: '#38bdf8', c2: '#2563eb' },
  { c1: '#fb923c', c2: '#e11d48' },
  { c1: '#c084fc', c2: '#7c3aed' },
  { c1: '#34d399', c2: '#0d9488' },
  { c1: '#facc15', c2: '#ea8a0a' },
  { c1: '#fb7185', c2: '#be185d' },
  { c1: '#e5e7eb', c2: '#9ca3af' },
  { c1: '#111827', c2: '#374151' },
];
