// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { InactiveProvidersSection } from './InactiveProvidersSection';
import type { ProviderInsight } from '../../../types/Subscription';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(['Add'].map((n) => [n, stub]));
});

vi.mock('../../../hooks/useProviderLogos', () => ({
  tmdbLogoUrl: (path?: string) => (path ? `https://image.tmdb.org/t/p/w45${path}` : undefined),
  useProviderLogos: () => ({}),
}));

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
vi.mock('../../../contexts/ThemeContext', () => ({ useTheme: () => theme }));

const makeInsight = (name: string): ProviderInsight => ({
  name,
  active: false,
  monthlyPrice: 0,
  cancelIfUnused: false,
  lastWatchedAt: null,
  daysSinceLastWatch: null,
  recentCount: 0,
  isUnused: false,
  lastWatchTitle: null,
  recentWatches: [],
});

afterEach(() => {
  cleanup();
});

describe('InactiveProvidersSection', () => {
  it('renders the heading and provider names', () => {
    render(
      <InactiveProvidersSection
        inactiveInsights={[makeInsight('Netflix'), makeInsight('WOW')]}
        providerLogos={{}}
        onActivate={vi.fn()}
      />
    );
    expect(screen.getByText('Andere Anbieter')).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('WOW')).toBeInTheDocument();
  });

  it('calls onActivate with the provider name when tapped', () => {
    const onActivate = vi.fn();
    render(
      <InactiveProvidersSection
        inactiveInsights={[makeInsight('Netflix')]}
        providerLogos={{}}
        onActivate={onActivate}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Netflix/ }));
    expect(onActivate).toHaveBeenCalledWith('Netflix');
  });
});
