import { dbRef, userPath } from '../db/ref';
import {
  readPetItems,
  type PetItemCounts,
  type PetItemId,
} from '../../components/pet/data/petItems';
import type { Pet } from '../../types/pet.types';
import { getUserPets } from './petCore';

const itemRef = (userId: string, id: PetItemId) => dbRef(userPath(userId, 'petItems', id));

export async function getPetItems(userId: string): Promise<PetItemCounts> {
  const snap = await dbRef(userPath(userId, 'petItems')).once('value');
  return readPetItems(snap.val());
}

export async function addPetItem(userId: string, id: PetItemId, amount = 1): Promise<void> {
  await itemRef(userId, id).transaction((current: number | null) => (current || 0) + amount);
}

/** Nimmt ein Stück aus dem Vorrat; false, wenn keines da ist (auch bei gleichzeitigem Einlösen). */
export async function takePetItem(userId: string, id: PetItemId): Promise<boolean> {
  const result = await itemRef(userId, id).transaction((current: number | null) =>
    current && current > 0 ? current - 1 : undefined
  );
  return result.committed;
}

/**
 * Leckerli, Spielzeug und Festmahl einlösen — jedes wirkt auf alle lebenden Pets. Liefert die
 * geänderten Pets oder null, wenn nichts eingelöst wurde: ein Vorrat wird nie verbraucht, ohne
 * zu wirken.
 */
export async function applyPetItem(
  userId: string,
  id: 'treat' | 'toy' | 'feast'
): Promise<Pet[] | null> {
  const targets = (await getUserPets(userId)).filter((p) => p.isAlive);
  if (targets.length === 0) return null;
  if (!(await takePetItem(userId, id))) return null;

  const now = new Date();
  for (const pet of targets) {
    const updates: Record<string, string | number> = {};
    if (id !== 'toy') {
      pet.hunger = 0;
      pet.lastFed = now;
      updates.hunger = 0;
      updates.lastFed = now.toISOString();
    }
    if (id !== 'treat') {
      pet.happiness = 100;
      updates.happiness = 100;
    }
    await dbRef(userPath(userId, 'pets', pet.id)).update(updates);
  }
  return targets;
}
