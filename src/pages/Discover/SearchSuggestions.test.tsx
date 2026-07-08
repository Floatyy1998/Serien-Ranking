// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SearchSuggestionsProps } from './SearchSuggestions';

vi.mock(
  '@mui/icons-material',
  () =>
    new Proxy(
      { __esModule: true },
      {
        get: (_t, p) =>
          p === '__esModule'
            ? true
            : typeof p === 'symbol' || p === 'then'
              ? undefined
              : () => null,
        has: () => true,
      }
    )
);

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap', 'whileHover']);
  const make = (tag: string) =>
    React.forwardRef(function M(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return { motion };
});

const makeTheme = (): SearchSuggestionsProps['currentTheme'] => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return make() as SearchSuggestionsProps['currentTheme'];
};
const theme = makeTheme();

import { SearchSuggestions } from './SearchSuggestions';

afterEach(() => cleanup());

describe('SearchSuggestions', () => {
  it('renders the popular searches and selects one on click', () => {
    const onSelectTerm = vi.fn();
    render(
      <SearchSuggestions
        popularSearches={['Breaking Bad', 'Dune']}
        recentSearches={[]}
        onSelectTerm={onSelectTerm}
        onRemoveRecent={vi.fn()}
        currentTheme={theme}
      />
    );
    expect(screen.getByText('Beliebte Suchen')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Dune'));
    expect(onSelectTerm).toHaveBeenCalledWith('Dune');
  });

  it('hides the recent section when there are no recent searches', () => {
    render(
      <SearchSuggestions
        popularSearches={['Dune']}
        recentSearches={[]}
        onSelectTerm={vi.fn()}
        onRemoveRecent={vi.fn()}
        currentTheme={theme}
      />
    );
    expect(screen.queryByText('Zuletzt gesucht')).not.toBeInTheDocument();
  });

  it('renders recent searches and removes one on click', () => {
    const onRemoveRecent = vi.fn();
    const { container } = render(
      <SearchSuggestions
        popularSearches={[]}
        recentSearches={['Severance']}
        onSelectTerm={vi.fn()}
        onRemoveRecent={onRemoveRecent}
        currentTheme={theme}
      />
    );
    expect(screen.getByText('Zuletzt gesucht')).toBeInTheDocument();
    fireEvent.click(container.querySelector('.search-recent-remove-btn') as HTMLElement);
    expect(onRemoveRecent).toHaveBeenCalledWith('Severance');
  });
});
