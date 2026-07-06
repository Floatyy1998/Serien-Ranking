// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BottomSheet } from './BottomSheet';

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

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      background: { surface: '#111', default: '#000' },
    },
  }),
}));

afterEach(() => cleanup());

describe('BottomSheet', () => {
  it('renders nothing when closed', () => {
    render(
      <BottomSheet isOpen={false} onClose={vi.fn()}>
        <p>Inhalt</p>
      </BottomSheet>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders its children in a dialog when open', () => {
    render(
      <BottomSheet isOpen onClose={vi.fn()} ariaLabel="Menü">
        <p>Inhalt</p>
      </BottomSheet>
    );
    const dialog = screen.getByRole('dialog', { name: 'Menü' });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Inhalt')).toBeInTheDocument();
  });

  it('closes when the Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen onClose={onClose}>
        <p>Inhalt</p>
      </BottomSheet>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop overlay is clicked', () => {
    const onClose = vi.fn();
    render(
      <BottomSheet isOpen onClose={onClose}>
        <p>Inhalt</p>
      </BottomSheet>
    );
    const overlay = screen.getByRole('dialog').parentElement as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
