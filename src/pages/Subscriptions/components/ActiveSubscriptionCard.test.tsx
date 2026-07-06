// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ActiveSubscriptionCard } from './ActiveSubscriptionCard';
import type { ProviderInsight } from '../../../types/Subscription';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(
    [
      'CheckCircleOutline',
      'ExpandLess',
      'ExpandMore',
      'NotificationsActive',
      'NotificationsNone',
      'Warning',
    ].map((n) => [n, stub])
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

const makeInsight = (over: Partial<ProviderInsight> = {}): ProviderInsight => ({
  name: 'Netflix',
  active: true,
  monthlyPrice: 12.99,
  cancelIfUnused: false,
  lastWatchedAt: Date.now(),
  daysSinceLastWatch: 2,
  recentCount: 3,
  isUnused: false,
  lastWatchTitle: 'Stranger Things',
  recentWatches: [{ title: 'Stranger Things', timestamp: 1700000000000, seriesId: 55 }],
  ...over,
});

const updateProvider = vi.fn(() => Promise.resolve());
const setSeriesOverride = vi.fn(() => Promise.resolve());

const baseProps = {
  logoPath: undefined,
  unusedThresholdDays: 60,
  activeInsights: [makeInsight()],
  moveMenuFor: null,
  onMoveMenuChange: vi.fn(),
  seriesOverrides: {} as Record<string, string>,
  updateProvider,
  setSeriesOverride,
};

afterEach(() => {
  cleanup();
  updateProvider.mockReset();
  setSeriesOverride.mockReset();
});

describe('ActiveSubscriptionCard', () => {
  it('renders the provider name and last-watched meta', () => {
    render(
      <ActiveSubscriptionCard
        insight={makeInsight()}
        expanded={false}
        onToggleExpand={vi.fn()}
        {...baseProps}
      />
    );
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText(/vor 2 Tagen geschaut/)).toBeInTheDocument();
  });

  it('toggles cancel-if-unused via updateProvider', () => {
    render(
      <ActiveSubscriptionCard
        insight={makeInsight({ cancelIfUnused: false })}
        expanded={false}
        onToggleExpand={vi.fn()}
        {...baseProps}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Kündigen wenn ungenutzt umschalten' }));
    expect(updateProvider).toHaveBeenCalledWith('Netflix', { cancelIfUnused: true });
  });

  it('calls onToggleExpand when the expand button is clicked', () => {
    const onToggleExpand = vi.fn();
    render(
      <ActiveSubscriptionCard
        insight={makeInsight()}
        expanded={false}
        onToggleExpand={onToggleExpand}
        {...baseProps}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Letzte Aufrufe anzeigen' }));
    expect(onToggleExpand).toHaveBeenCalledTimes(1);
  });

  it('renders the diagnostics list when expanded', () => {
    render(
      <ActiveSubscriptionCard
        insight={makeInsight()}
        expanded
        onToggleExpand={vi.fn()}
        {...baseProps}
      />
    );
    expect(screen.getByText('Zuletzt zugeordnet')).toBeInTheDocument();
    expect(screen.getByText('Stranger Things')).toBeInTheDocument();
  });
});
