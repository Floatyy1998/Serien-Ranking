// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const h = vi.hoisted(() => ({
  user: { uid: 'u1' },
  series: [{ id: 1, title: 'Loki', poster: { poster: '/l.jpg' } }],
  movies: [
    { id: 10, title: 'Iron Man', poster: { poster: '/i.jpg' } },
    { id: 11, title: 'Avengers', poster: { poster: '/a.jpg' } },
  ],
  create: vi.fn(async () => 'new-id'),
  save: vi.fn(async () => undefined),
  remove: vi.fn(async () => undefined),
  restore: vi.fn(async () => undefined),
  undoToast: vi.fn(),
}));

vi.mock('@mui/icons-material', () =>
  Object.fromEntries(
    ['CheckCircle', 'DeleteOutlined', 'Movie', 'RadioButtonUnchecked', 'Tv'].map((n) => [
      n,
      () => null,
    ])
  )
);
vi.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      whileTap: _w,
      ...rest
    }: { children?: ReactNode; whileTap?: unknown } & Record<string, unknown>) => (
      <button {...rest}>{children}</button>
    ),
  },
}));
vi.mock('../../components/ui', () => ({
  BottomSheet: ({ isOpen, children }: { isOpen: boolean; children?: ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
  SearchInput: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <input aria-label="search" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: h.user }) }));
vi.mock('../../contexts/SeriesListContext', () => ({
  useSeriesList: () => ({ allSeriesList: h.series }),
}));
vi.mock('../../contexts/MovieListContext', () => ({
  useMovieList: () => ({ movieList: h.movies }),
}));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#f00',
      background: { default: '#000', surface: '#111' },
      text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
      border: { default: '#333' },
    },
  }),
}));
vi.mock('../../lib/interaction/haptics', () => ({ hapticTap: vi.fn(), hapticSuccess: vi.fn() }));
vi.mock('../../lib/interaction/toast', () => ({ showToast: vi.fn(), showUndoToast: h.undoToast }));
vi.mock('../../services/rating/ratingFoldersService', () => ({
  createRatingFolder: h.create,
  saveRatingFolder: h.save,
  deleteRatingFolder: h.remove,
  restoreRatingFolder: h.restore,
}));

import { RatingFolderSheet } from './RatingFolderSheet';

beforeEach(() => {
  h.create.mockClear();
  h.save.mockClear();
  h.remove.mockClear();
  h.undoToast.mockClear();
});
afterEach(() => cleanup());

const nameInput = () => screen.getByPlaceholderText('z. B. Marvel oder Lieblingsfilme');

describe('RatingFolderSheet', () => {
  it('creates a folder with several selected titles', async () => {
    const onSaved = vi.fn();
    const onClose = vi.fn();
    render(
      <RatingFolderSheet
        state={{ open: true, folder: null }}
        onClose={onClose}
        onSaved={onSaved}
        onDeleted={vi.fn()}
      />
    );
    const save = screen.getByText('Liste anlegen (0)');
    expect(save).toBeDisabled();

    fireEvent.change(nameInput(), { target: { value: '  Marvel ' } });
    fireEvent.click(screen.getByText('Loki'));
    fireEvent.click(screen.getByText('Iron Man'));
    fireEvent.click(screen.getByText('Liste anlegen (2)'));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith('new-id'));
    expect(h.create).toHaveBeenCalledWith('u1', 'Marvel', new Set(['s_1', 'm_10']));
    expect(onClose).toHaveBeenCalled();
  });

  it('filters by kind, search and the current selection', () => {
    render(
      <RatingFolderSheet
        state={{ open: true, folder: null }}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        onDeleted={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('Filme'));
    expect(screen.queryByText('Loki')).toBeNull();
    fireEvent.change(screen.getByLabelText('search'), { target: { value: 'iron' } });
    expect(screen.queryByText('Avengers')).toBeNull();
    fireEvent.click(screen.getByText('Iron Man'));
    fireEvent.change(screen.getByLabelText('search'), { target: { value: '' } });
    fireEvent.click(screen.getByText('Ausgewählt (1)'));
    expect(screen.getByText('Iron Man')).toBeInTheDocument();
    expect(screen.queryByText('Avengers')).toBeNull();
  });

  it('edits an existing folder and deletes it with undo', async () => {
    const folder = { id: 'f1', name: 'Marvel', createdAt: 3, items: new Set(['m_10']) };
    const onDeleted = vi.fn();
    render(
      <RatingFolderSheet
        state={{ open: true, folder }}
        onClose={vi.fn()}
        onSaved={vi.fn()}
        onDeleted={onDeleted}
      />
    );
    expect(nameInput()).toHaveValue('Marvel');
    fireEvent.click(screen.getByText('Avengers'));
    fireEvent.click(screen.getByText('Speichern (2)'));
    await waitFor(() =>
      expect(h.save).toHaveBeenCalledWith('u1', folder, 'Marvel', new Set(['m_10', 'm_11']))
    );

    fireEvent.click(screen.getByLabelText('Liste löschen'));
    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith('f1'));
    expect(h.remove).toHaveBeenCalledWith('u1', 'f1');
    expect(h.undoToast).toHaveBeenCalled();
  });
});
