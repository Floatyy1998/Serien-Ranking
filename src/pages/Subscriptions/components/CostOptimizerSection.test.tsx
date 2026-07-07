// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CostOptimizerSection } from './CostOptimizerSection';
import type { ProviderInsight } from '../../../types/Subscription';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(
    ['TrendingDown', 'TrendingUp', 'Bolt', 'ExpandMore'].map((n) => [n, stub])
  );
});

vi.mock('../../../hooks/useProviderLogos', () => ({
  tmdbLogoUrl: (path?: string) => (path ? `https://image.tmdb.org/t/p/w92${path}` : undefined),
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

const makeInsight = (over: Partial<ProviderInsight> & { name: string }): ProviderInsight => ({
  active: true,
  monthlyPrice: 0,
  cancelIfUnused: false,
  lastWatchedAt: null,
  daysSinceLastWatch: null,
  recentCount: 0,
  isUnused: false,
  lastWatchTitle: null,
  recentWatches: [],
  recentWatchMinutes: 0,
  monthlyWatchHours: 0,
  costPerHour: null,
  ...over,
});

// Guter Wert, teuer und ungenutzt — deckt alle drei handlungsrelevanten Tiers ab.
const greatValue = makeInsight({
  name: 'Netflix',
  monthlyPrice: 12,
  recentCount: 40,
  recentWatchMinutes: 1200,
  monthlyWatchHours: 20,
  costPerHour: 0.6,
});
const expensive = makeInsight({
  name: 'HBO Max',
  monthlyPrice: 10,
  recentCount: 1,
  recentWatchMinutes: 60,
  monthlyWatchHours: 1,
  costPerHour: 10,
});
const unused = makeInsight({
  name: 'Disney Plus',
  monthlyPrice: 8,
  isUnused: true,
});

afterEach(() => {
  cleanup();
});

describe('CostOptimizerSection', () => {
  it('renders nothing when no active subscription has a price', () => {
    const { container } = render(
      <CostOptimizerSection
        activeInsights={[makeInsight({ name: 'Netflix' }), makeInsight({ name: 'WOW' })]}
        unusedThresholdDays={60}
        providerLogos={{}}
        updateProvider={vi.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('ranks providers by value and shows a value badge per tier', () => {
    render(
      <CostOptimizerSection
        activeInsights={[greatValue, expensive, unused]}
        unusedThresholdDays={60}
        providerLogos={{}}
        updateProvider={vi.fn()}
      />
    );
    expect(screen.getByText('Kosten-Optimizer')).toBeInTheDocument();
    expect(screen.getByText('Top-Wert')).toBeInTheDocument();
    expect(screen.getByText('Teuer/Std.')).toBeInTheDocument();
    expect(screen.getByText('Ungenutzt')).toBeInTheDocument();
  });

  it('offers a pause action only for expensive/unused providers', () => {
    render(
      <CostOptimizerSection
        activeInsights={[greatValue, expensive, unused]}
        unusedThresholdDays={60}
        providerLogos={{}}
        updateProvider={vi.fn()}
      />
    );
    // Netflix (Top-Wert) bekommt keinen Pausieren-Button → nur 2 Buttons.
    expect(screen.getAllByRole('button', { name: 'Pausieren' })).toHaveLength(2);
  });

  it('pauses a provider via updateProvider(name, { active: false })', () => {
    const updateProvider = vi.fn(() => Promise.resolve());
    render(
      <CostOptimizerSection
        activeInsights={[greatValue, expensive, unused]}
        unusedThresholdDays={60}
        providerLogos={{}}
        updateProvider={updateProvider}
      />
    );
    // Ungenutzt wird oben gerankt → erster Pausieren-Button gehört zu Disney Plus.
    fireEvent.click(screen.getAllByRole('button', { name: 'Pausieren' })[0]);
    expect(updateProvider).toHaveBeenCalledWith('Disney Plus', { active: false });
  });

  it('collapses and expands via the header toggle', () => {
    render(
      <CostOptimizerSection
        activeInsights={[greatValue, expensive]}
        unusedThresholdDays={60}
        providerLogos={{}}
        updateProvider={vi.fn()}
      />
    );
    const toggle = screen.getByRole('button', { name: /Kosten-Optimizer/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });
});
