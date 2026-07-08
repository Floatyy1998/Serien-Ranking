// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import type { Manga } from '../../../types/Manga';
import { MangaDetailBody } from './MangaDetailBody';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

const theme = {
  primary: '#00d123',
  accent: '#00b0ff',
  secondary: '#888888',
  text: { primary: '#ffffff', secondary: '#aaaaaa' },
} as unknown as ThemeContextType['currentTheme'];

function makeManga(overrides: Partial<Manga> = {}): Manga {
  return {
    nmr: 1,
    anilistId: 123,
    title: 'One Piece',
    poster: 'poster.jpg',
    rating: {},
    currentChapter: 50,
    readStatus: 'reading',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    status: 'FINISHED',
    notes: '',
    ...overrides,
  };
}

type BodyProps = Parameters<typeof MangaDetailBody>[0];

function baseProps(overrides: Partial<BodyProps> = {}): BodyProps {
  return {
    manga: makeManga(),
    anilistId: 123,
    currentTheme: theme,
    chapterInfo: null,
    displayData: null,
    cleanDescription: '',
    userRating: 0,
    notesValue: '',
    notesStatus: 'idle',
    showCustomPlatform: false,
    setShowCustomPlatform: vi.fn(),
    customPlatform: '',
    setCustomPlatform: vi.fn(),
    showDeleteConfirm: false,
    setShowDeleteConfirm: vi.fn(),
    onStatusChange: vi.fn(),
    onChapterChange: vi.fn(),
    onRating: vi.fn(),
    onPlatformSelect: vi.fn(),
    onNotesChange: vi.fn(),
    onNotesFocus: vi.fn(),
    onNotesBlur: vi.fn(),
    onToggleHide: vi.fn(),
    onDelete: vi.fn(),
    ...overrides,
  };
}

afterEach(() => cleanup());

describe('MangaDetailBody', () => {
  it('rendert Status-, Bewertungs- und Notizen-Abschnitte', () => {
    render(<MangaDetailBody {...baseProps()} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Bewertung')).toBeInTheDocument();
    expect(screen.getByText('Notizen')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Deine Notizen zu diesem Manga…')).toBeInTheDocument();
  });

  it('F13: Tippen ruft onNotesChange, Blur ruft onNotesBlur (Autosave, kein Speichern-Button)', () => {
    const onNotesChange = vi.fn();
    const onNotesBlur = vi.fn();
    render(<MangaDetailBody {...baseProps({ onNotesChange, onNotesBlur })} />);
    // Kein Edit-Modus-Umweg mehr.
    expect(screen.queryByText('Bearbeiten')).not.toBeInTheDocument();
    expect(screen.queryByText('Speichern')).not.toBeInTheDocument();
    const textarea = screen.getByPlaceholderText('Deine Notizen zu diesem Manga…');
    fireEvent.change(textarea, { target: { value: 'Neue Notiz' } });
    expect(onNotesChange).toHaveBeenCalledWith('Neue Notiz');
    fireEvent.blur(textarea);
    expect(onNotesBlur).toHaveBeenCalledTimes(1);
  });

  it('ruft onStatusChange beim Klick auf einen Status-Button auf', () => {
    const onStatusChange = vi.fn<(status: Manga['readStatus']) => void>();
    render(<MangaDetailBody {...baseProps({ onStatusChange })} />);
    fireEvent.click(screen.getByText('Abgeschlossen'));
    expect(onStatusChange).toHaveBeenCalledWith('completed');
  });

  it('zeigt Löschbestätigung und ruft onDelete auf', () => {
    const onDelete = vi.fn();
    render(<MangaDetailBody {...baseProps({ showDeleteConfirm: true, onDelete })} />);
    expect(screen.getByText('Wirklich entfernen?')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ja'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  const chapterInfo = {
    mangadexId: null,
    estimatedNextDate: null,
    avgDaysBetweenReleases: null,
    recentChapters: [
      { chapter: 40, publishedAt: '2024-01-01', title: 'A' },
      { chapter: 60, publishedAt: '2024-02-01', title: 'B' },
    ],
  } as unknown as BodyProps['chapterInfo'];

  it('setzt currentChapter beim Klick auf "bis hier gelesen" (Vorwärtsschritt) direkt', () => {
    const onChapterChange = vi.fn();
    render(
      <MangaDetailBody
        {...baseProps({
          manga: makeManga({ currentChapter: 50, status: 'RELEASING' }),
          chapterInfo,
          onChapterChange,
        })}
      />
    );
    // Kapitel 60 liegt über dem Stand 50 → direkter Vorwärtsschritt, keine Bestätigung
    fireEvent.click(screen.getByRole('button', { name: 'Bis Kapitel 60 als gelesen markieren' }));
    expect(onChapterChange).toHaveBeenCalledWith(60);
  });

  it('verlangt Bestätigung bei einem Rückschritt und ruft dann onChapterChange auf', () => {
    const onChapterChange = vi.fn();
    render(
      <MangaDetailBody
        {...baseProps({
          manga: makeManga({ currentChapter: 50, status: 'RELEASING' }),
          chapterInfo,
          onChapterChange,
        })}
      />
    );
    // Kapitel 40 liegt unter dem Stand 50 → Rückschritt, erst bestätigen
    fireEvent.click(
      screen.getByRole('button', { name: 'Fortschritt auf Kapitel 40 zurücksetzen' })
    );
    expect(onChapterChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Ja'));
    expect(onChapterChange).toHaveBeenCalledWith(40);
  });

  it('zeigt Verstecken-Aktion abhängig vom hidden-Flag', () => {
    const onToggleHide = vi.fn();
    render(
      <MangaDetailBody {...baseProps({ manga: makeManga({ hidden: true }), onToggleHide })} />
    );
    fireEvent.click(screen.getByText('Einblenden'));
    expect(onToggleHide).toHaveBeenCalledTimes(1);
  });
});
