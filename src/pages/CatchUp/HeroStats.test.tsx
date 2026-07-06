// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

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

vi.mock('@mui/icons-material', () => ({
  PlayArrow: () => null,
  Timer: () => null,
  TrendingUp: () => null,
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

vi.mock('../../components/ui', () => ({
  ProgressBar: (props: { value: number }) => <div data-testid="progress-bar">{props.value}</div>,
}));

vi.mock('./useCatchUpData', () => ({
  formatTime: (minutes: number) => ({ value: minutes, unit: 'Min' }),
}));

import { HeroStats } from './HeroStats';

afterEach(() => cleanup());

describe('HeroStats', () => {
  it('renders the total episode count', () => {
    render(<HeroStats totalEpisodes={12} totalMinutes={480} avgProgress={40} />);
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('Episoden')).toBeInTheDocument();
  });

  it('renders the formatted time value and unit', () => {
    render(<HeroStats totalEpisodes={12} totalMinutes={480} avgProgress={40} />);
    expect(screen.getByText('480')).toBeInTheDocument();
    expect(screen.getByText('Min')).toBeInTheDocument();
  });

  it('renders the capped average progress and forwards it to the bar', () => {
    render(<HeroStats totalEpisodes={1} totalMinutes={10} avgProgress={150} />);
    expect(screen.getByText('99%')).toBeInTheDocument();
    expect(screen.getByTestId('progress-bar')).toHaveTextContent('150');
  });
});
