// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { QuickRatingSheet } from './QuickRatingSheet';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

vi.mock('../../../lib/interaction/haptics', () => ({
  hapticSelect: vi.fn(),
  hapticSuccess: vi.fn(),
}));

vi.mock('../../../contexts/ThemeContext', async () => {
  const { generateDynamicTheme } = await import('../../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme({
    primaryColor: '#00d123',
    backgroundColor: '#000000',
    accentColor: '#008a6e',
  });
  return { useTheme: () => ({ currentTheme }) };
});

afterEach(cleanup);

describe('QuickRatingSheet', () => {
  it('renders nothing visible when closed (smoke)', () => {
    render(
      <QuickRatingSheet isOpen={false} onClose={() => {}} seriesTitle="Dexter" onRate={() => {}} />
    );
    expect(screen.queryByText(/Dexter bewerten/)).not.toBeInTheDocument();
  });

  it('shows the series title when open', () => {
    render(<QuickRatingSheet isOpen onClose={() => {}} seriesTitle="Dexter" onRate={() => {}} />);
    expect(screen.getByText(/Dexter bewerten/)).toBeInTheDocument();
  });

  it('saves the selected rating', () => {
    const onRate = vi.fn<(rating: number, genreRatings?: Record<string, number>) => void>();
    render(<QuickRatingSheet isOpen onClose={() => {}} seriesTitle="Dexter" onRate={onRate} />);
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: /Speichern/ }));
    expect(onRate).toHaveBeenCalledWith(8, undefined);
  });

  it('closes without rating via the "Später" button', () => {
    const onClose = vi.fn();
    render(<QuickRatingSheet isOpen onClose={onClose} seriesTitle="Dexter" onRate={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Später' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
  it('offers the genre stage even for a title without own genres', () => {
    render(<QuickRatingSheet isOpen onClose={() => {}} seriesTitle="Dexter" onRate={() => {}} />);
    expect(screen.getByRole('button', { name: 'Alle Genres' })).toBeInTheDocument();
  });

  it('leaves untouched genres unrated and keeps the plain save path', () => {
    const onRate = vi.fn<(rating: number, genreRatings?: Record<string, number>) => void>();
    render(
      <QuickRatingSheet
        isOpen
        onClose={() => {}}
        seriesTitle="Dexter"
        genres={['Drama']}
        onRate={onRate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alle Genres' }));
    // Fremde Genres stehen auf 0 und duerfen so nicht mitgespeichert werden.
    fireEvent.click(screen.getByRole('button', { name: /Speichern/ }));
    expect(onRate).toHaveBeenCalledWith(8, undefined);
  });

  it('saves a foreign genre once it was rated', () => {
    const onRate = vi.fn<(rating: number, genreRatings?: Record<string, number>) => void>();
    render(
      <QuickRatingSheet
        isOpen
        onClose={() => {}}
        seriesTitle="Dexter"
        genres={['Drama']}
        onRate={onRate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alle Genres' }));
    fireEvent.change(screen.getByLabelText('Bewertung Western'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: /Speichern/ }));
    expect(onRate).toHaveBeenCalledWith(7, { Drama: 8, Western: 6 });
  });

  it('opens the genre stage from the grip and saves per-genre values', () => {
    const onRate = vi.fn<(rating: number, genreRatings?: Record<string, number>) => void>();
    render(
      <QuickRatingSheet
        isOpen
        onClose={() => {}}
        seriesTitle="Dexter"
        genres={['Drama', 'Crime']}
        onRate={onRate}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: '8' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alle Genres' }));

    fireEvent.change(screen.getByLabelText('Bewertung Crime'), { target: { value: '6' } });
    fireEvent.click(screen.getByRole('button', { name: /Speichern/ }));

    // Gesamt = Durchschnitt der Einzelwerte.
    expect(onRate).toHaveBeenCalledWith(7, { Drama: 8, Crime: 6 });
  });

  it('opens already expanded when the stored genre values differ', () => {
    render(
      <QuickRatingSheet
        isOpen
        onClose={() => {}}
        seriesTitle="Dexter"
        genres={['Drama', 'Crime']}
        initialGenreRatings={{ Drama: 9, Crime: 7 }}
        onRate={() => {}}
      />
    );
    expect(screen.getByRole('button', { name: 'Weniger' })).toBeInTheDocument();
    expect(screen.getByLabelText('Bewertung Drama')).toHaveValue('9');
  });

  it('levels every genre back to the overall rating', () => {
    const onRate = vi.fn<(rating: number, genreRatings?: Record<string, number>) => void>();
    render(
      <QuickRatingSheet
        isOpen
        onClose={() => {}}
        seriesTitle="Dexter"
        genres={['Drama', 'Crime']}
        initialGenreRatings={{ Drama: 9, Crime: 7 }}
        onRate={onRate}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Angleichen/ }));
    fireEvent.click(screen.getByRole('button', { name: /Speichern/ }));
    expect(onRate).toHaveBeenCalledWith(8, { Drama: 8, Crime: 8 });
  });
});
