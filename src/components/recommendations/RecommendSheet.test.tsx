// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Friend } from '../../types/Friend';
import { RecommendSheet } from './RecommendSheet';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#00ff99',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111' },
      border: { default: '#333' },
      status: { success: '#22c55e', warning: '#f59e0b' },
    },
  }),
}));

vi.mock('../../hooks/useDeviceType', () => ({
  useDeviceType: () => ({ isMobile: false, isDesktop: true }),
}));

// BottomSheet als Passthrough (kein Portal / Focus-Trap im Test).
vi.mock('../ui', () => ({
  BottomSheet: ({ children }: { children?: ReactNode }) => (
    <div data-testid="sheet">{children}</div>
  ),
}));

const sheet = vi.hoisted(() => ({
  toggleFriend: vi.fn(),
  handleClose: vi.fn(),
  handleSend: vi.fn(),
  setMessage: vi.fn(),
  sortedFriends: [] as Friend[],
  hasFriends: true,
}));

vi.mock('./useRecommendSheet', () => ({
  useRecommendSheet: () => ({
    selected: new Set<string>(),
    message: '',
    setMessage: sheet.setMessage,
    sending: false,
    friendsWithMedia: new Set<string>(),
    checkingLibrary: false,
    sortedFriends: sheet.sortedFriends,
    availableCount: sheet.sortedFriends.length,
    hasFriends: sheet.hasFriends,
    toggleFriend: sheet.toggleFriend,
    handleClose: sheet.handleClose,
    handleSend: sheet.handleSend,
  }),
}));

const media = { id: 7, type: 'series' as const, title: 'The Wire' };

beforeEach(() => {
  sheet.sortedFriends = [
    { uid: 'f1', email: 'a@b.de', username: 'ada', displayName: 'Ada', friendsSince: 0 },
  ];
  sheet.hasFriends = true;
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('RecommendSheet', () => {
  it('rendert Hero, Picker, Nachricht und Sende-Leiste', () => {
    render(<RecommendSheet isOpen onClose={vi.fn()} media={media} />);
    expect(screen.getByText('The Wire')).toBeInTheDocument();
    expect(screen.getByText('An wen?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Sag was dazu…')).toBeInTheDocument();
    expect(screen.getByText('Freunde auswählen')).toBeInTheDocument();
  });

  it('blendet Nachricht und Sende-Leiste aus wenn keine Freunde da sind', () => {
    sheet.sortedFriends = [];
    sheet.hasFriends = false;
    render(<RecommendSheet isOpen onClose={vi.fn()} media={media} />);
    expect(screen.getByText('Noch keine Freunde')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Sag was dazu…')).not.toBeInTheDocument();
  });
});
