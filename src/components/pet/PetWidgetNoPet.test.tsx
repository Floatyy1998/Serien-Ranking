// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PetWidgetNoPet } from './PetWidgetNoPet';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      text: { primary: '#fff', secondary: '#eee' },
      background: { default: '#000', card: '#222' },
    },
  }),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('PetWidgetNoPet', () => {
  it('rendert den Call-to-Action', () => {
    render(<PetWidgetNoPet position={{ x: 10, y: 10 }} onNavigate={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText('Hol dir ein Pet!')).toBeInTheDocument();
    expect(screen.getByText('Tippe zum Starten')).toBeInTheDocument();
  });

  it('ruft onNavigate beim Klick auf das Widget', () => {
    const onNavigate = vi.fn();
    render(<PetWidgetNoPet position={{ x: 0, y: 0 }} onNavigate={onNavigate} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Hol dir ein Pet!'));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it('ruft onClose (und nicht onNavigate) beim Klick auf den Schließen-Button', () => {
    const onNavigate = vi.fn();
    const onClose = vi.fn();
    render(<PetWidgetNoPet position={{ x: 0, y: 0 }} onNavigate={onNavigate} onClose={onClose} />);
    fireEvent.click(screen.getByText('×'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
