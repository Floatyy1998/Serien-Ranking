// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ExpandableConfig } from './useHomeLayoutData';

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

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) =>
        prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf'
          ? () => '#3355ff'
          : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

vi.mock('./useHomeLayoutData', () => ({
  SECTION_LABELS: { hero: 'Held-Bereich' } as Record<string, string>,
}));

import { DraggableSectionItem } from './DraggableSectionItem';

afterEach(() => cleanup());

describe('DraggableSectionItem', () => {
  it('renders the mapped section label', () => {
    render(
      <DraggableSectionItem
        sectionId="hero"
        isHidden={false}
        onToggle={vi.fn()}
        expandableConfig={null}
      />
    );
    expect(screen.getByText('Held-Bereich')).toBeInTheDocument();
  });

  it('calls onToggle when the visibility switch is clicked', () => {
    const onToggle = vi.fn();
    render(
      <DraggableSectionItem
        sectionId="hero"
        isHidden={false}
        onToggle={onToggle}
        expandableConfig={null}
      />
    );
    fireEvent.click(screen.getByLabelText('Held-Bereich ausblenden'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('toggles the expandable section when the label is clicked', () => {
    const setExpanded = vi.fn();
    const config: ExpandableConfig = {
      expanded: false,
      setExpanded,
      order: ['x'],
      onReorder: vi.fn(),
      hiddenItems: [],
      labels: { x: 'Item X' },
      onToggle: vi.fn(),
    };
    render(
      <DraggableSectionItem
        sectionId="hero"
        isHidden={false}
        onToggle={vi.fn()}
        expandableConfig={config}
      />
    );
    fireEvent.click(screen.getByText('Held-Bereich'));
    expect(setExpanded).toHaveBeenCalledWith(true);
  });
});
