// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../AuthContext', () => ({
  useAuth: () => null,
}));

vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({
      ref: () => ({
        once: async () => ({ exists: () => false, val: () => null }),
        set: async () => {},
        remove: async () => {},
      }),
    }),
  },
}));
vi.mock('firebase/compat/database', () => ({}));

import { DynamicThemeProvider } from './ThemeProvider';
import { useTheme } from './ThemeContext';

const Consumer = () => {
  const { currentTheme, syncMode } = useTheme();
  return <div data-testid="theme-value">{`${currentTheme.primary}|${syncMode}`}</div>;
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('DynamicThemeProvider', () => {
  it('mounts and exposes a generated theme + default sync mode', () => {
    render(
      <DynamicThemeProvider>
        <Consumer />
      </DynamicThemeProvider>
    );

    const value = screen.getByTestId('theme-value').textContent ?? '';
    expect(value).toContain('|local');
    // Generated theme primary is a hex color string
    expect(value.startsWith('#')).toBe(true);
  });

  it('renders children inside the theme provider', () => {
    render(
      <DynamicThemeProvider>
        <span>themed child</span>
      </DynamicThemeProvider>
    );
    expect(screen.getByText('themed child')).toBeInTheDocument();
  });
});
