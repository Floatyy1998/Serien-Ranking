/**
 * Crossover-Datenbank: einmal pro Sitzung laden, per Versionsstempel in IndexedDB
 * gecacht (nur ein winziger Read, solange sich nichts geändert hat).
 */
import { idbGetVersioned, idbSetVersioned } from '../catalog/catalogIDB';
import { dbGet, dbRef, dbUpdate, serverTimestamp } from '../db/ref';
import { compactEntry } from '../../lib/crossover/crossoverIndex';
import type { CrossoverEntry, CrossoverMap } from '../../types/Crossover';

const NODE = 'crossovers';
const VERSION_PATH = 'crossoversMeta/version';
const IDB_KEY = 'crossovers:all';

let memory: CrossoverMap | null = null;
let inflight: Promise<CrossoverMap> | null = null;
const listeners = new Set<(map: CrossoverMap) => void>();

const emit = () => {
  const snapshot = memory || {};
  listeners.forEach((fn) => fn(snapshot));
};

export const peekCrossovers = (): CrossoverMap | null => memory;

export function subscribeCrossovers(fn: (map: CrossoverMap) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export async function loadCrossovers(force = false): Promise<CrossoverMap> {
  if (memory && !force) return memory;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const version = (await dbGet<number>(VERSION_PATH)) ?? 0;
      if (!force) {
        const cached = await idbGetVersioned<CrossoverMap>(IDB_KEY, version);
        if (cached) {
          memory = cached;
          return cached;
        }
      }
      const data = (await dbGet<CrossoverMap>(NODE)) || {};
      memory = data;
      void idbSetVersioned(IDB_KEY, version, data);
      return data;
    } catch {
      return memory || {};
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function saveCrossover(id: string | null, entry: CrossoverEntry): Promise<string> {
  const key = id || dbRef(NODE).push().key || `c${Date.now()}`;
  const clean = compactEntry(entry);
  // Ungeprüfte Einträge sieht niemand ausser dem Admin-Tab — kein Grund, alle Caches zu leeren.
  const updates: Record<string, unknown> = { [`${NODE}/${key}`]: clean };
  if (clean.status !== 'pending') updates[VERSION_PATH] = serverTimestamp();
  await dbUpdate(updates);
  memory = { ...(memory || {}), [key]: clean };
  emit();
  return key;
}

export async function approveCrossover(id: string): Promise<void> {
  await dbUpdate({
    [`${NODE}/${id}/status`]: 'approved',
    [`${NODE}/${id}/updatedAt`]: Date.now(),
    [VERSION_PATH]: serverTimestamp(),
  });
}

export async function deleteCrossover(id: string): Promise<void> {
  await dbUpdate({ [`${NODE}/${id}`]: null, [VERSION_PATH]: serverTimestamp() });
  if (memory) {
    const next = { ...memory };
    delete next[id];
    memory = next;
  }
  emit();
}

/** Import vieler Einträge auf einmal (Admin-Seed) — ein Multi-Path-Update. */
export async function importCrossovers(entries: Record<string, CrossoverEntry>): Promise<number> {
  const updates: Record<string, unknown> = {};
  let count = 0;
  for (const [id, entry] of Object.entries(entries)) {
    updates[`${NODE}/${id}`] = compactEntry(entry);
    count++;
  }
  if (!count) return 0;
  updates[VERSION_PATH] = serverTimestamp();
  await dbUpdate(updates);
  memory = null;
  await loadCrossovers(true);
  emit();
  return count;
}

export function applyCrossoverSnapshot(map: CrossoverMap): void {
  memory = map;
  emit();
}
