// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pet } from '../../types/pet.types';
import { PetCustomization } from './PetCustomization';

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

vi.mock('../../hooks/pet/useActiveSeason', () => ({ useActiveSeason: () => null }));

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
  it('rendert die drei Tabs und nach dem Wechsel ein Farb-Grid', async () => {
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
    fireEvent.click(screen.getByRole('tab', { name: /Farben/ }));
    await waitFor(() =>
      expect(container.querySelectorAll('.pet-color-btn').length).toBeGreaterThan(0)
    );
  });

  it('ruft onChangeColor beim Klick auf eine Farbe auf', async () => {
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
    fireEvent.click(screen.getByRole('tab', { name: /Farben/ }));
    const colorBtn = await waitFor(() => {
      const btn = container.querySelector('.pet-color-btn');
      expect(btn).not.toBeNull();
      return btn;
    });
    fireEvent.click(colorBtn as Element);
    expect(onChangeColor).toHaveBeenCalledWith('rot');
  });

  it('startet bei den Accessoires und wechselt zu den Farben', () => {
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
    expect(accessoriesTab).toHaveAttribute('aria-selected', 'true');
    fireEvent.click(colorsTab);
    expect(colorsTab).toHaveAttribute('aria-selected', 'true');
    expect(accessoriesTab).toHaveAttribute('aria-selected', 'false');
  });

  it('zeigt die drei Plätze mit dem getragenen Teil und legt es per X ab', () => {
    const onToggle = vi.fn(() => true);
    render(
      <PetCustomization
        pet={makePet({
          level: 12,
          accessories: [
            { id: 'beanie', type: 'head', name: 'Mütze', icon: '', equipped: true },
            { id: 'bow', type: 'neck', name: 'Schleife', icon: '', equipped: false },
          ],
        })}
        activeColorBorder={null}
        onChangeColor={vi.fn()}
        onToggleAccessory={onToggle}
        onEquipBackground={vi.fn()}
      />
    );
    expect(screen.getByRole('tab', { name: /Kopf/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /Gesicht/ })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Körper/ })).toBeInTheDocument();
    expect(screen.getByText('1 von 2 getragen')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mütze ablegen' }));
    expect(onToggle).toHaveBeenCalledWith('beanie');
  });

  it('erklärt, warum kein weiteres Teil passt', () => {
    render(
      <PetCustomization
        pet={makePet({
          level: 12,
          accessories: [
            { id: 'beanie', type: 'head', name: 'Mütze', icon: '', equipped: true },
            { id: 'roundGlasses', type: 'face', name: 'Brille', icon: '', equipped: true },
            { id: 'bow', type: 'neck', name: 'Schleife', icon: '', equipped: false },
          ],
        })}
        activeColorBorder={null}
        onChangeColor={vi.fn()}
        onToggleAccessory={() => false}
        onEquipBackground={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('tab', { name: /Körper/ }));
    fireEvent.click(screen.getByRole('button', { name: /Schleife/ }));
    expect(screen.getByRole('status')).toHaveTextContent('Ab Lv 30');
  });
});
