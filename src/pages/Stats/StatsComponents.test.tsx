// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
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
  AutoAwesome: () => null,
  EmojiEvents: () => null,
  LocalFireDepartment: () => null,
  Movie: () => null,
  Timer: () => null,
  Tv: () => null,
  Category: () => null,
  Star: () => null,
  Stream: () => null,
}));

vi.mock('../../components/ui', () => ({
  GradientText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

import { AnimatedRing } from './StatsComponents';
import { ActorUniverseBanner } from './StatsComponents';

const theme = {
  primary: '#3355ff',
  accent: '#22d3ee',
  background: { default: '#000000', surface: '#111111' },
  text: { primary: '#ffffff', secondary: '#eeeeee', muted: '#888888' },
  border: { default: '#333333' },
  status: { success: '#4cd137', error: '#e74c3c', warning: '#f5a623' },
};

afterEach(() => cleanup());

describe('StatsComponents', () => {
  it('renders an svg for AnimatedRing', () => {
    const { container } = render(
      <AnimatedRing progress={60} size={90} strokeWidth={8} color="#3355ff" />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('fires onNavigate when the Actor Universe banner is clicked', () => {
    const onNavigate = vi.fn();
    render(<ActorUniverseBanner theme={theme} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByText('Actor Universe'));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
