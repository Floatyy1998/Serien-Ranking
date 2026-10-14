// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MangaLink } from '../../../lib/books/mangaVolume';
import type { Manga } from '../../../types/Manga';
import { MangaVolumePanel } from './MangaVolumePanel';

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#ef6f8a',
      accent: '#f2a648',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
    },
  }),
}));

const link = (owned?: Partial<Manga>): MangaLink => ({
  manga: {
    id: 157489,
    title: { romaji: 'Shinigami no Hanayome', english: 'Bride of the Death God', native: null },
    coverImage: { large: 'l.jpg', medium: 'm.jpg' },
  } as MangaLink['manga'],
  owned: owned
    ? ({ anilistId: 157489, title: 'Bride of the Death God', ...owned } as Manga)
    : undefined,
  volume: 1,
});

const handlers = () => ({
  onOpen: vi.fn(),
  onAdd: vi.fn(),
  onMove: vi.fn(),
  onMoveToBooks: vi.fn(),
});

afterEach(cleanup);

describe('MangaVolumePanel', () => {
  it('bietet bei einem geführten Manga den Wechsel zum Buch an, nach Rückfrage', () => {
    const h = handlers();
    render(<MangaVolumePanel link={link({})} savedAsBook={false} busy={false} {...h} />);
    expect(screen.getByText('Zum Manga')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Als Buch führen'));
    expect(h.onMoveToBooks).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Ja'));
    expect(h.onMoveToBooks).toHaveBeenCalledTimes(1);
  });

  it('bleibt ohne Wechsel-Handler beim reinen „Zum Manga"', () => {
    const { onMoveToBooks: _unused, ...h } = handlers();
    render(<MangaVolumePanel link={link({})} savedAsBook={false} busy={false} {...h} />);
    expect(screen.queryByText('Als Buch führen')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Zum Manga'));
    expect(h.onOpen).toHaveBeenCalledTimes(1);
  });
});
