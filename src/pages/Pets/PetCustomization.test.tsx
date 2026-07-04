// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { PetCustomization } from './PetCustomization';

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
    accessories: [],
    unlockedBackgrounds: [],
    ...overrides,
  };
}

afterEach(() => cleanup());

describe('PetCustomization', () => {
  it('rendert die drei Tabs und ein Farb-Grid', () => {
    const { container } = render(
      <PetCustomization
        pet={makePet()}
        activeColorBorder={null}
        onChangeColor={vi.fn()}
        onToggleAccessory={vi.fn()}
        onEquipBackground={vi.fn()}
      />
    );
    expect(screen.getByText('Farben')).toBeInTheDocument();
    expect(screen.getByText('Accessoires')).toBeInTheDocument();
    expect(screen.getByText('Hintergründe')).toBeInTheDocument();
    expect(container.querySelectorAll('.pet-color-btn').length).toBeGreaterThan(0);
  });

  it('ruft onChangeColor beim Klick auf eine Farbe auf', () => {
    const onChangeColor = vi.fn();
    const { container } = render(
      <PetCustomization
        pet={makePet()}
        activeColorBorder={null}
        onChangeColor={onChangeColor}
        onToggleAccessory={vi.fn()}
        onEquipBackground={vi.fn()}
      />
    );
    const colorBtn = container.querySelector('.pet-color-btn');
    expect(colorBtn).not.toBeNull();
    fireEvent.click(colorBtn as Element);
    expect(onChangeColor).toHaveBeenCalledWith('rot');
  });

  it('wechselt den aktiven Tab beim Klick auf Accessoires', () => {
    render(
      <PetCustomization
        pet={makePet()}
        activeColorBorder={null}
        onChangeColor={vi.fn()}
        onToggleAccessory={vi.fn()}
        onEquipBackground={vi.fn()}
      />
    );
    const colorsTab = screen.getByRole('tab', { name: /Farben/ });
    const accessoriesTab = screen.getByRole('tab', { name: /Accessoires/ });
    expect(colorsTab).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(accessoriesTab);
    expect(accessoriesTab).toHaveAttribute('aria-selected', 'true');
    expect(colorsTab).toHaveAttribute('aria-selected', 'false');
  });
});
