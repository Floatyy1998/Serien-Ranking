import type React from 'react';
import { WrappedBanner } from '../HomePage/sheets/WrappedNotification';
import { WrappedShareSheet } from '../../components/wrapped/WrappedShareCard';
import { WrappedSlideRenderer } from '../Wrapped/WrappedComponents';
import '../Wrapped/WrappedPage.css';
import type { WrappedSlideType, WrappedStats } from '../../types/Wrapped';

const months = [
  'Januar',
  'Februar',
  'März',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Dezember',
];
const minutes = [1400, 900, 2100, 1700, 800, 600, 1200, 2600, 3900, 2200, 1800, 1500];

const heatmap = Array.from({ length: 7 }, (_, d) =>
  Array.from({ length: 24 }, (_, h) =>
    h >= 19 && h <= 23 ? 4 + ((d * 3 + h) % 6) : h >= 14 && h < 19 ? (d + h) % 4 : h < 2 ? d % 3 : 0
  )
);
heatmap[6][21] = 14;

const STATS: WrappedStats = {
  year: 2026,
  totalEpisodesWatched: 1284,
  totalMoviesWatched: 47,
  totalMinutesWatched: 51840,
  totalHoursWatched: 864,
  totalDaysEquivalent: 36,
  uniqueSeriesWatched: 58,
  topSeries: [
    {
      id: 1396,
      title: 'Breaking Bad',
      poster: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      episodesWatched: 62,
      minutesWatched: 2900,
    },
    {
      id: 66732,
      title: 'Stranger Things',
      poster: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      episodesWatched: 34,
      minutesWatched: 1800,
    },
    {
      id: 1399,
      title: 'Game of Thrones',
      poster: '/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg',
      episodesWatched: 31,
      minutesWatched: 1700,
    },
    {
      id: 2316,
      title: 'Das Büro',
      poster: '/qWnJzyZhyy74gjpSjIXWmuk0ifX.jpg',
      episodesWatched: 28,
      minutesWatched: 620,
    },
    {
      id: 95396,
      title: 'Severance',
      poster: '/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg',
      episodesWatched: 19,
      minutesWatched: 950,
    },
  ],
  topMovies: [
    {
      id: 157336,
      title: 'Interstellar',
      poster: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
      rating: 9.5,
      minutesWatched: 169,
    },
    {
      id: 27205,
      title: 'Inception',
      poster: '/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
      rating: 9,
      minutesWatched: 148,
    },
    {
      id: 155,
      title: 'The Dark Knight',
      poster: '/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
      rating: 9,
      minutesWatched: 152,
    },
    {
      id: 550,
      title: 'Fight Club',
      poster: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      rating: 8.5,
      minutesWatched: 139,
    },
    {
      id: 496243,
      title: 'Parasite',
      poster: '/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
      rating: 8.5,
      minutesWatched: 133,
    },
  ],
  topGenres: [
    { genre: 'Sci-Fi & Fantasy', count: 420, percentage: 34, minutesWatched: 17000 },
    { genre: 'Action & Adventure', count: 260, percentage: 34, minutesWatched: 11000 },
    { genre: 'Komödie', count: 210, percentage: 17, minutesWatched: 8000 },
    { genre: 'Krimi', count: 150, percentage: 12, minutesWatched: 6000 },
    { genre: 'Animation', count: 90, percentage: 8, minutesWatched: 4000 },
  ],
  topProviders: [
    {
      name: 'Netflix',
      episodeCount: 520,
      movieCount: 20,
      totalCount: 540,
      minutesWatched: 21000,
      percentage: 41,
    },
    {
      name: 'Disney+',
      episodeCount: 300,
      movieCount: 12,
      totalCount: 312,
      minutesWatched: 12000,
      percentage: 24,
    },
    {
      name: 'Amazon Prime Video',
      episodeCount: 240,
      movieCount: 9,
      totalCount: 249,
      minutesWatched: 9500,
      percentage: 19,
    },
    {
      name: 'Crunchyroll',
      episodeCount: 160,
      movieCount: 2,
      totalCount: 162,
      minutesWatched: 4000,
      percentage: 11,
    },
  ],
  mostActiveMonth: {
    month: 9,
    monthName: 'September',
    episodesWatched: 164,
    moviesWatched: 6,
    minutesWatched: 3900,
  },
  mostActiveDay: {
    date: '2026-03-14',
    dayName: 'Samstag',
    episodesWatched: 17,
    moviesWatched: 1,
    minutesWatched: 745,
  },
  favoriteTimeOfDay: { timeOfDay: 'evening', label: 'Abends', count: 700, percentage: 54 },
  favoriteDayOfWeek: { dayOfWeek: 0, dayName: 'Sonntag', count: 300, percentage: 23 },
  monthlyBreakdown: months.map((monthName, i) => ({
    month: i + 1,
    monthName,
    episodesWatched: Math.round(minutes[i] / 24),
    moviesWatched: i % 5,
    minutesWatched: minutes[i],
  })),
  totalBingeSessions: 38,
  longestBingeSession: {
    seriesId: 1396,
    seriesTitle: 'Breaking Bad',
    poster: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
    episodeCount: 14,
    totalMinutes: 672,
    date: '2026-03-14',
  },
  averageBingeLength: 5.4,
  longestStreak: 43,
  currentStreak: 6,
  deviceBreakdown: {
    mobile: { count: 0, percentage: 0 },
    desktop: { count: 0, percentage: 0 },
    tablet: { count: 0, percentage: 0 },
  },
  achievements: [],
  funFacts: [],
  manga: {
    totalChapters: 612,
    totalVolumes: 9,
    uniqueManga: 14,
    topManga: [
      {
        anilistId: 30002,
        title: 'Berserk',
        chapters: 180,
        poster:
          'https://s4.anilist.co/file/anilistcdn/media/manga/cover/large/bx30002-7EzO7o21jzeF.jpg',
      },
      { anilistId: 105778, title: 'Chainsaw Man', chapters: 120 },
      { anilistId: 30013, title: 'One Piece', chapters: 96 },
      { anilistId: 87216, title: 'Vagabond', chapters: 0, volumes: 6 },
    ],
    mostReadMonth: 6,
    mostReadMonthChapters: 140,
  },
  books: {
    booksFinished: 12,
    pagesRead: 5230,
    topBooks: [
      { id: 'b1', title: 'Der Marsianer', author: 'Andy Weir', pages: 512, rating: 9 },
      { id: 'b2', title: 'Dune', author: 'Frank Herbert', pages: 800 },
      { id: 'b3', title: 'Projekt Hail Mary', author: 'Andy Weir', pages: 560 },
    ],
    longestBook: { title: 'Dune', pages: 800 },
    mostReadMonth: 1,
    mostReadMonthPages: 900,
  },
  firstWatch: {
    type: 'episode',
    title: 'Severance',
    subtitle: 'S2 E1',
    date: '2026-01-01',
    timestamp: '2026-01-01T10:12:00Z',
    poster: '/pPHpeI2X1qEd1CS1SeyrdhZ4qnT.jpg',
    id: 95396,
  },
  lastWatch: {
    type: 'movie',
    title: 'Interstellar',
    date: '2026-12-30',
    timestamp: '2026-12-30T21:40:00Z',
    poster: '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    id: 157336,
  },
  lateNightStats: {
    totalLateNightWatches: 310,
    midnightWatches: 84,
    latestWatch: { time: '03:47', title: 'Breaking Bad' },
    percentage: 24,
  },
  heatmapData: heatmap,
};

/** `/dev/ui-preview?solo=wrapped&slide=total_time` zeigt genau eine Folie mit Beispieldaten. */
export const WrappedPreview = () => {
  const slide = (new URLSearchParams(window.location.search).get('slide') ||
    'intro') as WrappedSlideType;
  if (slide === ('banner' as string)) {
    return (
      <div style={{ padding: '24px 0', maxWidth: 430 }}>
        <WrappedBanner year={2026} />
        <div
          style={
            { '--theme-primary': '#c05cff', '--theme-accent': '#19e6d0' } as React.CSSProperties
          }
        >
          <WrappedBanner year={2026} />
        </div>
      </div>
    );
  }
  if (slide === ('share' as string)) {
    return <WrappedShareSheet isOpen onClose={() => {}} stats={STATS} />;
  }
  return (
    <div style={{ height: '100vh' }}>
      <WrappedSlideRenderer slideType={slide} stats={STATS} year={2026} username="Konrad" />
    </div>
  );
};
