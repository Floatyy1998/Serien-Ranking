// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      text: { primary: '#fff', secondary: '#ccc' },
      background: { surface: '#111' },
      border: { default: '#333' },
    },
  }),
}));

import { WatchJourneyYearPicker } from './WatchJourneyYearPicker';

const noop = () => {};

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('WatchJourneyYearPicker', () => {
  it('renders the selected year and toggles on click', () => {
    const toggle = vi.fn<() => void>();
    render(
      <WatchJourneyYearPicker
        selectedYear={2024}
        showYearPicker={false}
        availableYears={[2023, 2024]}
        toggleYearPicker={toggle}
        selectYear={noop}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /2024/ }));
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('renders year options in the dropdown and selects one', () => {
    const selectYear = vi.fn<(y: number) => void>();
    render(
      <WatchJourneyYearPicker.Dropdown
        showYearPicker
        availableYears={[2023, 2024]}
        selectedYear={2024}
        selectYear={selectYear}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '2023' }));
    expect(selectYear).toHaveBeenCalledWith(2023);
  });
});
