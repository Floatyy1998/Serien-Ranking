// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { PetsPage } from './PetsPage';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111', card: '#222' },
      border: { default: '#333' },
      status: { error: '#f00' },
    },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/pets' }),
}));

vi.mock('../../components/pet', () => ({
  EvolvingPixelPet: () => <div data-testid="pet-canvas" />,
}));

vi.mock('./XpBoostHeaderButton', () => ({
  XpBoostHeaderButton: () => <div data-testid="xp-boost" />,
}));

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'p1',
    userId: 'u1',
    name: 'Rex',
    type: 'cat',
    color: 'blau',
    level: 3,
    experience: 50,
    hunger: 10,
    happiness: 90,
    lastFed: new Date(),
    episodesWatched: 0,
    createdAt: new Date(),
    isAlive: true,
    accessories: [],
    unlockedBackgrounds: [],
    ...overrides,
  };
}

function baseData() {
  const pet = makePet();
  return {
    pets: [pet],
    pet: pet as Pet | null,
    selectedPetIndex: 0,
    canAddNewPet: false,
    isLoading: false,
    showCreateModal: false,
    petName: '',
    selectedType: 'cat' as Pet['type'],
    activeColorBorder: null as string | null,
    showReleaseConfirm: false,
    showReviveConfirm: false,
    currentMood: 'happy' as Pet['mood'],
    hungerPercentage: 90,
    happinessPercentage: 90,
    experienceNeeded: 300,
    experiencePercentage: 50,
    isHealthy: true,
    xpBonusHint: 'Füttere dein Pet',
    setPetName: vi.fn(),
    setSelectedType: vi.fn(),
    createPet: vi.fn(),
    feedPet: vi.fn(),
    playWithPet: vi.fn(),
    revivePet: vi.fn(),
    releasePet: vi.fn(),
    changeColor: vi.fn(),
    toggleAccessory: vi.fn(),
    equipBackground: vi.fn(),
    selectPet: vi.fn(),
    openCreateModal: vi.fn(),
    openReleaseConfirm: vi.fn(),
    closeReleaseConfirm: vi.fn(),
    openReviveConfirm: vi.fn(),
    closeReviveConfirm: vi.fn(),
  };
}

const data = vi.hoisted(() => ({ value: null as ReturnType<typeof baseData> | null }));
vi.mock('./usePetsData', () => ({
  usePetsData: () => data.value,
}));

beforeEach(() => {
  data.value = baseData();
});
afterEach(() => cleanup());

describe('PetsPage', () => {
  it('rendert den Loading-State', () => {
    data.value = { ...baseData(), isLoading: true };
    const { container } = render(<PetsPage />);
    expect(container.querySelector('.pet-loading')).not.toBeNull();
  });

  it('rendert das Erstellungs-Modal', () => {
    data.value = { ...baseData(), showCreateModal: true };
    render(<PetsPage />);
    expect(screen.getByText('Erschaffe dein Pet!')).toBeInTheDocument();
  });

  it('rendert die Pet-Seite mit Header und Pet-Namen', () => {
    render(<PetsPage />);
    expect(screen.getByText('Meine Pets')).toBeInTheDocument();
    expect(screen.getAllByText('Rex').length).toBeGreaterThan(0);
    expect(screen.getByTestId('pet-canvas')).toBeInTheDocument();
    expect(screen.getByText('Zur Adoption freigeben')).toBeInTheDocument();
  });

  it('rendert nichts wenn kein Pet vorhanden ist', () => {
    data.value = { ...baseData(), pet: null, pets: [] };
    const { container } = render(<PetsPage />);
    expect(container.firstChild).toBeNull();
  });
});
