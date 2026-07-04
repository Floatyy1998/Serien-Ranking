// @vitest-environment jsdom
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props)
        if (!['initial', 'animate', 'exit', 'transition', 'whileTap', 'whileHover'].includes(k))
          clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

vi.mock('@mui/icons-material', () => ({
  Lock: () => <span data-testid="lock-icon" />,
}));
vi.mock('../../features/badges/BadgeIcons', () => ({
  BadgeIcon: () => <span data-testid="badge-icon" />,
}));
vi.mock('./badgeCardHelpers', () => ({ getRarityColor: () => '#abcdef' }));
vi.mock('../../lib/motion', () => ({ tapScaleSmall: {} }));

import { BadgeCard } from './BadgeCard';

type Props = ComponentProps<typeof BadgeCard>;

const makeTheme = () =>
  new Proxy(() => '#333', {
    get: (_t, prop) => {
      if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
        return () => '#333';
      return makeTheme();
    },
  }) as unknown as Props['theme'];

const badge = {
  id: 'first_watch',
  name: 'Erster Schritt',
  description: 'Sieh deine erste Folge',
  rarity: 'legendary',
  color: '#ff0000',
} as unknown as Props['badge'];

const renderCard = (overrides: Partial<Props> = {}) =>
  render(
    <BadgeCard
      badge={badge}
      index={0}
      theme={makeTheme()}
      earned={true}
      progress={undefined}
      isNextTier={false}
      {...overrides}
    />
  );

afterEach(() => cleanup());

describe('BadgeCard', () => {
  it('renders the badge name and description', () => {
    renderCard();
    expect(screen.getByText('Erster Schritt')).toBeInTheDocument();
    expect(screen.getByText('Sieh deine erste Folge')).toBeInTheDocument();
  });

  it('maps the legendary rarity to its German label', () => {
    renderCard();
    expect(screen.getByText('Legendär')).toBeInTheDocument();
  });

  it('shows a progress ratio when unearned with progress data', () => {
    renderCard({
      earned: false,
      progress: { current: 3, total: 10, sessionActive: false } as unknown as Props['progress'],
    });
    expect(screen.getByText('3 / 10')).toBeInTheDocument();
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });
});
