// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import { VolumeShelf, type VolumeOwnership } from './VolumeShelf';

const theme = {
  primary: '#00d123',
  text: { secondary: '#aaa', muted: '#777' },
} as unknown as ThemeContextType['currentTheme'];

afterEach(() => cleanup());

describe('VolumeShelf', () => {
  it('hakt beim Antippen alle Bände bis dorthin ab', () => {
    const onChange = vi.fn();
    render(<VolumeShelf current={2} total={16} currentTheme={theme} onChange={onChange} />);
    expect(screen.getByText('2 von 16 gelesen')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(2);
    fireEvent.click(screen.getByLabelText('Bis Band 5 als gelesen markieren'));
    expect(onChange).toHaveBeenCalledWith(5);
  });

  it('fragt nach, bevor gelesene Bände wieder ungelesen werden', () => {
    const onChange = vi.fn();
    render(<VolumeShelf current={4} total={16} currentTheme={theme} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Band 2 als ungelesen markieren'));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText('Ab Band 2 als ungelesen markieren?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ja'));
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('zeigt ohne bekannte Bandzahl die gelesenen und den nächsten Band', () => {
    render(<VolumeShelf current={3} total={0} currentTheme={theme} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: /Band \d+/ })).toHaveLength(4);
  });

  const ownership = (over: Partial<VolumeOwnership> = {}): VolumeOwnership => ({
    all: false,
    volumes: [],
    onToggle: vi.fn(),
    onAll: vi.fn(),
    ...over,
  });

  it('stellt im Besitz-Modus einzelne Bände ins Regal', () => {
    const onChange = vi.fn();
    const own = ownership({ volumes: [2] });
    render(
      <VolumeShelf
        current={4}
        total={16}
        currentTheme={theme}
        onChange={onChange}
        ownership={own}
        mode="own"
      />
    );
    expect(screen.getByText('1 von 16 im Besitz')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Band 7 als Besitz markieren'));
    fireEvent.click(screen.getByLabelText('Band 2 aus dem Besitz entfernen'));
    expect(own.onToggle).toHaveBeenNthCalledWith(1, 7, 16);
    expect(own.onToggle).toHaveBeenNthCalledWith(2, 2, 16);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('wechselt zwischen Gelesen und Im Besitz', () => {
    const onModeChange = vi.fn();
    render(
      <VolumeShelf
        current={4}
        total={16}
        currentTheme={theme}
        onChange={vi.fn()}
        ownership={ownership()}
        onModeChange={onModeChange}
      />
    );
    expect(screen.getByText('4 von 16 gelesen')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Im Besitz' }));
    expect(onModeChange).toHaveBeenCalledWith('own');
  });

  it('zeigt Kapitel-Lesern nur den Besitz und lässt Bände hinter der Kürzung sichtbar', () => {
    const own = ownership({ volumes: [113] });
    render(<VolumeShelf current={0} total={113} currentTheme={theme} ownership={own} />);
    expect(screen.queryByRole('button', { name: 'Gelesen' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Band \d+/ })).toHaveLength(31);
    fireEvent.click(screen.getByLabelText('Band 113 aus dem Besitz entfernen'));
    expect(own.onToggle).toHaveBeenCalledWith(113, 113);
  });

  it('fragt nach, bevor die ganze Reihe aus dem Regal fliegt', () => {
    const own = ownership({ all: true });
    render(<VolumeShelf current={0} total={3} currentTheme={theme} ownership={own} />);
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(3);
    fireEvent.click(screen.getByText('Alle entfernen'));
    expect(own.onAll).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Ja'));
    expect(own.onAll).toHaveBeenCalledWith(false);
  });

  it('klappt lange Reihen zusammen', () => {
    render(<VolumeShelf current={1} total={110} currentTheme={theme} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: /Band \d+/ })).toHaveLength(30);
    fireEvent.click(screen.getByText('Alle 110 Bände zeigen'));
    expect(screen.getAllByRole('button', { name: /Band \d+/ })).toHaveLength(110);
  });
});
