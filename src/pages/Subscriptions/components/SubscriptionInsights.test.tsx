// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SubscriptionInsights } from './SubscriptionInsights';
import type { ProviderInsight } from '../../../types/Subscription';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(['ErrorOutline'].map((n) => [n, stub]));
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
vi.mock('../../../contexts/ThemeContextDef', () => ({ useTheme: () => theme }));

const makeInsight = (name: string): ProviderInsight => ({
  name,
  active: true,
  monthlyPrice: 12,
  cancelIfUnused: true,
  lastWatchedAt: null,
  daysSinceLastWatch: null,
  recentCount: 0,
  isUnused: true,
  lastWatchTitle: null,
  recentWatches: [],
});

afterEach(() => {
  cleanup();
});

describe('SubscriptionInsights', () => {
  it('renders the active count and spend', () => {
    render(
      <SubscriptionInsights
        activeCount={3}
        unusedInsights={[]}
        totalMonthlySpend={35.5}
        wastedMonthlySpend={0}
        unusedThresholdDays={60}
      />
    );
    expect(screen.getByText('Aktive Abos')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('Alles wird genutzt 🎉')).toBeInTheDocument();
  });

  it('renders the cancellation suggestion when there are unused subscriptions', () => {
    render(
      <SubscriptionInsights
        activeCount={2}
        unusedInsights={[makeInsight('Netflix'), makeInsight('WOW')]}
        totalMonthlySpend={30}
        wastedMonthlySpend={20}
        unusedThresholdDays={45}
      />
    );
    expect(screen.getByText('Vorschlag')).toBeInTheDocument();
    expect(screen.getByText(/2 Abos schläft/)).toBeInTheDocument();
    expect(screen.getByText(/45 Tagen/)).toBeInTheDocument();
  });
});
