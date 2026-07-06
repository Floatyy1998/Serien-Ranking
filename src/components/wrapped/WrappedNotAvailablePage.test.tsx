// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { WrappedNotAvailablePage } from './WrappedNotAvailablePage';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      accent: '#8b5cf6',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
      background: { default: '#000', surface: '#111' },
    },
  }),
}));

afterEach(() => cleanup());

describe('WrappedNotAvailablePage', () => {
  it('renders the year badge and coming-soon copy', () => {
    render(<WrappedNotAvailablePage year={2026} onBack={vi.fn()} />);
    expect(screen.getByText('Wrapped 2026')).toBeInTheDocument();
    expect(screen.getByText('Kommt bald')).toBeInTheDocument();
  });

  it('calls onBack when the back button is clicked', () => {
    const onBack = vi.fn();
    render(<WrappedNotAvailablePage year={2026} onBack={onBack} />);
    fireEvent.click(screen.getByText('Zurück zur Startseite'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
