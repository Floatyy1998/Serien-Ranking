/**
 * Chat-Erscheinungsbild — alles rein lokal (nur der Nutzer selbst sieht es):
 * Bubble-Design unter users/$uid/chatPrefs/bubbleStyle,
 * Hintergrund pro Chat unter users/$uid/chatPrefs/$pairId/bg.
 * Pet-Szenen als Wallpaper sind an die im Pet-System freigeschalteten
 * Hintergründe gekoppelt (unlockedBackgrounds, über alle Pets synchron).
 */
import { dbGet, dbRef, userPath } from '../db/ref';
import { onValue } from '../../services/db/subscribeValue';

export type BubbleRadius = 'round' | 'soft' | 'sharp';

export interface ChatBubbleStyle {
  c1: string;
  c2: string;
  r: BubbleRadius;
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const RADII: BubbleRadius[] = ['round', 'soft', 'sharp'];

export function isValidBubbleStyle(value: unknown): value is ChatBubbleStyle {
  if (!value || typeof value !== 'object') return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.c1 === 'string' &&
    HEX.test(s.c1) &&
    typeof s.c2 === 'string' &&
    HEX.test(s.c2) &&
    RADII.includes(s.r as BubbleRadius)
  );
}

export async function saveBubbleStyle(uid: string, style: ChatBubbleStyle | null): Promise<void> {
  await dbRef(userPath(uid, 'chatPrefs', 'bubbleStyle')).set(style);
}

export function subscribeBubbleStyle(
  uid: string,
  cb: (style: ChatBubbleStyle | null) => void
): () => void {
  const ref = dbRef(userPath(uid, 'chatPrefs', 'bubbleStyle'));
  const handler = onValue(
    ref,
    (snap) => {
      const val = snap.val();
      cb(isValidBubbleStyle(val) ? val : null);
    },
    {
      onError: () => cb(null),
    }
  );
  return () => ref.off('value', handler);
}

export async function setChatWallpaper(
  uid: string,
  pairId: string,
  wallpaperId: string | null
): Promise<void> {
  await dbRef(userPath(uid, 'chatPrefs', pairId, 'bg')).set(wallpaperId);
}

/** Union der im Pet-System freigeschalteten Hintergrund-IDs (alle Pets). */
export async function getUnlockedPetBackgroundIds(uid: string): Promise<Set<string>> {
  const unlocked = new Set<string>();
  try {
    const pets = (await dbGet(userPath(uid, 'pets'))) as Record<
      string,
      { unlockedBackgrounds?: Record<string, string> | string[] }
    > | null;
    for (const pet of Object.values(pets || {})) {
      for (const id of Object.values(pet.unlockedBackgrounds || {})) {
        if (typeof id === 'string') unlocked.add(id);
      }
    }
  } catch {
    /* best-effort — dann bleiben nur die Gradients wählbar */
  }
  return unlocked;
}

export function subscribeChatWallpaper(
  uid: string,
  pairId: string,
  cb: (wallpaperId: string | null) => void
): () => void {
  const ref = dbRef(userPath(uid, 'chatPrefs', pairId, 'bg'));
  const handler = onValue(
    ref,
    (snap) => {
      const val = snap.val();
      cb(typeof val === 'string' ? val : null);
    },
    {
      onError: () => cb(null),
    }
  );
  return () => ref.off('value', handler);
}
