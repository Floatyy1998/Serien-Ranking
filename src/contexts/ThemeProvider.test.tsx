// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./AuthContext', () => ({
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

let updateCount = 0;
const Updater = () => {
  const { updateTheme } = useTheme();
  return (
    <button
      data-testid="update"
      onClick={() => updateTheme({ primaryColor: `#00000${++updateCount}` })}
    >
      update
    </button>
  );
};

const Consumer = () => {
  const { currentTheme, syncMode } = useTheme();
  return <div data-testid="theme-value">{`${currentTheme.primary}|${syncMode}`}</div>;
};

afterEach(() => {
  cleanup();
  localStorage.clear();
  updateCount = 0;
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
  it('bundles rapid theme updates into a single persisted write', () => {
    vi.useFakeTimers();
    try {
      render(
        <DynamicThemeProvider>
          <Updater />
        </DynamicThemeProvider>
      );

      const button = screen.getByTestId('update');
      act(() => {
        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);
      });
      expect(localStorage.getItem('customTheme')).toBeNull();

      act(() => {
        vi.advanceTimersByTime(300);
      });
      const saved = JSON.parse(localStorage.getItem('customTheme') ?? '{}');
      expect(saved.primaryColor).toBe('#000003');
    } finally {
      vi.useRealTimers();
    }
  });

  it('flushes a pending write on unmount', () => {
    vi.useFakeTimers();
    try {
      const { unmount } = render(
        <DynamicThemeProvider>
          <Updater />
        </DynamicThemeProvider>
      );
      act(() => {
        fireEvent.click(screen.getByTestId('update'));
      });
      expect(localStorage.getItem('customTheme')).toBeNull();

      unmount();
      const saved = JSON.parse(localStorage.getItem('customTheme') ?? '{}');
      expect(saved.primaryColor).toBe('#000001');
    } finally {
      vi.useRealTimers();
    }
  });
});
