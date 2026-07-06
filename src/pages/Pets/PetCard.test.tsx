// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { PetCard } from './PetCard';

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

vi.mock('../../components/pet', () => ({
  EvolvingPixelPet: () => <div data-testid="pet-canvas" />,
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
    ...overrides,
  };
}

const baseProps = {
  currentMood: 'happy' as Pet['mood'],
  hungerPercentage: 90,
  happinessPercentage: 90,
  experiencePercentage: 50,
  experienceNeeded: 300,
  isHealthy: true,
  xpBonusHint: 'Füttere dein Pet',
};

afterEach(() => cleanup());

describe('PetCard', () => {
  it('rendert Name, Level, Typ und das Pet-Canvas', () => {
    render(<PetCard pet={makePet()} {...baseProps} />);
    expect(screen.getByText('Rex')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
    expect(screen.getByText('Katze')).toBeInTheDocument();
    expect(screen.getByTestId('pet-canvas')).toBeInTheDocument();
  });

  it('zeigt den aktiven XP-Bonus wenn gesund', () => {
    render(<PetCard pet={makePet()} {...baseProps} isHealthy />);
    expect(screen.getByText('XP-Bonus aktiv: +50%')).toBeInTheDocument();
  });

  it('zeigt das Tot-Badge und keinen XP-Bonus wenn nicht lebendig', () => {
    render(<PetCard pet={makePet({ isAlive: false })} {...baseProps} isHealthy={false} />);
    expect(screen.getByText('Tot')).toBeInTheDocument();
    expect(screen.queryByText('XP-Bonus aktiv: +50%')).not.toBeInTheDocument();
    expect(screen.queryByText('XP-Bonus inaktiv')).not.toBeInTheDocument();
  });
});
