// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap', 'whileHover']);
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
  ArrowForward: () => null,
  AutoAwesome: () => null,
  CheckCircleOutline: () => null,
}));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

vi.mock('../../contexts/ThemeContextDef', () => {
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
  GradientText: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

const navigateMock = vi.fn();

import { EmptyState } from './EmptyState';

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
});

describe('CatchUp EmptyState', () => {
  it('renders the celebratory headline and copy', () => {
    render(<EmptyState />);
    expect(screen.getByText('Alles aufgeholt!')).toBeInTheDocument();
    expect(screen.getByText(/up-to-date/)).toBeInTheDocument();
  });

  it('navigates to /discover when the discover button is clicked', () => {
    render(<EmptyState />);
    fireEvent.click(screen.getByText('Neue Serie entdecken'));
    expect(navigateMock).toHaveBeenCalledWith('/discover');
  });
});
