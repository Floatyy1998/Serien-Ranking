// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { IntroSlide } from './IntroSlide';

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

describe('IntroSlide', () => {
  it('renders the year and the WRAPPED wordmark', () => {
    render(<IntroSlide year={2025} />);
    expect(screen.getByText('2025')).toBeInTheDocument();
    expect(screen.getByText('WRAPPED')).toBeInTheDocument();
    expect(screen.getByText('Dein Jahr in Serien & Filmen')).toBeInTheDocument();
  });

  it('greets the user when a username is passed', () => {
    render(<IntroSlide year={2025} username="Konrad" />);
    expect(screen.getByText('Hey Konrad!')).toBeInTheDocument();
  });

  it('omits the greeting when no username is given', () => {
    render(<IntroSlide year={2024} />);
    expect(screen.queryByText(/^Hey/)).not.toBeInTheDocument();
  });
});
