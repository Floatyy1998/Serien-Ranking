/** Personen-Seite und Such-Overlay mit Personen/Manga — nur für /dev/ui-preview. */

import type firebase from 'firebase/compat/app';
import { useMemo } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { MovieListContext } from '../../contexts/MovieListContext';
import { SeriesListContext } from '../../contexts/SeriesListContext';
import { HomeSearchOverlay } from '../HomePage/sections/HomeSearchOverlay';
import { PersonView } from '../Person/PersonPage';

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
