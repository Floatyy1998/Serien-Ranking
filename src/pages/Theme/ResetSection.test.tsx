// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { useTheme } from '../../contexts/ThemeContextDef';

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
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('@mui/icons-material', () => ({ Refresh: () => null }));
vi.mock('../../lib/haptics', () => ({ hapticTap: vi.fn() }));

import { ResetSection } from './ResetSection';

const currentTheme = {
  primary: '#3355ff',
  background: { default: '#000000', surface: '#111111' },
  text: { primary: '#ffffff', secondary: '#eeeeee', muted: '#888888' },
  border: { default: '#333333' },
  status: { success: '#4cd137', error: '#e74c3c', warning: '#f5a623' },
} as unknown as ReturnType<typeof useTheme>['currentTheme'];

afterEach(() => cleanup());

describe('ResetSection', () => {
  it('renders the reset trigger initially', () => {
    render(<ResetSection currentTheme={currentTheme} onReset={vi.fn()} />);
    expect(screen.getByText('Theme zurücksetzen')).toBeInTheDocument();
  });

  it('shows the confirmation actions after clicking reset', () => {
    render(<ResetSection currentTheme={currentTheme} onReset={vi.fn()} />);
    fireEvent.click(screen.getByText('Theme zurücksetzen'));
    expect(screen.getByText('Zurücksetzen')).toBeInTheDocument();
    expect(screen.getByText('Abbrechen')).toBeInTheDocument();
  });

  it('calls onReset when the confirmation is accepted', () => {
    const onReset = vi.fn();
    render(<ResetSection currentTheme={currentTheme} onReset={onReset} />);
    fireEvent.click(screen.getByText('Theme zurücksetzen'));
    fireEvent.click(screen.getByText('Zurücksetzen'));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('hides the confirmation when cancelled', () => {
    render(<ResetSection currentTheme={currentTheme} onReset={vi.fn()} />);
    fireEvent.click(screen.getByText('Theme zurücksetzen'));
    fireEvent.click(screen.getByText('Abbrechen'));
    expect(screen.queryByText('Zurücksetzen')).not.toBeInTheDocument();
  });
});
