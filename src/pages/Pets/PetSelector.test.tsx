// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { PetSelector } from './PetSelector';

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111' },
      border: { default: '#333' },
    },
  }),
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

afterEach(() => cleanup());

describe('PetSelector', () => {
  it('rendert nichts ohne Pets', () => {
    const { container } = render(
      <PetSelector
        pets={[]}
        selectedPetIndex={0}
        canAddNewPet={false}
        onSelectPet={vi.fn()}
        onOpenCreateModal={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('rendert die Pet-Namen und ruft onSelectPet beim Klick auf', () => {
    const onSelectPet = vi.fn();
    const pets = [
      makePet({ id: 'p1', name: 'Rex' }),
      makePet({ id: 'p2', name: 'Milo', level: 5 }),
    ];
    render(
      <PetSelector
        pets={pets}
        selectedPetIndex={0}
        canAddNewPet
        onSelectPet={onSelectPet}
        onOpenCreateModal={vi.fn()}
      />
    );
    expect(screen.getByText('Rex')).toBeInTheDocument();
    expect(screen.getByText('Milo')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Milo'));
    expect(onSelectPet).toHaveBeenCalledWith(1);
  });

  it('zeigt den Add-Button wenn erlaubt und ruft onOpenCreateModal auf', () => {
    const onOpenCreateModal = vi.fn();
    render(
      <PetSelector
        pets={[makePet()]}
        selectedPetIndex={0}
        canAddNewPet
        onSelectPet={vi.fn()}
        onOpenCreateModal={onOpenCreateModal}
      />
    );
    fireEvent.click(screen.getByText('+'));
    expect(onOpenCreateModal).toHaveBeenCalledTimes(1);
  });

  it('zeigt den Locked-Hinweis wenn kein neues Pet erlaubt ist', () => {
    render(
      <PetSelector
        pets={[makePet()]}
        selectedPetIndex={0}
        canAddNewPet={false}
        onSelectPet={vi.fn()}
        onOpenCreateModal={vi.fn()}
      />
    );
    expect(screen.getByText('Neues Pet ab Lv.15')).toBeInTheDocument();
  });
});
