import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { AccessoryRarity, PetAccessory } from '../../types/pet.types';
import { ACCESSORIES, PET_BACKGROUNDS } from '../../types/pet.types';
import { getUserPets } from './petCore';

// ============================================================
// Daily Spin Reward Types
// ============================================================

export type SpinRewardType = 'xp_boost' | 'accessory' | 'nothing' | 'background';

export interface XpBoostItem {
  multiplier: number;
  episodeCount: number;
  source: string;
  wonAt: number;
}

export interface SpinReward {
  type: SpinRewardType;
  label: string;
  icon: string;
  color: string;
  rarity: AccessoryRarity;
  // XP boost
  xpMultiplier?: number;
  xpEpisodeCount?: number;
  // Accessory
  accessoryId?: string;
  // Background
  backgroundId?: string;
}

export interface DailySpinData {
  lastSpinDate: string;
  totalSpins: number;
  history: SpinHistoryEntry[];
}

export interface SpinHistoryEntry {
  date: string;
  reward: SpinReward;
  timestamp: number;
}

// ============================================================
// Spin Wheel Segments
// ============================================================

/** IDs of accessories exclusive to the daily spin (not dropped from episodes) */
const SPIN_EXCLUSIVE_ACCESSORIES = [
  'diamondTiara',
  'ninjaMask',
  'royalCape',
  'aviatorGoggles',
  'chefHat',
  'lei',
  'catEars',
  'nightOwlGoggles',
  'galaxyCape',
  'samuraiHelmet',
  'pixelShades',
  'luckyClover',
  'witchHat',
  'steamGoggles',
  'rainbowScarf',
  'mushHat',
  'butterflyMask',
  'shellNecklace',
  'foxEars',
  'ghostMask',
  'thunderChain',
  'iceHelm',
  'prismVisor',
  'solarAmulet',
];

function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Build the 9 segments for the spin wheel — rarities are fixed per segment */
export function buildSpinSegments(_streakDays: number): SpinReward[] {
  const segments: SpinReward[] = [
    // 0: Niete
    {
      type: 'nothing',
      label: 'Niete',
      icon: '❌',
      color: '#444444',
      rarity: 'common',
    },
    // 1: 2x XP 2 Episoden
    {
      type: 'xp_boost',
      label: '2x XP — 2 Episoden',
      icon: '⚡',
      color: '#FFD93D',
      rarity: 'common',
      xpMultiplier: 2,
      xpEpisodeCount: 2,
    },
    // 2: Niete
    {
      type: 'nothing',
      label: 'Niete',
      icon: '💨',
      color: '#555555',
      rarity: 'common',
    },
    // 3: 2x XP 5 Episoden
    {
      type: 'xp_boost',
      label: '2x XP — 5 Episoden',
      icon: '🔥',
      color: '#FF9800',
      rarity: 'uncommon',
      xpMultiplier: 2,
      xpEpisodeCount: 5,
    },
    // 4: Common Accessoire
    {
      type: 'accessory',
      label: 'Accessoire',
      icon: '🎁',
      color: '#2196F3',
      rarity: 'common',
    },
    // 5: 2x XP 10 Episoden
    {
      type: 'xp_boost',
      label: '2x XP — 10 Episoden',
      icon: '💥',
      color: '#4CAF50',
      rarity: 'rare',
      xpMultiplier: 2,
      xpEpisodeCount: 10,
    },
    // 6: Seltenes Accessoire
    {
      type: 'accessory',
      label: 'Seltenes Accessoire',
      icon: '✨',
      color: '#9C27B0',
      rarity: 'rare',
    },
    // 7: Episches Accessoire
    {
      type: 'accessory',
      label: 'Episches Accessoire',
      icon: '💎',
      color: '#E040FB',
      rarity: 'epic',
    },
    // 8: Legendäres Accessoire
    {
      type: 'accessory',
      label: 'Legendäres Accessoire',
      icon: '👑',
      color: '#FFD700',
      rarity: 'legendary',
    },
  ];

  return segments;
}

// ============================================================
// Weighted spin logic
// ============================================================

/** Weights per segment index, scaled by streak tier.
 *  Segments: Niete, 2xXP2Ep, Niete, 2xXP5Ep, Acc, 2xXP10Ep, RareAcc, EpicAcc, LegendaryAcc
 *  Higher streak = less Nieten, more rare/epic/legendary chances */
const STREAK_WEIGHTS: number[][] = [
  // Tier 0 (0–6 Tage):   Niete 44%, XP 38%, Acc 18%
  [29, 20, 15, 12, 10, 6, 4, 3, 1],
  // Tier 1 (7–13 Tage):  Niete 38%, XP 38%, Acc 24%
  [24, 20, 14, 12, 12, 7, 5, 4, 2],
  // Tier 2 (14–29 Tage): Niete 32%, XP 38%, Acc 30%
  [19, 20, 13, 12, 14, 8, 7, 5, 2],
  // Tier 3 (30+ Tage):   Niete 26%, XP 38%, Acc 36%
  [14, 20, 12, 12, 16, 9, 8, 6, 3],
];

function weightedRandomIndex(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return weights.length - 1;
}

// ============================================================
// Core spin functions
// ============================================================

/** Check if the user can spin today */
export async function canSpinToday(userId: string): Promise<boolean> {
  const ref = firebase.database().ref(`users/${userId}/dailySpin/lastSpinDate`);
  const snap = await ref.once('value');
  const lastDate = snap.val();
  if (!lastDate) return true;
  return lastDate !== toLocalDateString(new Date());
}

/** Get current daily spin data */
export async function getDailySpinData(userId: string): Promise<DailySpinData | null> {
  const ref = firebase.database().ref(`users/${userId}/dailySpin`);
  const snap = await ref.once('value');
  return snap.val();
}

/** Perform the daily spin and return the reward + segment index */
export async function performDailySpin(
  userId: string,
  streakDays: number
): Promise<{ reward: SpinReward; segmentIndex: number } | null> {
  const allowed = await canSpinToday(userId);
  if (!allowed) return null;

  const segments = buildSpinSegments(streakDays);
  const tier = streakDays >= 30 ? 3 : streakDays >= 14 ? 2 : streakDays >= 7 ? 1 : 0;
  const segmentIndex = weightedRandomIndex(STREAK_WEIGHTS[tier]);
  const reward = { ...segments[segmentIndex] };

  // If it's an accessory reward, 30% chance to swap for a background of same rarity
  if (reward.type === 'accessory' && Math.random() < 0.3) {
    const bg = await pickBackgroundReward(userId, reward.rarity);
    if (bg) {
      reward.type = 'background';
      reward.backgroundId = bg.id;
      reward.label = bg.name;
      reward.icon = '\uD83C\uDF0C';
    }
  }

  // If it's an accessory reward, pick a specific one
  if (reward.type === 'accessory') {
    const picked = await pickAccessoryReward(userId, reward.rarity);
    if (picked) {
      reward.accessoryId = picked.id;
      reward.label = picked.name;
      reward.icon = picked.icon;
    } else {
      // Try background fallback before XP fallback
      const bg = await pickBackgroundReward(userId, reward.rarity);
      if (bg) {
        reward.type = 'background';
        reward.backgroundId = bg.id;
        reward.label = bg.name;
        reward.icon = '\uD83C\uDF0C';
      } else {
        // Fallback to XP boost if all accessories owned
        reward.type = 'xp_boost';
        reward.label = '2x XP — 5 Episoden';
        reward.icon = '🔥';
        reward.xpMultiplier = 2;
        reward.xpEpisodeCount = 5;
      }
    }
  }

  // Save spin result
  const today = toLocalDateString(new Date());
  const spinRef = firebase.database().ref(`users/${userId}/dailySpin`);
  const snap = await spinRef.once('value');
  const current = snap.val() || { totalSpins: 0, history: [] };

  const historyEntry: SpinHistoryEntry = {
    date: today,
    reward,
    timestamp: Date.now(),
  };

  // Keep last 30 history entries
  const history = [...(current.history || []), historyEntry].slice(-30);

  await spinRef.set({
    lastSpinDate: today,
    totalSpins: (current.totalSpins || 0) + 1,
    history,
  });

  // Apply the reward
  await applySpinReward(userId, reward);

  return { reward, segmentIndex };
}

// ============================================================
// Reward application
// ============================================================

async function pickAccessoryReward(
  userId: string,
  targetRarity: AccessoryRarity
): Promise<{ id: string; name: string; icon: string } | null> {
  const pets = await getUserPets(userId);
  const alivePet = pets.find((p) => p.isAlive);
  if (!alivePet) return null;

  const owned = new Set((alivePet.accessories || []).map((a) => a.id));

  // Prefer spin-exclusive accessories first, then fall back to regular ones
  const spinExclusiveCandidates = SPIN_EXCLUSIVE_ACCESSORIES.filter((id) => {
    const def = ACCESSORIES[id];
    return def && def.rarity === targetRarity && !owned.has(id);
  });

  if (spinExclusiveCandidates.length > 0) {
    const id = spinExclusiveCandidates[Math.floor(Math.random() * spinExclusiveCandidates.length)];
    const def = ACCESSORIES[id];
    return { id, name: def.name, icon: def.icon };
  }

  // Fall back to regular accessories of that rarity
  const regularCandidates = Object.entries(ACCESSORIES).filter(
    ([id, def]) => def.rarity === targetRarity && !owned.has(id)
  );

  if (regularCandidates.length === 0) return null;

  const [id, def] = regularCandidates[Math.floor(Math.random() * regularCandidates.length)];
  return { id, name: def.name, icon: def.icon };
}

async function pickBackgroundReward(
  userId: string,
  targetRarity: AccessoryRarity
): Promise<{ id: string; name: string } | null> {
  const pets = await getUserPets(userId);
  const alivePet = pets.find((p) => p.isAlive);
  if (!alivePet) return null;

  const owned = new Set(alivePet.unlockedBackgrounds || []);
  const candidates = Object.values(PET_BACKGROUNDS).filter(
    (bg) => bg.rarity === targetRarity && !owned.has(bg.id)
  );

  if (candidates.length === 0) return null;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return { id: pick.id, name: pick.name };
}

async function applySpinReward(userId: string, reward: SpinReward): Promise<void> {
  const pets = await getUserPets(userId);
  const alivePet = pets.find((p) => p.isAlive);
  if (!alivePet) return;

  const petRef = firebase.database().ref(`users/${userId}/pets/${alivePet.id}`);

  switch (reward.type) {
    case 'xp_boost': {
      // Add to inventory instead of activating immediately
      const boostItem: XpBoostItem = {
        multiplier: reward.xpMultiplier || 2,
        episodeCount: reward.xpEpisodeCount || 5,
        source: 'daily_spin',
        wonAt: Date.now(),
      };
      const invRef = firebase.database().ref(`users/${userId}/xpBoostInventory`);
      const invSnap = await invRef.once('value');
      const inventory: XpBoostItem[] = invSnap.val() || [];
      inventory.push(boostItem);
      await invRef.set(inventory);
      break;
    }
    case 'nothing':
      break;
    case 'background': {
      if (!reward.backgroundId) break;
      if (!PET_BACKGROUNDS[reward.backgroundId]) break;
      const alreadyOwned = alivePet.unlockedBackgrounds?.includes(reward.backgroundId);
      if (alreadyOwned) break;
      // Hintergruende werden ueber alle Pets geteilt (wie Accessoires)
      for (const p of pets) {
        const unlocked = [...(p.unlockedBackgrounds || [])];
        if (!unlocked.includes(reward.backgroundId)) {
          unlocked.push(reward.backgroundId);
          await firebase
            .database()
            .ref(`users/${userId}/pets/${p.id}/unlockedBackgrounds`)
            .set(unlocked);
        }
      }
      break;
    }
    case 'accessory': {
      if (!reward.accessoryId) break;
      const def = ACCESSORIES[reward.accessoryId];
      if (!def) break;
      const alreadyOwned = alivePet.accessories?.some((a) => a.id === reward.accessoryId);
      if (alreadyOwned) break;

      const newAcc: PetAccessory = {
        id: reward.accessoryId,
        type: def.slot,
        name: def.name,
        icon: def.icon,
        equipped: false,
        isNew: true,
      };
      if (def.color) newAcc.color = def.color;

      const accessories = [...(alivePet.accessories || []), newAcc];
      await petRef.update({ accessories });
      break;
    }
  }
}

// ============================================================
// XP Boost check (used by petProgressManager)
// ============================================================

export async function getActiveXpBoost(
  userId: string
): Promise<{ multiplier: number; remainingEpisodes: number } | null> {
  const ref = firebase.database().ref(`users/${userId}/activeXpBoost`);
  const snap = await ref.once('value');
  const data = snap.val();
  if (!data) return null;

  // Migration: altes zeitbasiertes Format → entfernen (abgelaufen oder nicht migrierbar)
  if (data.expiresAt && !data.remainingEpisodes) {
    await ref.remove();
    return null;
  }

  if (!data.remainingEpisodes || data.remainingEpisodes <= 0) {
    await ref.remove();
    return null;
  }

  return { multiplier: data.multiplier, remainingEpisodes: data.remainingEpisodes };
}

/** Decrement remaining episodes on the active boost. Called after XP is applied. */
export async function consumeXpBoostEpisode(userId: string): Promise<void> {
  const ref = firebase.database().ref(`users/${userId}/activeXpBoost`);
  const snap = await ref.once('value');
  const data = snap.val();
  if (!data) return;

  const remaining = (data.remainingEpisodes || 0) - 1;
  console.warn(
    `🔴 [FRONTEND] consumeXpBoostEpisode: ${data.remainingEpisodes} → ${remaining}`,
    new Error().stack
  );
  if (remaining <= 0) {
    await ref.remove();
  } else {
    await ref.update({ remainingEpisodes: remaining });
  }
}

// ============================================================
// XP Boost Inventory
// ============================================================

/** Konvertiert alte zeitbasierte Minuten in Episoden-Anzahl */
function migrateMinutesToEpisodes(minutes: number): number {
  if (minutes >= 120) return 10;
  if (minutes >= 60) return 5;
  return 2;
}

/** Get all collected (unused) XP boosts */
export async function getXpBoostInventory(userId: string): Promise<XpBoostItem[]> {
  const ref = firebase.database().ref(`users/${userId}/xpBoostInventory`);
  const snap = await ref.once('value');
  const raw: Record<string, unknown>[] = snap.val() || [];
  if (raw.length === 0) return [];

  // Migration: alte durationMinutes-Items zu episodeCount konvertieren
  let needsMigration = false;
  const migrated: XpBoostItem[] = raw.map((item) => {
    const legacy = item as Record<string, unknown>;
    if (legacy.durationMinutes && !legacy.episodeCount) {
      needsMigration = true;
      return {
        multiplier: (legacy.multiplier as number) || 2,
        episodeCount: migrateMinutesToEpisodes(legacy.durationMinutes as number),
        source: (legacy.source as string) || 'daily_spin',
        wonAt: (legacy.wonAt as number) || Date.now(),
      };
    }
    return item as unknown as XpBoostItem;
  });

  if (needsMigration) {
    await ref.set(migrated);
  }

  return migrated;
}

/** Activate a boost from inventory by index */
export async function activateXpBoost(userId: string, index: number): Promise<boolean> {
  const ref = firebase.database().ref(`users/${userId}/xpBoostInventory`);
  const snap = await ref.once('value');
  const inventory: XpBoostItem[] = snap.val() || [];

  if (index < 0 || index >= inventory.length) return false;

  // Check if a boost is already active
  const activeRef = firebase.database().ref(`users/${userId}/activeXpBoost`);
  const activeSnap = await activeRef.once('value');
  const active = activeSnap.val();
  if (active && active.remainingEpisodes > 0) return false;

  const boost = inventory[index];

  // Activate
  await activeRef.set({
    multiplier: boost.multiplier,
    remainingEpisodes: boost.episodeCount,
    originalEpisodes: boost.episodeCount,
    source: boost.source,
  });

  // Remove from inventory
  inventory.splice(index, 1);
  await ref.set(inventory.length > 0 ? inventory : null);

  return true;
}
