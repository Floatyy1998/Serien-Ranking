/**
 * Chat-Erscheinungsbild.
 *
 * Bubble-Design (chatStyles/$uid): öffentlich lesbar — deine Bubbles tragen
 * dein Design auf BEIDEN Seiten (Identitäts-Modell wie das Pet).
 * Hintergrund (users/$uid/chatPrefs/$pairId/bg): nur für dich sichtbar.
 */
import { dbRef, userPath } from '../db/ref';

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
  await dbRef(`chatStyles/${uid}`).set(style);
}

export function subscribeBubbleStyle(
  uid: string,
  cb: (style: ChatBubbleStyle | null) => void
): () => void {
  const ref = dbRef(`chatStyles/${uid}`);
  const handler = ref.on(
    'value',
    (snap) => {
      const val = snap.val();
      cb(isValidBubbleStyle(val) ? val : null);
    },
    () => cb(null)
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

export function subscribeChatWallpaper(
  uid: string,
  pairId: string,
  cb: (wallpaperId: string | null) => void
): () => void {
  const ref = dbRef(userPath(uid, 'chatPrefs', pairId, 'bg'));
  const handler = ref.on(
    'value',
    (snap) => {
      const val = snap.val();
      cb(typeof val === 'string' ? val : null);
    },
    () => cb(null)
  );
  return () => ref.off('value', handler);
}
