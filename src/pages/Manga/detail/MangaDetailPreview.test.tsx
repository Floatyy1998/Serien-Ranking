// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AniListMangaSearchResult } from '../../../types/Manga';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import { MangaDetailPreview } from './MangaDetailPreview';
import { buildHeroData } from './mangaDetailData';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));

vi.mock('../../../components/ui', () => ({
  PageLayout: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  BackButton: () => <button type="button">back</button>,
}));

const theme = {
  primary: '#00d123',
  accent: '#00b0ff',
  text: { primary: '#fff', secondary: '#aaa', muted: '#777' },
} as unknown as ThemeContextType['currentTheme'];

function makeAniList(overrides: Partial<AniListMangaSearchResult> = {}): AniListMangaSearchResult {
  return {
    id: 123,
    title: { romaji: 'Berserk', english: 'Berserk EN', native: null },
    coverImage: { large: 'cover.jpg', medium: 'cover-s.jpg' },
    bannerImage: null,
    description: '<p>Ein <b>dunkles</b> Fantasy-Epos.</p>',
    chapters: 364,
    volumes: 41,
    status: 'RELEASING',
    format: 'MANGA',
    countryOfOrigin: 'JP',
    genres: ['Action', 'Drama', 'Horror'],
    averageScore: 93,
    startDate: { year: 1989, month: 8, day: 25 },
    isAdult: false,
    ...overrides,
  };
}

afterEach(() => cleanup());

describe('MangaDetailPreview', () => {
  it('rendert Titel, Format und bereinigte Beschreibung', () => {
    render(
      <MangaDetailPreview
        anilistData={makeAniList()}
        heroData={buildHeroData(123, undefined, makeAniList())}
        currentTheme={theme}
        isMobile
        ownedIds={new Set()}
        adding={false}
        onAdd={vi.fn()}
      />
    );
    expect(screen.getByRole('heading', { name: 'Berserk EN' })).toBeInTheDocument();
    // HTML aus der Beschreibung wird herausgefiltert
    expect(screen.getByText('Ein dunkles Fantasy-Epos.')).toBeInTheDocument();
    expect(screen.getByText(/364 Kapitel/)).toBeInTheDocument();
    expect(screen.getByText('Erschienen ab')).toBeInTheDocument();
  });

  it('ruft onAdd beim Klick auf den Hinzufügen-Button auf', () => {
    const onAdd = vi.fn();
    render(
      <MangaDetailPreview
        anilistData={makeAniList()}
        heroData={buildHeroData(123, undefined, makeAniList())}
        currentTheme={theme}
        isMobile
        ownedIds={new Set()}
        adding={false}
        onAdd={onAdd}
      />
    );
    fireEvent.click(screen.getByText('Zur Sammlung hinzufügen'));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('zeigt Genres als Chips', () => {
    render(
      <MangaDetailPreview
        anilistData={makeAniList()}
        heroData={buildHeroData(123, undefined, makeAniList())}
        currentTheme={theme}
        isMobile
        ownedIds={new Set()}
        adding={false}
        onAdd={vi.fn()}
      />
    );
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Drama')).toBeInTheDocument();
  });
});
