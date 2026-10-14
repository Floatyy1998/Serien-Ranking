// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import { VolumeShelf } from './VolumeShelf';

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

  it('klappt lange Reihen zusammen', () => {
    render(<VolumeShelf current={1} total={110} currentTheme={theme} onChange={vi.fn()} />);
    expect(screen.getAllByRole('button', { name: /Band \d+/ })).toHaveLength(30);
    fireEvent.click(screen.getByText('Alle 110 Bände zeigen'));
    expect(screen.getAllByRole('button', { name: /Band \d+/ })).toHaveLength(110);
  });
});
