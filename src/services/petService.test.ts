import { describe, expect, it, vi } from 'vitest';

// pet/* referenziert firebase nur innerhalb von Funktionen — leerer Compat-Mock
// reicht für den Fassaden-Import.
vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: () => ({}) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

import { petService } from './petService';

describe('petService (Re-Export-Fassade)', () => {
  it('exportiert ein petService-Objekt', () => {
    expect(petService).toBeDefined();
    expect(typeof petService).toBe('object');
  });

  it('bündelt die zentralen Pet-Operationen als Funktionen', () => {
    const svc = petService as unknown as Record<string, unknown>;
    for (const key of ['getUserPets', 'createPet', 'feedPet', 'playWithPet']) {
      expect(typeof svc[key], key).toBe('function');
    }
  });
});
