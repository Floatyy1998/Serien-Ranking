import { dbRef, userPath } from '../../services/db/ref';
import type { AccessoryRarity, PetAccessory } from '../../types/pet.types';
import { ACCESSORIES } from '../../components/pet/data/accessories';
import {
  MILESTONE_EXCLUSIVE_ACCESSORIES,
  pickItemReward,
} from '../../components/pet/data/accessoryPools';
import { PET_BACKGROUNDS } from '../../components/pet/data/petBackgrounds';
import { PET_ITEMS, rollPetItem, type PetItemId } from '../../components/pet/data/petItems';
import { t } from '../i18n';
import { getUserPets } from './petCore';
import { addPetItem, takePetItem } from './petItemService';

/** Interval: alle X Episoden gibt es eine Mystery Box */
export const BOX_EVERY_N_EPISODES = 20;

/** Schema-Version: v1 = 50er-Intervall, v2 = 20er — Migration re-baselined auf den 20er-Stand. */
export const BOX_SCHEMA_VERSION = 2;

export type MysteryRewardType = 'accessory' | 'xp_boost' | 'background' | 'item';

export interface MysteryBoxReward {
  type: MysteryRewardType;
  label: string;
  icon: string;
  rarity: AccessoryRarity;
  accessoryId?: string;
  backgroundId?: string;
  xpMultiplier?: number;
  xpEpisodeCount?: number;
  itemId?: PetItemId;
}

export interface MysteryBoxData {
  /** Wie viele Boxen der User schon geöffnet hat */
  boxesOpened: number;
  /** Letzte geöffnete Box-Nummer (z.B. 3 = 60 Episoden bei v2) */
  lastOpenedBoxNumber: number;
  /** Schema-Version — fehlt bei v1-Eintraegen, triggert Migration */
  schemaVersion?: number;
  /**
   * Episoden, die per Massen-Abhaken (ganze Staffel/Serie in einem Klick,
   * Catch-up) markiert wurden und NICHT zu Boxen zählen sollen. Die
   * Box-Ableitung rechnet mit `total - bulkExcludedEpisodes`, damit das
   * Eintragen bereits geschauter Serien keinen Box-Schwall auslöst.
   */
  bulkExcludedEpisodes?: number;
  /** Self-Heal-Kandidat: erste Defizit-Sichtung; geheilt erst nach >= 24h — sonst Doppel-Einlösung bei halb geladener Zählung. */
  healCandidateEarned?: number;
  healCandidateAt?: number;
}

/** Für Boxen zählende Episoden = Gesamt minus per Bulk abgehakte (>= 0). */
export function effectiveEpisodes(totalEpisodes: number, data?: MysteryBoxData | null): number {
  return Math.max(0, totalEpisodes - (data?.bulkExcludedEpisodes ?? 0));
}

/** Defizit muss so lange bestehen, bevor der Self-Heal die Baseline zurückzieht */
export const HEAL_DELAY_MS = 24 * 60 * 60 * 1000;

/** Wie viele ungeöffnete Boxen hat der User? */
export async function getAvailableBoxCount(userId: string, totalEpisodes: number): Promise<number> {
  const data = await ensureInitialized(userId, totalEpisodes);
  const earnedBoxes = Math.floor(effectiveEpisodes(totalEpisodes, data) / BOX_EVERY_N_EPISODES);
  return Math.max(0, earnedBoxes - data.lastOpenedBoxNumber);
}

/**
 * Verschiebt die Bulk-Ausschluss-Zählung um `delta` Unique-Episoden (positiv =
 * gerade per Bulk abgehakt, negativ = per Bulk wieder entfernt). Atomar, damit
 * parallele Marks nicht überschreiben. So bleibt die effektive Episodenzahl bei
 * jedem Massen-Toggle konstant → keine Box durch Massen-Abhaken.
 */
export async function adjustBulkExcludedEpisodes(userId: string, delta: number): Promise<void> {
  if (!delta) return;
  try {
    const ref = dbRef(userPath(userId, 'mysteryBox'));
    await ref.transaction((current: MysteryBoxData | null) => {
      const cur: MysteryBoxData = current ?? { boxesOpened: 0, lastOpenedBoxNumber: 0 };
      return {
        ...cur,
        bulkExcludedEpisodes: Math.max(0, (cur.bulkExcludedEpisodes ?? 0) + delta),
      };
    });
  } catch {
    // Best-effort: ein fehlgeschlagener Box-Zähler-Update darf das Abhaken nie brechen.
  }
}

/**
 * Spiegelt die aktuelle Zahl offener Boxen in einen eigenen Leaf, den der
 * Backend-Push-Cron (push-notify.js, „Belohnungs-Reminder") liest. Bewusst
 * getrennt vom `mysteryBox`-Node, dessen Heal-Transaktionen ihn per set()
 * ueberschreiben wuerden. Nur schreiben, wenn sich der Wert aendert.
 */
export async function syncAvailableBoxCount(userId: string, availableBoxes: number): Promise<void> {
  try {
    const ref = dbRef(userPath(userId, 'mysteryBoxAvailable'));
    const current = (await ref.once('value')).val();
    const next = Math.max(0, availableBoxes);
    if (current === next) return;
    await ref.set(next);
  } catch {
    /* best effort — der Push faellt sonst nur auf den alten Stand zurueck */
  }
}

/** Legt den mysteryBox-Eintrag an bzw. migriert v1→v2 (Baseline auf aktuellen 20er-Stand — keine rückwirkenden Boxen). */
export async function ensureInitialized(
  userId: string,
  totalEpisodes: number
): Promise<MysteryBoxData> {
  const ref = dbRef(userPath(userId, 'mysteryBox'));
  const snap = await ref.once('value');
  const data = snap.val();

  // 0 ist ein gültiger Stand — sonst re-baselined jeder Mount und verschluckt die erste Box.
  const hasExisting =
    data && typeof data.lastOpenedBoxNumber === 'number' && data.lastOpenedBoxNumber >= 0;
  const schemaVersion = (data?.schemaVersion as number | undefined) ?? 1;

  const excluded = (data?.bulkExcludedEpisodes as number | undefined) ?? 0;

  if (hasExisting && schemaVersion >= BOX_SCHEMA_VERSION) {
    // Self-Heal mit 24h-Hysterese: Baseline > earned verschluckt neue Boxen, aber sofortiges Zurückspulen bei halb geladener Zählung erlaubte Doppel-Einlösung.
    const earnedBoxes = Math.floor(effectiveEpisodes(totalEpisodes, data) / BOX_EVERY_N_EPISODES);
    if (totalEpisodes > 0 && data.lastOpenedBoxNumber > earnedBoxes) {
      const candAt = typeof data.healCandidateAt === 'number' ? data.healCandidateAt : null;
      if (candAt !== null && Date.now() - candAt >= HEAL_DELAY_MS) {
        const healed: MysteryBoxData = {
          boxesOpened: data.boxesOpened ?? 0,
          lastOpenedBoxNumber: earnedBoxes,
          schemaVersion: BOX_SCHEMA_VERSION,
          bulkExcludedEpisodes: excluded,
        };
        await ref.set(healed);
        return healed;
      }
      if (candAt === null) {
        const marked: MysteryBoxData = {
          ...data,
          healCandidateEarned: earnedBoxes,
          healCandidateAt: Date.now(),
        };
        await ref.set(marked);
        return marked;
      }
      // Kandidat laeuft noch — Baseline unveraendert lassen
      return data;
    }
    // Kein Defizit (mehr): offenen Heal-Kandidaten verwerfen
    if (data.healCandidateAt !== undefined || data.healCandidateEarned !== undefined) {
      const cleared: MysteryBoxData = {
        boxesOpened: data.boxesOpened ?? 0,
        lastOpenedBoxNumber: data.lastOpenedBoxNumber,
        schemaVersion: BOX_SCHEMA_VERSION,
        bulkExcludedEpisodes: excluded,
      };
      await ref.set(cleared);
      return cleared;
    }
    return data;
  }

  // Migration/Erstbesuch: Baseline auf aktuellen Stand — verhindert den Schwall rückwirkender Boxen.
  const baseline = Math.floor(effectiveEpisodes(totalEpisodes, data) / BOX_EVERY_N_EPISODES);
  const initData: MysteryBoxData = {
    boxesOpened: (data?.boxesOpened as number | undefined) ?? 0,
    lastOpenedBoxNumber: baseline,
    schemaVersion: BOX_SCHEMA_VERSION,
    bulkExcludedEpisodes: excluded,
  };
  await ref.set(initData);
  return initData;
}

/** Nächster Meilenstein (Episoden bis zur nächsten Box) */
export function getNextBoxThreshold(totalEpisodes: number): number {
  return (Math.floor(totalEpisodes / BOX_EVERY_N_EPISODES) + 1) * BOX_EVERY_N_EPISODES;
}

/** Episoden-Fortschritt zur nächsten Box (0-1) */
export function getProgressToNextBox(totalEpisodes: number): number {
  const within = totalEpisodes % BOX_EVERY_N_EPISODES;
  return within / BOX_EVERY_N_EPISODES;
}

/** Löst eine Bonus-Box aus dem Vorrat ein; der Zähler der erspielten Boxen bleibt unberührt. */
export async function openBonusBox(userId: string): Promise<MysteryBoxReward | null> {
  if (!(await takePetItem(userId, 'bonusBox'))) return null;
  const snap = await dbRef(userPath(userId, 'mysteryBox')).once('value');
  const opened = (snap.val() as MysteryBoxData | null)?.lastOpenedBoxNumber;
  const rarity = getBoxRarity(typeof opened === 'number' && opened > 0 ? opened : 1);
  const reward = await generateMysteryReward(userId, rarity);
  await applyMysteryReward(userId, reward);
  return reward;
}

export async function openMysteryBox(
  userId: string,
  totalEpisodes: number
): Promise<MysteryBoxReward | null> {
  const data = await ensureInitialized(userId, totalEpisodes);
  const earnedBoxes = Math.floor(effectiveEpisodes(totalEpisodes, data) / BOX_EVERY_N_EPISODES);

  if (earnedBoxes <= data.lastOpenedBoxNumber) return null;

  // Atomarer Claim per Transaktion — zwei Geräte/Doppel-Taps: der Verlierer geht leer aus.
  const ref = dbRef(userPath(userId, 'mysteryBox'));
  const tx = await ref.transaction((current: MysteryBoxData | null) => {
    // Lokaler Transaktions-Cache kann leer sein → frisch gelesenen Stand als Ausgangspunkt.
    const cur = current ?? data;
    const last =
      typeof cur.lastOpenedBoxNumber === 'number' ? cur.lastOpenedBoxNumber : earnedBoxes;
    if (earnedBoxes <= last) return undefined; // nichts (mehr) offen → abort
    return {
      boxesOpened: (cur.boxesOpened || 0) + 1,
      lastOpenedBoxNumber: last + 1,
      schemaVersion: BOX_SCHEMA_VERSION,
      bulkExcludedEpisodes: cur.bulkExcludedEpisodes ?? 0,
      // Heal-Kandidat entfällt bewusst: eine geöffnete Box beweist die korrekte Zählung.
    };
  });

  if (!tx.committed) return null;
  const claimed = tx.snapshot?.val() as MysteryBoxData | null;
  const boxNumber = claimed?.lastOpenedBoxNumber ?? data.lastOpenedBoxNumber + 1;

  // Verfuegbarkeits-Leaf sofort nachziehen, damit der Push-Cron nicht ueber
  // eine gerade geoeffnete Box benachrichtigt (Card-Re-Sync kaeme erst spaeter).
  void syncAvailableBoxCount(userId, Math.max(0, earnedBoxes - boxNumber));

  // Rarity basierend auf Box-Nummer (je mehr Boxen, desto besser)
  const rarity = getBoxRarity(boxNumber);
  const reward = await generateMysteryReward(userId, rarity);
  await applyMysteryReward(userId, reward);

  return reward;
}

/** Rarity skaliert mit Box-Nummer */
function getBoxRarity(boxNumber: number): AccessoryRarity {
  const roll = Math.random();

  if (boxNumber >= 400) {
    // 20000+ Ep: 10% L, 55% E, 25% R, 8% U, 2% C
    if (roll < 0.1) return 'legendary';
    if (roll < 0.65) return 'epic';
    if (roll < 0.9) return 'rare';
    if (roll < 0.98) return 'uncommon';
    return 'common';
  }
  if (boxNumber >= 200) {
    // 10000+ Ep: 8% L, 49% E, 30% R, 10% U, 3% C
    if (roll < 0.08) return 'legendary';
    if (roll < 0.57) return 'epic';
    if (roll < 0.87) return 'rare';
    if (roll < 0.97) return 'uncommon';
    return 'common';
  }
  if (boxNumber >= 100) {
    // 5000+ Ep: 5% L, 45% E, 33% R, 12% U, 5% C
    if (roll < 0.05) return 'legendary';
    if (roll < 0.5) return 'epic';
    if (roll < 0.83) return 'rare';
    if (roll < 0.95) return 'uncommon';
    return 'common';
  }
  if (boxNumber >= 50) {
    // 2500+ Ep: 3% L, 39% E, 35% R, 15% U, 8% C
    if (roll < 0.03) return 'legendary';
    if (roll < 0.42) return 'epic';
    if (roll < 0.77) return 'rare';
    if (roll < 0.92) return 'uncommon';
    return 'common';
  }
  if (boxNumber >= 20) {
    // 1000+ Ep: 2% L, 33% E, 35% R, 20% U, 10% C
    if (roll < 0.02) return 'legendary';
    if (roll < 0.35) return 'epic';
    if (roll < 0.7) return 'rare';
    if (roll < 0.9) return 'uncommon';
    return 'common';
  }
  if (boxNumber >= 10) {
    // 500+ Ep: 1% L, 24% E, 35% R, 25% U, 15% C
    if (roll < 0.01) return 'legendary';
    if (roll < 0.25) return 'epic';
    if (roll < 0.6) return 'rare';
    if (roll < 0.85) return 'uncommon';
    return 'common';
  }
  if (boxNumber >= 4) {
    // 200+ Ep: 10% E, 30% R, 35% U, 25% C
    if (roll < 0.1) return 'epic';
    if (roll < 0.4) return 'rare';
    if (roll < 0.75) return 'uncommon';
    return 'common';
  }
  // Erste Boxen (50-150 Ep): 15% R, 35% U, 50% C
  if (roll < 0.15) return 'rare';
  if (roll < 0.5) return 'uncommon';
  return 'common';
}

/** XP boost episode counts by rarity */
const BOOST_EPISODES: Record<AccessoryRarity, { multiplier: number; episodes: number }> = {
  common: { multiplier: 2, episodes: 2 },
  uncommon: { multiplier: 2, episodes: 5 },
  rare: { multiplier: 2, episodes: 10 },
  epic: { multiplier: 3, episodes: 10 },
  legendary: { multiplier: 3, episodes: 15 },
};

async function generateMysteryReward(
  userId: string,
  rarity: AccessoryRarity
): Promise<MysteryBoxReward> {
  // 30 % Hintergrund, 40 % Accessoire, 15 % XP-Boost, 15 % Vorrat. Ist die Seltenheit
  // leergesammelt, rückt die nächstgelegene nach; ist alles gesammelt, gibt es einen Vorrat.
  const roll = Math.random();
  if (roll < 0.7) {
    const pet = (await getUserPets(userId)).find((p) => p.isAlive);
    const item =
      pet &&
      pickItemReward({
        ownedAccessories: new Set((pet.accessories || []).map((a) => a.id)),
        ownedBackgrounds: new Set(pet.unlockedBackgrounds || []),
        rarity,
        preferred: MILESTONE_EXCLUSIVE_ACCESSORIES,
        first: roll < 0.3 ? 'background' : 'accessory',
      });
    if (item?.kind === 'accessory') {
      return {
        type: 'accessory',
        label: ACCESSORIES[item.id].name,
        icon: ACCESSORIES[item.id].icon,
        rarity: item.rarity,
        accessoryId: item.id,
      };
    }
    if (item) {
      return {
        type: 'background',
        label: PET_BACKGROUNDS[item.id].name,
        icon: '\uD83C\uDF0C',
        rarity: item.rarity,
        backgroundId: item.id,
      };
    }
  }

  if (roll < 0.7 || roll >= 0.85) {
    const itemId = rollPetItem(rarity);
    return {
      type: 'item',
      label: t(PET_ITEMS[itemId].name),
      icon: '🎁',
      rarity: PET_ITEMS[itemId].rarity,
      itemId,
    };
  }

  const boost = BOOST_EPISODES[rarity];
  return {
    type: 'xp_boost',
    label: t('{x}x XP — {n} Episoden', { x: boost.multiplier, n: boost.episodes }),
    icon: '\u26A1',
    rarity,
    xpMultiplier: boost.multiplier,
    xpEpisodeCount: boost.episodes,
  };
}

async function applyMysteryReward(userId: string, reward: MysteryBoxReward): Promise<void> {
  // Vorräte gehören zum Konto, nicht zu einem Pet — auch ohne lebendes Pet gutschreiben
  if (reward.type === 'item') {
    if (reward.itemId) await addPetItem(userId, reward.itemId);
    return;
  }

  const pets = await getUserPets(userId);
  const alivePet = pets.find((p) => p.isAlive);
  if (!alivePet) return;

  switch (reward.type) {
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
      await dbRef(userPath(userId, 'pets', alivePet.id)).update({ accessories });
      break;
    }
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
          await dbRef(userPath(userId, 'pets', p.id, 'unlockedBackgrounds')).set(unlocked);
        }
      }
      break;
    }
    case 'xp_boost': {
      // Add to inventory (same as daily spin)
      const invRef = dbRef(userPath(userId, 'xpBoostInventory'));
      const invSnap = await invRef.once('value');
      const inventory = invSnap.val() || [];
      inventory.push({
        multiplier: reward.xpMultiplier || 2,
        episodeCount: reward.xpEpisodeCount || 5,
        source: 'mystery_box',
        wonAt: Date.now(),
      });
      await invRef.set(inventory);
      break;
    }
  }
}
