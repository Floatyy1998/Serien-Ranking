// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('@mui/icons-material', () => ({
  Bookmark: () => null,
  ChevronLeft: () => null,
  ChevronRight: () => null,
}));
vi.mock('./useCalendarData', () => ({ formatDate: (d: Date) => `D${d.getDate()}` }));
vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import { CalendarToolbar } from './CalendarToolbar';

const baseProps = {
  kwNumber: 27,
  monday: new Date('2026-06-29T00:00:00'),
  sunday: new Date('2026-07-05T00:00:00'),
  weekOffset: 0,
  onPrev: vi.fn(),
  onNext: vi.fn(),
  onReset: vi.fn(),
  watchlistOnly: false,
  onToggle: vi.fn(),
  totalEpisodes: 10,
  watchedCount: 4,
};

beforeEach(() => {
  baseProps.onPrev = vi.fn();
  baseProps.onNext = vi.fn();
  baseProps.onToggle = vi.fn();
});
afterEach(() => cleanup());

describe('CalendarToolbar', () => {
  it('renders the KW label and episode stats', () => {
    render(<CalendarToolbar {...baseProps} />);
    expect(screen.getAllByText(/KW 27/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('10 gesamt').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4 gesehen').length).toBeGreaterThan(0);
    expect(screen.getAllByText('6 offen').length).toBeGreaterThan(0);
  });

  it('invokes navigation callbacks from the week arrows', () => {
    render(<CalendarToolbar {...baseProps} />);
    const buttons = document.querySelectorAll('.cal-arrow-btn');
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    expect(baseProps.onPrev).toHaveBeenCalled();
    expect(baseProps.onNext).toHaveBeenCalled();
  });

  it('toggles the watchlist filter when the Watchlist chip is clicked', () => {
    render(<CalendarToolbar {...baseProps} />);
    fireEvent.click(screen.getAllByText('Watchlist')[0]);
    expect(baseProps.onToggle).toHaveBeenCalledWith(true);
  });

  it('hides the stats when there are no episodes', () => {
    render(<CalendarToolbar {...baseProps} totalEpisodes={0} watchedCount={0} />);
    expect(screen.queryByText(/gesamt/)).not.toBeInTheDocument();
  });
});
