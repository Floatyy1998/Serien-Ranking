// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MysteryBoxOverlay } from './MysteryBoxOverlay';

const authState = vi.hoisted(() => ({ user: { uid: 'u1' } as { uid: string } | null }));
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: authState.user }),
}));

const openMysteryBox = vi.hoisted(() => vi.fn());
vi.mock('../../services/pet/mysteryBoxService', () => ({
  openMysteryBox,
}));

beforeEach(() => {
  authState.user = { uid: 'u1' };
  openMysteryBox.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('MysteryBoxOverlay', () => {
  it('rendert den geschlossenen Zustand mit Öffnen-Button', () => {
    render(<MysteryBoxOverlay totalEpisodes={40} onClose={vi.fn()} />);
    expect(screen.getByText('Mystery Box')).toBeInTheDocument();
    expect(screen.getByText('Öffnen!')).toBeInTheDocument();
  });

  it('ruft onClose beim Klick auf den Schließen-Button', () => {
    const onClose = vi.fn();
    render(<MysteryBoxOverlay totalEpisodes={40} onClose={onClose} />);
    // Erster Button ist der Close-Button (X oben rechts).
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('startet das Öffnen nicht ohne eingeloggten User', () => {
    authState.user = null;
    render(<MysteryBoxOverlay totalEpisodes={40} onClose={vi.fn()} />);
    fireEvent.click(screen.getByText('Öffnen!'));
    expect(openMysteryBox).not.toHaveBeenCalled();
  });
});
