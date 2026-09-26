// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

const h = vi.hoisted(() => ({ user: { uid: 'u1' }, setItem: vi.fn(async () => undefined) }));

vi.mock('@mui/icons-material', () =>
  Object.fromEntries(
    [
      'Add',
      'ArrowBack',
      'CheckCircle',
      'PlaylistAdd',
      'RadioButtonUnchecked',
      'Star',
      'Visibility',
    ].map((n) => [n, () => null])
  )
);
vi.mock('../../components/ui', () => ({
  BottomSheet: ({ isOpen, children }: { isOpen: boolean; children?: ReactNode }) =>
    isOpen ? <div>{children}</div> : null,
}));
vi.mock('../../contexts/AuthContext', () => ({ useAuth: () => ({ user: h.user }) }));
vi.mock('../../lib/interaction/haptics', () => ({ hapticTap: vi.fn() }));
vi.mock('../../lib/interaction/toast', () => ({ showToast: vi.fn() }));
vi.mock('../../services/rating/ratingFoldersService', () => ({ setRatingFolderItem: h.setItem }));

import { RatingItemActions } from './RatingItemActions';

const theme = {
  primary: '#f00',
  accent: '#0f0',
  text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
  border: { default: '#333' },
} as unknown as Parameters<typeof RatingItemActions>[0]['theme'];

const movie = {
  id: 7,
  title: 'Iron Man',
  posterUrl: '',
  rating: 8,
  progress: 0,
  watched: true,
  isMovie: true,
  watchlist: false,
  providers: [],
};

afterEach(() => cleanup());

describe('RatingItemActions', () => {
  it('toggles list membership and shows how many lists contain the title', async () => {
    const folders = [
      { id: 'f1', name: 'Marvel', createdAt: 1, items: new Set(['m_7']) },
      { id: 'f2', name: 'Favoriten', createdAt: 2, items: new Set<string>() },
    ];
    render(
      <RatingItemActions
        theme={theme}
        item={movie}
        folders={folders}
        onClose={vi.fn()}
        onRate={vi.fn()}
        onMarkWatched={vi.fn()}
        onCreateFolder={vi.fn()}
      />
    );
    expect(screen.queryByText('Als gesehen markieren')).toBeNull();
    expect(screen.getByText('in 1 Liste')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Zu Liste hinzufügen'));
    fireEvent.click(screen.getByText('Marvel'));
    await waitFor(() => expect(h.setItem).toHaveBeenCalledWith('u1', 'f1', 'm_7', false));
    fireEvent.click(screen.getByText('Favoriten'));
    await waitFor(() => expect(h.setItem).toHaveBeenCalledWith('u1', 'f2', 'm_7', true));
    fireEvent.click(screen.getByText('Zurück'));
    expect(screen.getByText('Bewertung ändern')).toBeInTheDocument();
  });
});
