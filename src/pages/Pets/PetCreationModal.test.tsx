// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PetCreationModal } from './PetCreationModal';

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

afterEach(() => cleanup());

describe('PetCreationModal', () => {
  it('rendert Titel, Typ-Buttons und Submit', () => {
    render(
      <PetCreationModal
        petName="Rex"
        selectedType="cat"
        onNameChange={vi.fn()}
        onTypeChange={vi.fn()}
        onCreatePet={vi.fn()}
      />
    );
    expect(screen.getByText('Erschaffe dein Pet!')).toBeInTheDocument();
    expect(screen.getByText('Katze')).toBeInTheDocument();
    expect(screen.getByText('Drache')).toBeInTheDocument();
    expect(screen.getByText('Pet erschaffen!')).toBeInTheDocument();
  });

  it('ruft onNameChange und onTypeChange auf', () => {
    const onNameChange = vi.fn();
    const onTypeChange = vi.fn();
    render(
      <PetCreationModal
        petName="Rex"
        selectedType="cat"
        onNameChange={onNameChange}
        onTypeChange={onTypeChange}
        onCreatePet={vi.fn()}
      />
    );
    fireEvent.change(screen.getByPlaceholderText('Pet Name...'), { target: { value: 'Milo' } });
    expect(onNameChange).toHaveBeenCalledWith('Milo');
    fireEvent.click(screen.getByText('Drache'));
    expect(onTypeChange).toHaveBeenCalledWith('dragon');
  });

  it('ruft onCreatePet auf wenn ein Name gesetzt ist', () => {
    const onCreatePet = vi.fn();
    render(
      <PetCreationModal
        petName="Rex"
        selectedType="cat"
        onNameChange={vi.fn()}
        onTypeChange={vi.fn()}
        onCreatePet={onCreatePet}
      />
    );
    fireEvent.click(screen.getByText('Pet erschaffen!'));
    expect(onCreatePet).toHaveBeenCalledTimes(1);
  });
});
