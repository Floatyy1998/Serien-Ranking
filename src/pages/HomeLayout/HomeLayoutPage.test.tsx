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
    'layout',
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
    Reorder: { Group: make('div'), Item: make('div') },
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

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u1' } }),
}));

const data = vi.hoisted(() => ({
  sectionOrder: ['continue-watching', 'today-episodes'],
  hiddenSections: [] as string[],
  handleSectionReorder: vi.fn(),
  handleSectionToggle: vi.fn(),
  handleReset: vi.fn(),
  getExpandableConfig: vi.fn(() => null),
}));
vi.mock('./useHomeLayoutData', () => ({
  useHomeLayoutData: () => data,
  SECTION_LABELS: { 'continue-watching': 'Weiterschauen', 'today-episodes': 'Heute Neu' },
}));

const nav = vi.hoisted(() => ({
  setNavSlots: vi.fn(),
  resetNavSlots: vi.fn(),
}));
vi.mock('../../services/navConfig', () => nav);
vi.mock('../../hooks/useNavConfig', () => ({ useNavSlots: () => ['watchnext'] }));

vi.mock('../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  GradientText: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
}));

import { HomeLayoutPage } from './HomeLayoutPage';

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('HomeLayoutPage', () => {
  it('rendert die Canvas-Sektionen mit Auge-Toggle', () => {
    render(<HomeLayoutPage />);
    expect(screen.getByText('Weiterschauen')).toBeInTheDocument();
    expect(screen.getByText('Heute Neu')).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Weiterschauen ausblenden'));
    expect(data.handleSectionToggle).toHaveBeenCalledWith('continue-watching');
  });

  it('setzt Layout und Navigation gemeinsam zurück', () => {
    render(<HomeLayoutPage />);
    fireEvent.click(screen.getByText('Zurücksetzen'));
    expect(data.handleReset).toHaveBeenCalledTimes(1);
    expect(nav.resetNavSlots).toHaveBeenCalledWith('u1');
  });

  it('fügt Ziele aus der Palette hinzu und entfernt Slots aus dem Dock', () => {
    render(<HomeLayoutPage />);

    fireEvent.click(screen.getByLabelText('Kalender zur Navigation hinzufügen'));
    expect(nav.setNavSlots).toHaveBeenCalledWith('u1', ['watchnext', 'calendar']);

    fireEvent.click(screen.getByLabelText('Weiter aus der Navigation entfernen'));
    expect(nav.setNavSlots).toHaveBeenCalledWith('u1', []);
  });
});
