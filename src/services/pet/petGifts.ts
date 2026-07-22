import { dbRef, userPath } from '../../services/db/ref';
import { t, tLocale } from '../i18n';
import { queuePush } from '../pushQueue';

export type PetGiftType = 'snack' | 'toy';

export interface PetGiftPayload {
  type: 'pet_gift';
  title: string;
  message: string;
  titleEn?: string;
  messageEn?: string;
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

// label = deutscher Quelltext; Lokalisierung erst beim Bauen der Texte (tLocale)
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

  const titleFor = (locale: 'de' | 'en') =>
    tLocale(locale, '{name} schickt {gift}', {
      name: fromName,
      gift: tLocale(locale, preset.label),
    });
  const messageFor = (locale: 'de' | 'en') =>
    tLocale(locale, 'Dein Pet freut sich (+{h} Glück{rest})', {
      h: preset.happinessDelta,
      rest:
        preset.hungerDelta < 0 ? tLocale(locale, ', {n} Hunger', { n: preset.hungerDelta }) : '',
    });

  // Rules capen title≤500 / message≤2000 — fromName ist unbegrenzt lang möglich
  const payload: PetGiftPayload = {
    type: 'pet_gift',
    title: titleFor('de').slice(0, 500),
    message: messageFor('de').slice(0, 2000),
    titleEn: titleFor('en').slice(0, 500),
    messageEn: messageFor('en').slice(0, 2000),
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

  await dbRef(userPath(toUid, 'notifications')).push(payload);
  await queuePush(toUid, {
    title: `🎁 ${payload.title}`,
    body: payload.message,
    titleEn: `🎁 ${payload.titleEn}`,
    bodyEn: payload.messageEn,
    url: '/pets',
  });

  try {
    localStorage.setItem(COOLDOWN_LS_PREFIX + toUid, String(Date.now()));
  } catch {
    // ignore
  }
}

export function formatCooldownRemaining(nextAvailableAt: number): string {
  const remainingMs = Math.max(0, nextAvailableAt - Date.now());
  const hours = Math.ceil(remainingMs / (60 * 60 * 1000));
  if (hours <= 1) return t('in unter 1 Stunde');
  if (hours < 24) return t('in {n} h', { n: hours });
  return t('morgen');
}
