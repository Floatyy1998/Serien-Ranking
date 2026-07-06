// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LoadingSpinner } from './LoadingSpinner';

if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      text: { secondary: '#ddd' },
    },
  }),
}));

afterEach(() => cleanup());

describe('LoadingSpinner', () => {
  it('renders a status role for assistive tech', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows a visually hidden loading label by default', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Daten werden geladen')).toBeInTheDocument();
  });

  it('renders custom text when provided', () => {
    render(<LoadingSpinner text="Lädt Serien…" />);
    expect(screen.getByText('Lädt Serien…')).toBeInTheDocument();
    expect(screen.queryByText('Daten werden geladen')).not.toBeInTheDocument();
  });
});
