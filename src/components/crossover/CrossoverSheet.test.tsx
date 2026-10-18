// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CrossoverEntry } from '../../types/Crossover';

const navigateMock = vi.hoisted(() => vi.fn());
const user = vi.hoisted(() => ({ uid: 'u1' }));
const seriesList = vi.hoisted(() => [
  {
    id: 62688,
    title: 'Supergirl',
    seasons: [{ seasonNumber: 4, episodes: [{ watched: true }, { watched: false }] }],
  },
]);

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['whileTap', 'whileHover', 'initial', 'animate', 'exit', 'transition']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: seriesList, refetchAfterAdd: vi.fn() }),
}));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#0f0',
      accent: '#00f',
      text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
      background: { surface: '#111' },
      border: { default: '#333' },
      status: { error: '#f00' },
    },
  }),
}));
vi.mock('../ui/overlay/BottomSheet', () => ({
  BottomSheet: ({ isOpen, children }: { isOpen: boolean; children: React.ReactNode }) =>
    isOpen ? <div data-testid="sheet">{children}</div> : null,
}));
vi.mock('../../services/crossover/crossoverService', () => ({ deleteCrossover: vi.fn() }));
vi.mock('../../services/series/addToLibrary', () => ({ addToLibrary: vi.fn() }));
vi.mock('../../lib/interaction/toast', () => ({ showToast: vi.fn() }));

import { CrossoverSheet } from './CrossoverSheet';

const entry: CrossoverEntry = {
  title: 'Crisis on Infinite Earths',
  kind: 'crossover',
  year: 2019,
  parts: [
    { id: 62688, t: 'Supergirl', s: 5, e: 1, n: 'Part One' },
    { id: 89247, t: 'Batwoman', s: 1, e: 9, n: 'Part Two' },
  ],
  createdBy: 'someone-else',
  createdAt: 1,
  source: 'community',
};

afterEach(() => {
  cleanup();
  navigateMock.mockReset();
});

describe('CrossoverSheet', () => {
  it('zeigt die Teile in Reihenfolge mit Sehstatus und Listen-Hinweis', () => {
    render(
      <CrossoverSheet isOpen id="crisis" entry={entry} onClose={vi.fn()} navigate={navigateMock} />
    );
    expect(screen.getByText('Crisis on Infinite Earths')).toBeInTheDocument();
    expect(screen.getByText('S5 E1 · Part One')).toBeInTheDocument();
    expect(screen.getByLabelText('Gesehen')).toBeInTheDocument();
    expect(screen.getByText('Nicht in deiner Liste')).toBeInTheDocument();
    expect(screen.getByText('Von der Community ergänzt')).toBeInTheDocument();
    expect(screen.getByText('Korrektur vorschlagen')).toBeInTheDocument();
  });

  it('springt zur Folge, wenn die Serie in der Liste ist, sonst zur Serie', () => {
    const onClose = vi.fn();
    render(
      <CrossoverSheet isOpen id="crisis" entry={entry} onClose={onClose} navigate={navigateMock} />
    );
    fireEvent.click(screen.getByText('Supergirl'));
    expect(navigateMock).toHaveBeenCalledWith('/episode/62688/s/5/e/1');
    fireEvent.click(screen.getByText('Batwoman'));
    expect(navigateMock).toHaveBeenCalledWith('/series/89247');
    expect(onClose).toHaveBeenCalled();
  });

  it('bietet dem Ersteller Bearbeiten und Löschen an', () => {
    const onEdit = vi.fn();
    render(
      <CrossoverSheet
        isOpen
        id="crisis"
        entry={{ ...entry, createdBy: 'u1' }}
        onClose={vi.fn()}
        onEdit={onEdit}
        navigate={navigateMock}
      />
    );
    fireEvent.click(screen.getByText('Bearbeiten'));
    expect(onEdit).toHaveBeenCalledWith('crisis');
    fireEvent.click(screen.getByText('Löschen'));
    expect(screen.getByText('Wirklich löschen?')).toBeInTheDocument();
  });
});
