// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StreamingReminderCard } from './StreamingReminderCard';

const navMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());
const subs = vi.hoisted(() => ({
  loading: false,
  wastedMonthlySpend: 12.99,
  updateProvider: vi.fn(() => Promise.resolve()),
  unusedInsights: [] as Array<{
    name: string;
    daysSinceLastWatch: number | null;
    monthlyPrice: number;
  }>,
}));

vi.mock('../../contexts/ThemeContextDef', async () => {
  const { defaultDynamicTheme } = await import('../../theme/dynamicTheme');
  return { useTheme: () => ({ currentTheme: defaultDynamicTheme }) };
});

vi.mock('../../hooks/useSubscriptionsData', () => ({
  useSubscriptionsData: () => ({
    unusedInsights: subs.unusedInsights,
    wastedMonthlySpend: subs.wastedMonthlySpend,
    updateProvider: subs.updateProvider,
    loading: subs.loading,
  }),
}));

vi.mock('../../hooks/useTransitionNavigate', () => ({ useTransitionNavigate: () => navMock }));

vi.mock('../../hooks/useProviderLogos', () => ({
  useProviderLogos: () => ({}),
  tmdbLogoUrl: () => null,
}));

vi.mock('../../lib/toast', () => ({ showUndoToast: toastMock }));

beforeEach(() => {
  navMock.mockReset();
  toastMock.mockReset();
  subs.updateProvider.mockClear();
  subs.loading = false;
  subs.wastedMonthlySpend = 12.99;
  subs.unusedInsights = [
    { name: 'Netflix', daysSinceLastWatch: 90, monthlyPrice: 12.99 },
    { name: 'Disney Plus', daysSinceLastWatch: 30, monthlyPrice: 8.99 },
  ];
});

afterEach(cleanup);

describe('StreamingReminderCard', () => {
  it('renders nothing while loading', () => {
    subs.loading = true;
    render(<StreamingReminderCard />);
    expect(screen.queryByText('Netflix')).toBeNull();
  });

  it('renders the wasted-spend header and unused provider rows', () => {
    render(<StreamingReminderCard />);
    expect(screen.getByText(/schläft/)).toBeInTheDocument();
    expect(screen.getByText('Netflix')).toBeInTheDocument();
    expect(screen.getByText('Disney Plus')).toBeInTheDocument();
    expect(screen.getAllByText('Pausieren').length).toBeGreaterThan(0);
  });

  it('pauses the provider and shows an undo toast when pausing', () => {
    render(<StreamingReminderCard />);
    fireEvent.click(screen.getByRole('button', { name: 'Netflix pausieren' }));
    expect(subs.updateProvider).toHaveBeenCalledWith('Netflix', { active: false });
    expect(toastMock).toHaveBeenCalled();
  });

  it('navigates to /subscriptions when the card body is clicked', () => {
    render(<StreamingReminderCard />);
    fireEvent.click(screen.getByText('Netflix'));
    expect(navMock).toHaveBeenCalledWith('/subscriptions');
  });
});
