// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

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
  const skip = new Set([
    'initial',
    'animate',
    'exit',
    'transition',
    'whileTap',
    'whileDrag',
    'values',
    'axis',
    'onReorder',
    'value',
  ]);
  const make = (tag: string) =>
    React.forwardRef(function M(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    Reorder: { Group: make('div'), Item: make('li') },
    AnimatePresence: (p: { children?: unknown }) =>
      React.createElement(React.Fragment, null, p.children as never),
  };
});

vi.mock('../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

const data = vi.hoisted(() => ({
  sectionOrder: ['hero', 'stats'],
  hiddenSections: [] as string[],
  handleSectionReorder: vi.fn(),
  handleSectionToggle: vi.fn(),
  handleReset: vi.fn(),
  getExpandableConfig: vi.fn(() => null),
}));
vi.mock('./useHomeLayoutData', () => ({ useHomeLayoutData: () => data }));

vi.mock('../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

vi.mock('./DraggableSectionItem', () => ({
  DraggableSectionItem: ({ sectionId }: { sectionId: string }) => (
    <div data-testid="section">{sectionId}</div>
  ),
}));

import { HomeLayoutPage } from './HomeLayoutPage';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HomeLayoutPage', () => {
  it('renders the toolbar and one item per section', () => {
    render(<HomeLayoutPage />);
    expect(screen.getByText('Sektionen')).toBeInTheDocument();
    expect(screen.getAllByTestId('section')).toHaveLength(2);
    expect(screen.getByText('hero')).toBeInTheDocument();
  });

  it('calls handleReset when the reset button is pressed', () => {
    render(<HomeLayoutPage />);
    fireEvent.click(screen.getByText('Zurücksetzen'));
    expect(data.handleReset).toHaveBeenCalledTimes(1);
  });
});
