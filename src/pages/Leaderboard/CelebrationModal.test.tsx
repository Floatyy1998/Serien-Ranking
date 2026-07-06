// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CelebrationData } from './useLeaderboardData';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap', 'whileHover']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
  };
});
vi.mock('@mui/icons-material', () => ({ Close: () => null, Timer: () => null }));
vi.mock('../../components/ui/Trophy3D', () => ({ Trophy3D: () => null }));
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

import { CelebrationModal } from './CelebrationModal';

const celebration: CelebrationData = { place: 1, monthLabel: 'Juli 2026', score: 125 };

afterEach(() => cleanup());

describe('CelebrationModal', () => {
  it('renders nothing when celebration is null', () => {
    const { container } = render(
      <CelebrationModal celebration={null} onClose={vi.fn()} userName="Konrad" />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the place label, month and formatted watchtime', () => {
    render(<CelebrationModal celebration={celebration} onClose={vi.fn()} userName="Konrad" />);
    expect(screen.getByText('1. Platz!')).toBeInTheDocument();
    expect(screen.getByText('Juli 2026')).toBeInTheDocument();
    expect(screen.getByText('2h 5m')).toBeInTheDocument();
  });

  it('invokes onClose when the dismiss button is clicked', () => {
    const onClose = vi.fn();
    render(<CelebrationModal celebration={celebration} onClose={onClose} userName="Konrad" />);
    fireEvent.click(screen.getByText('Weiter'));
    expect(onClose).toHaveBeenCalled();
  });
});
