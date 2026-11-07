// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PetCreationModal } from './PetCreationModal';

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

vi.mock('../../hooks/ui/useBackNavigation', () => ({
  useBackNavigation: () => ({ goBack: vi.fn(), goHome: vi.fn(), homeLabel: 'Zur Startseite' }),
}));

vi.mock('../../components/pet', () => ({
  EvolvingPixelPet: () => <div data-testid="pet-canvas" />,
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const base = {
  petName: 'Rex',
  selectedType: 'cat' as const,
  onNameChange: vi.fn(),
  onTypeChange: vi.fn(),
  onCreatePet: vi.fn(),
};

describe('PetCreationModal', () => {
  it('rendert Titel, Gestalten und Submit', () => {
    render(<PetCreationModal {...base} />);
    expect(screen.getByText('Erschaffe dein Pet!')).toBeInTheDocument();
    expect(screen.getByText('Katze')).toBeInTheDocument();
    expect(screen.getByText('Drache')).toBeInTheDocument();
    expect(screen.getByText('Pet erschaffen!')).toBeInTheDocument();
  });

  it('ruft onNameChange und onTypeChange auf', () => {
    const onNameChange = vi.fn();
    const onTypeChange = vi.fn();
    render(<PetCreationModal {...base} onNameChange={onNameChange} onTypeChange={onTypeChange} />);
    fireEvent.change(screen.getByPlaceholderText('Pet Name...'), { target: { value: 'Milo' } });
    expect(onNameChange).toHaveBeenCalledWith('Milo');
    fireEvent.click(screen.getByText('Drache'));
    expect(onTypeChange).toHaveBeenCalledWith('dragon');
  });

  it('ruft onCreatePet nach der Schlüpf-Animation auf', async () => {
    vi.useFakeTimers();
    const onCreatePet = vi.fn();
    render(<PetCreationModal {...base} onCreatePet={onCreatePet} />);
    fireEvent.click(screen.getByText('Pet erschaffen!'));
    expect(screen.getByText('Rex ist geschlüpft!')).toBeInTheDocument();
    expect(onCreatePet).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });
    expect(onCreatePet).toHaveBeenCalledTimes(1);
  });

  it('erschafft ohne Namen nichts', () => {
    const onCreatePet = vi.fn();
    render(<PetCreationModal {...base} petName="  " onCreatePet={onCreatePet} />);
    expect(screen.getByText('Pet erschaffen!').closest('button')).toBeDisabled();
  });

  it('bietet Farbwahl und Zurück an', () => {
    const onColorChange = vi.fn();
    const onCancel = vi.fn();
    render(
      <PetCreationModal
        {...base}
        selectedColor="orange"
        onColorChange={onColorChange}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByLabelText('Farbe Lila'));
    expect(onColorChange).toHaveBeenCalledWith('lila');
    fireEvent.click(screen.getByLabelText('Zurück'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('führt ohne onCancel über den normalen Zurück-Button heraus', () => {
    render(<PetCreationModal {...base} />);
    expect(screen.getByLabelText('Zurück')).toBeInTheDocument();
  });
});
