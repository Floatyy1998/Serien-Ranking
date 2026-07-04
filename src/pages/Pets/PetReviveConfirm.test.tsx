// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { PetReviveConfirm } from './PetReviveConfirm';

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
    isAlive: false,
    ...overrides,
  };
}

afterEach(() => cleanup());

describe('PetReviveConfirm', () => {
  it('rendert nichts wenn show=false', () => {
    const { container } = render(
      <PetReviveConfirm pet={makePet()} show={false} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('zeigt die Level-Kosten ab Level 2 und ruft onConfirm auf', () => {
    const onConfirm = vi.fn();
    render(
      <PetReviveConfirm pet={makePet({ level: 3 })} show onClose={vi.fn()} onConfirm={onConfirm} />
    );
    expect(screen.getByText(/fällt von Level 3 auf Level 2/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Wiederbeleben (−1 Level)'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('zeigt keine Level-Kosten auf Level 1', () => {
    render(
      <PetReviveConfirm pet={makePet({ level: 1 })} show onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(screen.getByText('Rex kehrt frisch gestärkt zurück.')).toBeInTheDocument();
  });
});
