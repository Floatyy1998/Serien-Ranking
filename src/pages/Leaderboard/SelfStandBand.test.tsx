// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { LeaderboardEntry } from '../../types/Leaderboard';

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
vi.mock('../../components/ui/display/GradientText', () => ({
  GradientText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
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

import { SelfStandBand, computeSelfStand } from './SelfStandBand';

const entry = (over: Partial<LeaderboardEntry>): LeaderboardEntry => ({
  uid: 'u',
  displayName: 'Wer',
  value: 0,
  rank: 1,
  isCurrentUser: false,
  ...over,
});

const FIELD: LeaderboardEntry[] = [
  entry({ uid: 'a', displayName: 'Konrad', rank: 1, value: 100 }),
  entry({ uid: 'me', displayName: 'VIC', rank: 2, value: 60, isCurrentUser: true }),
  entry({ uid: 'c', displayName: 'BeLLe', rank: 3, value: 30 }),
];

afterEach(() => cleanup());

describe('computeSelfStand', () => {
  it('findet Platz, Feldgroesse und den Abstand nach vorn', () => {
    expect(computeSelfStand(FIELD)).toEqual({
      rank: 2,
      of: 3,
      value: 60,
      aheadName: 'Konrad',
      gap: 40,
      isLeader: false,
    });
  });

  it('rechnet an der Spitze den Vorsprung auf Platz 2', () => {
    const leading = [
      entry({ uid: 'me', displayName: 'VIC', rank: 1, value: 100, isCurrentUser: true }),
      entry({ uid: 'a', displayName: 'Konrad', rank: 2, value: 70 }),
    ];
    expect(computeSelfStand(leading)).toMatchObject({ isLeader: true, gap: 30, aheadName: null });
  });

  it('kommt mit einem Feld aus einer Person klar', () => {
    const alone = [entry({ uid: 'me', rank: 1, value: 10, isCurrentUser: true })];
    expect(computeSelfStand(alone)).toMatchObject({ rank: 1, of: 1, gap: 0, isLeader: true });
  });

  it('gibt null zurueck, wenn man selbst nicht im Feld steht', () => {
    expect(computeSelfStand([entry({ uid: 'a' })])).toBeNull();
  });
});

describe('SelfStandBand', () => {
  it('zeigt Platz, Feldgroesse, Wert und Rueckstand', () => {
    render(
      <SelfStandBand
        entries={FIELD}
        category="episodesThisMonth"
        unit="Ep."
        categoryLabel="Episoden"
      />
    );

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('von 3')).toBeInTheDocument();
    expect(screen.getByText('Episoden')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
    expect(screen.getByText('40 Ep. hinter Konrad')).toBeInTheDocument();
  });

  it('meldet an der Spitze den Vorsprung statt eines Rueckstands', () => {
    const leading = [
      entry({ uid: 'me', displayName: 'VIC', rank: 1, value: 100, isCurrentUser: true }),
      entry({ uid: 'a', displayName: 'Konrad', rank: 2, value: 70 }),
    ];
    render(
      <SelfStandBand
        entries={leading}
        category="episodesThisMonth"
        unit="Ep."
        categoryLabel="Episoden"
      />
    );

    expect(screen.getByText('30 Ep. Vorsprung')).toBeInTheDocument();
  });

  it('rendert nichts, wenn man nicht im Feld steht', () => {
    const { container } = render(
      <SelfStandBand
        entries={[entry({ uid: 'a' })]}
        category="episodesThisMonth"
        unit="Ep."
        categoryLabel="Episoden"
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
