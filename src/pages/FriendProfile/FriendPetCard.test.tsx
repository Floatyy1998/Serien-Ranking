// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { Pet } from '../../types/pet.types';

const { authValue, sendGiftMock, canSendMock } = vi.hoisted(() => ({
  authValue: { user: { uid: 'me', displayName: 'Konrad' } },
  sendGiftMock: vi.fn<() => Promise<void>>(() => Promise.resolve()),
  canSendMock: vi.fn<() => { allowed: boolean; nextAvailableAt?: number }>(() => ({
    allowed: true,
  })),
}));

vi.mock('../../AuthContext', () => ({ useAuth: () => authValue }));
vi.mock('../../components/pet', () => ({
  EvolvingPixelPet: () => <div data-testid="pet-sprite" />,
}));
vi.mock('../../services/pet/petMoodService', () => ({
  petMoodService: { calculateCurrentMood: () => 'happy' },
}));
vi.mock('../../services/pet/petGifts', () => ({
  canSendGiftTo: () => canSendMock(),
  formatCooldownRemaining: () => 'in 2h',
  sendPetGift: () => sendGiftMock(),
}));
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});
vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import { FriendPetCard } from './FriendPetCard';

const pet: Pet = {
  id: 'p1',
  userId: 'friend-1',
  name: 'Wuffi',
  type: 'dog',
  color: '#fff',
  level: 5,
  experience: 100,
  hunger: 40,
  happiness: 80,
  lastFed: new Date(),
  episodesWatched: 20,
  createdAt: new Date(),
  isAlive: true,
};

beforeEach(() => {
  sendGiftMock.mockClear();
  canSendMock.mockReturnValue({ allowed: true });
});
afterEach(() => cleanup());

describe('FriendPetCard', () => {
  it('renders the pet name, type and stats', () => {
    render(<FriendPetCard friendUid="friend-1" pet={pet} />);
    expect(screen.getByText('Wuffi')).toBeInTheDocument();
    expect(screen.getByText(/Hund · Lvl 5/)).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('sends a snack gift when the button is clicked', async () => {
    render(<FriendPetCard friendUid="friend-1" pet={pet} />);
    fireEvent.click(screen.getByText('Snack schicken'));
    await waitFor(() => expect(sendGiftMock).toHaveBeenCalled());
    expect(await screen.findByText('Snack unterwegs')).toBeInTheDocument();
  });

  it('disables sending on a cooldown', () => {
    canSendMock.mockReturnValue({ allowed: false, nextAvailableAt: Date.now() + 7200000 });
    render(<FriendPetCard friendUid="friend-1" pet={pet} />);
    expect(screen.getByText(/Schon verwöhnt/)).toBeInTheDocument();
  });
});
