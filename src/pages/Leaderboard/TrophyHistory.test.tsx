// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { MonthlyTrophy } from '../../types/Leaderboard';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'transition']);
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

import { TrophyHistory } from './TrophyHistory';

const trophy: MonthlyTrophy = {
  monthKey: '2026-07',
  category: 'watchtimeThisMonth',
  first: { uid: 'me', displayName: 'Konrad', score: 130 },
  second: { uid: 'b', displayName: 'Bob', score: 90 },
  third: null,
};

afterEach(() => cleanup());

describe('TrophyHistory', () => {
  it('renders nothing when there are no trophies', () => {
    const { container } = render(<TrophyHistory trophies={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the month label and podium entries', () => {
    render(<TrophyHistory trophies={[trophy]} currentUserId="me" />);
    expect(screen.getByText('Trophäen')).toBeInTheDocument();
    expect(screen.getByText('Juli 2026')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('2h 10m')).toBeInTheDocument();
  });

  it('replaces the current user name with "Du"', () => {
    render(<TrophyHistory trophies={[trophy]} currentUserId="me" />);
    expect(screen.getByText('Du')).toBeInTheDocument();
    expect(screen.queryByText('Konrad')).not.toBeInTheDocument();
  });
});
