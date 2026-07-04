// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { PixelPet } from './PixelPet';

/** No-op 2D context: jsdom returns null for getContext, so we supply a proxy
 *  where every method is a no-op and gradient factories return a stub. */
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
    name: 'Rex',
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

describe('PixelPet', () => {
  it('rendert ein Canvas mit der übergebenen Größe', () => {
    const { container } = render(<PixelPet pet={makePet()} size={48} animated={false} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas?.getAttribute('width')).toBe('48');
    expect(canvas?.getAttribute('height')).toBe('48');
  });

  it('rendert alle Pet-Typen ohne Fehler', () => {
    const types: Pet['type'][] = ['cat', 'dog', 'bird', 'dragon', 'fox', 'rabbit', 'panda'];
    for (const type of types) {
      const { container, unmount } = render(
        <PixelPet pet={makePet({ type })} size={32} animated={false} />
      );
      expect(container.querySelector('canvas')).not.toBeNull();
      unmount();
    }
  });

  it('rendert auch bei niedriger Happiness und hohem Hunger (Mood-Indikatoren)', () => {
    const { container } = render(
      <PixelPet pet={makePet({ happiness: 10, hunger: 90 })} size={64} animated={false} />
    );
    expect(container.querySelector('canvas')).not.toBeNull();
  });

  it('startet die Animationsschleife wenn animated=true', () => {
    const raf = vi.spyOn(window, 'requestAnimationFrame');
    render(<PixelPet pet={makePet()} size={64} animated />);
    expect(raf).toHaveBeenCalled();
  });
});
