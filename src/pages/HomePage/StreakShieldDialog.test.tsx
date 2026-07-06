// @vitest-environment jsdom
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StreakShieldDialog } from './StreakShieldDialog';
import type { ActivePetInfo, WatchStreakData } from './watchStreakHelpers';

const MOTION_ONLY = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'layout',
  'drag',
]);
const strip = (props: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(props)) if (!MOTION_ONLY.has(k)) out[k] = props[k];
  return out;
};
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: new Proxy(
    {},
    {
      get: (_t, tag: string) => (props: Record<string, unknown>) =>
        createElement(tag, strip(props)),
    }
  ),
}));

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

afterEach(cleanup);

const pet: ActivePetInfo = { id: 'p1', name: 'Rex', level: 3, experience: 250, isAlive: true };
const streak: WatchStreakData = { currentStreak: 7, longestStreak: 7, lastWatchDate: '' };

function renderDialog(props: Partial<React.ComponentProps<typeof StreakShieldDialog>> = {}) {
  return render(
    <StreakShieldDialog
      showConfirm
      pet={pet}
      streak={streak}
      flameColor="#22c55e"
      shieldLoading={false}
      onClose={vi.fn()}
      onActivate={vi.fn()}
      {...props}
    />
  );
}

describe('StreakShieldDialog', () => {
  it('renders the dialog with pet name when open (smoke)', () => {
    renderDialog();
    expect(screen.getByText('Streak Shield')).toBeInTheDocument();
    expect(screen.getByText('Rex')).toBeInTheDocument();
    expect(screen.getByText('Aktivieren')).toBeInTheDocument();
  });

  it('renders nothing when closed', () => {
    const { container } = renderDialog({ showConfirm: false });
    expect(container).toBeEmptyDOMElement();
  });

  it('invokes onActivate and onClose from the action buttons', () => {
    const onActivate = vi.fn();
    const onClose = vi.fn();
    renderDialog({ onActivate, onClose });
    fireEvent.click(screen.getByText('Aktivieren'));
    expect(onActivate).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows the loading label while activating', () => {
    renderDialog({ shieldLoading: true });
    expect(screen.getByText('Aktiviere...')).toBeInTheDocument();
  });
});
