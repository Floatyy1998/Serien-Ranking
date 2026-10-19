// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SharedItem, TasteMatchResult } from '../../../services/social/tasteMatchService';
import { ReadingTab } from './ReadingTab';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../../Books/components/BookCover', () => ({ BookCover: () => <div /> }));

function makeResult(manga: SharedItem[], books: SharedItem[]): TasteMatchResult {
  const overlap = (shared: SharedItem[]) => ({
    score: 0,
    shared,
    userOnlyCount: 0,
    friendOnlyCount: 0,
  });
  return {
    overallMatch: 80,
    seriesOverlap: { score: 0, sharedSeries: [], userOnlyCount: 0, friendOnlyCount: 0 },
    movieOverlap: { score: 0, sharedMovies: [], userOnlyCount: 0, friendOnlyCount: 0 },
    mangaOverlap: overlap(manga),
    bookOverlap: overlap(books),
    reading: { shown: true, compared: true, score: 0 },
    genreMatch: { score: 0, sharedGenres: [], userTopGenres: [], friendTopGenres: [] },
    ratingMatch: { score: 0, averageDifference: 0, sameRatingCount: 0 },
    providerMatch: { score: 0, sharedProviders: [] },
  };
}

afterEach(() => cleanup());

describe('ReadingTab', () => {
  it('rendert gemeinsame Manga und Bücher getrennt', () => {
    const result = makeResult(
      [{ id: '1', title: 'Berserk', poster: 'https://img/b.jpg' }],
      [{ id: 'x', title: 'Dune', authors: ['Frank Herbert'] }]
    );
    render(<ReadingTab result={result} cardBg="#111" />);
    expect(screen.getByText('1 gemeinsame Manga')).toBeInTheDocument();
    expect(screen.getByText('1 gemeinsame Bücher')).toBeInTheDocument();
    expect(screen.getByText('Berserk')).toBeInTheDocument();
    expect(screen.getByText('Dune')).toBeInTheDocument();
  });

  it('rendert den Empty-State ohne Gemeinsamkeiten', () => {
    render(<ReadingTab result={makeResult([], [])} cardBg="#111" />);
    expect(screen.getByText('Keine gemeinsamen Manga oder Bücher')).toBeInTheDocument();
  });
});
