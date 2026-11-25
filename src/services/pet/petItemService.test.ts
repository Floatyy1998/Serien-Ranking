import { beforeEach, describe, expect, it, vi } from 'vitest';

const fb = vi.hoisted(() => {
  const root: Record<string, unknown> = {};
  const seg = (p: string) => p.split('/').filter(Boolean);
  const getAt = (p: string): unknown => {
    let cur: unknown = root;
    for (const k of seg(p)) {
      if (cur == null || typeof cur !== 'object') return null;
      cur = (cur as Record<string, unknown>)[k];
    }
    return cur === undefined ? null : cur;
  };
  const setAt = (p: string, v: unknown) => {
    const ks = seg(p);
    let cur = root as Record<string, unknown>;
    for (let i = 0; i < ks.length - 1; i++) {
      if (typeof cur[ks[i]] !== 'object' || cur[ks[i]] === null) cur[ks[i]] = {};
      cur = cur[ks[i]] as Record<string, unknown>;
    }
    cur[ks[ks.length - 1]] = v;
  };
  const makeRef = (path: string) => ({
    async once() {
      return { val: () => getAt(path) };
    },
    async update(v: Record<string, unknown>) {
      setAt(path, { ...((getAt(path) as Record<string, unknown>) || {}), ...v });
    },
    async transaction(fn: (cur: unknown) => unknown) {
      const next = fn(getAt(path));
      if (next === undefined) return { committed: false };
      setAt(path, next);
      return { committed: true };
    },
  });
  return {
    getAt,
    setAt,
    makeRef,
    reset() {
      for (const k of Object.keys(root)) delete root[k];
    },
  };
});

vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: (p: string) => fb.makeRef(p) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

const getUserPets = vi.hoisted(() => vi.fn());
vi.mock('./petCore', () => ({ getUserPets }));

import { addPetItem, applyPetItem, getPetItems, takePetItem } from './petItemService';

const pets = () => [
  { id: 'p1', isAlive: true, hunger: 80, happiness: 20 },
  { id: 'p2', isAlive: true, hunger: 60, happiness: 40 },
  { id: 'p3', isAlive: false, hunger: 100, happiness: 0 },
];

beforeEach(() => {
  fb.reset();
  getUserPets.mockReset();
  getUserPets.mockResolvedValue(pets());
});

describe('Vorrat', () => {
  it('zählt hoch und runter und geht nie unter null', async () => {
    await addPetItem('u', 'treat');
    await addPetItem('u', 'treat', 2);
    expect((await getPetItems('u')).treat).toBe(3);

    expect(await takePetItem('u', 'treat')).toBe(true);
    expect((await getPetItems('u')).treat).toBe(2);
    expect(await takePetItem('u', 'elixir')).toBe(false);
    expect((await getPetItems('u')).elixir).toBe(0);
  });

  it('liest Unsinn in der Datenbank als leer', async () => {
    fb.setAt('users/u/petItems', { treat: -2, toy: 'x', feast: 1.9, unbekannt: 5 });
    expect(await getPetItems('u')).toEqual({
      treat: 0,
      toy: 0,
      feast: 1,
      extraSpin: 0,
      bonusBox: 0,
      streakPass: 0,
      elixir: 0,
    });
  });
});

describe('applyPetItem', () => {
  it('Leckerli macht nur das gewählte Pet satt', async () => {
    fb.setAt('users/u/petItems/treat', 1);
    const changed = await applyPetItem('u', 'treat', 'p1');
    expect(changed?.map((p) => p.id)).toEqual(['p1']);
    expect(fb.getAt('users/u/pets/p1')).toMatchObject({ hunger: 0 });
    expect((fb.getAt('users/u/pets/p1') as { happiness?: number }).happiness).toBeUndefined();
    expect(fb.getAt('users/u/pets/p2')).toBeNull();
    expect(fb.getAt('users/u/petItems/treat')).toBe(0);
  });

  it('Spielzeug hebt nur das Glück', async () => {
    fb.setAt('users/u/petItems/toy', 1);
    await applyPetItem('u', 'toy', 'p2');
    expect(fb.getAt('users/u/pets/p2')).toEqual({ happiness: 100 });
  });

  it('Festmahl wirkt auf alle lebenden Pets', async () => {
    fb.setAt('users/u/petItems/feast', 1);
    const changed = await applyPetItem('u', 'feast');
    expect(changed?.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(fb.getAt('users/u/pets/p1')).toMatchObject({ hunger: 0, happiness: 100 });
    expect(fb.getAt('users/u/pets/p3')).toBeNull();
  });

  it('verbraucht nichts, wenn das Pet tot ist oder der Vorrat leer', async () => {
    fb.setAt('users/u/petItems/treat', 1);
    expect(await applyPetItem('u', 'treat', 'p3')).toBeNull();
    expect(fb.getAt('users/u/petItems/treat')).toBe(1);

    expect(await applyPetItem('u', 'toy', 'p1')).toBeNull();
    expect(fb.getAt('users/u/pets/p1')).toBeNull();
  });
});
