// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { WrappedStats } from '../../../types/Wrapped';

vi.mock('../../../lib/interaction/haptics', () => ({ hapticTap: vi.fn() }));
vi.mock('../WrappedShareCard', () => ({
  WrappedShareSheet: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div>SHARE_SHEET</div> : null),
}));

import { BingeStatsSlide } from './BingeStatsSlide';
import { FirstLastSlide } from './FirstLastSlide';
import { HeatmapSlide } from './HeatmapSlide';
import { IntroSlide } from './IntroSlide';
import { LateNightSlide } from './LateNightSlide';
import { MonthlyBreakdownSlide } from './MonthlyBreakdownSlide';
import { RecordDaySlide } from './RecordDaySlide';
import { SummarySlide } from './SummarySlide';
import { TimePatternSlide } from './TimePatternSlide';
import { TopBooksSlide } from './TopBooksSlide';
import { TopGenresSlide } from './TopGenresSlide';
import { TopMangaSlide } from './TopMangaSlide';
import { TopMoviesSlide } from './TopMoviesSlide';
import { TopProvidersSlide } from './TopProvidersSlide';
import { TopSeriesSlide } from './TopSeriesSlide';
import { TotalTimeSlide } from './TotalTimeSlide';

beforeAll(() => {
  if (!window.matchMedia) {
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
  }
});
afterEach(() => cleanup());

// active={false}: die Zähler stehen dann sofort auf dem Endwert, statt hochzuzählen.
const idle = { active: false } as const;

const month = (m: number, minutes: number) => ({
  month: m,
  monthName: m === 9 ? 'September' : `M${m}`,
  episodesWatched: 10,
  moviesWatched: 1,
  minutesWatched: minutes,
});

describe('Wrapped-Folien', () => {
  it('Intro grüßt mit Namen und nennt das Jahr', () => {
    render(<IntroSlide year={2026} username="Mia" {...idle} />);
    expect(screen.getByText('Hey Mia!')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '2026' })).toBeInTheDocument();
  });

  it('Intro nennt nur die Medien, die im Jahr vorkamen', () => {
    const { rerender } = render(
      <IntroSlide year={2026} media={{ watch: true, manga: true, books: true }} {...idle} />
    );
    expect(screen.getByText('Dein Jahr in Serien, Filmen, Manga & Büchern')).toBeInTheDocument();
    rerender(
      <IntroSlide year={2026} media={{ watch: false, manga: false, books: true }} {...idle} />
    );
    expect(screen.getByText('Dein Jahr in Büchern')).toBeInTheDocument();
    rerender(<IntroSlide year={2026} {...idle} />);
    expect(screen.getByText('Dein Jahr in Serien & Filmen')).toBeInTheDocument();
  });

  it('Intro kommt ohne Namen ohne Gruß aus', () => {
    render(<IntroSlide year={2026} {...idle} />);
    expect(screen.queryByText(/Hey/)).not.toBeInTheDocument();
  });

  it('Gesamtzeit zeigt Stunden als Riesenzahl und die Einzelwerte', () => {
    render(
      <TotalTimeSlide
        totalMinutes={51840}
        totalHours={864}
        totalDays={36}
        totalEpisodes={1284}
        totalMovies={47}
        {...idle}
      />
    );
    expect(screen.getByRole('img', { name: '864' })).toBeInTheDocument();
    expect(screen.getByText('Das sind 36 Tage am Stück.')).toBeInTheDocument();
    expect(screen.getByText('1.284')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
  });

  it('Gesamtzeit fällt unter einer Stunde auf Minuten zurück', () => {
    render(
      <TotalTimeSlide
        totalMinutes={24}
        totalHours={0.4}
        totalDays={0}
        totalEpisodes={1}
        totalMovies={0}
        {...idle}
      />
    );
    expect(screen.getByRole('img', { name: '24' })).toBeInTheDocument();
    expect(screen.queryByText(/Tage am Stück/)).not.toBeInTheDocument();
  });

  it('Erstes und Letztes nennt beide Titel mit Datum', () => {
    render(
      <FirstLastSlide
        year={2026}
        firstWatch={{
          type: 'episode',
          title: 'Severance',
          subtitle: 'S2 E1',
          date: '2026-01-01',
          timestamp: '',
          id: 1,
        }}
        lastWatch={{
          type: 'movie',
          title: 'Interstellar',
          date: '2026-12-30',
          timestamp: '',
          id: 2,
        }}
        {...idle}
      />
    );
    expect(screen.getByText('1. Januar')).toBeInTheDocument();
    expect(screen.getByText('30. Dezember')).toBeInTheDocument();
    expect(screen.getByText('S2 E1')).toBeInTheDocument();
  });

  it('Erstes und Letztes ohne Daten sagt das offen', () => {
    render(<FirstLastSlide year={2026} firstWatch={null} lastWatch={null} {...idle} />);
    expect(screen.getByText('Keine Daten verfügbar')).toBeInTheDocument();
  });

  it('Top-Serien stellt die Nummer 1 heraus und listet den Rest', () => {
    render(
      <TopSeriesSlide
        topSeries={[
          { id: 1, title: 'Breaking Bad', episodesWatched: 62, minutesWatched: 1 },
          { id: 2, title: 'Dark', episodesWatched: 26, minutesWatched: 1 },
        ]}
        {...idle}
      />
    );
    expect(screen.getByRole('heading', { name: 'Breaking Bad' })).toBeInTheDocument();
    expect(screen.getByText('62 Episoden')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('Top-Serien und Top-Filme haben einen leeren Zustand', () => {
    render(<TopSeriesSlide topSeries={[]} {...idle} />);
    expect(screen.getByText('Keine Serien dieses Jahr')).toBeInTheDocument();
    cleanup();
    render(<TopMoviesSlide topMovies={[]} {...idle} />);
    expect(screen.getByText('Keine Filme dieses Jahr')).toBeInTheDocument();
  });

  it('Top-Filme zeigt die Bewertung, sonst die Laufzeit', () => {
    render(
      <TopMoviesSlide
        topMovies={[
          { id: 1, title: 'Interstellar', rating: 9.5, minutesWatched: 169 },
          { id: 2, title: 'Dune', minutesWatched: 125 },
        ]}
        {...idle}
      />
    );
    expect(screen.getByText('9.5 / 10')).toBeInTheDocument();
    expect(screen.getByText('2 Std 5 Min')).toBeInTheDocument();
  });

  it('Top-Manga zählt Kapitel oder Bände', () => {
    render(
      <TopMangaSlide
        manga={{
          totalChapters: 200,
          uniqueManga: 2,
          topManga: [
            { anilistId: 1, title: 'Berserk', chapters: 180 },
            { anilistId: 2, title: 'Vagabond', chapters: 0, volumes: 1 },
          ],
          mostReadMonth: 4,
          mostReadMonthChapters: 60,
        }}
        {...idle}
      />
    );
    expect(screen.getByText('180 Kapitel')).toBeInTheDocument();
    expect(screen.getByText('1 Band')).toBeInTheDocument();
    expect(screen.getByText(/Lesemonat: Mai mit 60 Kapiteln/)).toBeInTheDocument();
  });

  it('Top-Bücher nennt Autor und das dickste Buch', () => {
    render(
      <TopBooksSlide
        books={{
          booksFinished: 1,
          pagesRead: 800,
          topBooks: [{ id: 'a', title: 'Dune', author: 'Frank Herbert', pages: 800 }],
          longestBook: { title: 'Dune', pages: 800 },
          mostReadMonth: 0,
          mostReadMonthPages: 800,
        }}
        {...idle}
      />
    );
    expect(screen.getByText('Frank Herbert, 800 Seiten')).toBeInTheDocument();
    expect(screen.getByText(/Dickstes Buch: Dune mit 800 Seiten/)).toBeInTheDocument();
  });

  it('Genres: das stärkste als Titel, alle in der Rangliste', () => {
    render(
      <TopGenresSlide
        topGenres={[
          { genre: 'Drama', count: 4, percentage: 42, minutesWatched: 1 },
          { genre: 'Horror', count: 2, percentage: 20, minutesWatched: 1 },
        ]}
        {...idle}
      />
    );
    expect(screen.getByRole('heading', { name: 'Drama' })).toBeInTheDocument();
    expect(screen.getByText('Horror')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('Genres und Dienste haben einen leeren Zustand', () => {
    render(<TopGenresSlide topGenres={[]} {...idle} />);
    expect(screen.getByText('Keine Genre-Daten')).toBeInTheDocument();
    cleanup();
    render(<TopProvidersSlide topProviders={[]} {...idle} />);
    expect(screen.getByText('Keine Streaming-Daten')).toBeInTheDocument();
  });

  it('Streaming-Dienste nennen den meistgenutzten mit Anteil', () => {
    render(
      <TopProvidersSlide
        topProviders={[
          {
            name: 'Netflix',
            episodeCount: 5,
            movieCount: 1,
            totalCount: 6,
            minutesWatched: 1,
            percentage: 45,
          },
          {
            name: 'Disney+',
            episodeCount: 2,
            movieCount: 0,
            totalCount: 2,
            minutesWatched: 1,
            percentage: 25,
          },
        ]}
        {...idle}
      />
    );
    expect(screen.getByRole('heading', { name: 'Netflix' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '45%' })).toBeInTheDocument();
    expect(screen.getByText('Disney+')).toBeInTheDocument();
  });

  it('Rekord-Tag zählt Episoden und Filme zusammen', () => {
    render(
      <RecordDaySlide
        mostActiveDay={{
          date: '2026-03-14',
          dayName: 'Samstag',
          episodesWatched: 17,
          moviesWatched: 1,
          minutesWatched: 745,
        }}
        {...idle}
      />
    );
    expect(screen.getByRole('heading', { name: '14. März' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: '18' })).toBeInTheDocument();
    expect(screen.getByText('12 Std 25 Min')).toBeInTheDocument();
  });

  it('Zeitmuster nennt Tageszeit und Lieblingstag', () => {
    render(
      <TimePatternSlide
        favoriteTimeOfDay={{ timeOfDay: 'evening', label: 'x', count: 1, percentage: 54 }}
        favoriteDayOfWeek={{ dayOfWeek: 0, dayName: 'Sonntag', count: 1, percentage: 20 }}
        {...idle}
      />
    );
    expect(screen.getByRole('heading', { name: 'Abends' })).toBeInTheDocument();
    expect(screen.getByText('Sonntag')).toBeInTheDocument();
  });

  it('Nacht-Folie zeigt den Anteil oder den Früh-ins-Bett-Zustand', () => {
    render(
      <LateNightSlide
        lateNightStats={{
          totalLateNightWatches: 30,
          midnightWatches: 8,
          latestWatch: { time: '03:14', title: 'Nachtfilm' },
          percentage: 33,
        }}
        {...idle}
      />
    );
    expect(screen.getByRole('img', { name: '33%' })).toBeInTheDocument();
    expect(screen.getByText('03:14')).toBeInTheDocument();
    cleanup();
    render(
      <LateNightSlide
        lateNightStats={{
          totalLateNightWatches: 0,
          midnightWatches: 0,
          latestWatch: null,
          percentage: 0,
        }}
        {...idle}
      />
    );
    expect(screen.getByText('Früh ins Bett?')).toBeInTheDocument();
  });

  it('Heatmap hebt die stärkste Stunde hervor', () => {
    const data = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    data[3][20] = 9;
    const { container } = render(<HeatmapSlide heatmapData={data} {...idle} />);
    expect(screen.getByRole('heading', { name: 'Mi 20:00 Uhr' })).toBeInTheDocument();
    expect(screen.getByText('9 Views zu dieser Zeit')).toBeInTheDocument();
    expect(container.querySelectorAll('.w-heat__cell.is-peak')).toHaveLength(1);
  });

  it('Binge-Folie nennt die längste Session oder den leeren Zustand', () => {
    render(
      <BingeStatsSlide
        totalBingeSessions={7}
        averageBingeLength={4.2}
        longestBinge={{
          seriesId: 1,
          seriesTitle: 'Dark',
          episodeCount: 12,
          totalMinutes: 600,
          date: '',
        }}
        {...idle}
      />
    );
    expect(screen.getByRole('img', { name: '12' })).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    cleanup();
    render(
      <BingeStatsSlide
        totalBingeSessions={0}
        averageBingeLength={0}
        longestBinge={null}
        {...idle}
      />
    );
    expect(screen.getByText('Kein Binge-Watching')).toBeInTheDocument();
  });

  it('Monate: der aktivste ist hervorgehoben', () => {
    const months = Array.from({ length: 12 }, (_, i) => month(i + 1, i === 8 ? 900 : 100));
    const { container } = render(
      <MonthlyBreakdownSlide monthlyBreakdown={months} mostActiveMonth={months[8]} {...idle} />
    );
    expect(screen.getByRole('heading', { name: 'September' })).toBeInTheDocument();
    expect(container.querySelectorAll('.w-month.is-top')).toHaveLength(1);
  });

  it('Abschluss zeigt nur vorhandene Kennzahlen, und Teilen öffnet das Bild-Sheet', () => {
    const stats = {
      year: 2026,
      totalHoursWatched: 12,
      totalEpisodesWatched: 30,
      totalMoviesWatched: 0,
      uniqueSeriesWatched: 4,
      longestStreak: 0,
      topSeries: [{ id: 1, title: 'Dark', episodesWatched: 26, minutesWatched: 1 }],
      topMovies: [],
      topGenres: [],
      manga: null,
      books: {
        booksFinished: 3,
        pagesRead: 900,
        topBooks: [],
        mostReadMonth: 0,
        mostReadMonthPages: 0,
      },
    } as unknown as WrappedStats;
    render(<SummarySlide stats={stats} {...idle} />);
    expect(screen.getByRole('heading', { name: 'Dein 2026' })).toBeInTheDocument();
    // Nur was es gibt: Bücher ja, Filme (0) nein.
    expect(screen.getByText('Bücher')).toBeInTheDocument();
    expect(screen.queryByText('Filme')).not.toBeInTheDocument();
    expect(screen.queryByText('SHARE_SHEET')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Jahresrückblick als Bild teilen' }));
    expect(screen.getByText('SHARE_SHEET')).toBeInTheDocument();
  });
});
