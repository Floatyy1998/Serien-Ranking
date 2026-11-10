// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OwnedButton } from './OwnedButton';

const setMediaOwned = vi.hoisted(() => vi.fn(async () => {}));

vi.mock('../../services/series/mediaBulk', () => ({ setMediaOwned }));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ currentTheme: { status: { success: '#0f0' } } }),
}));
vi.mock('../../lib/interaction/toast', () => ({ showToast: vi.fn() }));
vi.mock('../../lib/interaction/haptics', () => ({ hapticTap: vi.fn() }));
vi.mock('@mui/material', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('framer-motion', () => ({
  motion: {
    button: ({ whileTap: _w, ...props }: Record<string, unknown>) => (
      <button {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)} />
    ),
  },
}));

afterEach(() => {
  cleanup();
  setMediaOwned.mockClear();
});

const button = () => screen.getByRole('button');

describe('OwnedButton', () => {
  it('schaltet sofort um und speichert nur den einen Film', async () => {
    render(
      <OwnedButton className="b" iconSize={18} target={{ type: 'movie', id: 671 }} owned={false} />
    );
    await act(async () => fireEvent.click(button()));
    expect(button()).toHaveAttribute('aria-pressed', 'true');
    expect(setMediaOwned).toHaveBeenCalledWith('u1', [{ type: 'movie', id: 671 }], true);
  });

  it('nimmt den Besitz beim Blättern zum nächsten Teil einer Reihe nicht mit', async () => {
    const view = render(
      <OwnedButton className="b" iconSize={18} target={{ type: 'movie', id: 671 }} owned={false} />
    );
    await act(async () => fireEvent.click(button()));
    view.rerender(
      <OwnedButton className="b" iconSize={18} target={{ type: 'movie', id: 672 }} owned={false} />
    );
    expect(button()).toHaveAttribute('aria-pressed', 'false');
  });
});
