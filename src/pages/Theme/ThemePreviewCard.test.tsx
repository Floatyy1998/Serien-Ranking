// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { useTheme } from '../../contexts/ThemeContext';
import { ThemePreviewCard, type PresetTheme } from './ThemePreviewCard';

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

vi.mock('@mui/icons-material', () => ({ Check: () => null }));

const currentTheme = {
  primary: '#3355ff',
  background: { default: '#000000', surface: '#111111' },
  text: { primary: '#ffffff', secondary: '#eeeeee' },
  border: { default: '#333333' },
  status: { success: '#4cd137' },
} as unknown as ReturnType<typeof useTheme>['currentTheme'];

const preset: PresetTheme = {
  name: 'Abyss',
  primaryColor: '#00e5ff',
  backgroundColor: '#030d18',
  surfaceColor: '#060f20',
  accentColor: '#7c3aed',
};

afterEach(() => cleanup());

describe('ThemePreviewCard', () => {
  it('renders the preset name', () => {
    render(
      <ThemePreviewCard
        preset={preset}
        index={0}
        isActive={false}
        currentTheme={currentTheme}
        onApply={vi.fn()}
      />
    );
    expect(screen.getByText('Abyss')).toBeInTheDocument();
  });

  it('calls onApply with the preset when clicked', () => {
    const onApply = vi.fn<(p: PresetTheme) => void>();
    render(
      <ThemePreviewCard
        preset={preset}
        index={0}
        isActive={false}
        currentTheme={currentTheme}
        onApply={onApply}
      />
    );
    fireEvent.click(screen.getByText('Abyss'));
    expect(onApply).toHaveBeenCalledWith(preset);
  });

  it('renders the active check dot when active', () => {
    const { container } = render(
      <ThemePreviewCard
        preset={preset}
        index={1}
        isActive
        currentTheme={currentTheme}
        onApply={vi.fn()}
      />
    );
    expect(container.querySelector('.theme-preset-check')).toBeTruthy();
  });
});
