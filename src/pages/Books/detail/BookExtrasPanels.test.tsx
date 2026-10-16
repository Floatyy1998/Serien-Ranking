// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BookSearchResult } from '../../../types/Book';

const similar = vi.hoisted(() => vi.fn());
const ready = vi.hoisted(() => ({ value: true }));

vi.mock('@mui/icons-material', () => ({
  AutoAwesome: () => null,
  ExpandMore: () => null,
  WarningAmber: () => null,
  AutoFixHigh: () => null,
  Favorite: () => null,
  Fingerprint: () => null,
  HistoryEdu: () => null,
  Lightbulb: () => null,
  Science: () => null,
}));
vi.mock('../../../services/i18n', () => ({ appLocale: 'de', t: (text: string) => text }));
vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#ef6f8a',
      accent: '#f2a648',
      text: { primary: '#fff', secondary: '#eee', muted: '#999' },
    },
  }),
}));
vi.mock('../../../components/ui', () => ({
  HorizontalScrollContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
vi.mock('../../../services/api/hardcoverApi', () => ({
  hardcoverReady: () => ready.value,
  hardcoverSimilar: similar,
}));
vi.mock('../discover/DiscoverParts', () => ({
  DiscoverCard: ({ result }: { result: BookSearchResult }) => <div>{result.title}</div>,
  SkeletonCards: () => <div>lädt</div>,
}));
vi.mock('../discover/useAddFlow', () => ({
  useAddFlow: () => ({ openAdd: vi.fn(), sheet: null }),
}));

import { BookMoodPanel, SimilarBooksPanel } from './BookExtrasPanels';

const book = (n: number): BookSearchResult => ({
  id: `hc-${n}`,
  title: `Ähnlich ${n}`,
  authors: [],
  source: 'hardcover',
});

beforeEach(() => {
  ready.value = true;
  similar.mockReset();
});
afterEach(cleanup);

describe('BookMoodPanel', () => {
  it('zeigt Stimmungen übersetzt und verbirgt die Inhaltshinweise zunächst', () => {
    render(
      <BookMoodPanel moods={['tense', 'dark']} pace={['fast-paced']} warnings={['violence']} />
    );
    expect(screen.getByText('Spannend')).toBeTruthy();
    expect(screen.getByText('Düster')).toBeTruthy();
    expect(screen.getByText('Temporeich')).toBeTruthy();
    expect(screen.queryByText('Gewalt')).toBeNull();
    fireEvent.click(screen.getByText('Inhaltshinweise anzeigen'));
    expect(screen.getByText('Gewalt')).toBeTruthy();
    fireEvent.click(screen.getByText('Inhaltshinweise ausblenden'));
    expect(screen.queryByText('Gewalt')).toBeNull();
  });

  it('bleibt ohne Daten unsichtbar', () => {
    const { container } = render(<BookMoodPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('zeigt nur die Hinweise, wenn es keine Stimmung gibt', () => {
    render(<BookMoodPanel warnings={['murder']} />);
    expect(screen.queryByText('Stimmung & Tempo')).toBeNull();
    fireEvent.click(screen.getByText('Inhaltshinweise anzeigen'));
    expect(screen.getByText('Mord')).toBeTruthy();
  });
});

describe('SimilarBooksPanel', () => {
  it('zeigt die ähnlichen Bücher', async () => {
    similar.mockResolvedValue([book(1), book(2)]);
    render(<SimilarBooksPanel hardcoverId={328491} />);
    await waitFor(() => expect(screen.getByText('Ähnlich 1')).toBeTruthy());
    expect(screen.getByText('Das könnte dir auch gefallen')).toBeTruthy();
    expect(similar).toHaveBeenCalledWith(328491);
  });

  it('verschwindet ohne Treffer', async () => {
    similar.mockResolvedValue([]);
    const { container } = render(<SimilarBooksPanel hardcoverId={1} />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('fragt nicht, wenn Hardcover pausiert ist', async () => {
    ready.value = false;
    const { container } = render(<SimilarBooksPanel hardcoverId={1} />);
    await waitFor(() => expect(container.firstChild).toBeNull());
    expect(similar).not.toHaveBeenCalled();
  });
});
