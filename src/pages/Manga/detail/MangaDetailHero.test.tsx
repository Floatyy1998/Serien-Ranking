// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ThemeContextType } from '../../../contexts/ThemeContextDef';
import type { Manga } from '../../../types/Manga';
import { MangaDetailHero } from './MangaDetailHero';

vi.mock('../../../components/ui', () => ({
  BackButton: () => <button type="button">back</button>,
}));

const theme = {
  primary: '#00d123',
  accent: '#00b0ff',
  background: { default: '#000' },
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
    status: 'HIATUS',
    genres: ['Action', 'Drama'],
    averageScore: 90,
    titleRomaji: 'Vagabond Romaji',
    ...overrides,
  };
}

afterEach(() => cleanup());

describe('MangaDetailHero', () => {
  it('rendert Titel, Format und Kapitelinfo', () => {
    render(
      <MangaDetailHero
        manga={makeManga()}
        currentTheme={theme}
        isMobile={false}
        editChapter={100}
        effectiveChapters={327}
        progress={30}
        staff={[]}
        onChapterChange={vi.fn()}
      />
    );
    expect(screen.getByRole('heading', { name: 'Vagabond' })).toBeInTheDocument();
    expect(screen.getByText('Manga')).toBeInTheDocument();
    expect(screen.getByText('327 Kapitel')).toBeInTheDocument();
    expect(screen.getByText('von 327 Kapiteln')).toBeInTheDocument();
  });

  it('ruft onChapterChange mit inkrementierten/dekrementierten Werten auf', () => {
    const onChange = vi.fn<(next: number) => void>();
    render(
      <MangaDetailHero
        manga={makeManga()}
        currentTheme={theme}
        isMobile={true}
        editChapter={100}
        effectiveChapters={327}
        progress={30}
        staff={[]}
        onChapterChange={onChange}
      />
    );
    const buttons = screen.getAllByRole('button');
    // buttons: [BackButton, minus, plus]
    fireEvent.click(buttons[1]);
    fireEvent.click(buttons[2]);
    expect(onChange).toHaveBeenCalledWith(99);
    expect(onChange).toHaveBeenCalledWith(101);
  });

  it('zeigt Autoren aus dem staff-Array', () => {
    render(
      <MangaDetailHero
        manga={makeManga()}
        currentTheme={theme}
        isMobile={false}
        editChapter={100}
        effectiveChapters={null}
        progress={0}
        staff={[{ role: 'Story & Art', node: { name: { full: 'Takehiko Inoue' } } }]}
        onChapterChange={vi.fn()}
      />
    );
    expect(screen.getByText('Takehiko Inoue')).toBeInTheDocument();
  });
});
