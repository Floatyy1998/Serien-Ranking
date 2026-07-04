// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (k !== 'whileTap') clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

// @mui/icons-material barrel would OOM the worker; stub the icons this tree imports.
vi.mock('@mui/icons-material', () => ({
  ArrowDownward: () => null,
  ArrowUpward: () => null,
  DragHandle: () => null,
}));

vi.mock('../../components/ui', () => ({
  HorizontalScrollContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { SortBar } from './SortBar';

const theme = { primary: '#00d123', text: { primary: '#fff', secondary: '#000' } };

afterEach(() => cleanup());

describe('SortBar', () => {
  it('renders all sort option labels', () => {
    render(
      <SortBar
        sortOption="name-asc"
        customOrderActive={false}
        onSort={vi.fn()}
        onToggleCustom={vi.fn()}
        theme={theme}
      />
    );
    expect(screen.getByText('Benutzerdefiniert')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Datum')).toBeInTheDocument();
    expect(screen.getByText('Fortschritt')).toBeInTheDocument();
  });

  it('calls onSort with the field key for a normal option', () => {
    const onSort = vi.fn();
    render(
      <SortBar
        sortOption="name-asc"
        customOrderActive={false}
        onSort={onSort}
        onToggleCustom={vi.fn()}
        theme={theme}
      />
    );
    fireEvent.click(screen.getByText('Datum'));
    expect(onSort).toHaveBeenCalledWith('date');
  });

  it('calls onToggleCustom for the custom option', () => {
    const onToggleCustom = vi.fn();
    render(
      <SortBar
        sortOption="name-asc"
        customOrderActive={false}
        onSort={vi.fn()}
        onToggleCustom={onToggleCustom}
        theme={theme}
      />
    );
    fireEvent.click(screen.getByText('Benutzerdefiniert'));
    expect(onToggleCustom).toHaveBeenCalledTimes(1);
  });
});
