// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuickFilter } from './QuickFilter';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

vi.mock('../../contexts/ThemeContext', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

afterEach(cleanup);

describe('QuickFilter', () => {
  it('renders the floating filter button (smoke)', () => {
    render(<QuickFilter onFilterChange={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('reports the initial filter state on mount', () => {
    const onFilterChange = vi.fn();
    render(<QuickFilter onFilterChange={onFilterChange} initialFilters={{ genre: 'Drama' }} />);
    expect(onFilterChange).toHaveBeenCalled();
    const lastCall = onFilterChange.mock.calls[onFilterChange.mock.calls.length - 1]?.[0];
    expect(lastCall.genre).toBe('Drama');
  });

  it('shows an active-filter count badge', () => {
    render(<QuickFilter onFilterChange={() => {}} initialFilters={{ genre: 'Drama' }} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('opens the filter panel when the button is pressed', () => {
    render(<QuickFilter onFilterChange={() => {}} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Filter & Sortierung')).toBeInTheDocument();
  });
});
