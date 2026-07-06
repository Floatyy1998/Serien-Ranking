// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const hookState = vi.hoisted(() => ({
  value: {} as Record<string, unknown>,
}));

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: { primary: '#00d123', background: { default: '#000' } },
  }),
}));

vi.mock('./useWatchJourneyData', () => ({
  useWatchJourneyData: () => hookState.value,
}));

vi.mock('../../components/ui', () => ({
  PageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
    <div>
      header:{title}
      {actions}
    </div>
  ),
}));

vi.mock('./WatchJourneyLoadingState', () => ({
  WatchJourneyLoadingState: () => <div>loading-state</div>,
}));
vi.mock('./WatchJourneyEmptyState', () => ({
  WatchJourneyEmptyState: () => <div>empty-state</div>,
}));
vi.mock('./WatchJourneyTabs', () => ({
  WatchJourneyTabs: () => <div>tabs</div>,
}));
vi.mock('./WatchJourneyTabContent', () => ({
  WatchJourneyTabContent: () => <div>tab-content</div>,
}));
vi.mock('./WatchJourneyYearPicker', () => {
  const Picker = () => <div>year-picker</div>;
  Picker.Dropdown = () => <div>year-dropdown</div>;
  return { WatchJourneyYearPicker: Picker };
});

import { WatchJourneyPage } from './WatchJourneyPage';

const baseState = {
  loading: false,
  data: { year: 2024 },
  trendsData: null,
  activeTab: 'activity',
  setActiveTab: () => {},
  selectedYear: 2024,
  showYearPicker: false,
  toggleYearPicker: () => {},
  selectYear: () => {},
  chartWidth: 400,
  availableYears: [2024],
  hasData: true,
};

beforeEach(() => {
  hookState.value = { ...baseState };
});
afterEach(() => cleanup());

describe('WatchJourneyPage', () => {
  it('renders the loading state while loading', () => {
    hookState.value = { ...baseState, loading: true };
    render(<WatchJourneyPage />);
    expect(screen.getByText('loading-state')).toBeInTheDocument();
  });

  it('renders the empty state when there is no data', () => {
    hookState.value = { ...baseState, hasData: false };
    render(<WatchJourneyPage />);
    expect(screen.getByText('empty-state')).toBeInTheDocument();
  });

  it('renders the header, tabs and content when data exists', () => {
    render(<WatchJourneyPage />);
    expect(screen.getByText('header:Watch Journey')).toBeInTheDocument();
    expect(screen.getByText('tabs')).toBeInTheDocument();
    expect(screen.getByText('tab-content')).toBeInTheDocument();
  });
});
