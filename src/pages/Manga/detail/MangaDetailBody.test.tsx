// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ThemeContextType } from '../../../contexts/ThemeContextDef';
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
    editingNotes: false,
    setEditingNotes: vi.fn(),
    notesValue: '',
    setNotesValue: vi.fn(),
    showCustomPlatform: false,
    setShowCustomPlatform: vi.fn(),
    customPlatform: '',
    setCustomPlatform: vi.fn(),
    showDeleteConfirm: false,
    setShowDeleteConfirm: vi.fn(),
    onStatusChange: vi.fn(),
    onRating: vi.fn(),
    onPlatformSelect: vi.fn(),
    onSaveNotes: vi.fn(),
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
    expect(screen.getByText('Keine Notizen vorhanden.')).toBeInTheDocument();
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

  it('zeigt Verstecken-Aktion abhängig vom hidden-Flag', () => {
    const onToggleHide = vi.fn();
    render(
      <MangaDetailBody {...baseProps({ manga: makeManga({ hidden: true }), onToggleHide })} />
    );
    fireEvent.click(screen.getByText('Einblenden'));
    expect(onToggleHide).toHaveBeenCalledTimes(1);
  });
});
