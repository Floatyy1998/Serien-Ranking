// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { PetReleaseConfirm } from './PetReleaseConfirm';

vi.mock('../../contexts/ThemeContext', () => ({
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

describe('PetReleaseConfirm', () => {
  it('rendert nichts wenn show=false', () => {
    const { container } = render(
      <PetReleaseConfirm pet={makePet()} show={false} onClose={vi.fn()} onConfirm={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('rendert den Dialog und ruft die Handler auf', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    render(<PetReleaseConfirm pet={makePet()} show onClose={onClose} onConfirm={onConfirm} />);
    expect(screen.getByText('Rex zur Adoption freigeben?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Behalten'));
    fireEvent.click(screen.getByText('Freigeben'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
