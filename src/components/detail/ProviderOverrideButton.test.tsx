// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
  };
});

vi.mock('@mui/icons-material', () => ({
  Add: () => null,
  AutoAwesome: () => null,
  Check: () => null,
}));
vi.mock('../../lib/haptics', () => ({ hapticTap: vi.fn() }));
vi.mock('../../lib/motion', () => ({ tapScaleTight: {} }));

vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
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

const { getOverrideMock, setOverrideMock } = vi.hoisted(() => ({
  getOverrideMock: vi.fn(async () => null as string | null),
  setOverrideMock: vi.fn(async () => {}),
}));
vi.mock('../../services/providerOverride', () => ({
  getSeriesProviderOverride: getOverrideMock,
  setSeriesProviderOverride: setOverrideMock,
}));

import { ProviderOverrideButton } from './ProviderOverrideButton';

afterEach(() => {
  cleanup();
  getOverrideMock.mockClear();
  setOverrideMock.mockClear();
});

const openDialog = async () => {
  fireEvent.click(screen.getByRole('button', { name: 'Anbieter zuordnen' }));
  await act(async () => {
    await Promise.resolve();
  });
};

describe('ProviderOverrideButton', () => {
  it('öffnet den Dialog mit Automatik-Option und Anbietern', async () => {
    render(<ProviderOverrideButton seriesId={42} seriesTitle="One Piece" />);
    await openDialog();
    expect(screen.getByText('Anbieter zuordnen')).toBeInTheDocument();
    expect(screen.getByText('Automatisch (TMDB)')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(getOverrideMock).toHaveBeenCalledWith('u1', 42);
  });

  it('speichert die Zuordnung beim Anbieter-Klick', async () => {
    render(<ProviderOverrideButton seriesId={42} />);
    await openDialog();
    fireEvent.click(screen.getByText('Netflix'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(setOverrideMock).toHaveBeenCalledWith('u1', 42, 'Netflix');
    expect(screen.queryByText('Automatisch (TMDB)')).not.toBeInTheDocument();
  });

  it('setzt auf Automatik zurück', async () => {
    getOverrideMock.mockResolvedValueOnce('Netflix');
    render(<ProviderOverrideButton seriesId={42} />);
    await openDialog();
    fireEvent.click(screen.getByText('Automatisch (TMDB)'));
    await act(async () => {
      await Promise.resolve();
    });
    expect(setOverrideMock).toHaveBeenCalledWith('u1', 42, null);
  });
});
