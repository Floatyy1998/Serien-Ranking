// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { EvolvingPixelPet } from './EvolvingPixelPet';

function makeCtxMock(): CanvasRenderingContext2D {
  const grad = { addColorStop: () => {} };
  return new Proxy(
    {},
    {
      get: (_t, prop) => {
        if (prop === 'createLinearGradient' || prop === 'createRadialGradient') return () => grad;
        return () => undefined;
      },
      set: () => true,
    }
  ) as unknown as CanvasRenderingContext2D;
}

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'p1',
    userId: 'u1',
    name: 'Draco',
    type: 'cat',
    color: 'blau',
    level: 1,
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
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    writable: true,
    value: vi.fn(() => makeCtxMock()),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('EvolvingPixelPet', () => {
  it('rendert ein Canvas mit der übergebenen Größe', () => {
    const { container } = render(<EvolvingPixelPet pet={makePet()} size={128} animated={false} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute('width')).toBe('128');
    expect(canvas?.getAttribute('height')).toBe('128');
  });

  it('rendert ein hochstufiges Pet mit allen Effekt-Schichten ohne Fehler', () => {
    const { container } = render(
      <EvolvingPixelPet pet={makePet({ level: 100, type: 'dragon' })} size={128} animated={false} />
    );
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('rendert verschiedene Pet-Typen', () => {
    const types: Pet['type'][] = ['dog', 'bird', 'fox', 'rabbit', 'panda'];
    for (const type of types) {
      const { container, unmount } = render(
        <EvolvingPixelPet pet={makePet({ type, level: 25 })} size={96} animated={false} />
      );
      expect(container.querySelector('canvas')).not.toBeNull();
      unmount();
    }
  });
});
