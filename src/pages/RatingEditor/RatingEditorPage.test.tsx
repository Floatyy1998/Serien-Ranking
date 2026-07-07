// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

vi.mock('@mui/icons-material', () => ({
  Delete: () => null,
  Save: () => null,
  Star: () => null,
}));

const { theme, dataRef } = vi.hoisted(() => ({
  theme: { primary: '#3355ff' },
  dataRef: {
    current: {
      item: { title: 'Dark' } as { title: string } | null,
      activeTab: 'overall' as 'overall' | 'genre',
      setActiveTab: vi.fn(),
      overallRating: 8.5,
      genreRatings: { Action: 8 } as Record<string, number>,
      isSaving: false,
      snackbar: { open: false, message: '' },
      handleRatingChange: vi.fn(),
      handleGenreRatingChange: vi.fn(),
      handleSave: vi.fn(),
      handleDelete: vi.fn(),
    },
  },
}));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ currentTheme: theme }),
}));
vi.mock('./useRatingEditorData', () => ({ useRatingEditorData: () => dataRef.current }));
vi.mock('./OverallRatingSection', () => ({
  OverallRatingSection: () => <div data-testid="overall" />,
}));
vi.mock('./GenreRatingSection', () => ({
  GenreRatingSection: () => <div data-testid="genre" />,
}));
vi.mock('./RatingSnackbar', () => ({
  RatingSnackbar: ({ open }: { open: boolean }) => (open ? <div data-testid="snackbar" /> : null),
}));
vi.mock('../../components/ui', () => ({
  BackButton: () => <button aria-label="back" />,
  Dialog: ({ open }: { open?: boolean }) => (open ? <div data-testid="delete-dialog" /> : null),
}));

import { RatingEditorPage } from './RatingEditorPage';

beforeEach(() => {
  dataRef.current.item = { title: 'Dark' };
  dataRef.current.activeTab = 'overall';
  dataRef.current.handleSave = vi.fn();
  dataRef.current.handleDelete = vi.fn();
});

afterEach(() => cleanup());

describe('RatingEditorPage', () => {
  it('shows a not-found header when there is no item', () => {
    dataRef.current.item = null;
    render(<RatingEditorPage />);
    expect(screen.getByText('Nicht gefunden')).toBeInTheDocument();
  });

  it('renders the item title and the overall section', () => {
    render(<RatingEditorPage />);
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByTestId('overall')).toBeInTheDocument();
  });

  it('invokes save and delete handlers', () => {
    render(<RatingEditorPage />);
    fireEvent.click(screen.getByText('Speichern'));
    fireEvent.click(screen.getByText('Löschen'));
    expect(dataRef.current.handleSave).toHaveBeenCalledTimes(1);
    expect(dataRef.current.handleDelete).toHaveBeenCalledTimes(1);
  });
});
