// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: (props: Record<string, unknown>) =>
      React.createElement(React.Fragment, null, props.children as React.ReactNode),
  };
});

vi.mock('../../../contexts/ThemeContext', () => {
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

vi.mock('../../../components/ui', () => ({
  GradientText: ({ children }: { children: React.ReactNode }) => <h1>{children}</h1>,
}));
vi.mock('../SortBar', () => ({ SortBar: () => <div data-testid="sort-bar" /> }));
vi.mock('../ProviderFilter', () => ({
  ProviderFilter: () => <div data-testid="provider-filter" />,
}));

import { WatchNextHeader } from './WatchNextHeader';

const baseProps = {
  episodeCount: 42,
  customOrderActive: false,
  editModeActive: false,
  onToggleEditMode: vi.fn(),
  showFilter: false,
  onToggleFilter: vi.fn(),
  filterInput: '',
  onFilterInputChange: vi.fn(),
  sortOption: 'name-asc',
  onSort: vi.fn(),
  onToggleCustomOrder: vi.fn(),
  availableProviders: [],
  providerFilter: null,
  onSelectProvider: vi.fn(),
  hasAnySubscription: false,
  onlyMySubs: false,
  onToggleOnlyMySubs: vi.fn(),
};

afterEach(() => cleanup());

describe('WatchNextHeader', () => {
  it('renders the title and the episode count', () => {
    render(<WatchNextHeader {...baseProps} />);
    expect(screen.getByText('Als Nächstes')).toBeInTheDocument();
    expect(screen.getByText('42 nächste Episoden')).toBeInTheDocument();
  });

  it('does not show the filter input while showFilter is false', () => {
    render(<WatchNextHeader {...baseProps} />);
    expect(screen.queryByPlaceholderText('Serie suchen...')).not.toBeInTheDocument();
  });

  it('reveals the filter section (input + subcomponents) when showFilter is true', () => {
    render(<WatchNextHeader {...baseProps} showFilter />);
    expect(screen.getByPlaceholderText('Serie suchen...')).toBeInTheDocument();
    expect(screen.getByTestId('sort-bar')).toBeInTheDocument();
    expect(screen.getByTestId('provider-filter')).toBeInTheDocument();
  });

  it('shows the edit button only when a custom order is active and forwards its click', () => {
    const onToggleEditMode = vi.fn();
    const { rerender } = render(<WatchNextHeader {...baseProps} />);
    // Only the filter button exists by default (customOrderActive=false).
    expect(screen.getAllByRole('button')).toHaveLength(1);

    rerender(
      <WatchNextHeader {...baseProps} customOrderActive onToggleEditMode={onToggleEditMode} />
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[0]);
    expect(onToggleEditMode).toHaveBeenCalledTimes(1);
  });
});
