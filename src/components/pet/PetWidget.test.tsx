// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { PetWidget } from './PetWidget';

const authState = vi.hoisted(() => ({ user: { uid: 'u1' } as { uid: string } | null }));
vi.mock('../../AuthContext', () => ({
  useAuth: () => ({ user: authState.user }),
}));

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      text: { primary: '#fff', secondary: '#eee' },
      background: { default: '#000', surface: '#111', card: '#222' },
    },
  }),
}));

vi.mock('../../lib/toast', () => ({ showToast: vi.fn() }));

vi.mock('../../hooks/usePetReactions', () => ({
  usePetReactions: () => null,
  triggerPetReaction: vi.fn(),
}));

vi.mock('../../services/pet/petMoodService', () => ({
  petMoodService: { calculateCurrentMood: () => 'happy' },
}));

const petSvc = vi.hoisted(() => ({
  getPetWidgetPosition: vi.fn(),
  savePetWidgetPosition: vi.fn(),
  getActivePetId: vi.fn(),
  setActivePetId: vi.fn(),
  getUserPets: vi.fn(),
  getUserPet: vi.fn(),
  updatePetStatus: vi.fn(),
  updateAllPetsStatus: vi.fn(),
}));
vi.mock('../../services/petService', () => ({ petService: petSvc }));

// Kind-Komponenten (Canvas / MUI-Toast) durch schlanke Stubs ersetzen.
vi.mock('./EvolvingPixelPet', () => ({
  EvolvingPixelPet: () => <div data-testid="evolving-pet" />,
}));
vi.mock('./PetHungerToast', () => ({ PetHungerToast: () => null }));
vi.mock('./PetWidgetNoPet', () => ({
  PetWidgetNoPet: () => <div data-testid="no-pet" />,
}));

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'p1',
    userId: 'u1',
    name: 'Rex',
    type: 'cat',
    color: 'blau',
    level: 3,
    experience: 0,
    hunger: 10,
    happiness: 90,
    lastFed: new Date(),
    episodesWatched: 0,
    createdAt: new Date(),
    isAlive: true,
    ...overrides,
  };
}

beforeEach(() => {
  authState.user = { uid: 'u1' };
  navigate.mockReset();
  petSvc.getPetWidgetPosition.mockResolvedValue(null);
  petSvc.savePetWidgetPosition.mockResolvedValue(undefined);
  petSvc.getActivePetId.mockResolvedValue('p1');
  petSvc.setActivePetId.mockResolvedValue(undefined);
  petSvc.getUserPets.mockResolvedValue([]);
  petSvc.getUserPet.mockResolvedValue(makePet());
  petSvc.updatePetStatus.mockResolvedValue(makePet());
  petSvc.updateAllPetsStatus.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PetWidget', () => {
  it('rendert nichts ohne eingeloggten User', () => {
    authState.user = null;
    const { container } = render(<PetWidget />);
    expect(container.firstChild).toBeNull();
  });

  it('rendert das aktive Pet nach dem Laden', async () => {
    render(<PetWidget />);
    await waitFor(() => expect(screen.getByTestId('evolving-pet')).toBeInTheDocument());
  });

  it('rendert den No-Pet-Zustand wenn kein Pet existiert', async () => {
    petSvc.getActivePetId.mockResolvedValue(null);
    petSvc.getUserPets.mockResolvedValue([]);
    render(<PetWidget />);
    await waitFor(() => expect(screen.getByTestId('no-pet')).toBeInTheDocument());
  });
});
