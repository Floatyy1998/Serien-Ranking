// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { useTheme } from '../../contexts/ThemeContext';
import { ColorEditor, type ColorCategory } from './ColorEditor';

const currentTheme = {
  primary: '#3355ff',
  accent: '#22d3ee',
  background: { default: '#000000', surface: '#111111' },
  text: { primary: '#ffffff', secondary: '#eeeeee', muted: '#888888' },
  border: { default: '#333333' },
  status: { success: '#4cd137', error: '#e74c3c', warning: '#f5a623' },
} as unknown as ReturnType<typeof useTheme>['currentTheme'];

const category: ColorCategory = {
  key: 'primaryColor',
  name: 'Primär',
  icon: <span>icon</span>,
  description: 'Hauptfarbe für Buttons',
};

afterEach(() => cleanup());

describe('ColorEditor', () => {
  it('renders the category name and description', () => {
    render(
      <ColorEditor
        category={category}
        color="#3355ff"
        currentTheme={currentTheme}
        onColorChange={vi.fn()}
      />
    );
    expect(screen.getByText('Primär')).toBeInTheDocument();
    expect(screen.getByText('Hauptfarbe für Buttons')).toBeInTheDocument();
  });

  it('calls onColorChange when a valid hex is typed', () => {
    const onColorChange = vi.fn<(k: string, v: string) => void>();
    render(
      <ColorEditor
        category={category}
        color="#3355ff"
        currentTheme={currentTheme}
        onColorChange={onColorChange}
      />
    );
    fireEvent.change(screen.getByLabelText('Primär – Hex-Wert'), {
      target: { value: '#00ff00' },
    });
    expect(onColorChange).toHaveBeenCalledWith('primaryColor', '#00ff00');
  });

  it('does not call onColorChange for an invalid hex', () => {
    const onColorChange = vi.fn<(k: string, v: string) => void>();
    render(
      <ColorEditor
        category={category}
        color="#3355ff"
        currentTheme={currentTheme}
        onColorChange={onColorChange}
      />
    );
    fireEvent.change(screen.getByLabelText('Primär – Hex-Wert'), {
      target: { value: '#zzz' },
    });
    expect(onColorChange).not.toHaveBeenCalled();
  });

  it('calls onColorChange from the color picker input', () => {
    const onColorChange = vi.fn<(k: string, v: string) => void>();
    render(
      <ColorEditor
        category={category}
        color="#3355ff"
        currentTheme={currentTheme}
        onColorChange={onColorChange}
      />
    );
    fireEvent.change(screen.getByLabelText('Primär – Farbe wählen'), {
      target: { value: '#123456' },
    });
    expect(onColorChange).toHaveBeenCalledWith('primaryColor', '#123456');
  });
});
