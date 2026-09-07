// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@mui/icons-material', () => ({ Pets: () => null }));
vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition']);
  const make = (tag: string) =>
    React.forwardRef(function M(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return { motion };
});
vi.mock('../../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
const state = vi.hoisted(() => ({ user: { uid: 'u1' } as { uid: string } | null, enabled: true }));
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }));
vi.mock('../../../hooks/pet/usePetEnabled', () => ({ usePetEnabled: () => state.enabled }));
const setPetEnabled = vi.fn<(uid: string, enabled: boolean) => Promise<void>>(async () => {});
vi.mock('../../../services/pet/petPreferences', () => ({
  setPetEnabled: (uid: string, enabled: boolean) => setPetEnabled(uid, enabled),
}));

import { PetSection } from './PetSection';

afterEach(() => {
  cleanup();
  setPetEnabled.mockClear();
  state.user = { uid: 'u1' };
  state.enabled = true;
});

describe('PetSection', () => {
  it('shows the on-state and switches the pet off', async () => {
    render(<PetSection />);
    expect(screen.getByText('Widget, Reaktionen und Pet-Karten sind an.')).toBeInTheDocument();
    const toggle = screen.getByLabelText('Pet-Begleiter') as HTMLInputElement;
    expect(toggle.checked).toBe(true);
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(setPetEnabled).toHaveBeenCalledWith('u1', false);
  });

  it('shows the paused hint and switches the pet back on', async () => {
    state.enabled = false;
    render(<PetSection />);
    expect(screen.getByText(/Zeit für dein Pet still/)).toBeInTheDocument();
    const toggle = screen.getByLabelText('Pet-Begleiter') as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    await act(async () => {
      fireEvent.click(toggle);
    });
    expect(setPetEnabled).toHaveBeenCalledWith('u1', true);
  });

  it('stays inert without a user', () => {
    state.user = null;
    render(<PetSection />);
    const toggle = screen.getByLabelText('Pet-Begleiter') as HTMLInputElement;
    expect(toggle.disabled).toBe(true);
  });
});
