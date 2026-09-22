// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComparisonTotals } from './useFriendComparison';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
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

import { FriendComparisonCard } from './FriendComparisonCard';

const own: ComparisonTotals = {
  watchtimeMinutes: 36245,
  seriesStarted: 63,
  seriesCompleted: 28,
  movies: 212,
  episodes: 1480,
};

const friend: ComparisonTotals = {
  watchtimeMinutes: 45360,
  seriesStarted: 48,
  seriesCompleted: 20,
  movies: 104,
  episodes: 1900,
};

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
});

describe('FriendComparisonCard', () => {
  it('zeigt beide Seiten mit lesbaren Gesamtzahlen', () => {
    render(<FriendComparisonCard friendName="VIC" own={own} friend={friend} loading={false} />);

    expect(screen.getByText('Ihr im Vergleich')).toBeInTheDocument();
    expect(screen.getByText('VIC')).toBeInTheDocument();
    expect(screen.getByText('25 T 4 Std')).toBeInTheDocument();
    expect(screen.getByText('31 T 12 Std')).toBeInTheDocument();
    expect(screen.getByText('63')).toBeInTheDocument();
    expect(screen.getByText('104')).toBeInTheDocument();
  });

  it('nennt bei den Serien die komplett gesehenen als Unterzeile', () => {
    render(<FriendComparisonCard friendName="VIC" own={own} friend={friend} loading={false} />);

    expect(screen.getByText('davon 28 komplett')).toBeInTheDocument();
    expect(screen.getByText('davon 20 komplett')).toBeInTheDocument();
  });

  it('zeigt waehrend des Ladens keinen Vergleich', () => {
    render(<FriendComparisonCard friendName="VIC" own={own} friend={null} loading />);

    expect(screen.getByText(/Vergleich wird geladen/)).toBeInTheDocument();
    expect(screen.queryByText('Ihr im Vergleich')).not.toBeInTheDocument();
  });

  it('sagt es, wenn der Freund noch keinen Schnappschuss hat', () => {
    render(<FriendComparisonCard friendName="VIC" own={own} friend={null} loading={false} />);

    expect(screen.getByText('Von VIC gibt es noch keine Gesamtzahlen.')).toBeInTheDocument();
  });

  it('fuehrt in die Rangliste', () => {
    render(<FriendComparisonCard friendName="VIC" own={own} friend={friend} loading={false} />);

    fireEvent.click(screen.getByText('Zur Gesamt-Rangliste'));
    expect(navigateMock).toHaveBeenCalledWith('/leaderboard');
  });

  it('kommt mit einem Gleichstand bei null klar', () => {
    const empty: ComparisonTotals = {
      watchtimeMinutes: 0,
      seriesStarted: 0,
      seriesCompleted: 0,
      movies: 0,
      episodes: 0,
    };
    render(<FriendComparisonCard friendName="VIC" own={empty} friend={empty} loading={false} />);

    expect(screen.getAllByText('0 Min')).toHaveLength(2);
  });
});
