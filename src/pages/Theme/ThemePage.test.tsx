// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { PresetTheme } from './ThemePreviewCard';
import type { ColorCategory } from './ColorEditor';

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
  Palette: () => null,
  ColorLens: () => null,
  Brightness6: () => null,
  Wallpaper: () => null,
  FormatColorText: () => null,
}));

const { updateTheme, resetTheme, configRef, contrastRef } = vi.hoisted(() => ({
  updateTheme: vi.fn(),
  resetTheme: vi.fn(),
  configRef: {
    current: {
      primaryColor: '#3355ff',
      backgroundColor: '#000000',
      surfaceColor: '#111111',
      accentColor: '#22d3ee',
      textColor: '#ffffff',
    } as Record<string, string>,
  },
  contrastRef: { current: 10 },
}));

const theme = {
  primary: '#3355ff',
  accent: '#22d3ee',
  background: { default: '#000000', surface: '#111111' },
  text: { primary: '#ffffff', secondary: '#eeeeee', muted: '#888888' },
  border: { default: '#333333' },
  status: { success: '#4cd137', error: '#e74c3c', warning: '#f5a623' },
};

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    userConfig: configRef.current,
    updateTheme,
    resetTheme,
    currentTheme: theme,
  }),
}));
vi.mock('../../theme/colorUtils', () => ({ getContrastRatio: () => contrastRef.current }));
vi.mock('../../lib/haptics', () => ({ hapticTap: vi.fn() }));
vi.mock('../../components/ui', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('./ThemePreviewCard', () => ({
  ThemePreviewCard: ({
    preset,
    onApply,
  }: {
    preset: PresetTheme;
    onApply: (p: PresetTheme) => void;
  }) => <button onClick={() => onApply(preset)}>{preset.name}</button>,
}));
vi.mock('./ColorEditor', () => ({
  ColorEditor: ({
    category,
    onColorChange,
  }: {
    category: ColorCategory;
    onColorChange: (k: string, v: string) => void;
  }) => <button onClick={() => onColorChange(category.key, '#00ff00')}>{category.name}</button>,
}));
vi.mock('./ResetSection', () => ({
  ResetSection: ({ onReset }: { onReset: () => void }) => (
    <button onClick={onReset}>reset-section</button>
  ),
}));

import { ThemePage } from './ThemePage';

beforeEach(() => {
  updateTheme.mockReset();
  resetTheme.mockReset();
  contrastRef.current = 10;
});

afterEach(() => cleanup());

describe('ThemePage', () => {
  it('renders the header, preset cards and color editors', () => {
    render(<ThemePage />);
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Themes')).toBeInTheDocument();
    expect(screen.getByText('Abyss')).toBeInTheDocument();
    expect(screen.getByText('Primär')).toBeInTheDocument();
  });

  it('applies a preset theme via updateTheme', () => {
    render(<ThemePage />);
    fireEvent.click(screen.getByText('Abyss'));
    expect(updateTheme).toHaveBeenCalledWith({
      primaryColor: '#00e5ff',
      backgroundColor: '#030d18',
      surfaceColor: '#060f20',
      accentColor: '#7c3aed',
    });
  });

  it('updates a single color from a color editor', () => {
    render(<ThemePage />);
    fireEvent.click(screen.getByText('Primär'));
    expect(updateTheme).toHaveBeenCalledWith({ primaryColor: '#00ff00' });
  });

  it('shows a contrast warning when the ratio is too low', () => {
    contrastRef.current = 2;
    render(<ThemePage />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
