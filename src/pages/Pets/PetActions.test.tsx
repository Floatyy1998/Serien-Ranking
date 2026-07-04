// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { PetActions } from './PetActions';

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

describe('PetActions', () => {
  it('rendert Füttern/Spielen und ruft die Handler auf wenn lebendig', () => {
    const onFeed = vi.fn();
    const onPlay = vi.fn();
    render(<PetActions pet={makePet()} onFeed={onFeed} onPlay={onPlay} onRevive={vi.fn()} />);
    fireEvent.click(screen.getByText('🍖 Füttern'));
    fireEvent.click(screen.getByText('🎮 Spielen'));
    expect(onFeed).toHaveBeenCalledTimes(1);
    expect(onPlay).toHaveBeenCalledTimes(1);
  });

  it('rendert den Wiederbeleben-Button und ruft onRevive auf wenn tot', () => {
    const onRevive = vi.fn();
    render(
      <PetActions
        pet={makePet({ isAlive: false })}
        onFeed={vi.fn()}
        onPlay={vi.fn()}
        onRevive={onRevive}
      />
    );
    expect(screen.queryByText('🍖 Füttern')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Wiederbeleben'));
    expect(onRevive).toHaveBeenCalledTimes(1);
  });
});
