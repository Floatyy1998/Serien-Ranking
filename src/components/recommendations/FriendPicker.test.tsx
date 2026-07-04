// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Friend } from '../../types/Friend';
import { FriendPicker } from './FriendPicker';

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00ff99',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111' },
      border: { default: '#333' },
      status: { success: '#22c55e' },
    },
  }),
}));

vi.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: false, isDesktop: true }),
}));

function makeFriend(uid: string, displayName: string): Friend {
  return { uid, email: `${uid}@b.de`, username: uid, displayName, friendsSince: 0 };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('FriendPicker', () => {
  it('zeigt den Empty-State ohne Freunde', () => {
    render(
      <FriendPicker
        sortedFriends={[]}
        selected={new Set()}
        friendsWithMedia={new Set()}
        checkingLibrary={false}
        availableCount={0}
        mediaType="series"
        onToggleFriend={vi.fn()}
      />
    );
    expect(screen.getByText('Noch keine Freunde')).toBeInTheDocument();
  });

  it('rendert das Freundes-Grid und den Header', () => {
    render(
      <FriendPicker
        sortedFriends={[makeFriend('f1', 'Ada'), makeFriend('f2', 'Bea')]}
        selected={new Set()}
        friendsWithMedia={new Set()}
        checkingLibrary={false}
        availableCount={2}
        mediaType="series"
        onToggleFriend={vi.fn()}
      />
    );
    expect(screen.getByText('An wen?')).toBeInTheDocument();
    expect(screen.getByText('Ada')).toBeInTheDocument();
    expect(screen.getByText('Bea')).toBeInTheDocument();
  });

  it('zeigt die Auswahl-Anzahl und den Verfügbar-Zähler', () => {
    render(
      <FriendPicker
        sortedFriends={[makeFriend('f1', 'Ada'), makeFriend('f2', 'Bea')]}
        selected={new Set(['f1'])}
        friendsWithMedia={new Set(['f2'])}
        checkingLibrary={false}
        availableCount={1}
        mediaType="series"
        onToggleFriend={vi.fn()}
      />
    );
    expect(screen.getByText('1 ausgewählt')).toBeInTheDocument();
    expect(screen.getByText(/1 verfügbar/)).toBeInTheDocument();
  });

  it('reicht Klicks an onToggleFriend weiter', () => {
    const onToggleFriend = vi.fn();
    render(
      <FriendPicker
        sortedFriends={[makeFriend('f1', 'Ada')]}
        selected={new Set()}
        friendsWithMedia={new Set()}
        checkingLibrary={false}
        availableCount={1}
        mediaType="series"
        onToggleFriend={onToggleFriend}
      />
    );
    fireEvent.click(screen.getByText('Ada'));
    expect(onToggleFriend).toHaveBeenCalledWith('f1');
  });
});
