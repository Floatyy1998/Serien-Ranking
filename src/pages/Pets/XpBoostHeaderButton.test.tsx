// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { XpBoostItem } from '../../services/pet/dailySpinService';
import { XpBoostHeaderButton } from './XpBoostHeaderButton';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111', card: '#222' },
      border: { default: '#333' },
    },
  }),
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
}));

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: () => ({
        on: (_event: string, cb: (snap: { val: () => unknown }) => void) => {
          cb({ val: () => null });
          return cb;
        },
        off: () => {},
      }),
    }),
  },
}));
vi.mock('firebase/compat/database', () => ({}));

const inventory = vi.hoisted(() => ({ value: [] as XpBoostItem[] }));
vi.mock('../../services/pet/dailySpinService', () => ({
  getXpBoostInventory: vi.fn<() => Promise<XpBoostItem[]>>(() => Promise.resolve(inventory.value)),
  activateXpBoost: vi.fn<() => Promise<boolean>>(() => Promise.resolve(true)),
}));

afterEach(() => cleanup());

describe('XpBoostHeaderButton', () => {
  it('rendert den XP-Shield-Button', () => {
    render(<XpBoostHeaderButton />);
    expect(screen.getByText('XP')).toBeInTheDocument();
  });

  it('öffnet das Dropdown und zeigt den Empty-State', async () => {
    render(<XpBoostHeaderButton />);
    const button = screen.getByText('XP').closest('button');
    expect(button).not.toBeNull();
    fireEvent.click(button as HTMLButtonElement);
    await waitFor(() => expect(screen.getByText('XP Boosts')).toBeInTheDocument());
    expect(screen.getByText('Keine Boosts vorhanden.')).toBeInTheDocument();
  });
});
