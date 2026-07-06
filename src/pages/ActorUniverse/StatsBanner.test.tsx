// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StatsBanner } from './StatsBanner';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(['People'].map((n) => [n, stub]));
});

const theme = vi.hoisted(() => ({
  currentTheme: {
    primary: '#00d123',
    secondary: '#8b5cf6',
    accent: '#8b5cf6',
    background: { default: '#000', surface: '#111', surfaceHover: '#222', card: '#0a0a0a' },
    text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
    border: { default: '#333' },
    status: { success: '#4caf50', warning: '#f59e0b', error: '#ef4444' },
  },
}));
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => theme }));

afterEach(() => {
  cleanup();
});

describe('StatsBanner', () => {
  const pair = { actor1: 'Bryan Cranston', actor2: 'Aaron Paul', count: 4 };

  it('renders the label and the connected pair', () => {
    render(<StatsBanner mostConnectedPair={pair} />);
    expect(screen.getByText('Stärkstes Duo')).toBeInTheDocument();
    expect(screen.getByText('Bryan Cranston & Aaron Paul')).toBeInTheDocument();
  });

  it('renders the shared series count', () => {
    render(<StatsBanner mostConnectedPair={pair} />);
    expect(screen.getByText('4 gemeinsame Serien')).toBeInTheDocument();
  });
});
