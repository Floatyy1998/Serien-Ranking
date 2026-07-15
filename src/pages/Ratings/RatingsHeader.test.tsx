// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { useTheme } from '../../contexts/ThemeContext';
import type { RatingsStats } from './useRatingsData';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'transition']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return { motion };
});

vi.mock('@mui/icons-material', () => ({
  Movie: () => null,
  Star: () => null,
  Tv: () => null,
}));

vi.mock('../../components/ui', () => ({
  NavEscapeButtons: () => null,
  GradientText: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
  TabSwitcher: ({
    tabs,
    onTabChange,
  }: {
    tabs: { id: string; label: string }[];
    onTabChange: (id: string) => void;
  }) => (
    <div>
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onTabChange(t.id)}>
          {t.label}
        </button>
      ))}
    </div>
  ),
}));

import { RatingsHeader } from './RatingsHeader';

const theme = {
  primary: '#3355ff',
  accent: '#22d3ee',
  background: { default: '#000000', surface: '#111111' },
  text: { primary: '#ffffff', secondary: '#eeeeee', muted: '#888888' },
  border: { default: '#333333' },
} as unknown as ReturnType<typeof useTheme>['currentTheme'];

const stats: RatingsStats = { count: 42, average: 7.83 };

afterEach(() => cleanup());

describe('RatingsHeader', () => {
  it('renders the heading and the stats row', () => {
    render(
      <RatingsHeader
        theme={theme}
        stats={stats}
        activeTab="series"
        seriesCount={3}
        moviesCount={5}
        onTabChange={vi.fn()}
      />
    );
    expect(screen.getByText('Meine Bewertungen')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('7.8')).toBeInTheDocument();
  });

  it('calls onTabChange when a tab is selected', () => {
    const onTabChange = vi.fn<(id: string) => void>();
    render(
      <RatingsHeader
        theme={theme}
        stats={stats}
        activeTab="series"
        seriesCount={3}
        moviesCount={5}
        onTabChange={onTabChange}
      />
    );
    fireEvent.click(screen.getByText('Filme'));
    expect(onTabChange).toHaveBeenCalledWith('movies');
  });
});
