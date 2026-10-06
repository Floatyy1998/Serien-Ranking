// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'transition', 'whileTap']);
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

vi.mock('@mui/icons-material', () => ({ EmojiEvents: () => null }));

vi.mock('../../../contexts/ThemeContext', () => {
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

const auth = vi.hoisted(() => ({ value: { user: { uid: 'u1' } } }));
vi.mock('../../../contexts/AuthContext', () => ({ useAuth: () => auth.value }));

vi.mock('../../../lib/interaction/haptics', () => ({ hapticSelect: vi.fn() }));

const svc = vi.hoisted(() => ({
  isLeaderboardHidden: vi.fn(),
  setLeaderboardHidden: vi.fn(),
}));
vi.mock('../../../services/social/leaderboardService', () => svc);

import { LeaderboardVisibilitySection } from './LeaderboardVisibilitySection';

const checkbox = () =>
  screen.getByRole('checkbox', { name: 'In der globalen Rangliste erscheinen' });

beforeEach(() => {
  svc.isLeaderboardHidden.mockReset().mockResolvedValue(false);
  svc.setLeaderboardHidden.mockReset().mockResolvedValue(undefined);
});

afterEach(cleanup);

describe('LeaderboardVisibilitySection', () => {
  it('zeigt den gespeicherten Zustand', async () => {
    svc.isLeaderboardHidden.mockResolvedValue(true);
    render(<LeaderboardVisibilitySection />);
    await waitFor(() => expect(checkbox()).not.toBeDisabled());
    expect(checkbox()).not.toBeChecked();
    expect(svc.isLeaderboardHidden).toHaveBeenCalledWith('u1');
  });

  it('blendet beim Ausschalten aus', async () => {
    render(<LeaderboardVisibilitySection />);
    await waitFor(() => expect(checkbox()).not.toBeDisabled());
    expect(checkbox()).toBeChecked();

    fireEvent.click(checkbox());

    await waitFor(() => expect(svc.setLeaderboardHidden).toHaveBeenCalledWith('u1', true));
    await waitFor(() => expect(checkbox()).not.toBeChecked());
  });

  it('setzt den Schalter zurück, wenn das Speichern scheitert', async () => {
    svc.setLeaderboardHidden.mockRejectedValue(new Error('denied'));
    render(<LeaderboardVisibilitySection />);
    await waitFor(() => expect(checkbox()).not.toBeDisabled());

    fireEvent.click(checkbox());

    await waitFor(() => expect(checkbox()).not.toBeDisabled());
    expect(checkbox()).toBeChecked();
  });
});
