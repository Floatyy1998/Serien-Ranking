// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const navigate = vi.hoisted(() => vi.fn<(path: string) => void>());

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
  useLocation: () => ({ pathname: '/watch-journey' }),
}));

vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      text: { primary: '#fff', secondary: '#ccc' },
      background: { surface: '#111', default: '#000' },
      border: { default: '#333' },
    },
  }),
}));

import { WatchJourneyEmptyState } from './WatchJourneyEmptyState';

const currentYear = new Date().getFullYear();
const noop = () => {};

beforeEach(() => navigate.mockReset());
afterEach(() => cleanup());

describe('WatchJourneyEmptyState', () => {
  it('renders the empty state message for the selected year', () => {
    render(
      <WatchJourneyEmptyState
        selectedYear={currentYear}
        showYearPicker={false}
        availableYears={[currentYear]}
        toggleYearPicker={noop}
        selectYear={noop}
      />
    );
    expect(screen.getByText('Watch Journey')).toBeInTheDocument();
    expect(screen.getByText(`Keine Daten für ${currentYear}`)).toBeInTheDocument();
  });

  it('navigates to discover from the current-year CTA', () => {
    render(
      <WatchJourneyEmptyState
        selectedYear={currentYear}
        showYearPicker={false}
        availableYears={[currentYear]}
        toggleYearPicker={noop}
        selectYear={noop}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /entdecken/ }));
    expect(navigate).toHaveBeenCalledWith('/discover');
  });
});
