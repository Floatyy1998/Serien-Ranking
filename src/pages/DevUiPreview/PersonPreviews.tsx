/** Personen-Seite und Such-Overlay mit Personen/Manga — nur für /dev/ui-preview. */

import type firebase from 'firebase/compat/app';
import { useMemo } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { MovieListContext } from '../../contexts/MovieListContext';
import { SeriesListContext } from '../../contexts/SeriesListContext';
import { HomeSearchOverlay } from '../HomePage/sections/HomeSearchOverlay';
import { PersonView } from '../Person/PersonPage';
import { MovieHeroSection } from '../MovieDetail/MovieHeroSection';
import '../MovieDetail/MovieDetailPage.css';
import { useDeviceType } from '../../hooks/platform/useDeviceType';
import { PLACEHOLDER_SVG } from '../../lib/image/posterPlaceholder';
import type { Movie } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { HeroSection as SeriesHeroSection } from '../SeriesDetail/sections/HeroSection';
import '../SeriesDetail/SeriesDetailPage.css';

const fakeUser = {
  uid: 'preview-user',
  displayName: 'Bärbel',
  photoURL: null,
} as unknown as firebase.User;

const OWNED_SERIES = [
  { id: 100088, title: 'The Last of Us', rating: { Drama: 9 } },
  { id: 82856, title: 'The Mandalorian', rating: { Action: 8 } },
  { id: 1399, title: 'Game of Thrones', rating: {} },
];
const OWNED_MOVIES = [{ id: 464052, title: 'Wonder Woman 1984', rating: { Action: 6 } }];

const PersonPreviewShell = ({ children }: { children: React.ReactNode }) => {
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
        seriesList: OWNED_SERIES,
        allSeriesList: OWNED_SERIES,
        loading: false,
        refetchAfterAdd: async () => {},
      }) as unknown as React.ContextType<typeof SeriesListContext>,
    []
  );
  const movieCtx = useMemo(
    () =>
      ({
        movieList: OWNED_MOVIES,
        loading: false,
        refetchMovies: () => {},
        isOffline: false,
        isStale: false,
      }) as unknown as React.ContextType<typeof MovieListContext>,
    []
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

export const PersonPagePreview = () => {
  const id = Number(new URLSearchParams(window.location.search).get('id') || '1253360');
  return (
    <PersonPreviewShell>
      <PersonView personId={id} />
    </PersonPreviewShell>
  );
};

export const PeopleSearchPreview = () => (
  <PersonPreviewShell>
    <HomeSearchOverlay open onClose={() => {}} homePath="/dev/ui-preview" />
  </PersonPreviewShell>
);

export const BookOverlaySearchPreview = () => (
  <PersonPreviewShell>
    <HomeSearchOverlay open onClose={() => {}} homePath="/dev/ui-preview" initialFilter="books" />
  </PersonPreviewShell>
);

const noop = () => {};

/** Film-Hero eines noch nicht gesammelten Titels — `?solo=movie-hero-add`. */
export const MovieHeroAddPreview = () => {
  const isMobile = useDeviceType().isMobile;
  return (
    <MovieHeroSection
      movie={
        {
          id: 438631,
          title: 'Dune',
          release_date: '2021-09-15',
          runtime: 155,
          status: 'Released',
          poster: { poster: PLACEHOLDER_SVG },
          genre: { genres: ['Sci-Fi', 'Drama'] },
          imdb: { imdb_id: 'tt1160419' },
        } as unknown as Movie
      }
      id="438631"
      isMobile={isMobile}
      tmdbBackdrop={null}
      tmdbRating={{ vote_average: 7.8, vote_count: 13200 }}
      imdbRating={{ rating: 8.0, votes: '941,000' }}
      providers={
        [
          {
            provider_id: 8,
            provider_name: 'Netflix',
            logo_path: '/pbpMk2JmcoNnQwx5JGpXngfoWtp.jpg',
          },
        ] as never
      }
      averageRating={0}
      isWatched={false}
      isReadOnlyTmdbMovie
      isAdding={false}
      getBackdropUrl={() => PLACEHOLDER_SVG}
      formatRuntime={(m: number) => `${m} Min.`}
      onAddMovie={noop}
      onNavigateRate={noop}
      onToggleWatched={noop}
      onDeleteClick={noop}
    />
  );
};

/** Serien-Hero mit Faktenleiste (Anbieter, Videos, Wertungen) — `?solo=series-hero`. */
export const SeriesHeroPreview = () => {
  const isMobile = useDeviceType().isMobile;
  const series = {
    id: 4607,
    nmr: 4607,
    title: 'Lost',
    genre: { genres: ['Drama', 'Mystery'] },
    poster: { poster: PLACEHOLDER_SVG },
    imdb: { imdb_id: 'tt0411008' },
    vote_average: 7.9,
    vote_count: 3500,
    status: 'Ended',
  } as unknown as Series;
  return (
    <SeriesHeroSection
      series={series}
      localSeries={series}
      tmdbSeries={null}
      tmdbBackdrop={null}
      tmdbFirstAirDate="2004-09-22"
      tmdbRating={{ vote_average: 7.9, vote_count: 3500 }}
      imdbRating={{ rating: 8.3, votes: '612,000' }}
      providers={
        [
          {
            provider_id: 337,
            provider_name: 'Disney Plus',
            logo_path: '/97yvRBw1GzX7fXprcF80er19ot.jpg',
          },
        ] as never
      }
      overallRating="0.00"
      progressStats={{ watched: 0, total: 121, percentage: 0 }}
      paceInfo={null}
      isReadOnlyTmdbSeries={false}
      isAdding={false}
      isDeleting={false}
      isMobile={isMobile}
      currentTheme={{ status: { success: '#4ade80' }, accent: '#f2a648' }}
      onAddSeries={noop}
      onNavigateEpisodes={noop}
      onNavigateRating={noop}
      onWatchlistToggle={noop}
      onHideToggle={noop}
      onDelete={noop}
    />
  );
};
