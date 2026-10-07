// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import type { Manga } from '../../../types/Manga';
import { buildHeroData } from './mangaDetailData';
import { MangaDetailHero, type MangaHeroProgress } from './MangaDetailHero';

vi.mock('../../../components/ui', () => ({
  BackButton: () => <button type="button">back</button>,
}));

const theme = {
  primary: '#00d123',
  accent: '#00b0ff',
  background: { default: '#000' },
  text: { secondary: '#aaa' },
} as unknown as ThemeContextType['currentTheme'];

function makeManga(overrides: Partial<Manga> = {}): Manga {
  return {
    nmr: 1,
    anilistId: 123,
    title: 'Vagabond',
    poster: 'poster.jpg',
    rating: {},
    currentChapter: 100,
    readStatus: 'reading',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    status: 'FINISHED',
    chapters: 327,
    genres: ['Action', 'Drama'],
    averageScore: 90,
    titleRomaji: 'Vagabond Romaji',
    ...overrides,
  };
}

const owned = (over: Partial<MangaHeroProgress> = {}): MangaHeroProgress => ({
  manga: makeManga(),
  editChapter: 100,
  effectiveChapters: 327,
  progress: 30,
  userRating: 0,
  onChapterChange: vi.fn(),
  onRate: vi.fn(),
  ...over,
});

afterEach(() => cleanup());

describe('MangaDetailHero', () => {
  it('rendert Titel, Format, Fakten und Fortschritt', () => {
    const manga = makeManga();
    render(
      <MangaDetailHero
        data={buildHeroData(123, manga, null)}
        currentTheme={theme}
        isMobile={false}
        owned={owned({ manga })}
      />
    );
    expect(screen.getByRole('heading', { name: 'Vagabond' })).toBeInTheDocument();
    expect(screen.getByText('Manga')).toBeInTheDocument();
    expect(screen.getByText('Vagabond Romaji')).toBeInTheDocument();
    expect(screen.getByText('/ 327')).toBeInTheDocument();
    expect(screen.getByText('227')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('zählt Kapitel über Stepper und Hauptknopf hoch und runter', () => {
    const onChapterChange = vi.fn<(next: number) => void>();
    render(
      <MangaDetailHero
        data={buildHeroData(123, makeManga(), null)}
        currentTheme={theme}
        isMobile
        owned={owned({ onChapterChange })}
      />
    );
    fireEvent.click(screen.getByLabelText('Ein Kapitel zurück'));
    fireEvent.click(screen.getByLabelText('Ein Kapitel weiter'));
    fireEvent.click(screen.getByText('Kapitel 101 gelesen'));
    expect(onChapterChange).toHaveBeenCalledWith(99);
    expect(onChapterChange).toHaveBeenNthCalledWith(2, 101);
    expect(onChapterChange).toHaveBeenNthCalledWith(3, 101);
  });

  it('meldet abgeschlossene Lektüre statt eines weiteren Kapitels', () => {
    render(
      <MangaDetailHero
        data={buildHeroData(123, makeManga(), null)}
        currentTheme={theme}
        isMobile={false}
        owned={owned({ editChapter: 327 })}
      />
    );
    expect(screen.getByText('Alles gelesen')).toBeInTheDocument();
    expect(screen.getByLabelText('Ein Kapitel weiter')).toBeDisabled();
  });

  it('zeigt bei fremden Manga den Hinzufügen-Knopf', () => {
    const onAdd = vi.fn();
    render(
      <MangaDetailHero
        data={buildHeroData(123, makeManga(), null)}
        currentTheme={theme}
        isMobile={false}
        onAdd={onAdd}
      />
    );
    fireEvent.click(screen.getByText('Zur Sammlung hinzufügen'));
    expect(onAdd).toHaveBeenCalled();
    expect(screen.queryByLabelText('Ein Kapitel weiter')).not.toBeInTheDocument();
  });
});
