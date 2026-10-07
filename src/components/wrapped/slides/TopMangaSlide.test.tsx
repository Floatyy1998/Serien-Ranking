// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { TopMangaSlide } from './TopMangaSlide';

afterEach(() => cleanup());

describe('TopMangaSlide', () => {
  it('zeigt Kapitelsumme, Spitzenreiter und die weiteren Plätze', () => {
    render(
      <TopMangaSlide
        manga={{
          totalChapters: 1234,
          uniqueManga: 3,
          mostReadMonth: 4,
          mostReadMonthChapters: 300,
          topManga: [
            { anilistId: 1, title: 'Solo Leveling', chapters: 200, poster: 'p.jpg' },
            { anilistId: 2, title: 'Berserk', chapters: 50 },
          ],
        }}
      />
    );
    expect(screen.getByText('Deine Top Manga')).toBeInTheDocument();
    expect(screen.getByText((1234).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText('Solo Leveling')).toBeInTheDocument();
    expect(screen.getByText('200 Kapitel')).toBeInTheDocument();
    expect(screen.getByText('Berserk')).toBeInTheDocument();
  });
});
