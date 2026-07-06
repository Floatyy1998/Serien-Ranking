// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Friend } from '../../types/Friend';
import { FriendAvatarButton } from './FriendAvatarButton';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00ff99',
      text: { primary: '#fff', muted: '#999' },
      background: { default: '#000', surface: '#111' },
      border: { default: '#333' },
      status: { success: '#22c55e' },
    },
  }),
}));

vi.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: false, isDesktop: true }),
}));

function makeFriend(overrides: Partial<Friend> = {}): Friend {
  return {
    uid: 'f1',
    email: 'a@b.de',
    username: 'ada',
    displayName: 'Ada',
    friendsSince: 0,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FriendAvatarButton', () => {
  it('zeigt den Anzeigenamen', () => {
    render(
      <FriendAvatarButton
        friend={makeFriend()}
        isSelected={false}
        alreadyHas={false}
        mediaType="series"
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByText('Ada')).toBeInTheDocument();
  });

  it('ruft onToggle mit der uid beim Klick', () => {
    const onToggle = vi.fn();
    render(
      <FriendAvatarButton
        friend={makeFriend()}
        isSelected={false}
        alreadyHas={false}
        mediaType="series"
        onToggle={onToggle}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onToggle).toHaveBeenCalledWith('f1');
  });

  it('markiert Auswahl über aria-pressed', () => {
    render(
      <FriendAvatarButton
        friend={makeFriend()}
        isSelected
        alreadyHas={false}
        mediaType="movie"
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('zeigt den Besitz-Hinweis wenn alreadyHas', () => {
    render(
      <FriendAvatarButton
        friend={makeFriend()}
        isSelected={false}
        alreadyHas
        mediaType="movie"
        onToggle={vi.fn()}
      />
    );
    expect(screen.getByText('Hat das schon')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
  });
});
