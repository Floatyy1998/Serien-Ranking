import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

export type PetGiftType = 'snack' | 'toy';

export interface PetGiftPayload {
  type: 'pet_gift';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  data: {
    from: string;
    fromName: string;
    giftType: PetGiftType;
    hungerDelta: number;
    happinessDelta: number;
  };
}

const GIFT_PRESETS: Record<
  PetGiftType,
  { hungerDelta: number; happinessDelta: number; label: string }
> = {
  snack: { hungerDelta: -10, happinessDelta: 5, label: 'Snack' },
  toy: { hungerDelta: 0, happinessDelta: 10, label: 'Spielzeug' },
};

const COOLDOWN_LS_PREFIX = 'petGiftSentAt:';
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

export function canSendGiftTo(friendUid: string): { allowed: boolean; nextAvailableAt?: number } {
  try {
    const raw = localStorage.getItem(COOLDOWN_LS_PREFIX + friendUid);
    if (!raw) return { allowed: true };
    const sentAt = parseInt(raw, 10);
    if (isNaN(sentAt)) return { allowed: true };
    if (Date.now() - sentAt >= COOLDOWN_MS) return { allowed: true };
    return { allowed: false, nextAvailableAt: sentAt + COOLDOWN_MS };
  } catch {
    return { allowed: true };
  }
}

export async function sendPetGift(opts: {
  fromUid: string;
  fromName: string;
  toUid: string;
  giftType: PetGiftType;
}): Promise<void> {
  const { fromUid, fromName, toUid, giftType } = opts;
  const preset = GIFT_PRESETS[giftType];

  const payload: PetGiftPayload = {
    type: 'pet_gift',
    title: `${fromName} schickt ${preset.label}`,
    message: `Dein Pet freut sich (+${preset.happinessDelta} Glück${preset.hungerDelta < 0 ? `, ${preset.hungerDelta} Hunger` : ''})`,
    timestamp: Date.now(),
    read: false,
    data: {
      from: fromUid,
      fromName,
      giftType,
      hungerDelta: preset.hungerDelta,
      happinessDelta: preset.happinessDelta,
    },
  };

  await firebase.database().ref(`users/${toUid}/notifications`).push(payload);

  try {
    localStorage.setItem(COOLDOWN_LS_PREFIX + toUid, String(Date.now()));
  } catch {
    // ignore
  }
}

export function formatCooldownRemaining(nextAvailableAt: number): string {
  const remainingMs = Math.max(0, nextAvailableAt - Date.now());
  const hours = Math.ceil(remainingMs / (60 * 60 * 1000));
  if (hours <= 1) return 'in unter 1 Stunde';
  if (hours < 24) return `in ${hours} h`;
  return 'morgen';
}
