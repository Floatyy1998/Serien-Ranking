import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Firebase-Mock: ein flacher Pfad-Store, der push() unterstuetzt.
const fb = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  let counter = 0;
  const makeRef = (path: string) => ({
    push: async (value?: unknown) => {
      const key = `push-${++counter}`;
      const childPath = `${path}/${key}`;
      if (value !== undefined) store.set(childPath, value);
      return { key };
    },
  });
  return {
    store,
    ref: (path: string) => makeRef(path),
    reset: () => {
      store.clear();
      counter = 0;
    },
  };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: fb.ref }) },
}));
vi.mock('firebase/compat/database', () => ({}));

import {
  canSendGiftTo,
  sendPetGift,
  formatCooldownRemaining,
  type PetGiftPayload,
} from './petGifts';

const NOW = new Date('2026-07-04T12:00:00.000Z').getTime();
const COOLDOWN_MS = 24 * 60 * 60 * 1000;

// localStorage-Mock (node hat keinen).
const lsStore = new Map<string, string>();
let lsThrows = false;
const localStorageMock = {
  getItem: (k: string) => {
    if (lsThrows) throw new Error('quota');
    return lsStore.has(k) ? lsStore.get(k)! : null;
  },
  setItem: (k: string, v: string) => {
    if (lsThrows) throw new Error('quota');
    lsStore.set(k, v);
  },
  removeItem: (k: string) => lsStore.delete(k),
  clear: () => lsStore.clear(),
};

beforeEach(() => {
  fb.reset();
  lsStore.clear();
  lsThrows = false;
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  vi.stubGlobal('localStorage', localStorageMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('canSendGiftTo', () => {
  it('kein Eintrag → erlaubt', () => {
    expect(canSendGiftTo('friend1')).toEqual({ allowed: true });
  });

  it('kaputter (nicht-numerischer) Eintrag → erlaubt', () => {
    lsStore.set('petGiftSentAt:friend1', 'nonsense');
    expect(canSendGiftTo('friend1')).toEqual({ allowed: true });
  });

  it('innerhalb des Cooldowns → nicht erlaubt, mit nextAvailableAt', () => {
    lsStore.set('petGiftSentAt:friend1', String(NOW));
    const result = canSendGiftTo('friend1');
    expect(result.allowed).toBe(false);
    expect(result.nextAvailableAt).toBe(NOW + COOLDOWN_MS);
  });

  it('nach Ablauf des Cooldowns → erlaubt', () => {
    lsStore.set('petGiftSentAt:friend1', String(NOW - COOLDOWN_MS - 1));
    expect(canSendGiftTo('friend1')).toEqual({ allowed: true });
  });

  it('genau an der Cooldown-Grenze → erlaubt (>= Grenze)', () => {
    lsStore.set('petGiftSentAt:friend1', String(NOW - COOLDOWN_MS));
    expect(canSendGiftTo('friend1')).toEqual({ allowed: true });
  });

  it('localStorage wirft → erlaubt (best effort)', () => {
    lsThrows = true;
    expect(canSendGiftTo('friend1')).toEqual({ allowed: true });
  });
});

describe('formatCooldownRemaining', () => {
  it('<= 1 Stunde Rest → "in unter 1 Stunde"', () => {
    expect(formatCooldownRemaining(NOW + 30 * 60 * 1000)).toBe('in unter 1 Stunde');
  });

  it('mehrere Stunden (< 24) → "in N h"', () => {
    expect(formatCooldownRemaining(NOW + 5 * 60 * 60 * 1000)).toBe('in 5 h');
  });

  it('>= 24 Stunden → "morgen"', () => {
    expect(formatCooldownRemaining(NOW + 30 * 60 * 60 * 1000)).toBe('morgen');
  });

  it('bereits verstrichen (negativer Rest) → "in unter 1 Stunde"', () => {
    expect(formatCooldownRemaining(NOW - 1000)).toBe('in unter 1 Stunde');
  });
});

describe('sendPetGift', () => {
  it('snack: pusht Payload mit korrekten Deltas und setzt den Cooldown', async () => {
    await sendPetGift({
      fromUid: 'me',
      fromName: 'Alice',
      toUid: 'bob',
      giftType: 'snack',
    });

    const entry = fb.store.get('users/bob/notifications/push-1') as PetGiftPayload;
    expect(entry.type).toBe('pet_gift');
    expect(entry.read).toBe(false);
    expect(entry.data).toMatchObject({
      from: 'me',
      fromName: 'Alice',
      giftType: 'snack',
      hungerDelta: -10,
      happinessDelta: 5,
    });
    expect(entry.title).toContain('Alice');
    // Cooldown wird auf den Empfaenger gesetzt
    expect(lsStore.get('petGiftSentAt:bob')).toBe(String(NOW));
  });

  it('toy: hungerDelta 0, kein Hunger-Text in der Nachricht', async () => {
    await sendPetGift({ fromUid: 'me', fromName: 'Alice', toUid: 'bob', giftType: 'toy' });

    const entry = fb.store.get('users/bob/notifications/push-1') as PetGiftPayload;
    expect(entry.data.hungerDelta).toBe(0);
    expect(entry.data.happinessDelta).toBe(10);
    expect(entry.message).not.toContain('Hunger');
  });

  it('funktioniert auch wenn localStorage beim Cooldown-Set wirft', async () => {
    lsThrows = true;
    await expect(
      sendPetGift({ fromUid: 'me', fromName: 'Alice', toUid: 'bob', giftType: 'snack' })
    ).resolves.toBeUndefined();
    expect(fb.store.get('users/bob/notifications/push-1')).toBeDefined();
  });
});
