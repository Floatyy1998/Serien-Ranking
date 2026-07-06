// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { FirstLastSlide } from './FirstLastSlide';
import type { FirstLastWatch } from '../../types/Wrapped';

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

const first: FirstLastWatch = {
  type: 'episode',
  title: 'Pilot Serie',
  subtitle: 'S1 E1',
  date: '01.01.2025',
  timestamp: '2025-01-01T20:00:00Z',
  id: 1,
};

const last: FirstLastWatch = {
  type: 'movie',
  title: 'Silvester Film',
  date: '31.12.2025',
  timestamp: '2025-12-31T23:00:00Z',
  id: 2,
};

describe('FirstLastSlide', () => {
  it('renders a fallback when both watches are null', () => {
    render(<FirstLastSlide firstWatch={null} lastWatch={null} year={2025} />);
    expect(screen.getByText('Keine Daten verfügbar')).toBeInTheDocument();
  });

  it('renders both first and last watch entries', () => {
    render(<FirstLastSlide firstWatch={first} lastWatch={last} year={2025} />);
    expect(screen.getByText('ERSTES')).toBeInTheDocument();
    expect(screen.getByText('LETZTES')).toBeInTheDocument();
    expect(screen.getByText('Pilot Serie')).toBeInTheDocument();
    expect(screen.getByText('S1 E1')).toBeInTheDocument();
    expect(screen.getByText('Silvester Film')).toBeInTheDocument();
    expect(screen.getByText('Dein 2025 - Start bis Ende')).toBeInTheDocument();
  });
});
