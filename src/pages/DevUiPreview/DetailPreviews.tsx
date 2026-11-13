/** Ganze Detailseiten (Serie, Film) mit echten Katalogdaten — nur für /dev/ui-preview. */

import type firebase from 'firebase/compat/app';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { MovieListContext } from '../../contexts/MovieListContext';
import { SeriesListContext } from '../../contexts/SeriesListContext';
import { tmdbFetch } from '../../services/api/tmdbClient';
import type { TmdbMediaDetail } from '../../services/api/tmdb.types';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { MovieDetailPage } from '../MovieDetail/MovieDetailPage';
import { fetchTmdbSeriesFallback } from '../SeriesDetail/hooks/fetchTmdbSeriesFallback';
import { SeriesDetailPage } from '../SeriesDetail/SeriesDetailPage';

const PREVIEW_UID = 'preview-user';

const fakeUser = {
  uid: PREVIEW_UID,
  displayName: 'Bärbel',
  photoURL: null,
} as unknown as firebase.User;

const param = (name: string, fallback: string) =>
  new URLSearchParams(window.location.search).get(name) || fallback;

const Shell = ({
  series,
  movies,
  children,
}: {
  series: Series[];
  movies: Movie[];
  children: React.ReactNode;
}) => {
  const auth = useMemo(
    () => ({
      user: fakeUser,
      setUser: () => {},
      authStateResolved: true,
      onboardingComplete: true,
      setOnboardingComplete: () => {},
    }),
    []
  );
  const seriesCtx = useMemo(
    () =>
      ({
        seriesList: series,
        allSeriesList: series,
        hiddenSeriesList: [],
        loading: false,
        seriesWithNewSeasons: [],
        inactiveSeries: [],
        inactiveRewatches: [],
        unratedSeries: [],
        providerChanges: [],
        hiddenProviderChanges: [],
        animeMangaHandoffs: [],
        clearNewSeasons: () => {},
        clearInactiveSeries: () => {},
        clearInactiveRewatches: () => {},
        clearUnratedSeries: () => {},
        clearProviderChanges: () => {},
        clearHiddenProviderChanges: () => {},
        clearAnimeMangaHandoffs: () => {},
        resolveSeriesNotification: () => {},
        recheckForNewSeasons: () => {},
        refetchSeries: () => {},
        toggleHideSeries: async () => {},
        isOffline: false,
        isStale: false,
        refetchAfterAdd: async () => {},
      }) as unknown as React.ContextType<typeof SeriesListContext>,
    [series]
  );
  const movieCtx = useMemo(
    () =>
      ({
        movieList: movies,
        loading: false,
        refetchMovies: () => {},
        isOffline: false,
        isStale: false,
      }) as unknown as React.ContextType<typeof MovieListContext>,
    [movies]
  );
  return (
    <AuthContext.Provider value={auth}>
      <SeriesListContext.Provider value={seriesCtx}>
        <MovieListContext.Provider value={movieCtx}>
          <div className="mobile-content" style={{ height: '100vh', overflowY: 'auto' }}>
            {children}
          </div>
        </MovieListContext.Provider>
      </SeriesListContext.Provider>
    </AuthContext.Provider>
  );
};

/** Hakt den vorderen Teil der Serie ab, damit Fortschritt, Tempo und „Dran" etwas zeigen. */
const withProgress = (series: Series, share: number): Series => {
  const total = series.seasons.reduce((n, s) => n + (s.episodes?.length ?? 0), 0);
  let left = Math.round(total * share);
  const now = Date.now();
  return {
    ...series,
    watchlist: true,
    rating: { Drama: 9, Mystery: 8.5 },
    seasons: series.seasons.map((season) => ({
      ...season,
      episodes: (season.episodes ?? []).map((ep) => {
        if (left <= 0) return ep;
        left--;
        const at = new Date(now - (left + 1) * 86400000 * 1.5).toISOString();
        return { ...ep, watched: true, watchCount: 1, firstWatchedAt: at, lastWatchedAt: at };
      }),
    })),
  } as unknown as Series;
};

/** `?solo=series-page&id=<tmdb>&own=0|1&share=0.4` */
export const SeriesPagePreview = () => {
  const id = param('id', '1396');
  const own = param('own', '1') === '1';
  const share = Number(param('share', '0.4'));
  const [series, setSeries] = useState<Series | null>(null);

  useEffect(() => {
    if (!own) return;
    void fetchTmdbSeriesFallback(id).then((s) => s && setSeries(withProgress(s, share)));
  }, [id, own, share]);

  const list = useMemo(() => (series ? [series] : []), [series]);
  if (own && !series) return <p style={{ padding: 24 }}>Lade Beispieldaten …</p>;

  return (
    <Shell series={list} movies={[]}>
      <Routes location={`/dev/ui-preview/series/${id}`}>
        <Route path="series/:id" element={<SeriesDetailPage />} />
      </Routes>
    </Shell>
  );
};

/** `?solo=movie-page&id=<tmdb>&own=0|1&seen=0|1` */
export const MoviePagePreview = () => {
  const id = param('id', '438631');
  const own = param('own', '1') === '1';
  const seen = param('seen', '1') === '1';
  const [movie, setMovie] = useState<Movie | null>(null);

  useEffect(() => {
    if (!own) return;
    void tmdbFetch<TmdbMediaDetail>(`movie/${id}`, { append_to_response: 'external_ids' }).then(
      (data) =>
        setMovie({
          id: Number(id),
          nmr: 1,
          title: data.title,
          release_date: data.release_date,
          runtime: data.runtime,
          status: data.status,
          overview: data.overview,
          beschreibung: data.overview,
          poster: { poster: data.poster_path },
          genre: { genres: (data.genres ?? []).map((g) => g.name) },
          imdb: { imdb_id: data.external_ids?.imdb_id },
          rating: seen ? { 'Science Fiction': 8.5, Abenteuer: 9 } : {},
          watched: seen,
        } as unknown as Movie)
    );
  }, [id, own, seen]);

  const list = useMemo(() => (movie ? [movie] : []), [movie]);
  if (own && !movie) return <p style={{ padding: 24 }}>Lade Beispieldaten …</p>;

  return (
    <Shell series={[]} movies={list}>
      <Routes location={`/dev/ui-preview/movie/${id}`}>
        <Route path="movie/:id" element={<MovieDetailPage />} />
      </Routes>
    </Shell>
  );
};

const HOME_SERIES = ['1396', '60622', '94997', '100088', '82856', '1399', '66732', '76479'];
const HOME_SHARE = [0.4, 0.2, 0.6, 1, 0.75, 0.1, 0.5, 0.3];

/** Ganze App-Seiten mit einer kleinen Beispielsammlung — `?solo=app-page&p=home|ratings|watchnext|…` */
export const AppPagePreview = ({ children }: { children: React.ReactNode }) => {
  const [series, setSeries] = useState<Series[] | null>(null);

  useEffect(() => {
    void Promise.all(HOME_SERIES.map((id) => fetchTmdbSeriesFallback(id))).then((list) =>
      setSeries(
        list
          .filter((s): s is Series => !!s)
          .map((s, i) => ({ ...withProgress(s, HOME_SHARE[i] ?? 0.3), nmr: i + 1 }))
      )
    );
  }, []);

  if (!series) return <p style={{ padding: 24 }}>Lade Beispieldaten …</p>;

  return (
    <Shell series={series} movies={[]}>
      {children}
    </Shell>
  );
};

const APP_PAGES: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  home: lazy(() => import('../HomePage').then((m) => ({ default: m.HomePage }))),
  ratings: lazy(() => import('../Ratings').then((m) => ({ default: m.RatingsPage }))),
  watchnext: lazy(() => import('../WatchNext').then((m) => ({ default: m.WatchNextPage }))),
  search: lazy(() => import('../Search').then((m) => ({ default: m.SearchPage }))),
  profile: lazy(() => import('../Profile').then((m) => ({ default: m.ProfilePage }))),
  calendar: lazy(() => import('../Calendar').then((m) => ({ default: m.CalendarPage }))),
  discover: lazy(() => import('../Discover').then((m) => ({ default: m.DiscoverPage }))),
  stats: lazy(() => import('../Stats').then((m) => ({ default: m.StatsPage }))),
  badges: lazy(() => import('../Badges').then((m) => ({ default: m.BadgesPage }))),
  countdowns: lazy(() => import('../Countdown').then((m) => ({ default: m.CountdownPage }))),
  subscriptions: lazy(() =>
    import('../Subscriptions').then((m) => ({ default: m.SubscriptionsPage }))
  ),
  recent: lazy(() =>
    import('../RecentlyWatched').then((m) => ({ default: m.RecentlyWatchedPage }))
  ),
  activity: lazy(() => import('../Activity').then((m) => ({ default: m.ActivityPage }))),
  anime: lazy(() => import('../AnimeSeason').then((m) => ({ default: m.AnimeSeasonPage }))),
  serienkalender: lazy(() =>
    import('../SerienKalender').then((m) => ({ default: m.SerienKalenderPage }))
  ),
  filmkalender: lazy(() =>
    import('../FilmKalender').then((m) => ({ default: m.FilmKalenderPage }))
  ),
  journey: lazy(() => import('../WatchJourney').then((m) => ({ default: m.WatchJourneyPage }))),
  hidden: lazy(() => import('../HiddenSeries').then((m) => ({ default: m.HiddenSeriesPage }))),
  discussions: lazy(() =>
    import('../DiscussionFeed').then((m) => ({ default: m.DiscussionFeedPage }))
  ),
  tasteprofile: lazy(() =>
    import('../TasteProfile').then((m) => ({ default: m.TasteProfilePage }))
  ),
  actors: lazy(() => import('../ActorUniverse').then((m) => ({ default: m.ActorUniversePage }))),
  chats: lazy(() => import('../Chats').then((m) => ({ default: m.ChatsPage }))),
  bugreport: lazy(() => import('../BugReport').then((m) => ({ default: m.BugReportPage }))),
  episodes: lazy(() =>
    import('../EpisodeManagement').then((m) => ({ default: m.EpisodeManagementPage }))
  ),
  rating: lazy(() => import('../RatingEditor').then((m) => ({ default: m.RatingEditorPage }))),
};

/** Seiten mit Routen-Parameter: Vorschau-Pfad und Muster. */
const PARAM_ROUTES: Record<string, [string, string]> = {
  episodes: ['episodes/1396', 'episodes/:id'],
  rating: ['rating/series/1396', 'rating/:type/:id'],
};

export const AppPageByParam = () => {
  const Page = APP_PAGES[param('p', 'home')];
  if (!Page) return <p style={{ padding: 24 }}>Unbekannte Seite</p>;
  return (
    <AppPagePreview>
      <Suspense fallback={null}>
        {PARAM_ROUTES[param('p', 'home')] ? (
          <Routes location={`/dev/ui-preview/${PARAM_ROUTES[param('p', 'home')][0]}`}>
            <Route path={PARAM_ROUTES[param('p', 'home')][1]} element={<Page />} />
          </Routes>
        ) : (
          <Page />
        )}
      </Suspense>
    </AppPagePreview>
  );
};
