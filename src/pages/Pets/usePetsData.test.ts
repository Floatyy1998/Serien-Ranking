// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';

type ValueCb = (snap: { val: () => unknown }) => void;

const fb = vi.hoisted(() => {
  const state = { listeners: [] as ValueCb[] };
  const ref = vi.fn(() => ({
    on: (_e: string, cb: ValueCb) => {
      state.listeners.push(cb);
      return cb;
    },
    off: () => {},
  }));
  const database = Object.assign(() => ({ ref }), {});
  return { state, ref, database };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const authState = vi.hoisted(() => ({ user: null as { uid: string } | null }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: authState.user }) }));

const svc = vi.hoisted(() => ({
  updateAllPetsStatus: vi.fn<(uid: string) => Promise<Pet[]>>(),
  getActivePetId: vi.fn<(uid: string) => Promise<string | null>>(),
  canCreateNewPet: vi.fn<(uid: string) => Promise<boolean>>(),
  createPet: vi.fn<(uid: string, name: string, type: Pet['type']) => Promise<Pet>>(),
  feedPet: vi.fn<(uid: string, id: string) => Promise<Pet | null>>(),
  playWithPet: vi.fn<(uid: string, id: string) => Promise<Pet | null>>(),
  revivePet: vi.fn<(uid: string, id: string) => Promise<Pet | null>>(),
  deletePet: vi.fn<(uid: string, id: string) => Promise<void>>(),
  setActivePetId: vi.fn<(uid: string, id: string) => Promise<void>>(),
  changePetColor: vi.fn<(uid: string, id: string, c: string) => Promise<Pet | null>>(),
  toggleAccessory: vi.fn<(uid: string, id: string, a: string) => Promise<Pet | null>>(),
  equipBackground: vi.fn<(uid: string, id: string, b: string | null) => Promise<Pet | null>>(),
}));
vi.mock('../../services/petService', () => ({ petService: svc }));

vi.mock('../../services/pet/petMoodService', () => ({
  petMoodService: { calculateCurrentMood: () => 'happy' },
}));

import { usePetsData } from './usePetsData';

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'p1',
    name: 'Fluffy',
    type: 'cat',
    color: '#fff',
    hunger: 20,
    happiness: 80,
    level: 2,
    experience: 50,
    episodesWatched: 10,
    isAlive: true,
    accessories: [],
    ...overrides,
  } as unknown as Pet;
}

beforeEach(() => {
  fb.state.listeners = [];
  fb.ref.mockClear();
  authState.user = { uid: 'u1' };
  for (const fn of Object.values(svc)) fn.mockReset();
  svc.updateAllPetsStatus.mockResolvedValue([makePet()]);
  svc.getActivePetId.mockResolvedValue('p1');
  svc.canCreateNewPet.mockResolvedValue(true);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('usePetsData – load', () => {
  it('lädt Pets und berechnet abgeleitete Werte', async () => {
    const { result } = renderHook(() => usePetsData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.pets).toHaveLength(1);
    expect(result.current.pet?.id).toBe('p1');
    expect(result.current.hungerPercentage).toBe(80); // 100 - hunger(20)
    expect(result.current.happinessPercentage).toBe(80);
    expect(result.current.experienceNeeded).toBe(200); // level 2 * 100
    expect(result.current.experiencePercentage).toBe(25); // 50/200 * 100
    expect(result.current.isHealthy).toBe(true);
    expect(result.current.currentMood).toBe('happy');
    expect(result.current.canAddNewPet).toBe(true);
  });

  it('öffnet das Erstell-Modal wenn keine Pets existieren', async () => {
    svc.updateAllPetsStatus.mockResolvedValue([]);
    const { result } = renderHook(() => usePetsData());
    await waitFor(() => expect(result.current.showCreateModal).toBe(true));
    expect(result.current.pet).toBeNull();
  });
});

describe('usePetsData – actions', () => {
  it('createPet fügt ein neues Pet hinzu', async () => {
    svc.updateAllPetsStatus
      .mockResolvedValueOnce([makePet()])
      .mockResolvedValue([makePet(), makePet({ id: 'p2', name: 'Rex' })]);
    svc.createPet.mockResolvedValue(makePet({ id: 'p2', name: 'Rex' }));
    const { result } = renderHook(() => usePetsData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    act(() => result.current.setPetName('Rex'));
    await act(async () => {
      await result.current.createPet();
    });
    expect(svc.createPet).toHaveBeenCalledWith('u1', 'Rex', 'cat');
    await waitFor(() => expect(result.current.pets.some((p) => p.id === 'p2')).toBe(true));
    expect(result.current.showCreateModal).toBe(false);
  });

  it('feedPet ersetzt das aktualisierte Pet', async () => {
    svc.feedPet.mockResolvedValue(makePet({ id: 'p1', hunger: 0 }));
    const { result } = renderHook(() => usePetsData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.feedPet();
    });
    expect(svc.feedPet).toHaveBeenCalledWith('u1', 'p1');
    expect(result.current.pet?.hunger).toBe(0);
  });

  it('releasePet löscht das Pet und öffnet das Modal wenn keins übrig ist', async () => {
    svc.deletePet.mockResolvedValue(undefined);
    const { result } = renderHook(() => usePetsData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.releasePet();
    });
    expect(svc.deletePet).toHaveBeenCalledWith('u1', 'p1');
    expect(result.current.pets).toHaveLength(0);
    expect(result.current.showCreateModal).toBe(true);
  });

  it('selectPet persistiert das aktive Pet', async () => {
    svc.updateAllPetsStatus.mockResolvedValue([makePet({ id: 'p1' }), makePet({ id: 'p2' })]);
    svc.getActivePetId.mockResolvedValue('p1');
    const { result } = renderHook(() => usePetsData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.selectPet(1);
    });
    expect(svc.setActivePetId).toHaveBeenCalledWith('u1', 'p2');
  });

  it('registriert einen Realtime-Listener auf den Pets-Node', async () => {
    const { result } = renderHook(() => usePetsData());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fb.ref).toHaveBeenCalledWith('users/u1/pets');
    expect(fb.state.listeners.length).toBeGreaterThan(0);
  });
});
