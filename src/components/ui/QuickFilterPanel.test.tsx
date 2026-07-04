// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuickFilterPanel } from './QuickFilterPanel';

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

vi.mock('../../contexts/ThemeContextDef', async () => {
  const { generateDynamicTheme } = await import('../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

const Icon = () => <span data-testid="filter-icon" />;

function baseProps() {
  return {
    isMovieMode: false,
    isRatingsMode: false,
    hasBottomNav: true,
    searchQuery: '',
    setSearchQuery: vi.fn<(v: string) => void>(),
    selectedGenre: '',
    setSelectedGenre: vi.fn<(v: string) => void>(),
    selectedProvider: '',
    setSelectedProvider: vi.fn<(v: string) => void>(),
    selectedQuickFilter: '',
    setSelectedQuickFilter: vi.fn<(v: string) => void>(),
    selectedSort: 'rating-desc',
    setSelectedSort: vi.fn<(v: string) => void>(),
    quickFilters: [{ value: 'unwatched', label: 'Ungesehen', icon: Icon }],
    activeFiltersCount: 0,
    clearFilters: vi.fn(),
  };
}

afterEach(cleanup);

describe('QuickFilterPanel', () => {
  it('renders the section labels (smoke)', () => {
    render(<QuickFilterPanel {...baseProps()} />);
    expect(screen.getByText('Filter & Sortierung')).toBeInTheDocument();
    expect(screen.getByText('Schnellfilter')).toBeInTheDocument();
    expect(screen.getByText('Genre')).toBeInTheDocument();
    expect(screen.getByText('Streaming-Anbieter')).toBeInTheDocument();
  });

  it('toggles a quick filter on click', () => {
    const props = baseProps();
    render(<QuickFilterPanel {...props} />);
    fireEvent.click(screen.getByRole('button', { name: /Ungesehen/ }));
    expect(props.setSelectedQuickFilter).toHaveBeenCalledWith('unwatched');
  });

  it('shows the reset button and sort options only when relevant', () => {
    const props = { ...baseProps(), isRatingsMode: true, activeFiltersCount: 2 };
    render(<QuickFilterPanel {...props} />);
    const reset = screen.getByRole('button', { name: 'Zurücksetzen' });
    fireEvent.click(reset);
    expect(props.clearFilters).toHaveBeenCalledTimes(1);
    // Sort dropdown only in ratings mode
    expect(screen.getByText('Sortierung')).toBeInTheDocument();
  });

  it('does not render the reset button without active filters', () => {
    render(<QuickFilterPanel {...baseProps()} />);
    expect(screen.queryByRole('button', { name: 'Zurücksetzen' })).not.toBeInTheDocument();
  });
});
