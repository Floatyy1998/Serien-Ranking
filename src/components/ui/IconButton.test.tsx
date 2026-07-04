// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IconButton } from './IconButton';

if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      background: { surface: '#111', default: '#000' },
      text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
      border: { default: '#333' },
    },
  }),
}));

afterEach(() => cleanup());

describe('IconButton', () => {
  it('renders with an accessible label', () => {
    render(<IconButton icon={<span>x</span>} onClick={vi.fn()} ariaLabel="Aktion" />);
    expect(screen.getByRole('button', { name: 'Aktion' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn<(e: React.MouseEvent) => void>();
    render(<IconButton icon={<span>x</span>} onClick={onClick} ariaLabel="Klick" />);
    fireEvent.click(screen.getByRole('button', { name: 'Klick' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('wraps in a tooltip but keeps the button reachable', () => {
    render(<IconButton icon={<span>x</span>} onClick={vi.fn()} tooltip="Info" />);
    // tooltip falls back to aria-label
    expect(screen.getByRole('button', { name: 'Info' })).toBeInTheDocument();
  });
});
